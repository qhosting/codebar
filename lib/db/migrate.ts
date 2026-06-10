import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { seed } from "./seed";
import path from "path";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is required");
  }

  const sslDisabled = connectionString.includes("sslmode=disable");

  const migrationClient = postgres(connectionString, {
    max: 1,
    ssl: sslDisabled ? false : undefined,
  });
  const db = drizzle(migrationClient);

  console.log("🔄 Running migrations...");
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  console.log("✅ Migrations complete");

  await seed();

  await migrationClient.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
