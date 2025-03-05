import { FastifyReply } from "fastify";
import { FastifyRequest } from "fastify";
import { db } from "../../db/postgres/postgres.js";
import { sites } from "../../db/postgres/schema.js";
import { loadAllowedDomains } from "../../lib/allowedDomains.js";
import clickhouse from "../../db/clickhouse/clickhouse.js";
import { eq } from "drizzle-orm";

export async function deleteSite(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;

  await db.delete(sites).where(eq(sites.siteId, id));
  // await clickhouse.query({
  //   query: `DELETE FROM pageviews WHERE site_id = ${id}`,
  // });
  await loadAllowedDomains();

  return reply.status(200).send();
}
