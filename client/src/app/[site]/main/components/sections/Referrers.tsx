"use client";
import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../../components/ui/basic-tabs";
import { Card, CardContent } from "../../../../../components/ui/card";
import { StandardSection } from "../../../components/shared/StandardSection/StandardSection";

type Tab =
  | "referrers"
  | "channels"
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "utm_term"
  | "utm_content";

export function Referrers() {
  const [tab, setTab] = useState<Tab>("referrers");

  return (
    <Card className="h-[445px]">
      <CardContent className="mt-2">
        <Tabs
          defaultValue="referrers"
          value={tab}
          onValueChange={(value) => setTab(value as Tab)}
        >
          <TabsList>
            <TabsTrigger value="referrers">Referrers</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="utm_source">Source</TabsTrigger>
            <TabsTrigger value="utm_medium">Medium</TabsTrigger>
            <TabsTrigger value="utm_campaign">Campaign</TabsTrigger>
            <TabsTrigger value="utm_term">Term</TabsTrigger>
            <TabsTrigger value="utm_content">Content</TabsTrigger>
          </TabsList>
          <TabsContent value="referrers">
            <StandardSection
              filterParameter="referrer"
              title="Referrers"
              getValue={(e) => e.value}
              getKey={(e) => e.value}
              getLink={(e) => `https://${e.value}`}
              getLabel={(e) => (
                <div className="flex items-center">
                  <img
                    className="w-4 mr-2"
                    src={`https://www.google.com/s2/favicons?domain=${e.value}&sz=32`}
                  />
                  {e.value ? e.value : "Direct"}
                </div>
              )}
            />
          </TabsContent>
          <TabsContent value="channels">
            <StandardSection
              filterParameter="channel"
              title="Channels"
              getValue={(e) => e.value}
              getKey={(e) => e.value}
              // getLink={(e) => `https://${e.value}`}
              getLabel={(e) => (
                <div className="flex items-center">{e.value}</div>
              )}
            />
          </TabsContent>
          <TabsContent value="utm_source">
            <StandardSection
              filterParameter="utm_source"
              title="UTM Source"
              getKey={(e) => e.value}
              getLabel={(e) => e.value}
              getValue={(e) => e.value}
            />
          </TabsContent>
          <TabsContent value="utm_medium">
            <StandardSection
              filterParameter="utm_medium"
              title="UTM Medium"
              getKey={(e) => e.value}
              getLabel={(e) => e.value}
              getValue={(e) => e.value}
            />
          </TabsContent>
          <TabsContent value="utm_campaign">
            <StandardSection
              filterParameter="utm_campaign"
              title="UTM Campaign"
              getKey={(e) => e.value}
              getLabel={(e) => e.value}
              getValue={(e) => e.value}
            />
          </TabsContent>
          <TabsContent value="utm_content">
            <StandardSection
              filterParameter="utm_content"
              title="UTM Content"
              getKey={(e) => e.value}
              getLabel={(e) => e.value}
              getValue={(e) => e.value}
            />
          </TabsContent>
          <TabsContent value="utm_term">
            <StandardSection
              filterParameter="utm_term"
              title="UTM Term"
              getKey={(e) => e.value}
              getLabel={(e) => e.value}
              getValue={(e) => e.value}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
