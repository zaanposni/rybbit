import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/postgres/postgres.js";
import { reports } from "../db/postgres/schema.js";
import { getUserHasAccessToSite } from "../lib/auth-utils.js";

type FunnelStep = {
  value: string;
  name?: string;
  type: "page" | "event";
};

type Funnel = {
  steps: FunnelStep[];
  startDate: string;
  endDate: string;
  timezone: string;
  name: string;
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
  const { steps, startDate, endDate, timezone, name } = request.body;
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
    // Store the funnel configuration
    const result = await db
      .insert(reports)
      .values({
        siteId: Number(site),
        userId,
        reportType: "funnel",
        data: {
          name,
          steps,
          configuration: {
            startDate,
            endDate,
            timezone,
          },
        },
      })
      .returning({ reportId: reports.reportId });

    return reply.status(201).send({
      success: true,
      funnelId: result[0].reportId,
    });
  } catch (error) {
    console.error("Error creating funnel:", error);
    return reply.status(500).send({ error: "Failed to create funnel" });
  }
}
