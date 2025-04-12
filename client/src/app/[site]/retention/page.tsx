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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Label } from "../../../components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import { Skeleton } from "../../../components/ui/skeleton";
import { RetentionChart } from "./RetentionChart";
import { ThreeDotLoader } from "../../../components/Loaders";

// Available time range options (in days)
const RANGE_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "60", label: "60 days" },
  { value: "90", label: "90 days" },
  { value: "180", label: "6 months" },
  { value: "365", label: "1 year" },
];

// Default number of periods and cohorts for skeleton
const DEFAULT_SKELETON_PERIODS = 6;
const DEFAULT_SKELETON_COHORTS = 8;

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
  // State for the data time range (days)
  const [timeRange, setTimeRange] = useState<number>(90);

  // Use the updated hook without the limit parameter
  const { data, isLoading, isError } = useGetRetention(mode, timeRange);

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
    if (mode === "day") {
      return DateTime.fromISO(dateStr).toFormat("MMM dd, yyyy");
    } else {
      // For weekly mode, show start and end dates of the week
      const startDate = DateTime.fromISO(dateStr);
      const endDate = startDate.plus({ days: 6 }); // End of week (7 days total)

      // If same month, don't repeat month name
      if (startDate.month === endDate.month) {
        return `${startDate.toFormat("MMM dd")} - ${endDate.toFormat(
          "dd, yyyy"
        )}`;
      } else if (startDate.year === endDate.year) {
        // Different months, same year
        return `${startDate.toFormat("MMM dd")} - ${endDate.toFormat(
          "MMM dd, yyyy"
        )}`;
      } else {
        // Different years
        return `${startDate.toFormat("MMM dd, yyyy")} - ${endDate.toFormat(
          "MMM dd, yyyy"
        )}`;
      }
    }
  };

  // Labels for column headers based on mode
  const getPeriodLabel = (index: number) => {
    return mode === "day" ? `Day ${index}` : `Week ${index}`;
  };

  const handleModeChange = (newMode: string) => {
    setMode(newMode as RetentionMode);
  };

  const handleRangeChange = (value: string) => {
    setTimeRange(parseInt(value));
  };

  // Common filters for both views
  const FilterControls = () => (
    <div className="flex items-center gap-4 flex-wrap justify-end">
      <div className="flex items-center gap-2">
        <Label htmlFor="time-range" className="text-sm whitespace-nowrap">
          Time Range:
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 ml-1 inline-block text-neutral-400" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="w-[200px] text-xs">
                  Amount of historical data to include in the retention
                  calculation. All available periods within this timeframe will
                  be shown.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Select
          value={timeRange.toString()}
          onValueChange={handleRangeChange}
          disabled={isLoading}
        >
          <SelectTrigger id="time-range" className="w-28" size="sm">
            <SelectValue placeholder="90 days" />
          </SelectTrigger>
          <SelectContent size="sm">
            {RANGE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Tabs value={mode} onValueChange={handleModeChange}>
        <TabsList>
          <TabsTrigger value="day" disabled={isLoading}>
            Daily
          </TabsTrigger>
          <TabsTrigger value="week" disabled={isLoading}>
            Weekly
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );

  // Render error state
  if (isError) {
    return (
      <div className="pt-4">
        <Card>
          <CardHeader>
            <CardTitle>User Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center">
              <div className="text-red-500 mb-2 font-medium">
                Error loading retention data
              </div>
              <p className="text-neutral-500 text-sm">
                There was a problem fetching the retention data. Please try
                again later.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render empty state
  if (data && (!data.cohorts || cohortKeys.length === 0)) {
    return (
      <div className="pt-4">
        <Card>
          <CardHeader>
            <CardTitle>User Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-8 text-center">
              <div className="text-neutral-300 mb-2 font-medium">
                No retention data available
              </div>
              <p className="text-neutral-500 text-sm">
                Try selecting a different time range or make sure you have
                tracking data in the system.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const periodHeaders =
    !isLoading && data
      ? Array.from({ length: data.maxPeriods + 1 }, (_, i) => getPeriodLabel(i))
      : [];

  return (
    <div className="p-4 max-w-[1300px] mx-auto space-y-3">
      {/* Single Card containing both chart and grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>User Retention</CardTitle>
          <FilterControls />
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Retention Chart */}
          {isLoading ? null : data ? (
            <RetentionChart data={data} isLoading={false} mode={mode} />
          ) : null}

          <div>
            {isLoading ? (
              <ThreeDotLoader />
            ) : data ? (
              <div className="overflow-x-auto">
                <div
                  className="inline-grid gap-px bg-neutral-900 rounded-lg shadow-lg"
                  style={{
                    gridTemplateColumns: `minmax(120px, auto) repeat(${
                      data.maxPeriods + 1
                    }, minmax(80px, auto))`,
                  }}
                >
                  {/* Header Row */}
                  <div className="p-2 text-sm font-semibold bg-neutral-900 text-neutral-100 text-center sticky left-0 z-10 border-b border-r border-neutral-700">
                    Cohort
                  </div>
                  {periodHeaders.map((header) => (
                    <div
                      key={header}
                      className="p-2 text-sm bg-neutral-900 text-neutral-100 text-center border-b border-neutral-700"
                    >
                      {header}
                    </div>
                  ))}

                  {/* Data Rows */}
                  {cohortKeys.map((cohortPeriod) => (
                    <Fragment key={cohortPeriod}>
                      {/* Cohort Info Cell */}
                      <div className="py-2 px-2 bg-neutral-900 text-sm sticky left-0 z-10 border-r border-neutral-800">
                        <div className="whitespace-nowrap text-neutral-100">
                          {formatDate(cohortPeriod)}
                        </div>
                        <div className="text-xs text-neutral-300 mt-1 whitespace-nowrap">
                          {data.cohorts[cohortPeriod].size.toLocaleString()}{" "}
                          users
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
                              className="m-[2px] text-center flex items-center justify-center font-medium transition-colors duration-150 bg-neutral-900 rounded-md"
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
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
