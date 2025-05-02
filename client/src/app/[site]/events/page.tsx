"use client";

import { EVENT_FILTERS } from "@/lib/store";
import { useGetEventNames } from "../../../api/analytics/useGetEventNames";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EventList } from "./components/EventList";
import { EventLog } from "./components/EventLog";
import { SubHeader } from "../components/SubHeader/SubHeader";

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
            size="large"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event Log</CardTitle>
        </CardHeader>
        <CardContent>
          <EventLog />
        </CardContent>
      </Card>
    </div>
  );
}
