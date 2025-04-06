"use client";

import { DateSelector } from "@/components/DateSelector/DateSelector";
import { Time } from "@/components/DateSelector/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FunnelResponse } from "@/api/analytics/useGetFunnel";
import { ArrowRight, Clock } from "lucide-react";

export type FunnelChartData = {
  stepName: string;
  visitors: number;
  conversionRate: number;
  dropoffRate: number;
  stepNumber: number;
};

interface FunnelProps {
  data?: { data: FunnelResponse[] };
  isError: boolean;
  error: unknown;
  isPending: boolean;
  time: Time;
  setTime: (time: Time) => void;
}

export function Funnel({
  data,
  isError,
  error,
  isPending,
  time,
  setTime,
}: FunnelProps) {
  // Prepare chart data
  const chartData =
    data?.data.map((step) => ({
      stepName: step.step_name,
      visitors: step.visitors,
      conversionRate: step.conversion_rate,
      dropoffRate: step.dropoff_rate,
      stepNumber: step.step_number,
    })) || [];

  // Get first and last data points for total conversion metrics
  const firstStep = chartData[0];
  const lastStep = chartData[chartData.length - 1];
  const totalConversionRate = lastStep?.conversionRate || 0;

  const maxBarHeight = 333;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Funnel Analysis</CardTitle>
        <div className="flex items-center gap-2">
          <DateSelector time={time} setTime={setTime} />
        </div>
      </CardHeader>
      <CardContent>
        {isError ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-red-500">
              Error:{" "}
              {error instanceof Error
                ? error.message
                : "Failed to analyze funnel"}
            </div>
          </div>
        ) : data?.data && chartData.length > 0 ? (
          <div className="space-y-4">
            {/* Chart grid and background */}
            <div className="relative h-[350px]">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                {[100, 80, 60, 40, 20, 0].map((value) => (
                  <div
                    key={value}
                    className="w-full border-b border-neutral-200 dark:border-neutral-800 flex items-center"
                  >
                    <span className="text-xs text-neutral-500 pr-2">
                      {value}%
                    </span>
                  </div>
                ))}
              </div>

              {/* Bars container */}
              <div className="absolute inset-0 pt-6 flex items-end ml-8">
                {chartData.map((step, index) => {
                  // Calculate pixel height of the bar based on proportion of visitors
                  const ratio = firstStep?.visitors
                    ? step.visitors / firstStep.visitors
                    : 0;
                  const barHeight = Math.max(ratio * maxBarHeight, 0);

                  return (
                    <div
                      key={step.stepNumber}
                      className="flex-1 flex flex-col items-center px-2"
                    >
                      <div
                        className="w-full bg-accent-400/70 rounded-lg"
                        style={{ height: `${barHeight}px` }}
                      ></div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step details */}
            <div className="grid grid-cols-3 gap-0 ml-8">
              {chartData.map((step, index) => {
                // For step 2+, calculate the number of users who dropped off
                const prevStep = index > 0 ? chartData[index - 1] : null;
                const droppedUsers = prevStep
                  ? prevStep.visitors - step.visitors
                  : 0;
                const dropoffPercent = prevStep
                  ? (droppedUsers / prevStep.visitors) * 100
                  : 0;

                return (
                  <div
                    key={step.stepNumber}
                    className="bg-neutral-50 dark:bg-neutral-900 rounded-md p-1 relative pl-3 border-l border-l-neutral-800 first:border-l-0"
                  >
                    <div className="font-medium flex items-center gap-2">
                      {step.stepName}
                    </div>

                    {/* Entering users */}
                    <div className="mt-3">
                      <div className="flex items-center text-green-600 dark:text-green-500">
                        <ArrowRight className="w-4 h-4 mr-2" />
                        <div>
                          <span className="font-medium">
                            {step.visitors.toLocaleString()}
                          </span>{" "}
                          <span className="text-neutral-500 text-sm">
                            {index === 0
                              ? ` (100%)`
                              : ` (${step.conversionRate.toFixed(2)}%)`}
                          </span>
                        </div>
                      </div>

                      {/* Dropped off users - only for steps after the first */}
                      {index > 0 && (
                        <div className="flex items-center text-orange-500 mt-1">
                          <div className="w-4 h-4 mr-2 flex items-center justify-center">
                            ↘
                          </div>
                          <div>
                            <span className="font-medium">
                              {droppedUsers.toLocaleString()}
                            </span>{" "}
                            <span className="text-neutral-500 text-sm">
                              ({dropoffPercent.toFixed(2)}%)
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-neutral-400 text-sm">
              {isPending
                ? "Analyzing funnel..."
                : "Configure your funnel steps and click 'Analyze Funnel'"}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
