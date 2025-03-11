import { betterAuth } from "better-auth";
import { username, admin, organization } from "better-auth/plugins";
import dotenv from "dotenv";
import pg from "pg";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/postgres/postgres.js";
import { IS_CLOUD } from "./const.js";
import * as schema from "../db/postgres/schema.js";
import { eq } from "drizzle-orm";
import { stripe } from "@better-auth/stripe";
import Stripe from "stripe";

dotenv.config();

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!);

type AuthType = ReturnType<typeof betterAuth> | null;

const pluginList = IS_CLOUD
  ? [
      admin(),
      organization({
        // Allow users to create organizations
        allowUserToCreateOrganization: true,
        // Set the creator role to owner
        creatorRole: "owner",
      }),
      stripe({
        stripeClient,
        stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
        createCustomerOnSignUp: true,
        subscription: {
          enabled: true,
          plans: [
            {
              priceId: "price_1R0w5uDFVprnAny2T2AGF2sK",
              name: "basic100k",
              interval: "month",
              limits: {
                events: 100_000,
              },
            },
            {
              priceId: "price_1R1HMYDFVprnAny22gdVMAXn",
              name: "basic250k",
              interval: "month",
              limits: {
                events: 250_000,
              },
            },
            {
              name: "basic500k",
              priceId: "price_1R1HMjDFVprnAny2R5TT0GUh",
              interval: "month",
              limits: {
                events: 500_000,
              },
            },
            {
              name: "basic1m",
              priceId: "price_1R1HN1DFVprnAny22tCqrJej",
              interval: "month",
              limits: {
                events: 1_000_000,
              },
            },
            {
              name: "basic2m",
              priceId: "price_1R1HNFDFVprnAny2V0pTK8wE",
              interval: "month",
              limits: {
                events: 2_000_000,
              },
            },

            {
              name: "pro100k",
              priceId: "price_1R1H8WDFVprnAny25HLUxxGP",
              interval: "month",
              limits: {
                events: 100_000,
              },
            },
            {
              name: "pro250k",
              priceId: "price_1R1HRGDFVprnAny2ESGsBq3o",
              interval: "month",
              limits: {
                events: 250_000,
              },
            },
            {
              name: "pro500k",
              priceId: "price_1R1HRPDFVprnAny2glHnoioo",
              interval: "month",
              limits: {
                events: 500_000,
              },
            },
            {
              name: "pro1m",
              priceId: "price_1R1HS3DFVprnAny23VqEV8Oe",
              interval: "month",
              limits: {
                events: 1_000_000,
              },
            },
            {
              name: "pro2m",
              priceId: "price_1R1HSBDFVprnAny2ltDOb2pP",
              interval: "month",
              limits: {
                events: 2_000_000,
              },
            },
          ],
        },
      }),
    ]
  : [
      username(),
      admin(),
      organization({
        // Allow users to create organizations
        allowUserToCreateOrganization: true,
        // Set the creator role to owner
        creatorRole: "owner",
      }),
    ];

export let auth: AuthType | null = betterAuth({
  basePath: "/auth",
  database: new pg.Pool({
    host: process.env.POSTGRES_HOST || "postgres",
    port: parseInt(process.env.POSTGRES_PORT || "5432", 10),
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
  }),
  emailAndPassword: {
    enabled: true,
  },
  deleteUser: {
    enabled: true,
  },
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  plugins: pluginList as any,
  trustedOrigins: ["http://localhost:3002"],
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production", // don't mark Secure in dev
    defaultCookieAttributes: {
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    },
  },
});

export function initAuth(allowedOrigins: string[]) {
  auth = betterAuth({
    basePath: "/auth",
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        // Map our schema tables to what better-auth expects
        user: schema.users,
        account: schema.account,
        session: schema.session,
        verification: schema.verification,
        organization: schema.organization,
        member: schema.member,
      },
    }),
    experimental: {
      sessionCookie: {
        domains: allowedOrigins,
      },
    },
    emailAndPassword: {
      enabled: true,
      // Disable email verification for now
      requireEmailVerification: false,
    },
    // socialProviders: {
    //   google: {
    //     clientId: process.env.GOOGLE_CLIENT_ID!,
    //     clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //   },
    //   github: {
    //     clientId: process.env.GITHUB_CLIENT_ID!,
    //     clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    //   },
    //   twitter: {
    //     clientId: process.env.TWITTER_CLIENT_ID!,
    //     clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    //   },
    // },
    deleteUser: {
      enabled: true,
    },
    user: {
      deleteUser: {
        enabled: true,
        // Add a hook to run before deleting a user
        // i dont think this works
        beforeDelete: async (user) => {
          // Delete all memberships for this user first
          console.log(
            `Cleaning up memberships for user ${user.id} before deletion`
          );
          try {
            // Delete member records for this user
            await db
              .delete(schema.member)
              .where(eq(schema.member.userId, user.id));

            console.log(`Successfully removed memberships for user ${user.id}`);
          } catch (error) {
            console.error(
              `Error removing memberships for user ${user.id}:`,
              error
            );
            throw error; // Re-throw to prevent user deletion if cleanup fails
          }
        },
      },
    },
    plugins: pluginList as any,
    trustedOrigins: allowedOrigins,
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      defaultCookieAttributes: {
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      },
    },
  });
}
