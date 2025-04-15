import { FastifyReply, FastifyRequest } from "fastify";
import { stripe } from "../../lib/stripe.js";
import { db } from "../../db/postgres/postgres.js";
import { user as userSchema } from "../../db/postgres/schema.js";
import { eq } from "drizzle-orm";

interface PortalRequestBody {
  returnUrl: string;
}

export async function createPortalSession(
  request: FastifyRequest<{ Body: PortalRequestBody }>,
  reply: FastifyReply
) {
  const { returnUrl } = request.body;
  const userId = request.user?.id;

  if (!userId) {
    return reply.status(401).send({ error: "Unauthorized" });
  }

  if (!returnUrl) {
    return reply
      .status(400)
      .send({ error: "Missing required parameter: returnUrl" });
  }

  try {
    // 1. Find the user in your database
    const userResult = await db
      .select({
        stripeCustomerId: userSchema.stripeCustomerId,
      })
      .from(userSchema)
      .where(eq(userSchema.id, userId))
      .limit(1);

    const user = userResult[0];

    if (!user || !user.stripeCustomerId) {
      return reply
        .status(404)
        .send({ error: "User or Stripe customer ID not found" });
    }

    // 2. Create a Stripe Billing Portal Session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl, // The user will be redirected here after managing their billing
    });

    // 3. Return the Billing Portal Session URL
    return reply.send({ portalUrl: portalSession.url });
  } catch (error: any) {
    console.error("Stripe Portal Session Error:", error);
    return reply.status(500).send({
      error: "Failed to create Stripe portal session",
      details: error.message,
    });
  }
}
