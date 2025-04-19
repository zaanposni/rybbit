import { FastifyReply, FastifyRequest } from "fastify";
import clickhouse from "../../db/clickhouse/clickhouse.js";
import { getUserHasAccessToSitePublic } from "../../lib/auth-utils.js";
import { processResults } from "./utils.js";

export interface SessionDetails {
  session_id: string;
  user_id: string;
  country: string;
  region: string;
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
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface GetSessionRequest {
  Params: {
    sessionId: string;
    site: string;
  };
  Querystring: {
    limit?: string;
    offset?: string;
  };
}

export async function getSession(
  req: FastifyRequest<GetSessionRequest>,
  res: FastifyReply
) {
  const { sessionId, site } = req.params;
  const limit = req.query.limit ? parseInt(req.query.limit) : 100;
  const offset = req.query.offset ? parseInt(req.query.offset) : 0;

  const userHasAccessToSite = await getUserHasAccessToSitePublic(req, site);
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
    region,
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

    // 2. Query to get total count of pageviews
    const countQuery = `
SELECT
    COUNT(*) as total
FROM events
WHERE
    site_id = ${site}
    AND session_id = '${sessionId}'
    `;

    // 3. Query to get paginated pageviews
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
FROM events
WHERE
    site_id = ${site}
    AND session_id = '${sessionId}'
ORDER BY timestamp ASC
LIMIT ${limit}
OFFSET ${offset}
    `;

    // Execute queries in parallel
    const [sessionResultSettled, countResultSettled, pageviewsResultSettled] =
      await Promise.allSettled([
        clickhouse.query({
          query: sessionQuery,
          format: "JSONEachRow",
        }),
        clickhouse.query({
          query: countQuery,
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
    if (countResultSettled.status === "rejected") {
      throw countResultSettled.reason;
    }
    if (pageviewsResultSettled.status === "rejected") {
      throw pageviewsResultSettled.reason;
    }

    const sessionResult = sessionResultSettled.value;
    const countResult = countResultSettled.value;
    const pageviewsResult = pageviewsResultSettled.value;

    const sessionData = await processResults<SessionDetails>(sessionResult);
    const countData = await processResults<{ total: number }>(countResult);
    const pageviewsData = await processResults<PageviewEvent>(pageviewsResult);

    if (!sessionData || sessionData.length === 0) {
      return res.status(404).send({ error: "Session not found" });
    }

    // Combine results
    const response: SessionPageviewsAndEvents = {
      session: sessionData[0],
      pageviews: pageviewsData,
      pagination: {
        total: countData[0].total,
        limit,
        offset,
        hasMore: offset + pageviewsData.length < countData[0].total,
      },
    };

    return res.send({ data: response });
  } catch (error) {
    console.error("Error fetching session data:", error);
    return res.status(500).send({ error: "Failed to fetch session data" });
  }
}

export default { getSession };
