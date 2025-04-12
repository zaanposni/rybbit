import { FastifyRequest, FastifyReply } from "fastify";
import { publicSites } from "../../lib/publicSites.js";

export async function getSiteIsPublic(
  request: FastifyRequest<{ Params: { site: string } }>,
  reply: FastifyReply
) {
  const { site } = request.params;
  const isPublic = publicSites.isSitePublic(site);
  return reply.status(200).send({ isPublic });
}
