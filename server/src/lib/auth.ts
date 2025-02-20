import { betterAuth } from "better-auth";
import { username, admin } from "better-auth/plugins";
import dotenv from "dotenv";
import pg from "pg";

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
  plugins: [username(), admin()],
  trustedOrigins: [],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production", // don't mark Secure in dev
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    },
  },
});

export const initAuth = (allowList: string[]) => {
  auth = betterAuth({
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
    plugins: [username(), admin()],
    trustedOrigins: allowList,
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production", // don't mark Secure in dev
      defaultCookieAttributes: {
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      },
    },
  });
};
