import { FastifyReply, FastifyRequest } from "fastify";
import clickhouse from "../db/clickhouse/clickhouse.js";
import { GenericRequest } from "./types.js";
import { getTimeStatement, processResults } from "./utils.js";

type GetOverviewResponse = {
  sessions: number;
  pageviews: number;
  users: number;
  pages_per_session: number;
  bounce_rate: number;
  session_duration: number;
};

export async function getOverview(
  { query: { startDate, endDate, timezone } }: FastifyRequest<GenericRequest>,
  res: FastifyReply
) {
  const query = `
    SELECT 
        session_stats.sessions,
        session_stats.pages_per_session,
        session_stats.bounce_rate,
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
            -- Build a summary row per session
            SELECT
                session_id,
                MIN(timestamp) AS start_time,
                MAX(timestamp) AS end_time,
                COUNT(*)      AS pages_in_session
            FROM pageviews
            WHERE
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
            ${getTimeStatement(startDate, endDate, timezone)}
    ) AS page_stats
  `;

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
