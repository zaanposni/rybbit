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
import { StandardSectionRealtime } from "../../../components/shared/StandardSection/StandardSectionRealtime";
type Tab = "referrers";

export function Referrers({ isRealtime = false }: { isRealtime?: boolean }) {
  const [tab, setTab] = useState<Tab>("referrers");

  const ComponentToUse = isRealtime ? StandardSectionRealtime : StandardSection;

  return (
    <Card className="h-[493px]">
      <CardContent className="mt-2">
        <Tabs
          defaultValue="referrers"
          value={tab}
          onValueChange={(value) => setTab(value as Tab)}
        >
          <TabsList>
            <TabsTrigger value="referrers">Referrers</TabsTrigger>
          </TabsList>
          <TabsContent value="referrers">
            <ComponentToUse
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
        </Tabs>
      </CardContent>
    </Card>
  );
}
