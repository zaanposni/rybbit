"use client";

import { useState } from "react";
import { SavedFunnel } from "@/api/analytics/useGetFunnels";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Calendar, BarChart2 } from "lucide-react";
import { Time, DateRangeMode } from "@/components/DateSelector/types";
import { DateTime } from "luxon";
import { Funnel } from "./Funnel";
import { useGetFunnel } from "@/api/analytics/useGetFunnel";

interface FunnelRowProps {
  funnel: SavedFunnel;
}

export function FunnelRow({ funnel }: FunnelRowProps) {
  const [expanded, setExpanded] = useState(false);

  console.info(funnel);

  // Time state for funnel visualization - default to last 7 days
  const [time, setTime] = useState<Time>({
    mode: "range",
    startDate: DateTime.now().minus({ days: 7 }).toISODate(),
    endDate: DateTime.now().toISODate(),
    wellKnown: "Last 7 days",
  } as DateRangeMode);

  // Funnel data fetching
  const {
    mutate: analyzeFunnel,
    data,
    isError,
    error,
    isPending,
    isSuccess,
  } = useGetFunnel();

  // Handle expansion (fetch data if needed)
  const handleExpand = () => {
    if (!expanded && !isSuccess) {
      // Fetch funnel data when expanding if not already loaded
      analyzeFunnel({
        steps: funnel.steps,
        startDate:
          time.mode === "range"
            ? time.startDate
            : DateTime.now().minus({ days: 7 }).toISODate(),
        endDate:
          time.mode === "range" ? time.endDate : DateTime.now().toISODate(),
      });
    }
    setExpanded(!expanded);
  };

  // Format date string
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "Unknown date";
    }
  };

  return (
    <Card className="mb-4 overflow-hidden">
      {/* Header row (always visible) */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
        onClick={handleExpand}
      >
        <div className="flex items-center space-x-4">
          <div className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded-md">
            <BarChart2 className="h-5 w-5 text-neutral-500" />
          </div>
          <div>
            <h3 className="font-medium">{funnel.name}</h3>
            <div className="text-sm text-neutral-500 flex items-center gap-2">
              <span>{funnel.steps.length} steps</span>
              <span>•</span>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(funnel.createdAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-neutral-500">Conversion</div>
            <div className="font-semibold">
              {(funnel.conversionRate || 0).toFixed(1)}%
            </div>
          </div>
          <Button variant="ghost" size="sm" className="ml-2">
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </div>
      </div>

      {/* Expandable content */}
      {expanded && (
        <div className="border-t border-neutral-200 dark:border-neutral-800">
          <div className="p-4">
            {isPending ? (
              <div className="flex justify-center items-center h-[400px]">
                <div className="animate-pulse flex items-center">
                  <div className="h-2 w-2 bg-neutral-500 rounded-full mr-1 animate-bounce"></div>
                  <div className="h-2 w-2 bg-neutral-500 rounded-full mr-1 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="h-2 w-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            ) : isError ? (
              <div className="text-red-500 p-4 text-center">
                Error loading funnel:{" "}
                {error instanceof Error ? error.message : "Unknown error"}
              </div>
            ) : data?.data && data.data.length > 0 ? (
              <Funnel
                data={data}
                isError={isError}
                error={error}
                isPending={isPending}
                time={time}
                setTime={setTime}
              />
            ) : (
              <div className="text-center p-6 text-neutral-500">
                No funnel data available
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
