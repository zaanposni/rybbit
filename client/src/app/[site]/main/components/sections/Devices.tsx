"use client";

import { Monitor, Smartphone, Tablet } from "lucide-react";
import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../../components/ui/basic-tabs";
import { Card, CardContent } from "../../../../../components/ui/card";
import { StandardSection } from "../../../components/shared/StandardSection/StandardSection";
import { Browser } from "../../../components/shared/icons/Browser";
import { OperatingSystem } from "../../../components/shared/icons/OperatingSystem";

type Tab = "devices" | "browsers" | "os" | "dimensions";

export function Devices() {
  const [tab, setTab] = useState<Tab>("browsers");
  return (
    <Card className="h-[445px]">
      <CardContent className="mt-2">
        <Tabs
          defaultValue="browsers"
          value={tab}
          onValueChange={(value) => setTab(value as Tab)}
        >
          <div className="overflow-x-auto pb-1">
            <TabsList>
              <TabsTrigger value="browsers">Browsers</TabsTrigger>
              <TabsTrigger value="devices">Devices</TabsTrigger>
              <TabsTrigger value="os">Operating Systems</TabsTrigger>
              <TabsTrigger value="dimensions">Screen Dimensions</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="devices">
            <StandardSection
              filterParameter="device_type"
              title="Devices"
              getValue={(e) => e.value}
              getKey={(e) => e.value}
              getLabel={(e) => (
                <div className="flex gap-2 items-center">
                  {e.value === "Desktop" && <Monitor className="w-4 h-4" />}
                  {e.value === "Mobile" && <Smartphone className="w-4 h-4" />}
                  {e.value === "Tablet" && <Tablet className="w-4 h-4" />}
                  {e.value || "Other"}
                </div>
              )}
            />
          </TabsContent>
          <TabsContent value="browsers">
            <StandardSection
              filterParameter="browser"
              title="Browsers"
              getValue={(e) => e.value}
              getKey={(e) => e.value}
              getLabel={(e) => (
                <div className="flex gap-2 items-center">
                  <Browser browser={e.value} />
                  {e.value || "Other"}
                </div>
              )}
            />
          </TabsContent>
          <TabsContent value="os">
            <StandardSection
              title="Operating Systems"
              getValue={(e) => e.value}
              getKey={(e) => e.value}
              getLabel={(e) => (
                <div className="flex gap-2 items-center">
                  <OperatingSystem os={e.value || "Other"} />
                  {e.value || "Other"}
                </div>
              )}
              filterParameter="operating_system"
            />
          </TabsContent>
          <TabsContent value="dimensions">
            <StandardSection
              title="Screen Dimensions"
              getValue={(e) => e.value}
              getKey={(e) => e.value}
              getLabel={(e) => (
                <div className="flex gap-2 items-center">
                  {e.value || "Other"}
                </div>
              )}
              filterParameter="dimensions"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
