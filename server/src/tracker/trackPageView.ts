import { FastifyReply, FastifyRequest } from "fastify";
import { TrackingPayload } from "../types.js";
import { getUserId, getDeviceType, getIpAddress } from "../utils.js";
import crypto from "crypto";
import { db, sql } from "../db/postgres/postgres.js";
import { activeSessions } from "../db/postgres/schema.js";
import UAParser, { UAParser as userAgentParser } from "ua-parser-js";
import { eq } from "drizzle-orm";

import { Pageview } from "../db/clickhouse/types.js";
import { pageviewQueue } from "./pageviewQueue.js";

type TotalPayload = TrackingPayload & {
  userId: string;
  timestamp: string;
  sessionId: string;
  ua: UAParser.IResult;
  referrer: string;
  ipAddress: string;
};

// Extended type for database active sessions
type ActiveSession = {
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

const getExistingSession = async (
  userId: string
): Promise<ActiveSession | null> => {
  // We need to use the raw SQL query here since we're selecting into a specific type
  const [existingSession] = await sql<ActiveSession[]>`
    SELECT * FROM active_sessions WHERE user_id = ${userId}
  `;
  return existingSession;
};

const updateSession = async (
  pageview: TotalPayload,
  existingSession: ActiveSession | null
) => {
  if (existingSession) {
    // Update session with Drizzle
    await db
      .update(activeSessions)
      .set({
        lastActivity: new Date(pageview.timestamp),
        pageviews: (existingSession.pageviews || 0) + 1,
      })
      .where(eq(activeSessions.userId, pageview.userId));
    return;
  }

  // Insert new session with Drizzle
  const insertData = {
    sessionId: pageview.sessionId,
    siteId:
      typeof pageview.site_id === "string"
        ? parseInt(pageview.site_id, 10)
        : pageview.site_id,
    userId: pageview.userId,
    hostname: pageview.hostname || null,
    startTime: new Date(pageview.timestamp || Date.now()),
    lastActivity: new Date(pageview.timestamp || Date.now()),
    pageviews: 1,
    entryPage: pageview.pathname || null,
    deviceType: getDeviceType(
      pageview.screenWidth,
      pageview.screenHeight,
      pageview.ua
    ),
    screenWidth: pageview.screenWidth || null,
    screenHeight: pageview.screenHeight || null,
    browser: pageview.ua.browser.name || null,
    operatingSystem: pageview.ua.os.name || null,
    language: pageview.language || null,
    referrer: pageview.referrer || null,
  };

  await db.insert(activeSessions).values(insertData);
};

export async function trackPageView(
  request: FastifyRequest<{ Body: TrackingPayload }>,
  reply: FastifyReply
) {
  try {
    const userAgent = request.headers["user-agent"] || "";
    const ipAddress = getIpAddress(request);
    const userId = getUserId(ipAddress, userAgent);
    const existingSession = await getExistingSession(userId);

    const payload = {
      ...request.body,
      ipAddress: ipAddress,
      timestamp: new Date().toISOString(),
      ua: userAgentParser(userAgent),
      userId: userId,
      sessionId: existingSession?.session_id || crypto.randomUUID(),
    };

    pageviewQueue.add(payload);
    // insertPageview(payload);
    await updateSession(payload, existingSession);

    return reply.status(200).send();
  } catch (error) {
    request.log.error(error);
    return reply.status(500).send({
      success: false,
      error: "Failed to track pageview",
    });
  }
}
