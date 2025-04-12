import { FastifyReply, FastifyRequest } from "fastify";
import { auth } from "../../lib/auth.js";

interface CreateAccountRequest {
  Body: {
    email: string;
    username: string;
    name: string;
    password: string;
    isAdmin: boolean;
  };
}

export async function createAccount(
  request: FastifyRequest<CreateAccountRequest>,
  reply: FastifyReply
) {
  try {
    const { email, name, username, password, isAdmin } = request.body;

    // Validate input
    if (!email || !username || !password) {
      return reply.status(400).send({
        error:
          "Missing required fields: email,  name, and password are required",
      });
    }

    // Check password strength
    if (password.length < 8) {
      return reply.status(400).send({
        error: "Password must be at least 8 characters long",
      });
    }

    // Create the account using auth.api.signUpEmail
    const result = await auth!.api.signUpEmail({
      body: {
        email,
        name,
        username,
        password,
        role: isAdmin ? "admin" : "user",
      },
    });

    return reply.status(201).send({
      message: "Account created successfully",
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
    });
  } catch (error: any) {
    console.error("Error creating account:", error);

    // Handle specific errors
    if (error.message?.includes("unique constraint")) {
      if (error.message.includes("username")) {
        return reply.status(409).send({ error: "Username already exists" });
      }
      if (error.message.includes("email")) {
        return reply.status(409).send({ error: "Email already exists" });
      }
    }

    return reply.status(500).send({ error: "Failed to create account" });
  }
}
