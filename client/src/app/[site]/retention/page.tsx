"use client";

import {
  useGetRetention,
  RetentionMode,
} from "../../../api/analytics/useGetRetention";
import { DateTime } from "luxon"; // Import Luxon for date formatting
import { Fragment, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "../../../components/ui/tabs";

// Dynamic color function that creates a smooth gradient based on retention percentage
const getRetentionColor = (
  percentage: number | null
): { backgroundColor: string; textColor: string } => {
  if (percentage === null || isNaN(percentage)) {
    return {
      backgroundColor: "hsl(var(--neutral-900))",
      textColor: "transparent",
    };
  }

  if (percentage === 0) {
    return {
      backgroundColor: "hsl(var(--neutral-850))",
      textColor: "var(--text-dark, #262626)",
    };
  }

  // Use a consistent blue hue
  const hue = 210; // Fixed blue hue

  // Use a consistent saturation
  const saturation = 80; // Fixed high saturation

  // Only vary the lightness based on retention percentage
  // High retention = darker (lower lightness), low retention = lighter
  // Scale from 85% (low retention) to 30% (high retention)
  const lightness = Math.max(30, Math.min(85, 85 - percentage * 0.55));

  // Determine text color (white for dark backgrounds, dark for light backgrounds)
  const textColor = lightness < 50 ? "white" : "var(--text-dark, #262626)";

  return {
    backgroundColor: `hsl(${hue}, ${saturation}%, ${lightness}%)`,
    textColor,
  };
};

export default function RetentionPage() {
  // State for the retention mode (day or week)
  const [mode, setMode] = useState<RetentionMode>("week");
  const { data, isLoading, isError } = useGetRetention(mode);

  // Get sorted cohort keys (oldest first)
  const cohortKeys = useMemo(
    () =>
      data?.cohorts
        ? Object.keys(data.cohorts).sort((a, b) => a.localeCompare(b))
        : [],
    [data?.cohorts]
  );

  // Function to format date based on mode
  const formatDate = (dateStr: string) => {
    return mode === "day"
      ? DateTime.fromISO(dateStr).toFormat("MMM dd, yyyy")
      : DateTime.fromISO(dateStr).toFormat("MMM dd, yyyy") + " (Week)";
  };

  // Labels for column headers based on mode
  const getPeriodLabel = (index: number) => {
    return mode === "day" ? `Day ${index}` : `Week ${index}`;
  };

  if (isLoading) {
    return <div className="p-4">Loading retention data...</div>;
  }

  if (isError || !data) {
    return (
      <div className="p-4 text-red-500">Error loading retention data.</div>
    );
  }

  if (!data.cohorts || cohortKeys.length === 0) {
    return <div className="p-4">No retention data available.</div>;
  }

  const periodHeaders = Array.from({ length: data.maxPeriods + 1 }, (_, i) =>
    getPeriodLabel(i)
  );

  const handleModeChange = (newMode: string) => {
    setMode(newMode as RetentionMode);
  };

  return (
    <div className="pt-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>User Retention</CardTitle>
          <Tabs
            value={mode}
            onValueChange={handleModeChange}
            className="ml-auto"
          >
            <TabsList>
              <TabsTrigger value="day">Daily</TabsTrigger>
              <TabsTrigger value="week">Weekly</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div
              className="inline-grid gap-px bg-neutral-900 border border-neutral-800 rounded-lg shadow-lg"
              style={{
                gridTemplateColumns: `minmax(120px, auto) repeat(${
                  data.maxPeriods + 1
                }, minmax(90px, auto))`,
              }}
            >
              {/* Header Row */}
              <div className="p-3 font-semibold bg-neutral-850 text-neutral-100 text-center sticky left-0 z-10 border-b border-r border-neutral-700">
                Cohort
              </div>
              {periodHeaders.map((header) => (
                <div
                  key={header}
                  className="p-3 font-semibold bg-neutral-850 text-neutral-100 text-center border-b border-neutral-700"
                >
                  {header}
                </div>
              ))}

              {/* Data Rows */}
              {cohortKeys.map((cohortPeriod) => (
                <Fragment key={cohortPeriod}>
                  {/* Cohort Info Cell */}
                  <div className="p-3 bg-neutral-850  text-sm sticky left-0 z-10 border-r border-neutral-700">
                    <div className="font-medium whitespace-nowrap">
                      {formatDate(cohortPeriod)}
                    </div>
                    <div className="text-xs text-neutral-300 mt-1 whitespace-nowrap">
                      {data.cohorts[cohortPeriod].size.toLocaleString()} users
                    </div>
                  </div>
                  {/* Retention Cells */}
                  {data.cohorts[cohortPeriod].percentages.map(
                    (percentage: number | null, index: number) => {
                      const { backgroundColor, textColor } =
                        getRetentionColor(percentage);
                      return (
                        <div
                          key={`${cohortPeriod}-period-${index}`}
                          className="m-[2px] p-3 text-center flex items-center justify-center font-medium transition-colors duration-150 bg-neutral-850 rounded-md"
                          style={{
                            backgroundColor,
                            color: textColor,
                          }}
                        >
                          {percentage !== null
                            ? `${percentage.toFixed(1)}%`
                            : "-"}
                        </div>
                      );
                    }
                  )}
                </Fragment>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
