import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db/postgres/postgres.js";
import { sites } from "../../db/postgres/schema.js";
import { eq } from "drizzle-orm";
import { isSitePublic } from "../../utils.js";

interface GetSiteParams {
  Params: {
    id: string;
  };
}

export async function getSite(
  request: FastifyRequest<GetSiteParams>,
  reply: FastifyReply
) {
  const { id } = request.params;
  const userId = request.user?.id;

  try {
    // Get site info
    const site = await db.query.sites.findFirst({
      where: eq(sites.siteId, Number(id)),
    });

    if (!site) {
      return reply.status(404).send({ error: "Site not found" });
    }

    // Check if user is authorized to access this site
    const isPublic = await isSitePublic(id);
    const isOwner = site.createdBy === userId;

    // Only allow access if the site is public or the user is the owner
    if (!isPublic && !isOwner) {
      return reply.status(403).send({ error: "Access denied" });
    }

    return reply.status(200).send({
      siteId: site.siteId,
      name: site.name,
      domain: site.domain,
      createdAt: site.createdAt,
      updatedAt: site.updatedAt,
      createdBy: site.createdBy,
      public: site.public,
      isOwner: isOwner,
    });
  } catch (error) {
    console.error("Error retrieving site:", error);
    return reply.status(500).send({ error: "Internal server error" });
  }
}
