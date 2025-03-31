import { FastifyReply, FastifyRequest } from "fastify";
import clickhouse from "../db/clickhouse/clickhouse.js";
import { getUserHasAccessToSite } from "../lib/auth-utils.js";
import { processResults } from "./utils.js";

export async function fetchLiveUserCount (site: string) {
  const query = await clickhouse.query({
    query: `SELECT COUNT(DISTINCT(session_id)) AS count FROM pageviews WHERE timestamp > now() - interval '5 minute' AND site_id = {siteId:Int32}`,
    format: "JSONEachRow",
    query_params: {
      siteId: Number(site),
    },
  });

  const result = await processResults<{ count: number }>(query);

  return result[0]?.count ?? 0;
}

export async function getLiveUserCount (
  req: FastifyRequest<{ Params: { site: string } }>,
  res: FastifyReply
) {
  const { site } = req.params;

  const userHasAccessToSite = await getUserHasAccessToSite(req, site);
  if (!userHasAccessToSite) {
    return res.status(403).send({ error: "Forbidden" });
  }

  const count = await fetchLiveUserCount(site);
  return res.send({ count });
}
