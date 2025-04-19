import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { FastifyRequest } from "fastify";
import UAParser, { UAParser as userAgentParser } from "ua-parser-js";
import { z } from "zod";
import { sitesOverLimit } from "../cron/monthly-usage-checker.js";
import { db } from "../db/postgres/postgres.js";
import { activeSessions } from "../db/postgres/schema.js";
import { TrackingPayload } from "../types.js";
import { getDeviceType, getIpAddress, getUserId } from "../utils.js";
import { pageviewQueue } from "./pageviewQueue.js";
import { trackingPayloadSchema } from "./trackEvent.js";

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

// Infer type from Zod schema
export type ValidatedTrackingPayload = z.infer<typeof trackingPayloadSchema>;

// UTM and URL parameter parsing utilities
export function getUTMParams(querystring: string): Record<string, string> {
  const params: Record<string, string> = {};

  if (!querystring) return params;

  try {
    const searchParams = new URLSearchParams(querystring);

    // Extract UTM parameters
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith("utm_") || key === "gclid" || key === "gad_source") {
        params[key.toLowerCase()] = value.toLowerCase();
      }
    }
  } catch (e) {
    console.error("Error parsing query string:", e);
  }

  return params;
}

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
export async function getExistingSession(userId: string, siteId: string) {
  const siteIdNumber = parseInt(siteId, 10); // Ensure siteId is a number for the query

  const [existingSession] = await db
    .select()
    .from(activeSessions)
    .where(
      and(
        eq(activeSessions.userId, userId),
        eq(activeSessions.siteId, siteIdNumber)
      )
    )
    .limit(1);

  return existingSession || null; // Return the session or null if not found
}

// Create base tracking payload from request
export function createBasePayload(
  request: FastifyRequest,
  eventType: "pageview" | "custom_event" = "pageview",
  validatedBody: ValidatedTrackingPayload
): TotalTrackingPayload {
  const userAgent = request.headers["user-agent"] || "";
  const ipAddress = getIpAddress(request);
  const userId = getUserId(ipAddress, userAgent);

  return {
    ...validatedBody,
    hostname: validatedBody.hostname || "",
    pathname: validatedBody.pathname || "",
    querystring: validatedBody.querystring || "",
    screenWidth: validatedBody.screenWidth || 0,
    screenHeight: validatedBody.screenHeight || 0,
    language: validatedBody.language || "",
    page_title: validatedBody.page_title || "",
    referrer: validatedBody.referrer || "",
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
  existingSession: any | null,
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
      .where(eq(activeSessions.userId, existingSession.userId));
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
  existingSession: any | null,
  isPageview: boolean = true
): Promise<void> {
  // If session exists, use its ID instead of generated one
  if (existingSession) {
    payload.sessionId = existingSession.sessionId;
  }

  // Add to queue for processing
  await pageviewQueue.add(payload);

  // Update session data
  await updateSession(payload, existingSession, isPageview);
}
