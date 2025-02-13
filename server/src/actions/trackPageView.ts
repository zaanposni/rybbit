import { FastifyRequest } from "fastify";
import { TrackingPayload } from "../types.js";
import { getUserId, getDeviceType, getIpAddress } from "../utils.js";
import crypto from "crypto";
import { sql } from "../db/postgres/postgres.js";
import UAParser, { UAParser as userAgentParser } from "ua-parser-js";

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

const getExistingSession = async (userId: string): Promise<Pageview | null> => {
  const [existingSession] = await sql<Pageview[]>`
    SELECT * FROM active_sessions WHERE user_id = ${userId}
  `;
  return existingSession;
};

const updateSession = async (
  pageview: TotalPayload,
  existingSession: Pageview | null
) => {
  if (existingSession) {
    await sql`
      UPDATE active_sessions SET last_activity = ${pageview.timestamp}, pageviews = pageviews + 1 WHERE user_id = ${pageview.userId}
    `;
    return;
  }

  const inserts = {
    session_id: pageview.sessionId,
    user_id: pageview.userId,
    hostname: pageview.hostname || "",
    start_time: pageview.timestamp || "",
    last_activity: pageview.timestamp || "",
    pageviews: 1,
    entry_page: pageview.pathname || "",
    // exit_page: pageview.pathname,
    device_type: getDeviceType(
      pageview.screenWidth,
      pageview.screenHeight,
      pageview.ua
    ),
    screen_width: pageview.screenWidth || 0,
    screen_height: pageview.screenHeight || 0,
    browser: pageview.ua.browser.name || "",
    operating_system: pageview.ua.os.name || "",
    language: pageview.language || "",
    referrer: pageview.referrer || "",
  };

  await sql`
    INSERT INTO active_sessions ${sql(inserts)}
  `;
};

export async function trackPageView(
  request: FastifyRequest<{ Body: TrackingPayload }>
) {
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
  updateSession(payload, existingSession);
}
