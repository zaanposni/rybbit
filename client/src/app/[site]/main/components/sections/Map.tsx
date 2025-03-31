"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardLoader,
  CardTitle,
} from "@/components/ui/card";
import * as CountryFlags from "country-flag-icons/react/3x2";
import { scaleLinear } from "d3-scale";
import React, { useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, useMapEvent } from "react-leaflet";
import { Layer } from "leaflet";
import { Feature, GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";
import { useSingleCol } from "@/api/analytics/useSingleCol";
import { addFilter, FilterParameter } from "../../../../../lib/store";
import { useCountries, useSubdivisions } from "../../../../../lib/geo";

interface TooltipContent {
  name: string;
  code: string;
  count: number;
  percentage: number;
}

interface TooltipPosition {
  x: number;
  y: number;
}

export function Map() {
  const { data: countryData, isLoading: isCountryLoading } = useSingleCol({
    parameter: "country",
  });
  const { data: subdivisionData, isLoading: isSubdivisionLoading } =
    useSingleCol({
      parameter: "iso_3166_2",
    });

  const [dataVersion, setDataVersion] = useState<number>(0);

  useEffect(() => {
    if (countryData || subdivisionData) {
      setDataVersion((prev) => prev + 1);
    }
  }, [countryData, subdivisionData]);

  const [tooltipContent, setTooltipContent] = useState<TooltipContent | null>(
    null
  );
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    x: 0,
    y: 0,
  });
  const [mapView, setMapView] = useState<"countries" | "subdivisions">(
    "countries"
  );

  const colorScale = useMemo(() => {
    if (mapView === "countries" && !countryData?.data) return () => "#eee";
    if (mapView === "subdivisions" && !subdivisionData?.data)
      return () => "#eee";

    const dataToUse =
      mapView === "countries" ? countryData?.data : subdivisionData?.data;

    // Get computed values from CSS variables
    const getComputedColor = (cssVar: string) => {
      // Get the HSL values from CSS
      const hslValues = getComputedStyle(document.documentElement)
        .getPropertyValue(cssVar)
        .trim();
      return `hsl(${hslValues})`;
    };

    const startColor = getComputedColor("--accent-200");
    const endColor = getComputedColor("--accent-500");

    const maxValue = Math.max(...(dataToUse?.map((d) => d.count) || [0]));
    return scaleLinear<string>()
      .domain([0, maxValue])
      .range([startColor, endColor]);
  }, [countryData?.data, subdivisionData?.data, mapView]);

  const { data: subdivisionsGeoData } = useSubdivisions();
  const { data: countriesGeoData } = useCountries();

  const handleStyle = (feature: Feature | undefined) => {
    const borderColors = [
      "#377eb8",
      "#ff7f00",
      "#4daf4a",
      "#1abc9c",
      "#984ea3",
    ];
    const isCountryView = mapView === "countries";
    const dataKey = isCountryView
      ? feature?.properties?.["ISO_A2"]
      : feature?.properties?.["iso_3166_2"];
    const borderKey = isCountryView
      ? feature?.properties?.["BORDER"]
      : feature?.properties?.["border"];
    const foundData = isCountryView
      ? countryData?.data?.find(({ value }: any) => value === dataKey)
      : subdivisionData?.data.find(({ value }: any) => value === dataKey);
    const count = foundData?.count || 0;
    const color = count > 0 ? colorScale(count) : "rgba(140, 140, 140, 0.5)";
    return {
      color: isCountryView ? color : borderColors[borderKey],
      weight: 0.5,
      fill: true,
      fillColor: color,
    };
  };

  const handleEachFeature = (feature: Feature, layer: Layer) => {
    layer.on({
      mouseover: () => {
        // @ts-ignore
        layer.setStyle({
          fillOpacity: 0.5,
        });
        const isCountryView = mapView === "countries";
        const name = isCountryView
          ? feature.properties?.["ADMIN"]
          : feature.properties?.["name"];
        const code = isCountryView
          ? feature.properties?.["ISO_A2"]
          : feature.properties?.["iso_3166_2"];
        const foundData = isCountryView
          ? countryData?.data?.find(({ value }: any) => value === code)
          : subdivisionData?.data.find(({ value }: any) => value === code);
        const count = foundData?.count || 0;
        const percentage = foundData?.percentage || 0;
        setTooltipContent({ name, code, count, percentage });
      },
      mouseout: () => {
        // @ts-ignore
        layer.setStyle({
          fillOpacity: 0.2,
        });
        setTooltipContent(null);
      },
      click: () => {
        const isCountryView = mapView === "countries";
        const code = isCountryView
          ? feature.properties?.["ISO_A2"]
          : feature.properties?.["iso_3166_2"];

        // Set filter based on the current map view
        const filterParameter: FilterParameter = isCountryView
          ? "country"
          : "iso_3166_2";

        addFilter({
          parameter: filterParameter,
          value: [code],
          type: "equals",
        });
      },
    });
  };

  const MapEventHandler = () => {
    const map = useMapEvent("zoomend", () => {
      const newMapView = map.getZoom() >= 5 ? "subdivisions" : "countries";
      if (newMapView !== mapView) {
        setMapView(newMapView);
        setTooltipContent(null);
      }
    });
    return null;
  };

  const isLoading = isCountryLoading || isSubdivisionLoading;

  return (
    <Card>
      {isLoading && <CardLoader />}
      <CardHeader>
        <CardTitle>Map</CardTitle>
      </CardHeader>
      <CardContent
        onMouseMove={(e) => {
          if (tooltipContent) {
            setTooltipPosition({
              x: e.clientX,
              y: e.clientY,
            });
          }
        }}
      >
        {(countriesGeoData || subdivisionsGeoData) && (
          <MapContainer
            preferCanvas={true}
            attributionControl={false}
            zoomControl={false}
            center={[40, 3]}
            zoom={1}
            style={{
              height: "400px",
              background: "none",
              cursor: "default",
              outline: "none",
              zIndex: "1",
            }}
          >
            <MapEventHandler />
            {mapView === "subdivisions" && subdivisionsGeoData && (
              <GeoJSON
                key={`subdivisions-${dataVersion}`}
                data={subdivisionsGeoData as GeoJsonObject}
                style={handleStyle}
                onEachFeature={handleEachFeature}
              />
            )}
            {mapView === "countries" && countriesGeoData && (
              <GeoJSON
                key={`countries-${dataVersion}`}
                data={countriesGeoData as GeoJsonObject}
                style={handleStyle}
                onEachFeature={handleEachFeature}
              />
            )}
          </MapContainer>
        )}
        {tooltipContent && (
          <div
            className="fixed z-50 bg-neutral-1000 text-white rounded-md p-2 shadow-lg text-sm pointer-events-none"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y - 10,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="font-sm flex items-center gap-1">
              {mapView === "countries" &&
              tooltipContent.code &&
              CountryFlags[tooltipContent.code as keyof typeof CountryFlags]
                ? React.createElement(
                    CountryFlags[
                      tooltipContent.code as keyof typeof CountryFlags
                    ],
                    {
                      title: tooltipContent.name,
                      className: "w-4",
                    }
                  )
                : null}
              {tooltipContent.name}
            </div>
            <div>
              <span className="font-bold text-accent-400">
                {tooltipContent.count.toLocaleString()}
              </span>{" "}
              <span className="text-neutral-300">
                ({tooltipContent.percentage.toFixed(1)}%) sessions
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
