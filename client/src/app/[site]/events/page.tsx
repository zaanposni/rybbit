"use client";

import { useState } from "react";
import { FilterParameter } from "@/lib/store";
import { useGetEventNames } from "../../../api/analytics/useGetEventNames";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventList } from "./components/EventList";
import { SubHeader } from "../components/SubHeader/SubHeader";

// Define event filters
const EVENT_FILTERS: FilterParameter[] = [
  "event_name",
  "browser",
  "operating_system",
  "country",
  "device_type",
  "referrer",
];

export default function EventsPage() {
  const { data: eventNamesData, isLoading: isLoadingEventNames } =
    useGetEventNames();

  return (
    <div className="p-2 md:p-4 max-w-[1300px] mx-auto space-y-3">
      <SubHeader availableFilters={EVENT_FILTERS} />

      <Card>
        <CardHeader>
          <CardTitle>Custom Events</CardTitle>
        </CardHeader>
        <CardContent>
          <EventList
            events={eventNamesData || []}
            isLoading={isLoadingEventNames}
          />
        </CardContent>
      </Card>
    </div>
  );
}
