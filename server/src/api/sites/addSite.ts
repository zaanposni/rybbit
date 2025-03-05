import { fromNodeHeaders } from "better-auth/node";
import { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../../db/postgres/postgres.js";
import { sites } from "../../db/postgres/schema.js";
import { loadAllowedDomains } from "../../lib/allowedDomains.js";
import { auth } from "../../lib/auth.js";

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
    await db.insert(sites).values({
      domain,
      name,
      createdBy: session.user.id,
    });

    await loadAllowedDomains();
    return reply.status(200).send();
  } catch (err) {
    return reply.status(500).send({ error: String(err) });
  }
}
