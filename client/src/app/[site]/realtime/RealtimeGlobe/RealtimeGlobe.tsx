"use client";

import { useQuery } from "@tanstack/react-query";
import { useWindowSize } from "@uidotdev/usehooks";
import { scaleSequentialSqrt } from "d3-scale";
import { interpolateYlOrRd } from "d3-scale-chromatic";
import { memoize } from "lodash";
import { useEffect, useMemo, useRef } from "react";
import Globe from "react-globe.gl";
import { MeshPhongMaterial } from "three";
import { useGetLiveSessionLocations } from "../../../../api/analytics/useGetLiveSessionLocations";
import { useAtom } from "jotai";
import { minutesAtom } from "../realtimeStore";

const randomShader = memoize((e: string) => {
  return `rgba(100, 100, 100, ${Math.random() / 2 + 0.5})`;
});

export const World = ({ width }: { width: number }) => {
  const globeEl = useRef<any>(null);
  const size = useWindowSize();

  const [minutes] = useAtom(minutesAtom);

  const {
    data: liveSessionLocations,
    isLoading: isLiveSessionLocationsLoading,
  } = useGetLiveSessionLocations(Number(minutes));

  const { data: countries = { features: [] } } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const res = await fetch("/countries.geojson");
      return res.json();
    },
  });

  const highest =
    liveSessionLocations?.reduce((acc, curr) => Math.max(acc, curr.count), 0) ??
    1;

  const normalized = 5 / Number(minutes);
  const weightColor = scaleSequentialSqrt(interpolateYlOrRd).domain([
    0,
    highest * normalized * 15,
  ]);

  useEffect(() => {
    // Auto-rotate
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.2;
    }
  }, [globeEl.current]);

  const oceanBlueMaterial = useMemo(
    () =>
      new MeshPhongMaterial({
        color: "hsl(220.9, 30.3%, 16%)",
        transparent: false,
        opacity: 1,
      }),
    []
  );

  const liveSessionLocationsData = useMemo(() => {
    return liveSessionLocations?.map((e) => ({
      lat: e.lat,
      lng: e.lon,
      count: Math.max(1, e.count / highest),
    }));
  }, [liveSessionLocations]);

  return (
    <div
      onMouseDown={() => {
        if (globeEl.current) {
          globeEl.current.controls().autoRotate = false;
        }
      }}
    >
      <Globe
        onGlobeReady={() => {
          if (globeEl.current) {
            // Set initial view: lat, lng, and altitude (zoom)
            globeEl.current.pointOfView({ lat: 20, lng: -36, altitude: 2 });
          }
        }}
        ref={globeEl as any}
        width={width ?? 0}
        height={(size.height ?? 0) - 50}
        globeOffset={[-100, 0]}
        atmosphereColor="rgba(170, 170, 200, 1)"
        globeMaterial={oceanBlueMaterial}
        hexPolygonsData={countries.features}
        hexPolygonResolution={3}
        hexPolygonMargin={0.2}
        hexBinResolution={3}
        hexBinPointsData={liveSessionLocationsData}
        hexBinMerge={true}
        hexBinPointWeight={"count"}
        backgroundColor="rgba(0, 0, 0, 0)"
        hexPolygonColor={(e: any) => {
          return randomShader(e.properties.ISO_A2);
        }}
        hexTopColor={(d) => weightColor(d.sumWeight)}
        hexSideColor={(d) => weightColor(d.sumWeight)}
        // @ts-ignore
        // hexPolygonLabel={(props: any) => {
        //   console.info(props);
        //   return <div>{props.properties.ADMIN}</div>;
        //   // <div className="text-neutral-100 bg-neutral-900 border border-neutral-700 rounded-md p-2 ">
        //   //   <div>
        //   //     <b>
        //   //       {d.ADMIN} ({d.ISO_A2})
        //   //     </b>
        //   //   </div>
        //   //   <div>
        //   //     Population: <i>{d.POP_EST}</i>
        //   //   </div>
        //   // </div>
        // }}
      />
    </div>
  );
};
