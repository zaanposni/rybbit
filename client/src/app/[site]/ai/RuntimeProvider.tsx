"use client";

import { ReactNode } from "react";
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  ChatModelAdapter,
} from "@assistant-ui/react";
import { authedFetch } from "@/api/utils";
import { BACKEND_URL } from "@/lib/const";
import { DateTime } from "luxon";
import { useStore } from "@/lib/store";

const ModelAdapter: ChatModelAdapter = {
  async run({ messages, abortSignal }) {
    const { site } = useStore();
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const date = DateTime.now().toFormat("yyyy-MM-dd");

    const response = await authedFetch(`${BACKEND_URL}/handle-message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        site,
        timezone,
        date,
        messages,
      }),
      signal: abortSignal,
    });

    const data = await response.json();
    return {
      content: [
        {
          type: "text",
          text: data.text,
        },
      ],
    };
  },
};

export function RuntimeProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const runtime = useLocalRuntime(ModelAdapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
