import { FastifyReply, FastifyRequest } from "fastify";
import { z, ZodError } from "zod";
import {
  createBasePayload,
  getExistingSession,
  processTrackingEvent,
} from "./trackingUtils.js";

// Define Zod schema for validation
export const trackingPayloadSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("pageview"),
    site_id: z.string().min(1),
    hostname: z.string().max(253).optional(),
    pathname: z.string().max(2048).optional(),
    querystring: z.string().max(2048).optional(),
    screenWidth: z.number().int().positive().optional(),
    screenHeight: z.number().int().positive().optional(),
    language: z.string().max(35).optional(),
    page_title: z.string().max(512).optional(),
    referrer: z.string().max(2048).optional(),
    event_name: z.string().max(256).optional(),
    properties: z.string().max(2048).optional(),
  }),
  z.object({
    type: z.literal("custom_event"),
    site_id: z.string().min(1),
    hostname: z.string().max(253).optional(),
    pathname: z.string().max(2048).optional(),
    querystring: z.string().max(2048).optional(),
    screenWidth: z.number().int().positive().optional(),
    screenHeight: z.number().int().positive().optional(),
    language: z.string().max(35).optional(),
    page_title: z.string().max(512).optional(),
    referrer: z.string().max(2048).optional(),
    event_name: z.string().min(1).max(256),
    properties: z
      .string()
      .max(2048)
      .refine(
        (val) => {
          try {
            JSON.parse(val);
            return true;
          } catch (e) {
            return false;
          }
        },
        { message: "Properties must be a valid JSON string" }
      )
      .optional(), // Optional but must be valid JSON if present
  }),
]);

// Unified handler for all events (pageviews and custom events)
export async function trackEvent(request: FastifyRequest, reply: FastifyReply) {
  try {
    // Validate request body using Zod
    const validationResult = trackingPayloadSchema.safeParse(request.body);

    if (!validationResult.success) {
      return reply.status(400).send({
        success: false,
        error: "Invalid payload",
        details: validationResult.error.flatten(),
      });
    }

    // Use validated data
    const validatedPayload = validationResult.data;

    // Access validated data using validatedPayload.propertyName
    const eventType = validatedPayload.type;

    // Check if the site has exceeded its monthly limit
    // if (isSiteOverLimit(validatedPayload.site_id)) {
    //   console.log(
    //     `[Tracking] Skipping event for site ${validatedPayload.site_id} - over monthly limit`
    //   );
    //   return reply
    //     .status(200)
    //     .send("Site over monthly limit, event not tracked");
    // }

    // Create base payload for the event using validated data
    const payload = createBasePayload(
      request, // Pass request for IP/UA
      eventType,
      validatedPayload // Add validated payload back
    );

    // Get existing session
    const existingSession = await getExistingSession(
      payload.userId,
      payload.site_id
    );

    // Process the event
    await processTrackingEvent(
      payload,
      existingSession,
      eventType === "pageview"
    );

    return reply.status(200).send({
      success: true,
    });
  } catch (error) {
    console.error("Error tracking event:", error);
    if (error instanceof ZodError) {
      return reply.status(400).send({
        success: false,
        error: "Invalid payload format",
        details: error.flatten(),
      });
    }
    return reply.status(500).send({
      success: false,
      error: "Failed to track event",
    });
  }
}
