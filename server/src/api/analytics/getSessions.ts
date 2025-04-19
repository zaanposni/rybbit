import { FastifyReply, FastifyRequest } from "fastify";
import clickhouse from "../../db/clickhouse/clickhouse.js";
import {
  getFilterStatement,
  getTimeStatement,
  processResults,
} from "./utils.js";
import { getUserHasAccessToSitePublic } from "../../lib/auth-utils.js";

export type GetSessionsResponse = {
  session_id: string;
  user_id: string;
  country: string;
  region: string;
  city: string;
  language: string;
  device_type: string;
  browser: string;
  operating_system: string;
  referrer: string;
  channel: string;
  session_end: string;
  session_start: string;
  session_duration: number;
  entry_page: string;
  exit_page: string;
  pageviews: number;
  events: number;
}[];

export interface GetSessionsRequest {
  Params: {
    site: string;
  };
  Querystring: {
    startDate: string;
    endDate: string;
    timezone: string;
    filters: string;
    page: number;
    userId?: string;
  };
}

export async function getSessions(
  req: FastifyRequest<GetSessionsRequest>,
  res: FastifyReply
) {
  const { startDate, endDate, timezone, filters, page, userId } = req.query;
  const site = req.params.site;
  const userHasAccessToSite = await getUserHasAccessToSitePublic(req, site);
  if (!userHasAccessToSite) {
    return res.status(403).send({ error: "Forbidden" });
  }

  const filterStatement = getFilterStatement(filters);
  const timeStatement = getTimeStatement({
    date: { startDate, endDate, timezone },
  });

  const query = `
  WITH AggregatedSessions AS (
      SELECT
          session_id,
          user_id,
          argMax(country, timestamp) AS country,
          argMax(region, timestamp) AS region,
          argMax(city, timestamp) AS city,
          argMax(language, timestamp) AS language,
          argMax(device_type, timestamp) AS device_type,
          argMax(browser, timestamp) AS browser,
          argMax(operating_system, timestamp) AS operating_system,
          argMax(screen_width, timestamp) AS screen_width,
          argMax(screen_height, timestamp) AS screen_height,
          argMin(referrer, timestamp) AS referrer,
          argMin(channel, timestamp) AS channel,
          MAX(timestamp) AS session_end,
          MIN(timestamp) AS session_start,
          dateDiff('second', MIN(timestamp), MAX(timestamp)) AS session_duration,
          argMinIf(pathname, timestamp, type = 'pageview') AS entry_page,
          argMaxIf(pathname, timestamp, type = 'pageview') AS exit_page,
          countIf(type = 'pageview') AS pageviews,
          countIf(type = 'custom_event') AS events
      FROM events
      WHERE
          site_id = ${site}
          ${userId ? ` AND user_id = '${userId}'` : ""}
          ${timeStatement}
      GROUP BY
          session_id,
          user_id
  )
  SELECT *
  FROM AggregatedSessions
  WHERE 1 = 1 ${filterStatement}
  ORDER BY session_end DESC
  LIMIT 100 OFFSET ${(page - 1) * 100}
  `;

  try {
    const result = await clickhouse.query({
      query,
      format: "JSONEachRow",
    });

    const data = await processResults<GetSessionsResponse[number]>(result);
    return res.send({ data });
  } catch (error) {
    console.error("Generated Query:", query);
    console.error("Error fetching sessions:", error);
    return res.status(500).send({ error: "Failed to fetch sessions" });
  }
}
