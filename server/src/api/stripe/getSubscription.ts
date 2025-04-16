import { FastifyReply, FastifyRequest } from "fastify";
import { stripe } from "../../lib/stripe.js";
import { db } from "../../db/postgres/postgres.js";
import { user as userSchema } from "../../db/postgres/schema.js";
import { eq } from "drizzle-orm";
import { STRIPE_PRICES, StripePlan } from "../../lib/const.js";
import Stripe from "stripe";

// Function to find plan details by price ID
function findPlanDetails(priceId: string): StripePlan | undefined {
  return STRIPE_PRICES.find(
    (plan: StripePlan) =>
      plan.priceId === priceId ||
      (plan.annualDiscountPriceId && plan.annualDiscountPriceId === priceId)
  );
}

export async function getSubscriptionInner(userId: string) {
  // 1. Find the user and their Stripe Customer ID
  const userResult = await db
    .select({
      stripeCustomerId: userSchema.stripeCustomerId,
      monthlyEventCount: userSchema.monthlyEventCount,
    })
    .from(userSchema)
    .where(eq(userSchema.id, userId))
    .limit(1);

  const user = userResult[0];

  if (!user || !user.stripeCustomerId) {
    // If no customer ID, they definitely don't have a subscription
    return null;
  }

  // 2. List active subscriptions for the customer from Stripe
  const subscriptions = await stripe.subscriptions.list({
    customer: user.stripeCustomerId,
    status: "active", // Only fetch active subscriptions
    limit: 1, // Users should only have one active subscription in this model
    expand: ["data.plan.product"], // Expand to get product details if needed
  });

  if (subscriptions.data.length === 0) {
    // No active subscription found
    return null;
  }

  const sub = subscriptions.data[0];
  const priceId = sub.items.data[0]?.price.id;

  if (!priceId) {
    throw new Error("Subscription item price ID not found");
  }

  // 3. Find corresponding plan details from your constants
  const planDetails = findPlanDetails(priceId);

  if (!planDetails) {
    console.error("Plan details not found for price ID:", priceId);
    // Still return the basic subscription info even if local plan details missing
    return {
      id: sub.id,
      planName: "Unknown Plan", // Indicate missing details
      status: sub.status,
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
      eventLimit: 0, // Unknown limit
      monthlyEventCount: user.monthlyEventCount,
      interval: sub.items.data[0]?.price.recurring?.interval ?? "unknown",
    };
  }

  // 4. Format and return the subscription data
  const responseData = {
    id: sub.id,
    planName: planDetails.name,
    status: sub.status,
    currentPeriodEnd: new Date(sub.current_period_end * 1000), // Convert Unix timestamp to Date
    eventLimit: planDetails.limits.events,
    monthlyEventCount: user.monthlyEventCount,
    interval: sub.items.data[0]?.price.recurring?.interval ?? "unknown",
  };

  return responseData;
}

export async function getSubscription(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = request.user?.id;

  if (!userId) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  try {
    const responseData = await getSubscriptionInner(userId);
    // // 1. Find the user and their Stripe Customer ID
    // const userResult = await db
    //   .select({
    //     stripeCustomerId: userSchema.stripeCustomerId,
    //     monthlyEventCount: userSchema.monthlyEventCount,
    //   })
    //   .from(userSchema)
    //   .where(eq(userSchema.id, userId))
    //   .limit(1);

    // const user = userResult[0];

    // if (!user || !user.stripeCustomerId) {
    //   // If no customer ID, they definitely don't have a subscription
    //   return reply.send(null);
    // }

    // // 2. List active subscriptions for the customer from Stripe
    // const subscriptions = await stripe.subscriptions.list({
    //   customer: user.stripeCustomerId,
    //   status: "active", // Only fetch active subscriptions
    //   limit: 1, // Users should only have one active subscription in this model
    //   expand: ["data.plan.product"], // Expand to get product details if needed
    // });

    // if (subscriptions.data.length === 0) {
    //   // No active subscription found
    //   return reply.send(null);
    // }

    // const sub = subscriptions.data[0];
    // const priceId = sub.items.data[0]?.price.id;

    // if (!priceId) {
    //   console.error("Subscription item price ID not found:", sub.id);
    //   return reply
    //     .status(500)
    //     .send({ error: "Subscription price information missing." });
    // }

    // // 3. Find corresponding plan details from your constants
    // const planDetails = findPlanDetails(priceId);

    // if (!planDetails) {
    //   console.error("Plan details not found for price ID:", priceId);
    //   // Still return the basic subscription info even if local plan details missing
    //   return reply.send({
    //     id: sub.id,
    //     planName: "Unknown Plan", // Indicate missing details
    //     status: sub.status,
    //     currentPeriodEnd: new Date(sub.current_period_end * 1000),
    //     eventLimit: 0, // Unknown limit
    //     interval: sub.items.data[0]?.price.recurring?.interval ?? "unknown",
    //   });
    // }

    // // 4. Format and return the subscription data
    // const responseData = {
    //   id: sub.id,
    //   planName: planDetails.name,
    //   status: sub.status,
    //   currentPeriodEnd: new Date(sub.current_period_end * 1000), // Convert Unix timestamp to Date
    //   eventLimit: planDetails.limits.events,
    //   monthlyEventCount: user.monthlyEventCount,
    //   interval: sub.items.data[0]?.price.recurring?.interval ?? "unknown",
    // };

    return reply.send(responseData);
  } catch (error: any) {
    console.error("Get Subscription Error:", error);
    // Handle specific Stripe errors if necessary
    if (error instanceof Stripe.errors.StripeError) {
      return reply
        .status(error.statusCode || 500)
        .send({ error: error.message });
    } else {
      return reply.status(500).send({
        error: "Failed to fetch subscription details",
        details: error.message,
      });
    }
  }
}
