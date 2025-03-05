"use client";

import { Button } from "@/components/ui/button";
import { GearSix } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useGetSites } from "../../../hooks/api";
import { General } from "./General";

export default function SettingsPage() {
  const [selectedTab, setSelectedTab] = useState<"general">("general");
  const { data: sites } = useGetSites();
  const pathname = usePathname();

  const site = sites?.data?.find(
    (site) => site.siteId === Number(pathname.split("/")[1])
  );

  return (
    <div className="max-w-6xl">
      <div className="flex items-center gap-2 text-xl font-bold mb-4">
        <img
          className="w-7 mr-1"
          src={`https://www.google.com/s2/favicons?domain=${site?.domain}&sz=64`}
        />
        <div>{site?.domain}</div>
      </div>
      <div className="grid grid-cols-[200px_1fr] gap-6">
        <div className="flex flex-col gap-2">
          <Button
            variant={selectedTab === "general" ? "default" : "ghost"}
            onClick={() => setSelectedTab("general")}
            className="justify-start"
          >
            <GearSix size={16} weight="bold" />
            General
          </Button>
        </div>
        {selectedTab === "general" && site && <General site={site} />}
      </div>
    </div>
  );
}
