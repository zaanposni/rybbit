import cors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import path from "path";
import { toNodeHandler } from "better-auth/node";
import { trackPageView } from "./actions/trackPageView";
import { initializeClickhouse } from "./db/clickhouse/clickhouse";
import { TrackingPayload } from "./types";
import { initializePostgres } from "./db/postgres/postgres";
import cron from "node-cron";
import { cleanupOldSessions } from "./db/postgres/session-cleanup";
import { getLiveUsercount } from "./api/getLiveUsercount";
import { getCountries } from "./api/getCountries";
import { getOperatingSystems } from "./api/getOperatingSystems";
import { getBrowsers } from "./api/getBrowsers";
import { getDevices } from "./api/getDevices";
import { getReferrers } from "./api/getReferrers";
import { getPages } from "./api/getPages";
import { getPageViews } from "./api/getPageViews";
import { getOverview } from "./api/getOverview";
import { auth } from "./lib/auth";

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
  origin: true, // In production, you should specify your frontend domain
});

// Serve static files
server.register(fastifyStatic, {
  root: path.join(__dirname, "../public"),
  prefix: "/", // optional: default '/'
});

server.register(async (fastify) => {
  const authHandler = toNodeHandler(auth); // auth = betterAuth(...) instance
  fastify.addContentTypeParser("application/json", (_req, _payload, done) => {
    done(null, null);
  });
  fastify.all("/api/auth/*", async (request, reply) => {
    // Forward all /api/auth requests to BetterAuth
    await authHandler(request.raw, reply.raw);
    return reply; // ensure Fastify knows response was sent
  });
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
