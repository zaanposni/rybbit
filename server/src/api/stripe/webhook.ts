import { FastifyReply, FastifyRequest } from "fastify";
import { stripe } from "../../lib/stripe.js";
import { db } from "../../db/postgres/postgres.js";
import { user as userSchema } from "../../db/postgres/schema.js";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function handleWebhook(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (!webhookSecret) {
    console.error("Stripe webhook secret is not configured.");
    return reply.status(500).send({ error: "Webhook secret not configured." });
  }

  const sig = request.headers["stripe-signature"];
  let event: Stripe.Event;

  try {
    // Use rawBody instead of request.body for signature verification
    const rawBody = (request.raw as any).body;
    if (!rawBody) {
      return reply.status(400).send("Webhook error: No raw body available");
    }

    event = stripe.webhooks.constructEvent(
      rawBody,
      sig as string,
      webhookSecret
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return reply.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("Checkout session completed event received:", session.id);

      // If the checkout session was for a subscription
      if (session.mode === "subscription" && session.customer) {
        const stripeCustomerId = session.customer as string;
        const userId = session.metadata?.userId; // Retrieve userId from metadata if you set it

        if (stripeCustomerId) {
          try {
            // Check if user already has this customer ID
            const existingUser = await db
              .select({ id: userSchema.id })
              .from(userSchema)
              .where(eq(userSchema.stripeCustomerId, stripeCustomerId))
              .limit(1);

            // If no user has this ID, update the user linked via metadata (if available)
            // Or update based on email if metadata is not reliable
            if (existingUser.length === 0) {
              let userToUpdateId: string | null = null;

              if (userId) {
                userToUpdateId = userId;
              } else if (session.customer_details?.email) {
                // Fallback: Find user by email (ensure email is unique in your DB)
                const userByEmail = await db
                  .select({ id: userSchema.id })
                  .from(userSchema)
                  .where(eq(userSchema.email, session.customer_details.email))
                  .limit(1);
                if (userByEmail.length > 0) {
                  userToUpdateId = userByEmail[0].id;
                }
              }

              if (userToUpdateId) {
                console.log(
                  `Updating user ${userToUpdateId} with Stripe customer ID ${stripeCustomerId}`
                );
                await db
                  .update(userSchema)
                  .set({ stripeCustomerId: stripeCustomerId })
                  .where(eq(userSchema.id, userToUpdateId));
              } else {
                console.error(
                  `Could not find user to associate with Stripe customer ID ${stripeCustomerId} from checkout session ${session.id}`
                );
              }
            } else {
              console.log(
                `User ${existingUser[0].id} already has Stripe customer ID ${stripeCustomerId}`
              );
            }
          } catch (dbError: any) {
            console.error(
              `Database error updating user with Stripe customer ID: ${dbError.message}`
            );
            // Decide if you should still return 200 to Stripe or signal an error
          }
        }
      }
      break;

    // case "customer.subscription.updated":
    //   const subscriptionUpdated = event.data.object as Stripe.Subscription;
    //   console.log("Subscription updated:", subscriptionUpdated.id, subscriptionUpdated.status);
    //   // Potential actions: Update user roles/permissions based on status
    //   break;

    // case "customer.subscription.deleted":
    //   const subscriptionDeleted = event.data.object as Stripe.Subscription;
    //   console.log("Subscription deleted:", subscriptionDeleted.id);
    //   // Potential actions: Update user roles/permissions, mark as unsubscribed
    //   break;

    // ... handle other event types as needed

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  reply.send({ received: true });
}
