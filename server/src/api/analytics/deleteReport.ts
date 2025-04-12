import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../../db/postgres/postgres.js";
import { reports } from "../../db/postgres/schema.js";
import { eq } from "drizzle-orm";
import {
  getUserHasAccessToSite,
  getUserHasAccessToSitePublic,
} from "../../lib/auth-utils.js";

export async function deleteReport(
  request: FastifyRequest<{
    Params: {
      reportId: string;
    };
  }>,
  reply: FastifyReply
) {
  const { reportId } = request.params;
  const userId = request.user?.id;

  try {
    // First get the report to check ownership
    const report = await db.query.reports.findFirst({
      where: eq(reports.reportId, parseInt(reportId)),
    });

    if (!report) {
      return reply.status(404).send({ error: "Report not found" });
    }

    if (!report.siteId) {
      return reply
        .status(400)
        .send({ error: "Invalid report: missing site ID" });
    }

    // Check user access to site
    const userHasAccessToSite = await getUserHasAccessToSite(
      request,
      report.siteId.toString()
    );
    if (!userHasAccessToSite) {
      return reply.status(403).send({ error: "Forbidden" });
    }

    // Delete the report
    await db.delete(reports).where(eq(reports.reportId, parseInt(reportId)));

    return reply.status(200).send({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return reply.status(500).send({ error: "Failed to delete report" });
  }
}
