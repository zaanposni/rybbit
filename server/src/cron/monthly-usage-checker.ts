import { user, member, sites, subscription } from "../db/postgres/schema.js";
import { clickhouse } from "../db/clickhouse/clickhouse.js";
import { STRIPE_PRICES } from "../lib/const.js";
import { eq, inArray, and } from "drizzle-orm";
import { db } from "../db/postgres/postgres.js";
import { processResults } from "../api/analytics/utils.js";

// Default event limit for users without an active subscription
const DEFAULT_EVENT_LIMIT = 20_000;

// Global set to track site IDs that have exceeded their monthly limits
export const sitesOverLimit = new Set<number>();

/**
 * Gets the first day of the current month in YYYY-MM-DD format
 */
function getStartOfMonth(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}-01`;
}

/**
 * Gets all site IDs for organizations owned by a user
 */
async function getSiteIdsForUser(userId: string): Promise<number[]> {
  try {
    // Find the organizations this user is an owner of
    const userOrgs = await db
      .select({ organizationId: member.organizationId })
      .from(member)
      .where(and(eq(member.userId, userId), eq(member.role, "owner")));

    if (!userOrgs.length) {
      return [];
    }

    const orgIds = userOrgs.map((org) => org.organizationId);

    // Get all sites for these organizations
    const siteRecords = await db
      .select({ siteId: sites.siteId })
      .from(sites)
      .where(inArray(sites.organizationId, orgIds));

    return siteRecords.map((record) => record.siteId);
  } catch (error) {
    console.error(`Error getting sites for user ${userId}:`, error);
    return [];
  }
}

/**
 * Gets event limit for a user based on their subscription plan
 * @returns [eventLimit, periodStartDate]
 */
async function getUserSubscriptionInfo(
  userId: string
): Promise<[number, string | null]> {
  try {
    // Find active subscription
    const userSubscription = await db
      .select()
      .from(subscription)
      .where(
        and(
          eq(subscription.referenceId, userId),
          inArray(subscription.status, ["active", "trialing"])
        )
      )
      .limit(1);

    if (!userSubscription.length) {
      return [DEFAULT_EVENT_LIMIT, null];
    }

    // Find the plan in STRIPE_PLANS
    const plan = STRIPE_PRICES.find((p) => p.name === userSubscription[0].plan);
    const eventLimit = plan ? plan.limits.events : DEFAULT_EVENT_LIMIT;

    // Get period start date - if not available, use first day of month
    const periodStart = userSubscription[0].periodStart
      ? new Date(userSubscription[0].periodStart).toISOString().split("T")[0]
      : getStartOfMonth();

    return [eventLimit, periodStart];
  } catch (error) {
    console.error(`Error getting subscription info for user ${userId}:`, error);
    return [DEFAULT_EVENT_LIMIT, null];
  }
}

/**
 * Gets monthly pageview count from ClickHouse for the given site IDs
 */
async function getMonthlyPageviews(
  siteIds: number[],
  startDate: string | null
): Promise<number> {
  if (!siteIds.length) {
    return 0;
  }

  // If no startDate is provided (no subscription), default to start of month
  const periodStart = startDate || getStartOfMonth();

  try {
    const result = await clickhouse.query({
      query: `
        SELECT COUNT(*) as count
        FROM pageviews
        WHERE site_id IN (${siteIds.join(",")})
        AND timestamp >= toDate('${periodStart}')
      `,
      format: "JSONEachRow",
    });
    const rows = await processResults<{ count: string }>(result);
    return parseInt(rows[0].count, 10);
  } catch (error) {
    console.error(
      `Error querying ClickHouse for pageviews for sites ${siteIds}:`,
      error
    );
    return 0;
  }
}

/**
 * Updates monthly event usage for all users
 */
export async function updateUsersMonthlyUsage() {
  console.log(
    "[Monthly Usage Checker] Starting check of monthly event usage..."
  );

  try {
    // Clear the previous list of sites over their limit
    sitesOverLimit.clear();

    // Get all users
    const users = await db.select().from(user);

    for (const userData of users) {
      try {
        // Get site IDs for organizations owned by this user
        const siteIds = await getSiteIdsForUser(userData.id);

        // If user has no sites, continue to next user
        if (!siteIds.length) {
          continue;
        }

        // Get user's subscription information (limit and period start)
        const [eventLimit, periodStart] = await getUserSubscriptionInfo(
          userData.id
        );

        // Get monthly pageview count from ClickHouse using the subscription period
        const pageviewCount = await getMonthlyPageviews(siteIds, periodStart);

        // Check if over limit and update global set
        const isOverLimit = pageviewCount > eventLimit;

        // Update user's monthlyEventCount and overMonthlyLimit fields
        await db
          .update(user)
          .set({
            monthlyEventCount: pageviewCount,
            overMonthlyLimit: isOverLimit,
          })
          .where(eq(user.id, userData.id));

        // If over the limit, add all this user's sites to the global set
        if (isOverLimit) {
          for (const siteId of siteIds) {
            sitesOverLimit.add(siteId);
          }
          console.log(
            `[Monthly Usage Checker] User ${userData.email} is over limit. Added ${siteIds.length} sites to blocked list.`
          );
        }

        console.log(
          `[Monthly Usage Checker] Updated user ${
            userData.email
          }: ${pageviewCount.toLocaleString()} events, limit ${eventLimit.toLocaleString()}, period started ${
            periodStart || "this month"
          }`
        );
      } catch (error) {
        console.error(
          `[Monthly Usage Checker] Error processing user ${userData.id}:`,
          error
        );
      }
    }

    console.log(
      `[Monthly Usage Checker] Completed monthly event usage check. ${sitesOverLimit.size} sites are over their limit.`
    );
  } catch (error) {
    console.error(
      "[Monthly Usage Checker] Error updating monthly usage:",
      error
    );
  }
}
