import { user, member, sites } from "../db/postgres/schema.js";
import { clickhouse } from "../db/clickhouse/clickhouse.js";
import { STRIPE_PRICES, StripePlan } from "../lib/const.js";
import { eq, inArray, and } from "drizzle-orm";
import { db } from "../db/postgres/postgres.js";
import { processResults } from "../api/analytics/utils.js";
import { stripe } from "../lib/stripe.js";
import Stripe from "stripe";

// Default event limit for users without an active subscription
const DEFAULT_EVENT_LIMIT = 10_000;

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
 * Gets event limit and billing period start date for a user based on their Stripe subscription.
 * Fetches directly from Stripe if the user has a stripeCustomerId.
 * @returns [eventLimit, periodStartDate]
 */
async function getUserSubscriptionInfo(userData: {
  id: string;
  stripeCustomerId: string | null;
}): Promise<[number, string | null]> {
  if (!userData.stripeCustomerId) {
    // No Stripe customer ID, use default limit and start of current month
    return [DEFAULT_EVENT_LIMIT, getStartOfMonth()];
  }

  try {
    // Fetch active subscriptions for the customer from Stripe
    const subscriptions = await (stripe as Stripe).subscriptions.list({
      customer: userData.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      // No active subscription, use default limit and start of current month
      return [DEFAULT_EVENT_LIMIT, getStartOfMonth()];
    }

    const sub = subscriptions.data[0];
    const priceId = sub.items.data[0]?.price.id;

    if (!priceId) {
      console.error(
        `Subscription item price ID not found for user ${userData.id}, sub ${sub.id}`
      );
      return [DEFAULT_EVENT_LIMIT, getStartOfMonth()];
    }

    // Find corresponding plan details from constants
    const planDetails = STRIPE_PRICES.find(
      (plan: StripePlan) =>
        plan.priceId === priceId ||
        (plan.annualDiscountPriceId && plan.annualDiscountPriceId === priceId)
    );

    const eventLimit = planDetails
      ? planDetails.limits.events
      : DEFAULT_EVENT_LIMIT;
    const periodStart = sub.current_period_start
      ? new Date(sub.current_period_start * 1000).toISOString().split("T")[0]
      : getStartOfMonth();

    return [eventLimit, periodStart];
  } catch (error: any) {
    console.error(
      `Error fetching Stripe subscription info for user ${userData.id}:`,
      error
    );
    // Fallback to default limit and current month start on Stripe API error
    return [DEFAULT_EVENT_LIMIT, getStartOfMonth()];
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

  // If no startDate is provided (e.g., no subscription), default to start of month
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

    // Get all users with their Stripe customer ID
    const users = await db
      .select({
        id: user.id,
        email: user.email,
        stripeCustomerId: user.stripeCustomerId,
      })
      .from(user);

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
          userData
        );

        // Get monthly pageview count from ClickHouse using the billing period start date
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
