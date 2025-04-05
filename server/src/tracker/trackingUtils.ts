import crypto from "crypto";
import { eq } from "drizzle-orm";
import { FastifyRequest } from "fastify";
import UAParser, { UAParser as userAgentParser } from "ua-parser-js";
import { db, sql } from "../db/postgres/postgres.js";
import { activeSessions } from "../db/postgres/schema.js";
import { TrackingPayload } from "../types.js";
import { getDeviceType, getIpAddress, getUserId } from "../utils.js";
import { pageviewQueue } from "./pageviewQueue.js";
import { sitesOverLimit } from "../cron/monthly-usage-checker.js";

// Define extended payload types
export type BaseTrackingPayload = TrackingPayload & {
  type?: string;
  event_name?: string;
  properties?: string;
};

export type TotalTrackingPayload = BaseTrackingPayload & {
  userId: string;
  timestamp: string;
  sessionId: string;
  ua: UAParser.IResult;
  referrer: string;
  ipAddress: string;
};

// Extended type for database active sessions
export type ActiveSession = {
  session_id: string;
  site_id: number | null;
  user_id: string;
  pageviews: number;
  hostname: string | null;
  start_time: Date | null;
  last_activity: Date | null;
  entry_page: string | null;
  exit_page: string | null;
  device_type: string | null;
  screen_width: number | null;
  screen_height: number | null;
  browser: string | null;
  operating_system: string | null;
  language: string | null;
  referrer: string | null;
};

// Clear referrer if it's from the same domain
export function clearSelfReferrer(referrer: string, hostname: string): string {
  if (!referrer || !hostname) return referrer;

  try {
    const referrerUrl = new URL(referrer);
    if (referrerUrl.hostname === hostname) {
      // Internal navigation, clear the referrer
      return "";
    }
  } catch (e) {
    // Invalid URL, return original referrer
  }

  return referrer;
}

// Check if site is over the monthly limit
export function isSiteOverLimit(siteId: number | string): boolean {
  return sitesOverLimit.has(Number(siteId));
}

// Get existing user session
export async function getExistingSession(
  userId: string,
  siteId: string
): Promise<ActiveSession | null> {
  const [existingSession] = await sql<ActiveSession[]>`
    SELECT * FROM active_sessions WHERE user_id = ${userId} AND site_id = ${siteId}
  `;
  return existingSession;
}

// Create base tracking payload from request
export function createBasePayload(
  request: FastifyRequest,
  eventType: "pageview" | "custom_event" = "pageview"
): TotalTrackingPayload {
  const userAgent = request.headers["user-agent"] || "";
  const ipAddress = getIpAddress(request);
  const userId = getUserId(ipAddress, userAgent);

  return {
    ...(request.body as BaseTrackingPayload),
    type: eventType,
    ipAddress: ipAddress,
    timestamp: new Date().toISOString(),
    ua: userAgentParser(userAgent),
    userId: userId,
    sessionId: crypto.randomUUID(), // Will be replaced if session exists
  };
}

// Update session for both pageviews and events
export async function updateSession(
  payload: TotalTrackingPayload,
  existingSession: ActiveSession | null,
  isPageview: boolean = true
): Promise<void> {
  if (existingSession) {
    // Update session with Drizzle
    const updateData: any = {
      lastActivity: new Date(payload.timestamp),
    };

    // Only increment pageviews count for actual pageviews
    if (isPageview) {
      updateData.pageviews = (existingSession.pageviews || 0) + 1;
    }

    await db
      .update(activeSessions)
      .set(updateData)
      .where(eq(activeSessions.userId, payload.userId));
    return;
  }

  // Insert new session with Drizzle
  const insertData = {
    sessionId: payload.sessionId,
    siteId:
      typeof payload.site_id === "string"
        ? parseInt(payload.site_id, 10)
        : payload.site_id,
    userId: payload.userId,
    hostname: payload.hostname || null,
    startTime: new Date(payload.timestamp || Date.now()),
    lastActivity: new Date(payload.timestamp || Date.now()),
    pageviews: isPageview ? 1 : 0,
    entryPage: payload.pathname || null,
    deviceType: getDeviceType(
      payload.screenWidth,
      payload.screenHeight,
      payload.ua
    ),
    screenWidth: payload.screenWidth || null,
    screenHeight: payload.screenHeight || null,
    browser: payload.ua.browser.name || null,
    operatingSystem: payload.ua.os.name || null,
    language: payload.language || null,
    referrer: payload.hostname
      ? clearSelfReferrer(payload.referrer || "", payload.hostname)
      : payload.referrer || null,
  };

  await db.insert(activeSessions).values(insertData);
}

// Process tracking event and add to queue
export async function processTrackingEvent(
  payload: TotalTrackingPayload,
  existingSession: ActiveSession | null,
  isPageview: boolean = true
): Promise<void> {
  // If session exists, use its ID instead of generated one
  if (existingSession) {
    payload.sessionId = existingSession.session_id;
  }

  // Add to queue for processing
  await pageviewQueue.add(payload);

  // Update session data
  await updateSession(payload, existingSession, isPageview);
}
