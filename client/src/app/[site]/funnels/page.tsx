"use client";

import { CreateFunnelDialog } from "./components/CreateFunnel";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useGetFunnels, SavedFunnel } from "@/api/analytics/useGetFunnels";
import { PlusCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/lib/store";
import { FunnelRow } from "./components/FunnelRow";
import { MobileSidebar } from "../../../components/MobileSidebar";

export default function FunnelsPage() {
  const { site } = useStore();
  const { data: funnels, isLoading, error } = useGetFunnels(site);

  if (isLoading) {
    return (
      <div className="p-4 max-w-[1300px] mx-auto space-y-4">
        <div className="flex justify-between items-center mb-3">
          <div>
            <MobileSidebar />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full mb-4" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-2 md:p-4  max-w-[1300px] mx-auto space-y-3">
      <div className="flex justify-between items-center mb-3">
        <div>
          <MobileSidebar />
        </div>
        <CreateFunnelDialog />
      </div>

      {error ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          Failed to load funnels:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      ) : funnels?.length ? (
        <div className="space-y-4">
          {funnels.map((funnel: SavedFunnel) => (
            <FunnelRow key={funnel.id} funnel={funnel} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="bg-neutral-100 dark:bg-neutral-800 rounded-full p-3 mb-4">
            <PlusCircle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-medium mb-2">No funnels yet</h3>
          <p className="text-neutral-500 max-w-md mb-6">
            Create your first funnel to track conversions through your site's
            user journey
          </p>
          <CreateFunnelDialog />
        </div>
      )}
    </div>
  );
}
