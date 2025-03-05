import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import dotenv from "dotenv";
import * as schema from "./schema.js";

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
    onnotice: () => {}, // Silence notices
  });

  const db = drizzle(migrationClient, { schema });

  try {
    // First check if tables already exist
    const tableCheck = await migrationClient`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user'
      );
    `;
    const tablesExist = tableCheck[0]?.exists;

    // Create drizzle schema if it doesn't exist
    await migrationClient`CREATE SCHEMA IF NOT EXISTS drizzle;`;

    // Create migration table if it doesn't exist
    await migrationClient`
      CREATE TABLE IF NOT EXISTS drizzle."__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at timestamp with time zone DEFAULT now()
      );
    `;

    if (tablesExist) {
      console.log("Tables already exist - checking for new migrations only");
    }

    // This will run migrations on the database, skipping the ones already applied
    try {
      await migrate(db, { migrationsFolder: "./drizzle" });
      console.log("Migrations completed!");
    } catch (err: any) {
      // If error contains relation already exists, tables likely exist but not in drizzle metadata
      if (err.message && err.message.includes("already exists")) {
        console.log(
          "Tables already exist but not tracked by drizzle. This is expected for existing databases."
        );
        console.log(
          "You can safely ignore these errors if your database is already set up."
        );
      } else {
        // Other errors should be reported
        throw err;
      }
    }
  } catch (e) {
    console.error("Migration failed!");
    console.error(e);
    process.exit(1);
  } finally {
    // Don't forget to close the connection
    await migrationClient.end();
  }
}

main();
