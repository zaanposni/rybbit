import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import FastifyBetterAuth from "fastify-better-auth";
import cron from "node-cron";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { Headers, HeadersInit } from "undici"; // Ensure Undici is used for Headers
import { trackPageView } from "./actions/trackPageView.js";
import { getBrowsers } from "./api/getBrowsers.js";
import { getCountries } from "./api/getCountries.js";
import { getDevices } from "./api/getDevices.js";
import { getLiveUsercount } from "./api/getLiveUsercount.js";
import { getOperatingSystems } from "./api/getOperatingSystems.js";
import { getOverview } from "./api/getOverview.js";
import { getPages } from "./api/getPages.js";
import { getPageViews } from "./api/getPageViews.js";
import { getReferrers } from "./api/getReferrers.js";
import { initializeClickhouse } from "./db/clickhouse/clickhouse.js";
import { initializePostgres } from "./db/postgres/postgres.js";
import { cleanupOldSessions } from "./db/postgres/session-cleanup.js";
import { auth } from "./lib/auth.js";
import { TrackingPayload } from "./types.js";
import { toNodeHandler } from "better-auth/node";
import { mapHeaders } from "./lib/betterAuth.js";

// ESM replacement for __dirname:
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

// Register CORS
server.register(cors, {
  origin: [
    "http://localhost:3002",
    "https://tracking.tomato.gg",
    "https://tomato.gg",
  ], // In production, you should specify your frontend domain
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
      fastify.all("/api/auth/*", async (request, reply: any) => {
        reply.raw.setHeaders(mapHeaders(reply.getHeaders()));
        await authHandler(request.raw, reply.raw);
      });
    });
  },
  { auth }
);

server.addHook("onRequest", async (request, reply) => {
  const { url } = request.raw;

  // Bypass auth for health check and tracking
  if (
    url?.startsWith("/health") ||
    url?.startsWith("/track/pageview") ||
    url?.startsWith("/analytics") ||
    url?.startsWith("/auth") ||
    url?.startsWith("/api/auth")
  ) {
    return;
  }

  console.info(url);

  try {
    // Convert Fastify headers object into Fetch-compatible Headers
    const headers = new Headers(request.headers as HeadersInit);

    // Get session from BetterAuth
    const session = await auth.api.getSession({ headers });

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

// Health check endpoint
server.get("/health", async () => {
  return { status: "ok" };
});

server.get("/live-user-count", async () => {
  return { count: await getLiveUsercount() };
});

server.get("/overview", getOverview);
server.get("/countries", getCountries);
server.get("/browsers", getBrowsers);
server.get("/operating-systems", getOperatingSystems);
server.get("/devices", getDevices);
server.get("/pages", getPages);
server.get("/referrers", getReferrers);
server.get("/pageviews", getPageViews);

// Track pageview endpoint
server.post<{ Body: TrackingPayload }>(
  "/track/pageview",
  async (
    request: FastifyRequest<{ Body: TrackingPayload }>,
    reply: FastifyReply
  ) => {
    try {
      await trackPageView(request);
      return { success: true };
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: "Failed to track pageview",
      });
    }
  }
);

const start = async () => {
  try {
    console.info("Starting server...");
    // Initialize the database
    await Promise.allSettled([initializeClickhouse(), initializePostgres()]);
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
