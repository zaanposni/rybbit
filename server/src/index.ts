import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { toNodeHandler } from "better-auth/node";
import Fastify from "fastify";
import cron from "node-cron";
import { dirname, join } from "path";
import { Headers, HeadersInit } from "undici";
import { fileURLToPath } from "url";
import { createAccount } from "./api/createAccount.js";
import { getLiveUsercount } from "./api/getLiveUsercount.js";
import { getOverview } from "./api/getOverview.js";
import { getOverviewBucketed } from "./api/getOverviewBucketed.js";
import { getSessions } from "./api/getSessions.js";
import { getSingleCol } from "./api/getSingleCol.js";
import { getUserSessions } from "./api/getUserSessions.js";
import { listUsers } from "./api/listUsers.js";
import { addSite } from "./api/sites/addSite.js";
import { changeSiteDomain } from "./api/sites/changeSiteDomain.js";
import { deleteSite } from "./api/sites/deleteSite.js";
import { getSiteHasData } from "./api/sites/getSiteHasData.js";
import { getSites } from "./api/sites/getSites.js";
import { initializeClickhouse } from "./db/clickhouse/clickhouse.js";
import { initializePostgres } from "./db/postgres/postgres.js";
import { cleanupOldSessions } from "./db/postgres/session-cleanup.js";
import { allowList, loadAllowedDomains } from "./lib/allowedDomains.js";
import { auth } from "./lib/auth.js";
import { mapHeaders } from "./lib/auth-utils.js";
import { trackPageView } from "./tracker/trackPageView.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const server = Fastify({
  logger: {
    transport: {
      target: "@fastify/one-line-logger",
    },
  },
  maxParamLength: 1500,
  trustProxy: true,
});

server.register(cors, {
  origin: (origin, callback) => {
    if (!origin || allowList.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"), false);
    }
  },
  credentials: true,
});

// Serve static files
server.register(fastifyStatic, {
  root: join(__dirname, "../public"),
  prefix: "/", // or whatever prefix you need
});

server.register(
  async (fastify, options) => {
    await fastify.register((fastify) => {
      const authHandler = toNodeHandler(options.auth);

      fastify.addContentTypeParser(
        "application/json",
        /* c8 ignore next 3 */
        (_request, _payload, done) => {
          done(null, null);
        }
      );

      fastify.all("/api/auth/*", async (request, reply: any) => {
        reply.raw.setHeaders(mapHeaders(reply.getHeaders()));
        await authHandler(request.raw, reply.raw);
      });
      fastify.all("/auth/*", async (request, reply: any) => {
        reply.raw.setHeaders(mapHeaders(reply.getHeaders()));
        await authHandler(request.raw, reply.raw);
      });
    });
  },
  { auth: auth! }
);

server.addHook("onRequest", async (request, reply) => {
  const { url } = request.raw;

  // Bypass auth for health check and tracking
  if (
    url?.startsWith("/health") ||
    url?.startsWith("/track/pageview") ||
    url?.startsWith("/script") ||
    url?.startsWith("/auth") ||
    url?.startsWith("/api/auth")
  ) {
    return;
  }

  try {
    // Convert Fastify headers object into Fetch-compatible Headers
    const headers = new Headers(request.headers as HeadersInit);

    // Get session from BetterAuth
    const session = await auth!.api.getSession({ headers });

    if (!session) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    // Attach session user info to request
    request.user = session.user;
  } catch (err) {
    console.error("Auth Error:", err);
    return reply.status(500).send({ error: "Auth check failed" });
  }
});

server.get("/live-user-count/:site", getLiveUsercount);
server.get("/overview", getOverview);
server.get("/overview-bucketed", getOverviewBucketed);
server.get("/single-col", getSingleCol);
server.get("/site-has-data/:site", getSiteHasData);
server.get("/sessions", getSessions);
server.get("/user/:userId/sessions", getUserSessions);

// Administrative
server.post("/add-site", addSite);
server.post("/change-site-domain", changeSiteDomain);
server.post("/delete-site/:id", deleteSite);
server.get("/get-sites", getSites);
server.get("/list-users", listUsers);
server.post("/create-account", createAccount);

// Track pageview endpoint
server.post("/track/pageview", trackPageView);

const start = async () => {
  try {
    console.info("Starting server...");
    // Initialize the database
    await Promise.all([initializeClickhouse(), initializePostgres()]);
    await loadAllowedDomains();
    // Start the server
    await server.listen({ port: 3001, host: "0.0.0.0" });
    cron.schedule("*/60 * * * * *", () => {
      console.log("Cleaning up old sessions");
      cleanupOldSessions();
    });
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();

declare module "fastify" {
  interface FastifyRequest {
    user?: any; // Or define a more specific user type
  }
}
