import { fromNodeHeaders } from "better-auth/node";
import { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/postgres/postgres.js";
import { users } from "../db/postgres/schema.js";
import { auth } from "../lib/auth.js";

interface ChangeEmailRequest {
  Body: {
    newEmail: string;
  };
}

export async function changeEmail(
  request: FastifyRequest<ChangeEmailRequest>,
  reply: FastifyReply
) {
  try {
    const { newEmail } = request.body;

    // Validate input
    if (!newEmail || newEmail.trim() === "") {
      return reply.status(400).send({
        error: "New email cannot be empty",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      return reply.status(400).send({
        error: "Invalid email format",
      });
    }

    // Get current user session
    const session = await auth!.api.getSession({
      headers: fromNodeHeaders(request.headers),
    });

    if (!session?.user.id) {
      return reply.status(401).send({ error: "Unauthorized" });
    }

    const userId = session.user.id;

    // Check if the email is already taken
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, newEmail))
      .execute();

    if (existingUser.length > 0 && existingUser[0].id !== userId) {
      return reply.status(409).send({ error: "Email already exists" });
    }

    // Update the user's email
    await db
      .update(users)
      .set({
        email: newEmail,
        updatedAt: new Date(),
        // Note: In a production app, you might want to reset emailVerified to false here
        // and send a verification email to the new address
        // emailVerified: false,
      })
      .where(eq(users.id, userId))
      .execute();

    return reply.status(200).send({
      message: "Email updated successfully",
      email: newEmail,
    });
  } catch (error: any) {
    console.error("Error changing email:", error);

    // Handle specific errors
    if (
      error.message?.includes("unique constraint") &&
      error.message.includes("email")
    ) {
      return reply.status(409).send({ error: "Email already exists" });
    }

    return reply.status(500).send({ error: "Failed to update email" });
  }
}
