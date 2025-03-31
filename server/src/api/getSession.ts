import { FastifyReply, FastifyRequest } from "fastify";
import clickhouse from "../db/clickhouse/clickhouse.js";
import {
  getFilterStatement,
  getTimeStatement,
  processResults,
} from "./utils.js";
import { getUserHasAccessToSite } from "../lib/auth-utils.js";

export interface SessionDetails {
  session_id: string;
  user_id: string;
  country: string;
  iso_3166_2: string;
  language: string;
  device_type: string;
  browser: string;
  browser_version: string;
  operating_system: string;
  operating_system_version: string;
  screen_width: number;
  screen_height: number;
  referrer: string;
  session_end: string;
  session_start: string;
  session_duration: number;
  pageviews: number;
  events: number;
  entry_page: string;
  exit_page: string;
}

export interface PageviewEvent {
  timestamp: string;
  pathname: string;
  hostname: string;
  querystring: string;
  page_title: string;
  referrer: string;
  type: string;
  event_name?: string;
  properties?: string;
}

export interface SessionPageviewsAndEvents {
  session: SessionDetails;
  pageviews: PageviewEvent[];
}

export interface GetSessionRequest {
  Params: {
    sessionId: string;
  };
  Querystring: {
    site: string;
  };
}

export async function getSession(
  req: FastifyRequest<GetSessionRequest>,
  res: FastifyReply
) {
  const { sessionId } = req.params;
  const { site } = req.query;

  const userHasAccessToSite = await getUserHasAccessToSite(req, site);
  if (!userHasAccessToSite) {
    return res.status(403).send({ error: "Forbidden" });
  }

  try {
    // 1. First query: Get session data
    const sessionQuery = `
SELECT
    session_id,
    user_id,
    country,
    iso_3166_2,
    language,
    device_type,
    browser,
    browser_version,
    operating_system,
    operating_system_version,
    screen_width,
    screen_height,
    referrer,
    session_end,
    session_start,
    pageviews,
    entry_page,
    exit_page
FROM sessions
WHERE 
    site_id = ${site}
    AND session_id = '${sessionId}'
LIMIT 1
    `;

    // 2. Second query: Get all pageviews and events for this session
    const pageviewsQuery = `
SELECT
    timestamp,
    pathname,
    hostname,
    querystring,
    page_title,
    referrer,
    type,
    event_name,
    properties
FROM pageviews
WHERE
    site_id = ${site}
    AND session_id = '${sessionId}'
ORDER BY timestamp ASC
    `;

    // Execute both queries in parallel
    const [sessionResultSettled, pageviewsResultSettled] =
      await Promise.allSettled([
        clickhouse.query({
          query: sessionQuery,
          format: "JSONEachRow",
        }),
        clickhouse.query({
          query: pageviewsQuery,
          format: "JSONEachRow",
        }),
      ]);

    // Check if queries were successful
    if (sessionResultSettled.status === "rejected") {
      throw sessionResultSettled.reason;
    }
    if (pageviewsResultSettled.status === "rejected") {
      throw pageviewsResultSettled.reason;
    }

    const sessionResult = sessionResultSettled.value;
    const pageviewsResult = pageviewsResultSettled.value;

    const sessionData = await processResults<SessionDetails>(sessionResult);
    const pageviewsData = await processResults<PageviewEvent>(pageviewsResult);

    if (!sessionData || sessionData.length === 0) {
      return res.status(404).send({ error: "Session not found" });
    }

    // Combine both results
    const response: SessionPageviewsAndEvents = {
      session: sessionData[0],
      pageviews: pageviewsData,
    };

    return res.send({ data: response });
  } catch (error) {
    console.error("Error fetching session data:", error);
    return res.status(500).send({ error: "Failed to fetch session data" });
  }
}

export default { getSession };
