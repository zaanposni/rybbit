import { betterAuth } from "better-auth";
import { username, admin, organization } from "better-auth/plugins";
import dotenv from "dotenv";
import pg from "pg";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/postgres/postgres.js";
import { IS_CLOUD } from "./const.js";
import * as schema from "../db/postgres/schema.js";

dotenv.config();

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
  plugins: pluginList,
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
      },
    },
    plugins: pluginList,
    trustedOrigins: allowedOrigins,
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      defaultCookieAttributes: {
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      },
    },
    // Use database hooks to create an organization after user signup
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            // Create an organization for the new user
            console.info(user);
            // if (auth) {
            //   try {
            //     const orgName = user.name || user.username || "My Organization";
            //     await auth.api.organization.createOrganization({
            //       body: {
            //         name: orgName,
            //       },
            //       headers: {
            //         "x-user-id": user.id,
            //       },
            //     });
            //   } catch (error) {
            //     console.error(
            //       "Error creating organization for new user:",
            //       error
            //     );
            //   }
            // }
          },
        },
      },
    },
  });
}
