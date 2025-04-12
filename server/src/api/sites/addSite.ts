import { fromNodeHeaders } from "better-auth/node";
import { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../../db/postgres/postgres.js";
import { sites } from "../../db/postgres/schema.js";
import { loadAllowedDomains } from "../../lib/allowedDomains.js";
import { auth } from "../../lib/auth.js";
import { publicSites } from "../../lib/publicSites.js";

export async function addSite(
  request: FastifyRequest<{
    Body: { domain: string; name: string; organizationId: string };
  }>,
  reply: FastifyReply
) {
  const { domain, name, organizationId } = request.body;

  // Validate domain format using regex
  const domainRegex =
    /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return reply.status(400).send({
      error:
        "Invalid domain format. Must be a valid domain like example.com or sub.example.com",
    });
  }

  try {
    // Get the current user's session
    const headers = new Headers(request.headers as any);
    const session = await auth!.api.getSession({ headers });

    if (!session?.user?.id) {
      return reply.status(401).send({
        error: "Unauthorized",
        message: "You must be logged in to add a site",
      });
    }

    // Check if the organization exists
    if (!organizationId) {
      return reply.status(400).send({
        error: "Organization ID is required",
      });
    }

    // Check if the user is an owner or admin of the organization
    // First, get the user's role in the organization
    const member = await db.query.member.findFirst({
      where: (member, { and, eq }) =>
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, organizationId)
        ),
    });

    if (!member) {
      return reply.status(403).send({
        error: "You are not a member of this organization",
      });
    }

    // Check if the user's role is admin or owner
    if (member.role !== "admin" && member.role !== "owner") {
      return reply.status(403).send({
        error:
          "You must be an admin or owner to add sites to this organization",
      });
    }

    // Check if site already exists
    const existingSite = await db.query.sites.findFirst({
      where: (sites, { eq }) => eq(sites.domain, domain),
    });

    if (existingSite) {
      return reply.status(400).send({
        error: "Site already exists",
      });
    }

    // Create the new site
    const newSite = await db
      .insert(sites)
      .values({
        domain,
        name,
        createdBy: session.user.id,
        organizationId,
      })
      .returning();

    // Update allowed domains
    await loadAllowedDomains();

    // Update publicSites cache with the new site
    publicSites.addSite(newSite[0].siteId, newSite[0].public || false);

    return reply.status(201).send(newSite[0]);
  } catch (error) {
    console.error("Error adding site:", error);
    return reply.status(500).send({
      error: "Internal server error",
    });
  }
}
