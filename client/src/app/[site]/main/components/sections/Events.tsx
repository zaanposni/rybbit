import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../../components/ui/basic-tabs";
import { Card, CardContent } from "../../../../../components/ui/card";
import { StandardSection } from "../../../components/shared/StandardSection/StandardSection";
import { StandardSectionRealtime } from "../../../components/shared/StandardSection/StandardSectionRealtime";

type Tab = "events";

export function Events({ isRealtime = false }: { isRealtime?: boolean }) {
  const [tab, setTab] = useState<Tab>("events");

  const ComponentToUse = isRealtime ? StandardSectionRealtime : StandardSection;

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
            <ComponentToUse
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
