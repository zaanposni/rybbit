"use client";

import { EventProperty } from "../../../../api/analytics/useGetEventProperties";
import { CardLoader } from "@/components/ui/card";
import NumberFlow from "@number-flow/react";
import { Info } from "lucide-react";

interface EventPropertiesProps {
  properties: EventProperty[];
  isLoading: boolean;
  selectedEvent: string | null;
}

export function EventProperties({
  properties,
  isLoading,
  selectedEvent,
}: EventPropertiesProps) {
  if (isLoading) {
    return (
      <div className="relative h-40">
        <CardLoader />
      </div>
    );
  }

  if (!selectedEvent) {
    return (
      <div className="text-neutral-300 w-full text-center py-8 flex flex-col gap-2 items-center justify-center">
        <Info className="w-6 h-6" />
        <p>Select an event to view its properties</p>
      </div>
    );
  }

  if (!properties || properties.length === 0) {
    return (
      <div className="text-neutral-300 w-full text-center py-8 flex flex-col gap-2 items-center justify-center">
        <Info className="w-6 h-6" />
        <p>No properties found for this event</p>
      </div>
    );
  }

  // Group properties by propertyKey
  const groupedProperties = properties.reduce((acc, property) => {
    if (!acc[property.propertyKey]) {
      acc[property.propertyKey] = [];
    }
    acc[property.propertyKey].push(property);
    return acc;
  }, {} as Record<string, EventProperty[]>);

  // Sort keys by the total count of their values
  const sortedKeys = Object.keys(groupedProperties).sort((a, b) => {
    const sumA = groupedProperties[a].reduce(
      (sum, prop) => sum + prop.count,
      0
    );
    const sumB = groupedProperties[b].reduce(
      (sum, prop) => sum + prop.count,
      0
    );
    return sumB - sumA;
  });

  // Find the highest count to calculate percentages for values
  const maxCount = Math.max(...properties.map((prop) => prop.count));

  return (
    <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
      {sortedKeys.map((key) => {
        // Sort property values by count (descending)
        const values = groupedProperties[key].sort((a, b) => b.count - a.count);

        return (
          <div key={key} className="flex flex-col gap-1">
            {/* Property Key Header */}
            <div className="font-semibold text-sm text-primary py-1 border-b border-neutral-800">
              {key}
            </div>

            {/* Property Values */}
            <div className="pl-4 flex flex-col gap-1">
              {values.map((property) => {
                const percentage = (property.count / maxCount) * 100;

                return (
                  <div
                    key={`${property.propertyKey}-${property.propertyValue}`}
                    className="relative h-8 flex items-center hover:bg-neutral-850 group px-2 rounded-md"
                  >
                    <div
                      className="absolute inset-0 bg-dataviz py-2 opacity-25 rounded-md"
                      style={{ width: `${percentage}%` }}
                    ></div>
                    <div className="z-10 flex justify-between items-center text-sm w-full">
                      <div className="truncate max-w-[70%]">
                        {property.propertyValue}
                      </div>
                      <div className="text-sm flex gap-2">
                        <div className="hidden group-hover:block text-neutral-400">
                          {Math.round(percentage * 10) / 10}%
                        </div>
                        <NumberFlow
                          respectMotionPreference={false}
                          value={property.count}
                          format={{ notation: "compact" }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
