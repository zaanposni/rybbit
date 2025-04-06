"use client";

import { CreateFunnelDialog } from "./components/CreateFunnel";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, PlusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/lib/store";
import {
  SavedFunnel,
  useGetFunnels,
} from "../../../api/analytics/useGetFunnels";

export default function FunnelsPage() {
  const { site } = useStore();
  const router = useRouter();
  const { data: funnels, isLoading, error } = useGetFunnels(site);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Funnels</h1>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Funnels</h1>
        <CreateFunnelDialog />
      </div>

      {error ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          Failed to load funnels:{" "}
          {error instanceof Error ? error.message : "Unknown error"}
        </div>
      ) : funnels?.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {funnels.map((funnel: SavedFunnel) => (
            <Card key={funnel.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle>{funnel.name}</CardTitle>
                <CardDescription>
                  {funnel.steps.length} steps • Created{" "}
                  {new Date(funnel.createdAt).toLocaleDateString()}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm">Conversion rate</div>
                    <div className="text-2xl font-bold">
                      {funnel.conversionRate || "0"}%
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => router.push(`/funnels/${funnel.id}`)}
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
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
