"use client";
import { ChevronRight, Globe } from "lucide-react";
import { useState } from "react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../../../../components/ui/basic-tabs";
import { Card, CardContent } from "../../../../../components/ui/card";
import { getCountryName, getLanguageName } from "../../../../../lib/utils";
import { StandardSection } from "../../../components/shared/StandardSection/StandardSection";
import { CountryFlag } from "../../../components/shared/icons/CountryFlag";
import { useSubdivisions } from "../../../../../lib/geo";
import { MapComponent } from "../../../components/shared/Map";

type Tab = "countries" | "regions" | "languages" | "cities" | "map";

// Helper to extract country code from language code
const getCountryFromLanguage = (languageCode: string): string | null => {
  if (languageCode.includes("-")) {
    const [_, region] = languageCode.split("-");
    return region;
  }
  return null;
};

export function Countries() {
  const [tab, setTab] = useState<Tab>("countries");

  const { data: subdivisions } = useSubdivisions();

  return (
    <Card className="">
      <CardContent className="mt-2">
        <Tabs
          defaultValue="countries"
          value={tab}
          onValueChange={(value) => setTab(value as Tab)}
        >
          <TabsList>
            <TabsTrigger value="countries">Countries</TabsTrigger>
            <TabsTrigger value="regions">Regions</TabsTrigger>
            <TabsTrigger value="cities">Cities</TabsTrigger>
            <TabsTrigger value="languages">Languages</TabsTrigger>
            <TabsTrigger value="map">Map</TabsTrigger>
          </TabsList>
          <TabsContent value="countries">
            <StandardSection
              filterParameter="country"
              title="Countries"
              getValue={(e) => e.value}
              getKey={(e) => e.value}
              getFilterLabel={(e) => getCountryName(e.value)}
              getLabel={(e) => {
                return (
                  <div className="flex gap-2 items-center">
                    <CountryFlag country={e.value} />
                    {getCountryName(e.value)}
                  </div>
                );
              }}
            />
          </TabsContent>
          <TabsContent value="regions">
            <StandardSection
              filterParameter="region"
              title="Regions"
              getValue={(e) => e.value}
              getKey={(e) => e.value}
              getFilterLabel={(e) => {
                const region = subdivisions?.features.find(
                  (feature) => feature.properties.iso_3166_2 === e.value
                )?.properties;
                return region?.name ?? "";
              }}
              getLabel={(e) => {
                if (!e.value) {
                  return "Unknown";
                }

                const region = subdivisions?.features.find(
                  (feature) => feature.properties.iso_3166_2 === e.value
                )?.properties;

                return (
                  <div className="flex gap-2 items-center">
                    <CountryFlag
                      country={region?.iso_3166_2.slice(0, 2) ?? ""}
                    />
                    {region?.iso_3166_2.slice(0, 2)}
                    <ChevronRight className="w-4 h-4 mx-[-4px]" />
                    {region?.name}
                  </div>
                );
              }}
            />
          </TabsContent>
          <TabsContent value="cities">
            <StandardSection
              filterParameter="city"
              title="Cities"
              getValue={(e) => e.value}
              getKey={(e) => e.value}
              getLabel={(e) => {
                if (!e.value) {
                  return "Unknown";
                }
                return <div className="flex gap-2 items-center">{e.value}</div>;
              }}
            />
          </TabsContent>
          <TabsContent value="languages">
            <StandardSection
              filterParameter="language"
              title="Languages"
              getValue={(e) => e.value}
              getKey={(e) => e.value}
              getFilterLabel={(e) => getLanguageName(e.value) ?? ""}
              getLabel={(e) => (
                <div className="flex gap-2 items-center">
                  {getCountryFromLanguage(e.value) ? (
                    <CountryFlag country={getCountryFromLanguage(e.value)!} />
                  ) : (
                    <Globe className="w-5 h-5" />
                  )}
                  {getLanguageName(e.value)}
                </div>
              )}
            />
          </TabsContent>
          <TabsContent value="map">
            <MapComponent height="380px" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
