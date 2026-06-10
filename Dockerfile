# ── Stage 1: Dependencies ──────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: Builder ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Next.js evalúa DATABASE_URL en tiempo de build solo para validar el módulo de configuración.
# La conexión real se establece en runtime con la variable inyectada por Easypanel/Docker.
# Este valor no se usa para ninguna consulta real durante el build.
ENV DATABASE_URL=postgres://build_time_only:not_real@localhost:5432/not_real

# Build Next.js app
RUN npm run build

# Compile the migration script to plain JS (no tsx needed at runtime)
RUN node_modules/.bin/esbuild lib/db/migrate.ts \
      --bundle \
      --platform=node \
      --format=cjs \
      --outfile=migrate.cjs \
      --external:postgres

# ── Stage 3: Runner ────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Security: run as non-root
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy Next.js standalone output
COPY --from=builder /app/public                              ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy migration artefacts
COPY --from=builder --chown=nextjs:nodejs /app/migrate.cjs  ./migrate.cjs
COPY --from=builder --chown=nextjs:nodejs /app/drizzle      ./drizzle

# Install only the postgres driver (needed by migrate.cjs at runtime)
COPY --from=deps /app/node_modules/postgres ./node_modules/postgres

USER nextjs

EXPOSE 3000

# Run migrations + seed, then start the Next.js server
CMD ["sh", "-c", "node migrate.cjs && node server.js"]
