import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL || "postgres://localhost:5432/placeholder";

// postgres.js ignores sslmode= URL param — set ssl option explicitly
const sslDisabled = connectionString.includes("sslmode=disable");

// Prevent multiple connections in development (Next.js hot reload)
declare global {
  var _pgClient: ReturnType<typeof postgres> | undefined;
}

const client =
  global._pgClient ??
  postgres(connectionString, {
    max: 10,
    ssl: sslDisabled ? false : undefined,
  });

if (process.env.NODE_ENV !== "production") {
  global._pgClient = client;
}

export const db = drizzle(client, { schema });
export { client };
