import { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../../db/postgres/postgres.js";
import { goals } from "../../db/postgres/schema.js";
import clickhouse from "../../db/clickhouse/clickhouse.js";
import { getUserHasAccessToSitePublic } from "../../lib/auth-utils.js";
import { eq } from "drizzle-orm";
import {
  getFilterStatement,
  getTimeStatement,
  processResults,
} from "./utils.js";
import SqlString from "sqlstring";

// Helper to convert wildcard patterns to ClickHouse regex (same as in getGoals.ts)
function patternToRegex(pattern: string): string {
  // Escape special regex characters except * which we'll handle specially
  const escapedPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&");

  // Replace ** with a temporary marker
  const withDoubleStar = escapedPattern.replace(/\*\*/g, "{{DOUBLE_STAR}}");

  // Replace * with [^/]+ (any characters except /)
  const withSingleStar = withDoubleStar.replace(/\*/g, "[^/]+");

  // Replace the double star marker with .* (any characters including /)
  const finalRegex = withSingleStar.replace(/{{DOUBLE_STAR}}/g, ".*");

  // Anchor the regex to start/end of string for exact matches
  return `^${finalRegex}$`;
}

export async function getGoal(
  request: FastifyRequest<{
    Params: {
      goalId: string;
      site: string;
    };
    Querystring: {
      startDate: string;
      endDate: string;
      timezone: string;
      filters?: string;
    };
  }>,
  reply: FastifyReply
) {
  const { goalId, site } = request.params;
  const { startDate, endDate, timezone, filters } = request.query;

  // Check user access to site
  const userHasAccessToSite = await getUserHasAccessToSitePublic(request, site);
  if (!userHasAccessToSite) {
    return reply.status(403).send({ error: "Forbidden" });
  }

  try {
    // Fetch the goal from PostgreSQL
    const goal = await db.query.goals.findFirst({
      where: eq(goals.goalId, parseInt(goalId, 10)),
    });

    if (!goal) {
      return reply.status(404).send({ error: "Goal not found" });
    }

    // Ensure the goal belongs to the specified site
    if (goal.siteId !== parseInt(site, 10)) {
      return reply
        .status(403)
        .send({ error: "Goal does not belong to the specified site" });
    }

    // Build filter and time clauses for ClickHouse queries
    const filterStatement = filters ? getFilterStatement(filters) : "";
    const timeStatement = getTimeStatement({
      date: { startDate, endDate, timezone },
    });

    // First, get the total number of unique sessions (denominator for conversion rate)
    const totalSessionsQuery = `
      SELECT COUNT(DISTINCT session_id) AS total_sessions
      FROM events
      WHERE site_id = ${SqlString.escape(Number(site))}
      ${timeStatement}
      ${filterStatement}
    `;

    const totalSessionsResult = await clickhouse.query({
      query: totalSessionsQuery,
      format: "JSONEachRow",
    });

    const totalSessionsData = await processResults<{ total_sessions: number }>(
      totalSessionsResult
    );
    const totalSessions = totalSessionsData[0]?.total_sessions || 0;

    // Build a query specific to this goal type to calculate conversions
    let conversionQuery = "";

    if (goal.goalType === "path") {
      const pathPattern = goal.config.pathPattern;
      if (!pathPattern) {
        return reply.status(400).send({ error: "Invalid goal configuration" });
      }

      const regex = patternToRegex(pathPattern);
      conversionQuery = `
        SELECT COUNT(DISTINCT session_id) AS total_conversions
        FROM events
        WHERE site_id = ${SqlString.escape(Number(site))}
        AND type = 'pageview' 
        AND match(pathname, ${SqlString.escape(regex)})
        ${timeStatement}
        ${filterStatement}
      `;
    } else if (goal.goalType === "event") {
      const eventName = goal.config.eventName;
      const eventPropertyKey = goal.config.eventPropertyKey;
      const eventPropertyValue = goal.config.eventPropertyValue;

      if (!eventName) {
        return reply.status(400).send({ error: "Invalid goal configuration" });
      }

      let eventClause = `type = 'custom_event' AND event_name = ${SqlString.escape(
        eventName
      )}`;

      // Add property matching if needed
      if (eventPropertyKey && eventPropertyValue !== undefined) {
        // Access the sub-column directly for native JSON type
        const propValueAccessor = `props.${SqlString.escapeId(
          eventPropertyKey
        )}`;

        // Comparison needs to handle the Dynamic type returned
        // Let ClickHouse handle the comparison based on the provided value type
        if (typeof eventPropertyValue === "string") {
          eventClause += ` AND toString(${propValueAccessor}) = ${SqlString.escape(
            eventPropertyValue
          )}`;
        } else if (typeof eventPropertyValue === "number") {
          // Use toFloat64 or toInt* depending on expected number type
          eventClause += ` AND toFloat64OrNull(${propValueAccessor}) = ${SqlString.escape(
            eventPropertyValue
          )}`;
        } else if (typeof eventPropertyValue === "boolean") {
          // Booleans might be stored as 0/1 or true/false in JSON
          // Comparing toUInt8 seems robust
          eventClause += ` AND toUInt8OrNull(${propValueAccessor}) = ${
            eventPropertyValue ? 1 : 0
          }`;
        }
      }

      conversionQuery = `
        SELECT COUNT(DISTINCT session_id) AS total_conversions
        FROM events
        WHERE site_id = ${SqlString.escape(Number(site))}
        AND ${eventClause}
        ${timeStatement}
        ${filterStatement}
      `;
    } else {
      return reply.status(400).send({ error: "Invalid goal type" });
    }

    // Execute the conversion query
    const conversionResult = await clickhouse.query({
      query: conversionQuery,
      format: "JSONEachRow",
    });

    const conversionData = await processResults<{ total_conversions: number }>(
      conversionResult
    );
    const totalConversions = conversionData[0]?.total_conversions || 0;
    const conversionRate =
      totalSessions > 0 ? totalConversions / totalSessions : 0;

    // Return the goal with conversion metrics
    return reply.send({
      data: {
        ...goal,
        total_conversions: totalConversions,
        total_sessions: totalSessions,
        conversion_rate: conversionRate,
      },
    });
  } catch (error) {
    console.error("Error fetching goal:", error);
    return reply.status(500).send({ error: "Failed to fetch goal data" });
  }
}
