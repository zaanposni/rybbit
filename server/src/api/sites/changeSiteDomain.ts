import { eq } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../../db/postgres/postgres.js";
import { sites } from "../../db/postgres/schema.js";
import { loadAllowedDomains } from "../../lib/allowedDomains.js";
import { getUserHasAccessToSite } from "../../lib/auth-utils.js";

export async function changeSiteDomain(
  request: FastifyRequest<{
    Body: {
      siteId: number;
      newDomain: string;
    };
  }>,
  reply: FastifyReply
) {
  const { siteId, newDomain } = request.body;

  const userHasAccessToSite = await getUserHasAccessToSite(
    request,
    String(siteId)
  );
  if (!userHasAccessToSite) {
    return reply.status(403).send({ error: "Forbidden" });
  }

  // Validate domain format using regex
  const domainRegex =
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (!domainRegex.test(newDomain)) {
    return reply.status(400).send({
      error:
        "Invalid domain format. Must be a valid domain like example.com or sub.example.com",
    });
  }

  try {
    // Check if site exists and user has permission
    const siteResult = await db
      .select()
      .from(sites)
      .where(eq(sites.siteId, siteId));

    if (siteResult.length === 0) {
      return reply.status(404).send({ error: "Site not found" });
    }

    // Update the site domain
    await db
      .update(sites)
      .set({
        domain: newDomain,
        name: newDomain,
        updatedAt: new Date(),
      })
      .where(eq(sites.siteId, siteId));

    // Reload allowed domains to update CORS configuration
    await loadAllowedDomains();

    return reply.status(200).send({ message: "Domain updated successfully" });
  } catch (err) {
    console.error("Error changing site domain:", err);

    // Check for unique constraint violation
    if (
      String(err).includes(
        'duplicate key value violates unique constraint "sites_domain_unique"'
      )
    ) {
      return reply.status(409).send({ error: "Domain already in use" });
    }

    return reply.status(500).send({ error: String(err) });
  }
}
