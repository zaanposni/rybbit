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

// Helper to convert wildcard patterns to ClickHouse regex
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

// Types for the response
interface GoalWithConversions {
  goalId: number;
  name: string | null;
  goalType: string;
  config: any;
  createdAt: string | null;
  total_conversions: number;
  total_sessions: number;
  conversion_rate: number;
}

interface GetGoalsResponse {
  data: GoalWithConversions[];
}

export async function getGoals(
  request: FastifyRequest<{
    Params: {
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
  const { site } = request.params;
  const { startDate, endDate, timezone, filters } = request.query;

  // Check user access to site
  const userHasAccessToSite = await getUserHasAccessToSitePublic(request, site);
  if (!userHasAccessToSite) {
    return reply.status(403).send({ error: "Forbidden" });
  }

  try {
    // Fetch all goals for this site from PostgreSQL
    const siteGoals = await db
      .select()
      .from(goals)
      .where(eq(goals.siteId, Number(site)));

    if (siteGoals.length === 0) {
      // If no goals exist, return early with empty data
      return reply.send({ data: [] });
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

    // Build a single query that calculates all goal conversions at once using conditional aggregation
    // This is more efficient than separate queries for each goal
    let conditionalClauses: string[] = [];

    for (const goal of siteGoals) {
      if (goal.goalType === "path") {
        const pathPattern = goal.config.pathPattern;
        if (!pathPattern) continue;

        const regex = patternToRegex(pathPattern);
        conditionalClauses.push(`
          COUNT(DISTINCT IF(
            type = 'pageview' AND match(pathname, ${SqlString.escape(regex)}),
            session_id,
            NULL
          )) AS goal_${goal.goalId}_conversions
        `);
      } else if (goal.goalType === "event") {
        const eventName = goal.config.eventName;
        const eventPropertyKey = goal.config.eventPropertyKey;
        const eventPropertyValue = goal.config.eventPropertyValue;

        if (!eventName) continue;

        let eventClause = `type = 'custom_event' AND event_name = ${SqlString.escape(
          eventName
        )}`;

        // Add property matching if needed
        if (eventPropertyKey && eventPropertyValue !== undefined) {
          // Different handling based on property value type
          if (typeof eventPropertyValue === "string") {
            eventClause += ` AND JSONExtractString(properties, ${SqlString.escape(
              eventPropertyKey
            )}) = ${SqlString.escape(eventPropertyValue)}`;
          } else if (typeof eventPropertyValue === "number") {
            eventClause += ` AND JSONExtractFloat(properties, ${SqlString.escape(
              eventPropertyKey
            )}) = ${SqlString.escape(eventPropertyValue)}`;
          } else if (typeof eventPropertyValue === "boolean") {
            eventClause += ` AND JSONExtractBool(properties, ${SqlString.escape(
              eventPropertyKey
            )}) = ${eventPropertyValue ? 1 : 0}`;
          }
        }

        conditionalClauses.push(`
          COUNT(DISTINCT IF(
            ${eventClause},
            session_id,
            NULL
          )) AS goal_${goal.goalId}_conversions
        `);
      }
    }

    if (conditionalClauses.length === 0) {
      // If no valid goals to calculate, return the goals without conversion data
      const goalsWithZeroConversions = siteGoals.map((goal) => ({
        ...goal,
        total_conversions: 0,
        total_sessions: totalSessions,
        conversion_rate: 0,
      }));

      return reply.send({ data: goalsWithZeroConversions });
    }

    // Execute the comprehensive query
    const conversionQuery = `
      SELECT
        ${conditionalClauses.join(", ")}
      FROM events
      WHERE site_id = ${SqlString.escape(Number(site))}
      ${timeStatement}
      ${filterStatement}
    `;

    const conversionResult = await clickhouse.query({
      query: conversionQuery,
      format: "JSONEachRow",
    });

    const conversionData = await processResults<Record<string, number>>(
      conversionResult
    );

    // If we didn't get any results, use zeros
    const conversions = conversionData[0] || {};

    // Combine goals data with conversion metrics
    const goalsWithConversions: GoalWithConversions[] = siteGoals.map(
      (goal) => {
        const totalConversions =
          conversions[`goal_${goal.goalId}_conversions`] || 0;
        const conversionRate =
          totalSessions > 0 ? totalConversions / totalSessions : 0;

        return {
          ...goal,
          total_conversions: totalConversions,
          total_sessions: totalSessions,
          conversion_rate: conversionRate,
        };
      }
    );

    return reply.send({ data: goalsWithConversions });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return reply.status(500).send({ error: "Failed to fetch goals data" });
  }
}
