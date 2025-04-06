"use client";

import { ThreadList } from "@/components/assistant-ui/thread-list";
import { Thread } from "@/components/assistant-ui/thread";
import { RuntimeProvider } from "./RuntimeProvider";

export default function AIPage() {
  return (
    <RuntimeProvider>
      <div className="grid h-dvh grid-cols-[200px_1fr] gap-x-2 px-4 py-4">
        <ThreadList />
        <Thread />
      </div>
    </RuntimeProvider>
  );
}
