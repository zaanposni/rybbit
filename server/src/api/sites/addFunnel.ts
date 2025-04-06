import { FastifyReply } from "fastify";

import { FastifyRequest } from "fastify";

export function addFunnel(
  request: FastifyRequest<{
    Body: { domain: string; name: string; organizationId: string };
  }>,
  reply: FastifyReply
) {
  const { domain, name, organizationId } = request.body;
}
