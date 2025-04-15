import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  throw new Error(
    "Stripe secret key is not defined in environment variables. Please set STRIPE_SECRET_KEY."
  );
}

export const stripe = new Stripe(secretKey, {
  // apiVersion: "2024-06-20", // Use the latest API version - Removed to use SDK default
  typescript: true, // Enable TypeScript support
});
