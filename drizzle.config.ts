// @ts-nocheck
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./server/src/db/postgres/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: "postgres",
    port: 5432,
    database: "analytics",
    user: "frog",
    password: "frog",
  },
  // Additional configurations
  verbose: true,
  strict: true,
});
