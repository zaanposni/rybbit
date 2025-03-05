import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

// For migrations
async function main() {
  console.log("Running migrations...");

  const migrationClient = postgres({
    host: process.env.POSTGRES_HOST || "postgres",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    database: process.env.POSTGRES_DB,
    username: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    max: 1,
  });

  const db = drizzle(migrationClient);

  // This will run migrations on the database, skipping the ones already applied
  await migrate(db, { migrationsFolder: "drizzle" });

  // Don't forget to close the connection
  await migrationClient.end();

  console.log("Migrations completed!");
}

main().catch((e) => {
  console.error("Migration failed!");
  console.error(e);
  process.exit(1);
});
