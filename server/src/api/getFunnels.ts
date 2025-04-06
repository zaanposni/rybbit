import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../db/postgres/postgres.js";
import { reports } from "../db/postgres/schema.js";
import { getUserHasAccessToSite } from "../lib/auth-utils.js";
import { eq, and } from "drizzle-orm";

export async function getFunnels(
  request: FastifyRequest<{
    Params: {
      site: string;
    };
  }>,
  reply: FastifyReply
) {
  const { site } = request.params;

  // Check user access to site
  const userHasAccessToSite = await getUserHasAccessToSite(request, site);
  if (!userHasAccessToSite) {
    return reply.status(403).send({ error: "Forbidden" });
  }

  try {
    // Fetch all funnel reports for the site
    const funnelReports = await db
      .select()
      .from(reports)
      .where(
        and(eq(reports.siteId, Number(site)), eq(reports.reportType, "funnel"))
      )
      .orderBy(reports.createdAt);

    // Transform the reports to a more frontend-friendly structure
    const funnels = funnelReports.map((report) => {
      const data = report.data as any;
      return {
        id: report.reportId,
        name: data.name || "Unnamed Funnel",
        steps: data.steps || [],
        configuration: data.configuration || {},
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        // Include any additional analytics data that might be stored
        conversionRate: data.lastResult?.conversionRate || null,
        totalVisitors: data.lastResult?.totalVisitors || null,
      };
    });

    return reply.send({ data: funnels });
  } catch (error) {
    console.error("Error fetching funnels:", error);
    return reply.status(500).send({ error: "Failed to fetch funnels" });
  }
}
