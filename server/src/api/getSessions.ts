import { FastifyReply, FastifyRequest } from "fastify";
import clickhouse from "../db/clickhouse/clickhouse.js";
import {
  getFilterStatement,
  getTimeStatement,
  processResults,
} from "./utils.js";
import { getUserHasAccessToSite } from "../lib/auth-utils.js";

interface GetSessionsRequest {
  Querystring: {
    startDate: string;
    endDate: string;
    timezone: string;
    site: string;
    filters: string;
    page: number;
    userId?: string;
  };
}

type GetSessionsResponse = {
  session_id: string;
  user_id: string;
  country: string;
  iso_3166_2: string;
  language: string;
  device_type: string;
  browser: string;
  operating_system: string;
  referrer: string;
  session_end: string;
  session_start: string;
  session_duration: number;
  entry_page: string;
  exit_page: string;
  pageviews: number;
  events: number;
}[];

export async function fetchSessions({
  startDate,
  endDate,
  timezone,
  site,
  filters,
  page,
  userId,
}: GetSessionsRequest["Querystring"]) {
  const filterStatement = getFilterStatement(filters);

  const query = `
SELECT
    session_id,
    user_id,
    argMax(country, timestamp) AS country,
    argMax(iso_3166_2, timestamp) AS iso_3166_2,
    argMax(language, timestamp) AS language,
    argMax(device_type, timestamp) AS device_type,
    argMax(browser, timestamp) AS browser,
    argMax(operating_system, timestamp) AS operating_system,
    argMin(referrer, timestamp) AS referrer,
    MAX(timestamp) AS session_end,
    MIN(timestamp) AS session_start,
    dateDiff('second', MIN(timestamp), MAX(timestamp)) AS session_duration,
    argMinIf(pathname, timestamp, type = 'pageview') AS entry_page,
    argMaxIf(pathname, timestamp, type = 'pageview') AS exit_page,
    countIf(type = 'pageview') AS pageviews,
    countIf(type = 'custom_event') AS events
FROM pageviews
WHERE
    site_id = ${site}
    ${userId ? ` AND user_id = '${userId}'` : ""}
    ${filterStatement}
    ${getTimeStatement({
      date: { startDate, endDate, timezone },
    })}
GROUP BY
    session_id,
    user_id
ORDER BY session_end DESC
LIMIT 100 OFFSET ${(page - 1) * 100}
  `;

  try {
    const result = await clickhouse.query({
      query,
      format: "JSONEachRow",
    });

    return await processResults<GetSessionsResponse[number]>(result);
  } catch (error) {
    console.error("Error fetching devices:", error);
    return null;
  }
}

export async function getSessions(
  req: FastifyRequest<GetSessionsRequest>,
  res: FastifyReply
) {
  const { startDate, endDate, timezone, site, filters, page, userId } =
    req.query;

  const userHasAccessToSite = await getUserHasAccessToSite(req, site);
  if (!userHasAccessToSite) {
    return res.status(403).send({ error: "Forbidden" });
  }

  const data = await fetchSessions({
    startDate,
    endDate,
    timezone,
    site,
    filters,
    page,
    userId,
  });
  if (!data) {
    return res.status(500).send({ error: "Failed to fetch devices" });
  }

  return res.send({ data });
}
