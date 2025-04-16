"use client";

import { userStore } from "../../../../lib/userStore";
import { UsageBanners } from "./UsageBanners";

export function Header() {
  const { user } = userStore();

  return <div className="flex flex-col p-3">{user && <UsageBanners />}</div>;
}
