import { FastifyReply } from "fastify";

import { FastifyRequest } from "fastify";
import { auth } from "../../lib/auth.js";
import { fromNodeHeaders } from "better-auth/node";
import { sql } from "../../db/postgres/postgres.js";
import { loadAllowedDomains } from "../../lib/allowedDomains.js";

export async function addSite(
  request: FastifyRequest<{ Body: { domain: string; name: string } }>,
  reply: FastifyReply
) {
  const { domain, name } = request.body;

  // Validate domain format using regex
  const domainRegex =
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return reply.status(400).send({
      error:
        "Invalid domain format. Must be a valid domain like example.com or sub.example.com",
    });
  }

  const session = await auth!.api.getSession({
    headers: fromNodeHeaders(request.headers),
  });

  if (!session?.user.id) {
    return reply.status(500).send({ error: "Could not find user id" });
  }
  try {
    await sql`INSERT INTO sites (domain, name, created_by) VALUES (${domain}, ${name}, ${session?.user.id})`;
    await loadAllowedDomains();
    return reply.status(200).send();
  } catch (err) {
    return reply.status(500).send({ error: String(err) });
  }
}
