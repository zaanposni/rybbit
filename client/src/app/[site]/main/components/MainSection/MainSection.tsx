"use client";
import { Card, CardContent, CardLoader } from "@/components/ui/card";
import { useGetOverview, useGetOverviewBucketed } from "@/hooks/api";
import { BucketSelection } from "./BucketSelection";
import { Chart } from "./Chart";
import { Overview } from "./Overview";
import { PreviousChart } from "./PreviousChart";
import { useStore } from "../../../../../lib/store";

export function MainSection() {
  const { selectedStat, time, site } = useStore();

  const { data, isFetching, error } = useGetOverviewBucketed({ site });
  const {
    data: previousData,
    isFetching: isPreviousFetching,
    error: previousError,
  } = useGetOverviewBucketed({ periodTime: "previous", site });
  const { isFetching: isOverviewFetching } = useGetOverview();
  const { isFetching: isOverviewFetchingPrevious } = useGetOverview("previous");

  const maxOfDataAndPreviousData = Math.max(
    Math.max(...(data?.data?.map((d) => d[selectedStat]) ?? [])),
    Math.max(...(previousData?.data?.map((d) => d[selectedStat]) ?? []))
  );

  return (
    <Card>
      {(isFetching ||
        isPreviousFetching ||
        isOverviewFetching ||
        isOverviewFetchingPrevious) && <CardLoader />}
      <CardContent className="pt-4 w-full">
        <div className="flex justify-between items-center">
          <Overview />
          <BucketSelection />
        </div>
        <div className="h-[350px] relative">
          <div className="absolute top-0 left-0 w-full h-full">
            <PreviousChart data={previousData} max={maxOfDataAndPreviousData} />
          </div>
          <div className="absolute top-0 left-0 w-full h-full">
            <Chart
              data={data}
              max={maxOfDataAndPreviousData}
              previousData={time.mode === "all-time" ? undefined : previousData}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
