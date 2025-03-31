"use client";

import { useState } from "react";
import {
  GetSitesResponse,
  useGetSiteMetadata,
} from "../../../../../api/admin/sites";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../../components/ui/basic-tabs";
import { Card, CardContent } from "../../../../../components/ui/card";
import { StandardSection } from "../../../components/shared/StandardSection/StandardSection";
import { StandardSectionRealtime } from "../../../components/shared/StandardSection/StandardSectionRealtime";

type Tab = "pages" | "entry_pages" | "exit_pages";

export function Pages({ isRealtime = false }: { isRealtime?: boolean }) {
  const { siteMetadata } = useGetSiteMetadata();
  const [tab, setTab] = useState<Tab>("pages");

  const ComponentToUse = isRealtime ? StandardSectionRealtime : StandardSection;

  return (
    <Card className="h-[493px]">
      <CardContent className="mt-2">
        <Tabs
          defaultValue="pages"
          value={tab}
          onValueChange={(value) => setTab(value as Tab)}
        >
          <TabsList>
            <TabsTrigger value="pages">Pages</TabsTrigger>
            <TabsTrigger value="entry_pages">Entry Pages</TabsTrigger>
            <TabsTrigger value="exit_pages">Exit Pages</TabsTrigger>
          </TabsList>
          <TabsContent value="pages">
            <ComponentToUse
              filterParameter="pathname"
              title="Pages"
              getValue={(e) => e.value}
              getKey={(e) => e.value}
              getLabel={(e) => e.value || "Other"}
              getLink={(e) => `https://${siteMetadata?.domain}${e.value}`}
            />
          </TabsContent>
          <TabsContent value="entry_pages">
            <ComponentToUse
              filterParameter="entry_page"
              title="Entry Pages"
              getValue={(e) => e.value}
              getKey={(e) => e.value}
              getLabel={(e) => e.value || "Other"}
              getLink={(e) => `https://${siteMetadata?.domain}${e.value}`}
            />
          </TabsContent>
          <TabsContent value="exit_pages">
            <ComponentToUse
              filterParameter="exit_page"
              title="Exit Pages"
              getValue={(e) => e.value}
              getKey={(e) => e.value}
              getLabel={(e) => e.value || "Other"}
              getLink={(e) => `https://${siteMetadata?.domain}${e.value}`}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
