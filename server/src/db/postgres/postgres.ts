import dotenv from "dotenv";
import postgres from "postgres";
import { auth } from "../../lib/auth.js";

dotenv.config();

export const sql = postgres({
  host: process.env.POSTGRES_HOST || "postgres",
  port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
  database: process.env.POSTGRES_DB,
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  onnotice: () => {},
});

export async function initializePostgres() {
  try {
    // Phase 1: Create tables with no dependencies
    await sql`
        CREATE TABLE IF NOT EXISTS "user" (
          "id" text not null primary key,
          "name" text not null,
          "username" text not null unique,
          "email" text not null unique,
          "emailVerified" boolean not null,
          "image" text,
          "createdAt" timestamp not null,
          "updatedAt" timestamp not null,
          "role" text not null default 'user'
        );
      `;

    await sql`
        CREATE TABLE IF NOT EXISTS "verification" (
          "id" text not null primary key,
          "identifier" text not null,
          "value" text not null,
          "expiresAt" timestamp not null,
          "createdAt" timestamp,
          "updatedAt" timestamp
        );
      `;

    await sql`
        CREATE TABLE IF NOT EXISTS active_sessions (
          session_id TEXT PRIMARY KEY,
          site_id INT,
          user_id TEXT,
          hostname TEXT,
          start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          pageviews INT DEFAULT 0,
          entry_page TEXT,
          exit_page TEXT,
          device_type TEXT,
          screen_width INT,
          screen_height INT,
          browser TEXT,
          operating_system TEXT,
          language TEXT,
          referrer TEXT
        );
      `;

    await sql`
        CREATE TABLE IF NOT EXISTS sites (
          site_id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          domain TEXT NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          created_by TEXT NOT NULL REFERENCES "user" ("id")
        );
      `;

    await sql`
      CREATE TABLE IF NOT EXISTS "session" (
        "id" text not null primary key,
        "expiresAt" timestamp not null,
        "token" text not null unique,
        "createdAt" timestamp not null,
        "updatedAt" timestamp not null,
        "ipAddress" text,
        "userAgent" text,
        "userId" text not null references "user" ("id")
      );
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS "account" (
        "id" text not null primary key,
        "accountId" text not null,
        "providerId" text not null,
        "userId" text not null references "user" ("id"),
        "accessToken" text,
        "refreshToken" text,
        "idToken" text,
        "accessTokenExpiresAt" timestamp,
        "refreshTokenExpiresAt" timestamp,
        "scope" text,
        "password" text,
        "createdAt" timestamp not null,
        "updatedAt" timestamp not null
      );
    `;

    const [{ count }]: { count: number }[] =
      await sql`SELECT count(*) FROM "user" WHERE username = 'admin'`;

    console.info(count);
    console.info(typeof count);
    if (count === 0) {
      const res = await auth!.api.signUpEmail({
        body: {
          email: "test@test.com",
          username: "admin",
          name: "admin",
          password: "admin123",
        },
      });
      console.info(res);
    }

    await sql`UPDATE "user" SET "role" = 'admin' WHERE username = 'admin'`;

    console.log("Tables created successfully.");
  } catch (err) {
    console.error("Error creating tables:", err);
  }
}
