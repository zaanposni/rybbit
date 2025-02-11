import { betterAuth } from "better-auth";
import { Pool } from "pg";
import { username } from "better-auth/plugins";
import dotenv from "dotenv";

dotenv.config();

export const auth = betterAuth({
  database: new Pool({
    host: process.env.POSTGRES_HOST || "postgres",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [username()],
});
