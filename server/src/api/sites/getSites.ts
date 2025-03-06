import { FastifyReply } from "fastify";
import { FastifyRequest } from "fastify";
import { db } from "../../db/postgres/postgres.js";
import { sites } from "../../db/postgres/schema.js";

export async function getSites(_: FastifyRequest, reply: FastifyReply) {
  try {
    const sitesData = await db.select().from(sites);
    return reply.status(200).send({ data: sitesData });
  } catch (err) {
    return reply.status(500).send({ error: String(err) });
  }
}
