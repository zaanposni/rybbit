import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { auth } from "../../lib/auth.js";
import * as schema from "./schema.js";

dotenv.config();

// Create postgres connection
const client = postgres({
  host: process.env.POSTGRES_HOST || "postgres",
  port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  onnotice: () => {},
});

// Create drizzle ORM instance
export const db = drizzle(client, { schema });

// For compatibility with raw SQL if needed
export const sql = client;

export async function initializePostgres() {
  try {
    console.log("Initializing PostgreSQL database...");

    // First check if tables already exist
    const checkTablesExist = async () => {
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'user'
        );
      `;
      return tableExists[0]?.exists;
    };

    const tablesExist = await checkTablesExist();

    // If tables already exist, skip full migrations to avoid errors
    // but make sure Drizzle migration metadata table exists
    if (tablesExist) {
      console.log(
        "Database tables already exist, ensuring migration metadata table exists..."
      );

      // Important: Execute each SQL statement separately to avoid the "multiple commands" error
      await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;

      await sql`
        CREATE TABLE IF NOT EXISTS drizzle."__drizzle_migrations" (
          id SERIAL PRIMARY KEY,
          hash text NOT NULL,
          created_at timestamp with time zone DEFAULT now()
        )
      `;
    } else {
      // Tables don't exist, run full migrations
      console.log("Setting up new database with migrations...");

      // Create a separate connection for migrations to avoid conflicts
      const migrationClient = postgres({
        host: process.env.POSTGRES_HOST || "postgres",
        port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
        database: process.env.POSTGRES_DB,
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        max: 1,
      });

      // Initialize the database with Drizzle migrations
      console.log("Running Drizzle migrations...");
      const migrationDb = drizzle(migrationClient);

      try {
        // Run migrations from the drizzle directory
        await migrate(migrationDb, { migrationsFolder: "./drizzle" });
        console.log("Migrations completed successfully");
      } catch (error: any) {
        console.error("Error running migrations:", error);

        // If migrations fail (e.g., directory doesn't exist), use schema to push changes directly
        if (error.message && error.message.includes("already exists")) {
          console.log(
            "Tables already exist - this is expected for existing databases"
          );
          console.log(
            "Migration errors about existing relations can be safely ignored"
          );
        } else {
          console.log(
            "Migration failed, please check the error and run migrations manually"
          );
        }
      } finally {
        // Close the migration client
        await migrationClient.end();
      }
    }

    // Check if admin user exists, if not create one
    const [{ count }]: { count: number }[] =
      await client`SELECT count(*) FROM "user" WHERE username = 'admin'`;

    if (Number(count) === 0) {
      // Create admin user
      console.log("Creating admin user");
      await auth!.api.signUpEmail({
        body: {
          email: "admin@example.com",
          username: "admin",
          password: "password",
          name: "Admin User",
        },
      });
    }

    await client`UPDATE "user" SET "role" = 'admin' WHERE username = 'admin'`;

    console.log("PostgreSQL initialization completed successfully.");
  } catch (error) {
    console.error("Error initializing PostgreSQL:", error);
    throw error;
  }
}
