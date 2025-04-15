import { and, eq, inArray } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";
import { db } from "../../db/postgres/postgres.js";
import { member, user } from "../../db/postgres/schema.js";
import { getSitesUserHasAccessTo } from "../../lib/auth-utils.js";
import { STRIPE_PRICES } from "../../lib/const.js";

// Default event limit for users without an active subscription
const DEFAULT_EVENT_LIMIT = 20_000;

// Commenting out getUserEventLimit as it relies on the removed subscription table
/*
export async function getUserEventLimit(userId: string): Promise<number> {
  try {
    // Find active subscription
    const userSubscription = await db
      .select()
      .from(subscription) // subscription table removed
      .where(
        and(
          eq(subscription.referenceId, userId),
          inArray(subscription.status, ["active", "trialing"])
        )
      )
      .limit(1);

    if (!userSubscription.length) {
      return DEFAULT_EVENT_LIMIT;
    }

    // Find the plan in STRIPE_PLANS
    const plan = STRIPE_PRICES.find((p) => p.name === userSubscription[0].plan);
    return plan ? plan.limits.events : DEFAULT_EVENT_LIMIT;
  } catch (error) {
    console.error(`Error getting event limit for user ${userId}:`, error);
    return DEFAULT_EVENT_LIMIT;
  }
}
*/

export async function getSites(req: FastifyRequest, reply: FastifyReply) {
  try {
    // Get sites the user has access to
    const sitesData = await getSitesUserHasAccessTo(req);

    // Enhance sites data - removing usage limit information for now
    const enhancedSitesData = await Promise.all(
      sitesData.map(async (site) => {
        let isOwner = false;
        let ownerId: string | null = null;

        // Determine ownership if organization ID exists
        if (site.organizationId) {
          const orgOwnerResult = await db
            .select({ userId: member.userId })
            .from(member)
            .where(
              and(
                eq(member.organizationId, site.organizationId),
                eq(member.role, "owner")
              )
            )
            .limit(1);

          if (orgOwnerResult.length > 0) {
            ownerId = orgOwnerResult[0].userId;
            isOwner = ownerId === req.user?.id;
          }
        }

        // TODO: Re-implement limit checking later, possibly by fetching subscription
        // data for the ownerId directly from Stripe where needed.

        return {
          ...site,
          // overMonthlyLimit: false, // Removed for now
          // monthlyEventCount: 0, // Removed for now
          // eventLimit: DEFAULT_EVENT_LIMIT, // Removed for now
          isOwner,
        };
      })
    );

    return reply.status(200).send(enhancedSitesData);
  } catch (err) {
    console.error("Error in getSites:", err);
    return reply.status(500).send(String(err));
  }
}
