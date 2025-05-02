import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../../components/ui/basic-tabs";
import {
  Card,
  CardContent,
  CardLoader,
} from "../../../../../components/ui/card";
import { useGetEventNames } from "../../../../../api/analytics/useGetEventNames";
import { EventList } from "../../../events/components/EventList";

type Tab = "events";

export function Events() {
  const [tab, setTab] = useState<Tab>("events");
  const { data: eventNamesData, isLoading: isLoadingEventNames } =
    useGetEventNames();

  return (
    <Card>
      <CardContent className="mt-2">
        <Tabs
          defaultValue="events"
          value={tab}
          onValueChange={(value) => setTab(value as Tab)}
        >
          <TabsList>
            <TabsTrigger value="events">Custom Events</TabsTrigger>
          </TabsList>
          <TabsContent value="events">
            {isLoadingEventNames && (
              <div className="absolute top-[-8px] left-0 w-full h-full">
                <CardLoader />
              </div>
            )}
            <div className="relative">
              <EventList
                events={eventNamesData || []}
                isLoading={isLoadingEventNames}
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
