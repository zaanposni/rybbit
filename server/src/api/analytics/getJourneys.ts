import { FastifyRequest, FastifyReply } from "fastify";
import clickhouse from "../../db/clickhouse/clickhouse.js";
import { DateTime } from "luxon";
import { getTimeStatement } from "./utils.js";

export const getJourneys = async (
  request: FastifyRequest<{
    Params: { site: string };
    Querystring: {
      steps?: string;
      startDate?: string;
      endDate?: string;
      timezone?: string;
    };
  }>,
  reply: FastifyReply
) => {
  try {
    const { site } = request.params;
    const { steps = "3", startDate, endDate, timezone = "UTC" } = request.query;

    const maxSteps = parseInt(steps, 10);

    if (isNaN(maxSteps) || maxSteps < 2 || maxSteps > 10) {
      return reply.status(400).send({
        error: "Steps parameter must be a number between 2 and 10",
      });
    }

    // Time conditions using getTimeStatement
    const timeStatement = getTimeStatement({
      date:
        startDate || endDate
          ? {
              startDate:
                startDate || DateTime.now().minus({ days: 30 }).toISODate(),
              endDate: endDate || DateTime.now().toISODate(),
              timezone,
              table: "events",
            }
          : undefined,
    });

    // Query to find sequences of events (journeys) for each user
    const result = await clickhouse.query({
      query: `
        WITH user_paths AS (
          SELECT
            user_id,
            arrayCompact(groupArray(pathname)) AS path_sequence
          FROM (
            SELECT
              user_id,
              pathname,
              timestamp
            FROM events
            WHERE 
              site_id = ${site}
              ${timeStatement || ""}
              AND type = 'pageview'
            ORDER BY user_id, timestamp
          )
          GROUP BY user_id
          HAVING length(path_sequence) >= 2
        ),
        
        journey_segments AS (
          SELECT
            arraySlice(path_sequence, 1, ${maxSteps}) AS journey,
            count() AS users_count
          FROM user_paths
          GROUP BY journey
          ORDER BY users_count DESC
          LIMIT 100
        )
        
        SELECT
          journey,
          users_count,
          users_count * 100 / (
            SELECT count(DISTINCT user_id) 
            FROM events 
            WHERE site_id = ${site} ${timeStatement || ""}
          ) AS percentage
        FROM journey_segments
      `,
      //   query_params: {
      //     site: parseInt(site, 10),
      //   },
    });

    const data = await result.json();

    return reply.send({
      journeys: data.data.map((item: any) => ({
        path: item.journey,
        count: Number(item.users_count),
        percentage: Number(item.percentage),
      })),
    });
  } catch (error) {
    console.error("Error getting journeys:", error);
    return reply.status(500).send({ error: "Failed to get journeys" });
  }
};
