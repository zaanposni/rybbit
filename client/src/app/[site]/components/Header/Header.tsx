"use client";

import { userStore } from "../../../../lib/userStore";
import { UsageBanners } from "./UsageBanners";

export function Header() {
  const { user } = userStore();

  return null;
  // return <div className="flex flex-col">{user && <UsageBanners />}</div>;
}
