import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/postgres/postgres.js";
import { reports } from "../db/postgres/schema.js";
import { getUserHasAccessToSite } from "../lib/auth-utils.js";
import { eq } from "drizzle-orm";

type FunnelStep = {
  value: string;
  name?: string;
  type: "page" | "event";
};

type Funnel = {
  steps: FunnelStep[];
  name: string;
  reportId?: number; // Optional report ID for updates
};

export async function createFunnel(
  request: FastifyRequest<{
    Body: Funnel;
    Params: {
      site: string;
    };
  }>,
  reply: FastifyReply
) {
  const { steps, name, reportId } = request.body;
  const { site } = request.params;
  const userId = request.user?.id;

  // Validate request
  if (!steps || steps.length < 2) {
    return reply
      .status(400)
      .send({ error: "At least 2 steps are required for a funnel" });
  }

  if (!name) {
    return reply.status(400).send({ error: "Funnel name is required" });
  }

  // Check user access to site
  const userHasAccessToSite = await getUserHasAccessToSite(request, site);
  if (!userHasAccessToSite) {
    return reply.status(403).send({ error: "Forbidden" });
  }

  try {
    let result;

    if (reportId) {
      // Check if the report exists and user has access to it
      const existingReport = await db.query.reports.findFirst({
        where: eq(reports.reportId, reportId),
      });

      if (!existingReport) {
        return reply.status(404).send({ error: "Report not found" });
      }

      if (existingReport.siteId !== Number(site)) {
        return reply
          .status(403)
          .send({ error: "Report does not belong to this site" });
      }

      // Update existing funnel
      result = await db
        .update(reports)
        .set({
          data: {
            name,
            steps,
          },
          updatedAt: new Date().toISOString(),
        })
        .where(eq(reports.reportId, reportId))
        .returning({ reportId: reports.reportId });

      if (!result || result.length === 0) {
        return reply.status(500).send({ error: "Failed to update funnel" });
      }
    } else {
      // Create new funnel
      result = await db
        .insert(reports)
        .values({
          siteId: Number(site),
          userId,
          reportType: "funnel",
          data: {
            name,
            steps,
          },
        })
        .returning({ reportId: reports.reportId });
    }

    return reply.status(201).send({
      success: true,
      funnelId: result[0].reportId,
    });
  } catch (error) {
    console.error("Error creating funnel:", error);
    return reply.status(500).send({ error: "Failed to create funnel" });
  }
}
