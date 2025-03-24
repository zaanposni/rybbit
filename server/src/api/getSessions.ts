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
  last_pageview_timestamp: string;
  pageviews: number;
}[];

export async function fetchSessions({
  startDate,
  endDate,
  timezone,
  site,
  filters,
  page,
}: GetSessionsRequest["Querystring"]) {
  const filterStatement = getFilterStatement(filters);

  const query = `
SELECT
    session_id,
    user_id,
    country,
    iso_3166_2,
    language,
    device_type,
    browser,
    operating_system,
    referrer,
    MAX(timestamp) AS last_pageview_timestamp,
    COUNT(*) AS pageviews
FROM pageviews
WHERE
    site_id = ${site}
    ${filterStatement}
    ${getTimeStatement(startDate, endDate, timezone)}
    AND type = 'pageview'
GROUP BY
    session_id,
    user_id,
    browser,
    country,
    iso_3166_2,
    language,
    device_type,
    operating_system,
    referrer
ORDER BY last_pageview_timestamp DESC
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
  const { startDate, endDate, timezone, site, filters, page } = req.query;

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
    page
  });
  if (!data) {
    return res.status(500).send({ error: "Failed to fetch devices" });
  }

  return res.send({ data });
}
