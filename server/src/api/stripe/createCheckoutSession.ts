import { eq } from "drizzle-orm";
import { FastifyReply, FastifyRequest } from "fastify";
import Stripe from "stripe";
import { db } from "../../db/postgres/postgres.js";
import { user as userSchema } from "../../db/postgres/schema.js";
import { stripe } from "../../lib/stripe.js";

interface CheckoutRequestBody {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createCheckoutSession(
  request: FastifyRequest<{ Body: CheckoutRequestBody }>,
  reply: FastifyReply
) {
  const { priceId, successUrl, cancelUrl } = request.body;
  const userId = request.user?.id;

  if (!userId) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  if (!priceId || !successUrl || !cancelUrl) {
    return reply.status(400).send({
      error: "Missing required parameters: priceId, successUrl, cancelUrl",
    });
  }

  try {
    // 1. Find the user in your database
    const userResult = await db
      .select({
        id: userSchema.id,
        email: userSchema.email,
        stripeCustomerId: userSchema.stripeCustomerId,
      })
      .from(userSchema)
      .where(eq(userSchema.id, userId))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      return reply.status(404).send({ error: "User not found" });
    }

    let stripeCustomerId = user.stripeCustomerId;

    // 2. If the user doesn't have a Stripe Customer ID, create one
    if (!stripeCustomerId) {
      const customer = await (stripe as Stripe).customers.create({
        email: user.email,
        metadata: {
          userId: user.id, // Link Stripe customer to your internal user ID
        },
      });
      stripeCustomerId = customer.id;

      // 3. Update the user record in your database with the new Stripe Customer ID
      await db
        .update(userSchema)
        .set({ stripeCustomerId: stripeCustomerId })
        .where(eq(userSchema.id, userId));
    }

    // 4. Create a Stripe Checkout Session
    const session = await (stripe as Stripe).checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      customer: stripeCustomerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl, // The user will be redirected here on success
      cancel_url: cancelUrl, // The user will be redirected here if they cancel
      // Allow promotion codes
      allow_promotion_codes: true,
      // Enable automatic tax calculation if configured in Stripe Tax settings
      automatic_tax: { enabled: true },
      // Configure customer address collection for tax calculation
      customer_update: {
        address: "auto",
      },
    });

    // 5. Return the Checkout Session URL
    return reply.send({ checkoutUrl: session.url });
  } catch (error: any) {
    console.error("Stripe Checkout Session Error:", error);
    return reply.status(500).send({
      error: "Failed to create Stripe checkout session",
      details: error.message,
    });
  }
}
