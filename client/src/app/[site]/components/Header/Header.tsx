"use client";

import { FreeTrialBanner } from "../../../../components/FreeTrialBanner";
import { userStore } from "../../../../lib/userStore";
import { UsageBanners } from "./UsageBanners";

export function Header() {
  const { user } = userStore();

  return (
    <div className="flex flex-col">
      {user && (
        <>
          <FreeTrialBanner />
          <UsageBanners />
        </>
      )}
    </div>
  );
}
