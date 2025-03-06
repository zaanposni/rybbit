"use client";

import { SiteCard } from "../components/SiteCard";
import { useGetSites } from "../hooks/api";
import { AddSite } from "./components/AddSite";

export default function Home() {
  const { data: sites } = useGetSites();

  return (
    <div className="flex min-h-screen flex-col pt-1">
      <div className="flex justify-between items-center mb-4">
        <div className="text-2xl font-bold">Websites</div>
        <AddSite />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sites?.data?.map((site) => {
          return (
            <SiteCard
              key={site.siteId}
              siteId={site.siteId}
              domain={site.domain}
            />
          );
        })}
      </div>
    </div>
  );
}
