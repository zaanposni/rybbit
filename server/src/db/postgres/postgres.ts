import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
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

    // Assume migrations have been run manually with 'npm run db:migrate'
    // No automatic migrations during application startup

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
          password: "admin123",
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
