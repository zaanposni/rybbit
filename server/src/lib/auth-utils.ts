import { FastifyRequest } from "fastify";
import { auth } from "./auth.js";
import { sites, member } from "../db/postgres/schema.js";
import { inArray, eq } from "drizzle-orm";
import { db } from "../db/postgres/postgres.js";

export function mapHeaders(headers: any) {
  const entries = Object.entries(headers);
  const map = new Map();
  for (const [headerKey, headerValue] of entries) {
    if (headerValue != null) {
      map.set(headerKey, headerValue);
    }
  }
  return map;
}

export async function getSitesUserHasAccessTo(req: FastifyRequest) {
  const headers = new Headers(req.headers as any);
  const session = await auth!.api.getSession({ headers });

  const userId = session?.user.id;

  if (!userId) {
    return [];
  }

  try {
    // Get the user's organization IDs directly from the database
    const memberRecords = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(eq(member.userId, userId));

    if (!memberRecords || memberRecords.length === 0) {
      return [];
    }

    // Extract organization IDs
    const organizationIds = memberRecords.map(
      (record) => record.organizationId
    );

    // Get sites for these organizations
    const siteRecords = await db
      .select()
      .from(sites)
      .where(inArray(sites.organizationId, organizationIds));

    return siteRecords;
  } catch (error) {
    console.error("Error getting sites user has access to:", error);
    return [];
  }
}

export async function getUserHasAccessToSite(
  req: FastifyRequest,
  siteId: string
) {
  const sites = await getSitesUserHasAccessTo(req);
  return sites.some((site) => site.siteId === Number(siteId));
}
