import { FastifyReply, FastifyRequest } from "fastify";
import { getSitesUserHasAccessTo } from "../../lib/auth-utils.js";

export async function getSites(req: FastifyRequest, reply: FastifyReply) {
  try {
    const sitesData = await getSitesUserHasAccessTo(req);
    return reply.status(200).send({ data: sitesData });
  } catch (err) {
    return reply.status(500).send({ error: String(err) });
  }
}
