import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import dotenv from "dotenv";
import * as schema from "./schema.js";

dotenv.config();

/**
 * Run database migrations
 * @param migrationsPath Path to migrations folder
 * @returns Promise that resolves when migrations are complete
 */
export async function runMigrations(migrationsPath: string = "./drizzle") {
  console.log("Running database migrations...");

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

    // Always run migrations, Drizzle will skip already applied ones
    console.log(
      "Running all migrations - Drizzle will skip already applied ones"
    );

    // This will run migrations on the database, skipping the ones already applied
    try {
      await migrate(db, { migrationsFolder: migrationsPath });
      console.log("Migrations completed!");
      return true; // Return success
    } catch (err: any) {
      // If error contains relation already exists, tables likely exist but not in drizzle metadata
      if (err.message && err.message.includes("already exists")) {
        console.log(
          "Some tables already exist but not tracked by drizzle. This is expected for existing databases."
        );
        console.log(
          "You can safely ignore these errors if your database is already set up."
        );
        return true; // Consider this a success case
      } else {
        // Other errors should be reported
        throw err;
      }
    }
  } catch (e) {
    console.error("Migration failed!");
    console.error(e);
    return false; // Return failure
  } finally {
    // Don't forget to close the connection
    await migrationClient.end();
  }
}

// Only run migrations directly if this module is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then((success) => {
      if (!success) {
        process.exit(1);
      }
    })
    .catch((err) => {
      console.error("Unhandled error in migrations:", err);
      process.exit(1);
    });
}
