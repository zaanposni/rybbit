import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";

// User table
export const users = pgTable("user", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  role: text("role").notNull().default("user"),
});

// Verification table
export const verification = pgTable("verification", {
  id: text("id").primaryKey().notNull(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
});

// Sites table
export const sites = pgTable("sites", {
  siteId: text("site_id").primaryKey().notNull(),
  domain: text("domain").notNull().unique(),
  name: text("name").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Active sessions table
export const activeSessions = pgTable("active_sessions", {
  id: text("id").primaryKey().notNull(),
  siteId: text("site_id").notNull(),
  sessionId: text("session_id").notNull(),
  userId: text("user_id").notNull(),
  hostname: text("hostname").notNull(),
  startTime: timestamp("start_time").notNull(),
  lastActivity: timestamp("last_activity").notNull(),
  pageviews: integer("pageviews").notNull(),
  entryPage: text("entry_page").notNull(),
  deviceType: text("device_type").notNull(),
});
