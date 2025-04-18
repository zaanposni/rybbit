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
import { getCountryName } from "../../../../../lib/utils";
import { StandardSection } from "../../../components/shared/StandardSection/StandardSection";
import { CountryFlag } from "../../../components/shared/icons/CountryFlag";
import { useSubdivisions } from "../../../../../lib/geo";
import { StandardSectionRealtime } from "../../../components/shared/StandardSection/StandardSectionRealtime";
import { MapComponent } from "./Map";

type Tab = "countries" | "regions" | "languages" | "cities" | "map";

const regionNamesInEnglish = new Intl.DisplayNames(["en"], { type: "region" });
const languageNamesInEnglish = new Intl.DisplayNames(["en"], {
  type: "language",
});

const getLanguageName = (languageCode: string) => {
  try {
    // Handle codes like "en-US" that have both language and region
    if (languageCode.includes("-")) {
      const [language, region] = languageCode.split("-");
      const languageName = languageNamesInEnglish.of(language);
      const regionName = regionNamesInEnglish.of(region);
      return `${languageName} (${regionName})`;
    }
    // Just a language code
    return languageNamesInEnglish.of(languageCode);
  } catch (error) {
    return languageCode;
  }
};

// Helper to extract country code from language code
const getCountryFromLanguage = (languageCode: string): string | null => {
  if (languageCode.includes("-")) {
    const [_, region] = languageCode.split("-");
    return region;
  }
  return null;
};

export function Countries({ isRealtime = false }: { isRealtime?: boolean }) {
  const [tab, setTab] = useState<Tab>("countries");

  const { data: subdivisions } = useSubdivisions();

  const ComponentToUse = isRealtime ? StandardSectionRealtime : StandardSection;

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
            <ComponentToUse
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
            <ComponentToUse
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
            <ComponentToUse
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
            <ComponentToUse
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
            <MapComponent />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
