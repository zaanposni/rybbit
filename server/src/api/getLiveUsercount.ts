import { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../db/postgres/postgres.js";
import { activeSessions } from "../db/postgres/schema.js";
import { eq, count } from "drizzle-orm";

export const getLiveUsercount = async (
  { params: { site } }: FastifyRequest<{ Params: { site: string } }>,
  res: FastifyReply
) => {
  const result = await db
    .select({ count: count() })
    .from(activeSessions)
    .where(eq(activeSessions.siteId, Number(site)));

  return res.send({ count: result[0].count });
};
