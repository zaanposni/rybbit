"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardLoader,
  CardTitle,
} from "@/components/ui/card";
import { countries } from "countries-list";
import * as CountryFlags from "country-flag-icons/react/3x2";
import { scaleLinear } from "d3-scale";
import { useMemo, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Sphere,
  ZoomableGroup,
} from "react-simple-maps";

import { useSingleCol } from "@/hooks/api";
import React from "react";

const countriesGeoUrl = "/countries.geojson";
const subdivisionsGeoUrl = "/subdivisions.geojson";

interface TooltipData {
  name: string;
  count: number;
  percentage: number;
  x: number;
  y: number;
}

interface MapView {
  view: "countries" | "subdivisions";
  coordinates: [number, number];
  zoom: number;
  selectedCountryName?: string;
  selectedCountryCode?: string;
}

export function Map() {
  const { data: countryData, isLoading: isCountryLoading } = useSingleCol({
    parameter: "country"
  });
  const { data: subdivisionData, isLoading: isSubdivisionLoading } = useSingleCol({
    parameter: "iso_3166_2"
  });

  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [mapView, setMapView] = useState<MapView>({
    view: "countries",
    coordinates: [0, 0],
    zoom: 1,
    selectedCountryName: undefined,
    selectedCountryCode: undefined,
  });

  const activeGeoUrl = mapView.view === "countries" ? countriesGeoUrl : subdivisionsGeoUrl;

  const filteredSubdivisionData = useMemo(() => {
    if (!subdivisionData?.data || !mapView.selectedCountryCode) return [];

    return subdivisionData.data.filter(item => {
      return item.value.startsWith(`${mapView.selectedCountryCode}-`);
    });
  }, [subdivisionData?.data, mapView.selectedCountryCode]);

  const colorScale = useMemo(() => {
    if (mapView.view === "countries" && !countryData?.data) return () => "#eee";
    if (mapView.view === "subdivisions" && !filteredSubdivisionData) return () => "#eee";

    const dataToUse = mapView.view === "countries"
        ? countryData?.data
        : filteredSubdivisionData;

    const maxValue = Math.max(...(dataToUse?.map((d) => d.count) || [0]));
    return scaleLinear<string>()
        .domain([0, maxValue])
        .range(["rgba(232, 121, 249, 0.3)", "rgb(232, 121, 249)"]);
  }, [countryData?.data, filteredSubdivisionData, mapView.view]);

  const handleCountryClick = (countryName: string, countryCode: string, longitude: number, latitude: number) => {
    setMapView({
      view: "subdivisions",
      coordinates: [longitude, latitude],
      zoom: 4,
      selectedCountryName: countryName,
      selectedCountryCode: countryCode,
    });
  };

  const handleBackToCountries = () => {
    setMapView({
      view: "countries",
      coordinates: [0, 0],
      zoom: 1,
      selectedCountryName: undefined,
      selectedCountryCode: undefined,
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (tooltipData) {
      setTooltipPosition({
        x: event.clientX,
        y: event.clientY
      });
    }
  };

  const isLoading = isCountryLoading || isSubdivisionLoading;

  return (
      <Card>
        {isLoading && <CardLoader />}
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {mapView.view === "subdivisions"
                ? `${mapView.selectedCountryName || mapView.selectedCountryCode} Regions`
                : "Map"}
          </CardTitle>
          {mapView.view === "subdivisions" && <Button onClick={handleBackToCountries}>Back to World View</Button>}
        </CardHeader>
        <CardContent onMouseMove={handleMouseMove}>
          {(mapView.view === "countries" ? countryData?.data : filteredSubdivisionData) ? (
            <>
              <ComposableMap
                projection="geoMercator"
                projectionConfig={{
                  rotate: [-10, 0, 0],
                  scale: mapView.view === "countries" ? 120 : 240,
                }}
              >
                <Sphere stroke="hsl(var(--neutral-800))" strokeWidth={0.5} />
                <ZoomableGroup
                  zoom={mapView.zoom}
                  center={mapView.coordinates}
                >
                  <Geographies key={activeGeoUrl} geography={activeGeoUrl}>
                    {({ geographies }) =>
                      geographies.map((geo, index) => {
                        const isCountryView = mapView.view === "countries";

                        // For subdivision view, filter to only show subdivisions of the selected country
                        if (!isCountryView && mapView.selectedCountryCode) {
                          const subdivisionCode = geo.properties?.["iso_3166_2"];
                          if (!subdivisionCode || !subdivisionCode.startsWith(`${mapView.selectedCountryCode}-`)) {
                            return null;
                          }
                        }

                        const dataKey = isCountryView ? geo.properties?.["ISO_A2"] : geo.properties?.["iso_3166_2"];

                        const foundData = isCountryView
                          ? countryData?.data?.find(({ value }) => value === dataKey)
                          : filteredSubdivisionData.find(({ value }) => value === dataKey);

                        const count = foundData?.count || 0;
                        const percentage = foundData?.percentage || 0;

                        return (
                          <Geography
                            key={`${geo.properties?.["ISO_A2"] || ""}-${geo.properties?.["iso_3166_2"] || ""}-${index}`}
                            geography={geo}
                            fill={count > 0 ? colorScale(count) : "rgba(140, 140, 140, 0.5)"}
                            stroke="hsl(var(--neutral-800))"
                            strokeWidth={0.5}
                            style={{
                              default: {
                                outline: "none",
                              },
                              hover: {
                                outline: "none",
                                cursor: isCountryView ? "pointer" : "default",
                              },
                              pressed: {
                                outline: "none",
                              },
                            }}
                            onClick={() => {
                              if (isCountryView) {
                                handleCountryClick(
                                  geo.properties?.["ADMIN"],
                                  geo.properties?.["ISO_A2"],
                                  geo.properties?.["LABEL_X"],
                                  geo.properties?.["LABEL_Y"]
                                );
                              }
                            }}
                            onMouseEnter={(evt: React.MouseEvent) => {
                              const name = isCountryView
                                ? geo.properties?.["ADMIN"]
                                : geo.properties?.["name"];

                              setTooltipData({
                                name,
                                count,
                                percentage,
                                x: evt.clientX,
                                y: evt.clientY,
                              });
                              setShowTooltip(true);
                            }}
                            onMouseLeave={() => {
                              setShowTooltip(false);
                              setTooltipData(null);
                            }}
                          />
                        );
                      }).filter(Boolean)
                    }
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>
              {tooltipData && showTooltip && (
                <div
                  className="fixed z-50 bg-neutral-800 text-white rounded-md p-2 shadow-lg text-sm pointer-events-none"
                  style={{
                    left: tooltipPosition.x + 10,
                    top: tooltipPosition.y - 10,
                    transform: "translateY(-100%)"
                  }}
                >
                  <div className="font-sm flex items-center gap-1">
                    {mapView.view === "countries" &&
                    tooltipData.name &&
                    CountryFlags[tooltipData.name as keyof typeof CountryFlags]
                        ? React.createElement(
                            CountryFlags[
                                tooltipData.name as keyof typeof CountryFlags
                                ],
                            {
                              title:
                              countries[
                                  tooltipData.name as keyof typeof countries
                                  ]?.name,
                              className: "w-4",
                            }
                        )
                        : null}
                    {tooltipData.name}
                  </div>
                  <div>
                    <span className="font-bold text-fuchsia-400">
                      {tooltipData.count.toLocaleString()}
                    </span>{" "}
                    <span className="text-neutral-300">
                      ({tooltipData.percentage.toFixed(1)}%) pageviews
                    </span>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>
  );
}