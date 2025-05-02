import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../../components/ui/basic-tabs";
import { Card, CardContent } from "../../../../../components/ui/card";
import { StandardSection } from "../../../components/shared/StandardSection/StandardSection";

type Tab = "events";

export function Events() {
  const [tab, setTab] = useState<Tab>("events");

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
            <StandardSection
              filterParameter="event_name"
              title="Events"
              countLabel="Count"
              getValue={(e) => e.value}
              getKey={(e) => e.value}
              getLabel={(e) => e.value}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
