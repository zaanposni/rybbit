import { FastifyReply, FastifyRequest } from "fastify";
import { getUserHasAccessToSite } from "../../lib/auth-utils.js";

interface Message {
  role: "user" | "system";
  content: string;
}

interface HandleMessageRequest {
  Body: {
    site: string;
    timezone: string;
    date: string;
    messages: Message[];
  };
}

export async function handleMessage (
  req: FastifyRequest<HandleMessageRequest>,
  res: FastifyReply
) {
  const { site, timezone, date, messages } = req.body;

  const userHasAccessToSite = await getUserHasAccessToSite(req, site);
  if (!userHasAccessToSite) {
    return res.status(403).send({ error: "Forbidden" });
  }
}
