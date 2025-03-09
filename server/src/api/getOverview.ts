import { FastifyReply, FastifyRequest } from "fastify";
import clickhouse from "../db/clickhouse/clickhouse.js";
import { GenericRequest } from "./types.js";
import {
  getFilterStatement,
  getTimeStatement,
  processResults,
} from "./utils.js";

type GetOverviewResponse = {
  sessions: number;
  pageviews: number;
  users: number;
  pages_per_session: number;
  bounce_rate: number;
  session_duration: number;
};

const getQuery = ({
  startDate,
  endDate,
  timezone,
  site,
  filters,
  past24Hours,
}: {
  startDate: string;
  endDate: string;
  timezone: string;
  site: string;
  filters: string;
  past24Hours: boolean;
}) => {
  const filterStatement = getFilterStatement(filters);

  if (past24Hours) {
    return `SELECT 
      session_stats.sessions,
      session_stats.pages_per_session,
      session_stats.bounce_rate * 100 AS bounce_rate,
      session_stats.session_duration,
      page_stats.pageviews,
      page_stats.users
    FROM
    (
        -- Session-level metrics
        SELECT
            COUNT() AS sessions,
            AVG(pages_in_session) AS pages_per_session,
            sumIf(1, pages_in_session = 1) / COUNT() AS bounce_rate,
            AVG(end_time - start_time) AS session_duration
        FROM
            (
                -- One row per session
                SELECT
                    session_id,
                    MIN(timestamp) AS start_time,
                    MAX(timestamp) AS end_time,
                    COUNT(*)      AS pages_in_session 
                FROM pageviews
                WHERE
                    site_id = ${site}
                    ${filterStatement}
                    AND timestamp >= toTimeZone(now('${timezone}'), 'UTC') - INTERVAL 1 DAY
                    AND timestamp < toTimeZone(now('${timezone}'), 'UTC') 
                GROUP BY session_id
            )
        ) AS session_stats
        CROSS JOIN
        (
            -- Page-level and user-level metrics  
            SELECT
                COUNT(*)                   AS pageviews,
                COUNT(DISTINCT user_id)    AS users
            FROM pageviews
            WHERE 
                site_id = ${site}
                ${filterStatement}  
                AND timestamp >= toTimeZone(now('${timezone}'), 'UTC') - INTERVAL 1 DAY
                AND timestamp < toTimeZone(now('${timezone}'), 'UTC')
        ) AS page_stats`;
  }

  return `SELECT   
      session_stats.sessions,
      session_stats.pages_per_session,
      session_stats.bounce_rate * 100 AS bounce_rate,
      session_stats.session_duration,
      page_stats.pageviews,
      page_stats.users  
    FROM
    (
        -- Session-level metrics
        SELECT
            COUNT() AS sessions,
            AVG(pages_in_session) AS pages_per_session,
            sumIf(1, pages_in_session = 1) / COUNT() AS bounce_rate,
            AVG(end_time - start_time) AS session_duration
        FROM
            (
                -- One row per session
                SELECT
                    session_id,
                    MIN(timestamp) AS start_time,
                    MAX(timestamp) AS end_time,
                    COUNT(*)      AS pages_in_session
                FROM pageviews
                WHERE
                    site_id = ${site}
                    ${filterStatement}
                    ${getTimeStatement(startDate, endDate, timezone)}
                GROUP BY session_id
            )
        ) AS session_stats
        CROSS JOIN
        (
            -- Page-level and user-level metrics
            SELECT
                COUNT(*)                   AS pageviews,
                COUNT(DISTINCT user_id)    AS users
            FROM pageviews
            WHERE 
                site_id = ${site}
                ${filterStatement}
                ${getTimeStatement(startDate, endDate, timezone)}
        ) AS page_stats`;
};

export async function getOverview(
  {
    query: { startDate, endDate, timezone, site, filters, past24Hours },
  }: FastifyRequest<GenericRequest & { Querystring: { past24Hours: boolean } }>,
  res: FastifyReply
) {
  const query = getQuery({
    startDate,
    endDate,
    timezone,
    site,
    filters,
    past24Hours,
  });

  try {
    const result = await clickhouse.query({
      query,
      format: "JSONEachRow",
    });

    const data = await processResults<GetOverviewResponse>(result);
    return res.send({ data: data[0] });
  } catch (error) {
    console.error("Error fetching overview:", error);
    return res.status(500).send({ error: "Failed to fetch overview" });
  }
}
