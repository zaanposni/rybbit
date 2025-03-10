import { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db/postgres/postgres.js";
import { activeSessions } from "../db/postgres/schema.js";
import { eq, count } from "drizzle-orm";
import { getUserHasAccessToSite } from "../lib/auth-utils.js";

export const getLiveUsercount = async (
  req: FastifyRequest<{ Params: { site: string } }>,
  res: FastifyReply
) => {
  const { site } = req.params;
  const userHasAccessToSite = await getUserHasAccessToSite(req, site);
  if (!userHasAccessToSite) {
    return res.status(403).send({ error: "Forbidden" });
  }

  const result = await db
    .select({ count: count() })
    .from(activeSessions)
    .where(eq(activeSessions.siteId, Number(site)));

  return res.send({ count: result[0].count });
};
