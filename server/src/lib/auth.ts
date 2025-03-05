import { betterAuth } from "better-auth";
import { username, admin, organization } from "better-auth/plugins";
import dotenv from "dotenv";
import pg from "pg";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/postgres/postgres.js";
import * as schema from "../db/postgres/schema.js";

dotenv.config();

type AuthType = ReturnType<typeof betterAuth> | null;

export let auth: AuthType | null = betterAuth({
  basePath: "/auth",
  database: new pg.Pool({
    host: process.env.POSTGRES_HOST || "postgres",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  }),
  emailAndPassword: {
    enabled: true,
  },
  deleteUser: {
    enabled: true,
  },
  plugins: [username(), admin(), organization()],
  trustedOrigins: ["http://localhost:3002"],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production", // don't mark Secure in dev
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    },
  },
});

export function initAuth(allowedOrigins: string[]) {
  auth = betterAuth({
    basePath: "/auth",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        // Map our schema tables to what better-auth expects
        user: schema.users,
        account: schema.account,
        session: schema.session,
        verification: schema.verification,
        organization: schema.organization,
        member: schema.member,
      },
    }),
    experimental: {
      sessionCookie: {
        domains: allowedOrigins,
      },
    },
    emailAndPassword: {
      enabled: true,
    },
    deleteUser: {
      enabled: true,
    },
    plugins: [username(), admin(), organization()],
    trustedOrigins: allowedOrigins,
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production", // don't mark Secure in dev
      defaultCookieAttributes: {
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      },
    },
  });
}
