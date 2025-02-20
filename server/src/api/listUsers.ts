import { FastifyReply, FastifyRequest } from "fastify";
import { sql } from "../db/postgres/postgres.js";

type ListUsersResponse = {
  id: string;
  name: string;
  username: string;
  email: string;
  emailVerified: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
}[];

export async function listUsers(_: FastifyRequest, res: FastifyReply) {
  try {
    const users = await sql<ListUsersResponse[]>`SELECT * FROM "user"`;
    return res.send({ data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).send({ error: "Failed to fetch users" });
  }
}
