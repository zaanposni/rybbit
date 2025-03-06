import { fromNodeHeaders } from "better-auth/node";
import { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db } from "../db/postgres/postgres.js";
import { users } from "../db/postgres/schema.js";
import { auth } from "../lib/auth.js";

interface ChangeUsernameRequest {
  Body: {
    newUsername: string;
  };
}

export async function changeUsername(
  request: FastifyRequest<ChangeUsernameRequest>,
  reply: FastifyReply
) {
  try {
    const { newUsername } = request.body;

    // Validate input
    if (!newUsername || newUsername.trim() === "") {
      return reply.status(400).send({
        error: "New username cannot be empty",
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

    // Check if the username is already taken
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.username, newUsername))
      .execute();

    if (existingUser.length > 0 && existingUser[0].id !== userId) {
      return reply.status(409).send({ error: "Username already exists" });
    }

    // Update the user's username
    await db
      .update(users)
      .set({
        username: newUsername,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .execute();

    return reply.status(200).send({
      message: "Username updated successfully",
      username: newUsername,
    });
  } catch (error: any) {
    console.error("Error changing username:", error);

    // Handle specific errors
    if (
      error.message?.includes("unique constraint") &&
      error.message.includes("username")
    ) {
      return reply.status(409).send({ error: "Username already exists" });
    }

    return reply.status(500).send({ error: "Failed to update username" });
  }
}
