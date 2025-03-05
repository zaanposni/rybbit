import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/postgres/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    host: "5.78.110.218",
    port: 5432,
    database: "analytics",
    user: "frog",
    password: "frog",
    ssl: false,
  },
  verbose: true,
  strict: true,
});
