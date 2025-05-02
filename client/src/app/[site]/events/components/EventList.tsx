"use client";

import { useState } from "react";
import { EventName } from "../../../../api/analytics/useGetEventNames";
import { EventProperty } from "../../../../api/analytics/useGetEventProperties";
import { CardLoader } from "@/components/ui/card";
import NumberFlow from "@number-flow/react";
import { ChevronDown, ChevronRight, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventProperties } from "./EventProperties";
import { useGetEventProperties } from "../../../../api/analytics/useGetEventProperties";

interface EventListProps {
  events: EventName[];
  isLoading: boolean;
}

export function EventList({ events, isLoading }: EventListProps) {
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const handleEventClick = (eventName: string) => {
    setExpandedEvent(expandedEvent === eventName ? null : eventName);
  };

  const { data: eventPropertiesData, isLoading: isLoadingProperties } =
    useGetEventProperties(expandedEvent);

  console.info(JSON.stringify(eventPropertiesData, null, 2));
  if (isLoading) {
    return (
      <div className="relative h-40">
        <CardLoader />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="text-neutral-300 w-full text-center mt-6 flex flex-row gap-2 items-center justify-center">
        <Info className="w-5 h-5" />
        No custom events found
      </div>
    );
  }

  // Find the highest count to calculate percentages
  const maxCount = Math.max(...events.map((event) => event.count));

  return (
    <div className="flex flex-col gap-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
      {events.map((event) => {
        const percentage = (event.count / maxCount) * 100;
        const isExpanded = expandedEvent === event.eventName;

        return (
          <div key={event.eventName} className="flex flex-col">
            {/* Event Row */}
            <div
              className={`relative h-9 flex items-center cursor-pointer hover:bg-neutral-850 group px-2 rounded-md ${
                isExpanded ? "bg-neutral-800 ring-1 ring-neutral-700" : ""
              }`}
              onClick={() => handleEventClick(event.eventName)}
            >
              <div
                className="absolute inset-0 bg-dataviz py-2 opacity-25 rounded-md"
                style={{ width: `${percentage}%` }}
              ></div>
              <div className="z-10 flex justify-between items-center text-sm w-full">
                <div className="font-medium truncate max-w-[70%] flex items-center gap-1">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-neutral-400" />
                  )}
                  {event.eventName}
                </div>
                <div className="text-sm flex gap-2">
                  <div className="hidden group-hover:block text-neutral-400">
                    {Math.round(percentage * 10) / 10}%
                  </div>
                  <NumberFlow
                    respectMotionPreference={false}
                    value={event.count}
                    format={{ notation: "compact" }}
                  />
                </div>
              </div>
            </div>

            {/* Properties Section (Expanded) */}
            {isExpanded && (
              <div className="ml-4 mt-2 mb-4 border-l-2 border-neutral-800 pl-4">
                <EventProperties
                  properties={eventPropertiesData || []}
                  isLoading={isLoadingProperties}
                  selectedEvent={expandedEvent}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
