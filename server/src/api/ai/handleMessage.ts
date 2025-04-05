import { FastifyReply, FastifyRequest } from "fastify";
import { getUserHasAccessToSite } from "../../lib/auth-utils.js";
import { initChatModel } from "langchain/chat_models/universal";
import { generateAnalyticsTools } from "./tools.js";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { analyticsAgentSystemPrompt } from "./prompts.js";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

interface HandleMessageRequest {
  Body: {
    site: string;
    timezone: string;
    date: string;
    message: string;
  };
}

export async function handleMessage (
  req: FastifyRequest<HandleMessageRequest>,
  res: FastifyReply
) {
  const { site, timezone, date, message } = req.body;

  const userHasAccessToSite = await getUserHasAccessToSite(req, site);
  if (!userHasAccessToSite) {
    return res.status(403).send({ error: "Forbidden" });
  }

  try {
    const llm = await initChatModel(process.env.MODEL, {
      modelProvider: process.env.PROVIDER,
      temperature: 0,
    });
    const tools = generateAnalyticsTools(timezone, site);
    const analyticsAgent = createReactAgent({ llm, tools });

    const promptTemplate = ChatPromptTemplate.fromMessages([
      ["system", analyticsAgentSystemPrompt],
      // ["placeholder", "{messages}"],
      ["user", message],
    ]);
    const prompt = await promptTemplate.invoke({ date });

    const result = await analyticsAgent.invoke(prompt);

    return res.send({ response: result.messages[result.messages.length - 1].content });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ error: "Failed to handle message" });
  }
}
