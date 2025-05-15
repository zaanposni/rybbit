import { FastifyRequest, FastifyReply } from "fastify";
import { DISABLE_SIGNUP } from "../lib/const.js";

export async function getConfig(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({
    disableSignup: DISABLE_SIGNUP,
  });
}
