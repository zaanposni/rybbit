import { eq } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../../db/postgres/postgres.js";
import { sites } from "../../db/postgres/schema.js";
import { loadAllowedDomains } from "../../lib/allowedDomains.js";

export async function deleteSite(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params;

  await db.delete(sites).where(eq(sites.siteId, Number(id)));
  // await clickhouse.query({
  //   query: `DELETE FROM pageviews WHERE site_id = ${id}`,
  // });
  await loadAllowedDomains();

  return reply.status(200).send();
}
