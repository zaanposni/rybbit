import { FastifyReply, FastifyRequest } from "fastify";
import { getTimeStatement, processResults } from "./utils.js";
import clickhouse from "../db/clickhouse/clickhouse.js";
import { GenericRequest } from "./types.js";

type GetPagesResponse = {
  pathname: string;
  count: number;
  percentage: number;
}[];

export async function getPages(
  { query: { startDate, endDate, timezone } }: FastifyRequest<GenericRequest>,
  res: FastifyReply
) {
  const query = `
    SELECT
      pathname,
      COUNT(*) as count,
      ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
    FROM pageviews
    WHERE
        ${getTimeStatement(startDate, endDate, timezone)}
    GROUP BY pathname 
    ORDER BY count desc
    LIMIT 100;
  `;

  try {
    const result = await clickhouse.query({
      query,
      format: "JSONEachRow",
    });

    const data = await processResults<GetPagesResponse[number]>(result);
    return res.send({ data });
  } catch (error) {
    console.error("Error fetching pages:", error);
    return res.status(500).send({ error: "Failed to fetch pages" });
  }
}
