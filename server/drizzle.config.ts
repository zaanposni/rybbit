import dotenv from "dotenv";
import { defineConfig } from "drizzle-kit";

dotenv.config();

export default defineConfig({
  schema: "./src/db/postgres/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.POSTGRES_HOST || "postgres",
    port: 5432,
    database: "analytics",
    user: "frog",
    password: "frog",
    ssl: false,
  },
  verbose: true,
});
