"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { Time } from "@/components/DateSelector/types";
import { DateTime } from "luxon";
import { useGetFunnel, FunnelStep } from "@/api/analytics/useGetFunnel";
import { Funnel } from "./Funnel";

export function CreateFunnel() {
  // Initial date state - last 30 days
  const [time, setTime] = useState<Time>({
    mode: "range",
    startDate: DateTime.now().minus({ days: 30 }).toISODate(),
    endDate: DateTime.now().toISODate(),
    wellKnown: "Last 30 days",
  });

  // Funnel steps state
  const [steps, setSteps] = useState<FunnelStep[]>([
    { type: "page", value: "/", name: "Homepage" },
    { type: "page", value: "", name: "" },
  ]);

  // Funnel analysis mutation
  const {
    mutate: analyzeFunnel,
    data,
    isError,
    error,
    isPending,
  } = useGetFunnel();

  // Handle adding a new step
  const addStep = () => {
    setSteps([...steps, { type: "page", value: "", name: "" }]);
  };

  // Handle removing a step
  const removeStep = (index: number) => {
    if (steps.length <= 2) return; // Maintain at least 2 steps
    const newSteps = [...steps];
    newSteps.splice(index, 1);
    setSteps(newSteps);
  };

  // Handle step input changes
  const updateStep = (
    index: number,
    field: keyof FunnelStep,
    value: string
  ) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  // Handle step type changes
  const updateStepType = (index: number, type: "page" | "event") => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], type };
    setSteps(newSteps);
  };

  // Handle form submission
  const handleSubmit = () => {
    // Validate steps have values
    const hasEmptySteps = steps.some((step) => !step.value);
    if (hasEmptySteps) {
      alert("All steps must have values");
      return;
    }

    // Get timezone and dates
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    let startDate = "",
      endDate = "";

    if (time.mode === "range") {
      startDate = time.startDate;
      endDate = time.endDate;
    } else if (time.mode === "day") {
      startDate = time.day;
      endDate = time.day;
    } else if (time.mode === "week") {
      startDate = time.week;
      const endDateValue = DateTime.fromISO(time.week)
        .plus({ days: 6 })
        .toISODate();
      endDate = endDateValue || DateTime.now().toISODate();
    } else if (time.mode === "month") {
      startDate = time.month;
      const endDateValue = DateTime.fromISO(time.month)
        .endOf("month")
        .toISODate();
      endDate = endDateValue || DateTime.now().toISODate();
    } else if (time.mode === "year") {
      startDate = time.year;
      const endDateValue = DateTime.fromISO(time.year)
        .endOf("year")
        .toISODate();
      endDate = endDateValue || DateTime.now().toISODate();
    } else {
      // Fall back to last 30 days for all-time
      startDate = DateTime.now().minus({ days: 30 }).toISODate();
      endDate = DateTime.now().toISODate();
    }

    // Create funnel analysis
    analyzeFunnel({
      steps,
      startDate,
      endDate,
      timezone,
    });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Left side: Funnel configuration form */}
      <Card>
        <CardHeader>
          <CardTitle>Create Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-800 flex items-center justify-center text-xs">
                    {index + 1}
                  </div>
                  <Select
                    value={step.type}
                    onValueChange={(value) =>
                      updateStepType(index, value as "page" | "event")
                    }
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="page">Page Path</SelectItem>
                      <SelectItem value="event">Event</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex-grow flex gap-2">
                    <Input
                      placeholder={
                        step.type === "page"
                          ? "Path (e.g. /pricing)"
                          : "Event name"
                      }
                      value={step.value}
                      onChange={(e) =>
                        updateStep(index, "value", e.target.value)
                      }
                    />
                    <Input
                      placeholder="Label (optional)"
                      value={step.name || ""}
                      onChange={(e) =>
                        updateStep(index, "name", e.target.value)
                      }
                    />
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeStep(index)}
                    disabled={steps.length <= 2}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={addStep} className="w-full mt-2">
              <Plus className="mr-2 h-4 w-4" /> Add Step
            </Button>

            <Button
              onClick={handleSubmit}
              className="w-full mt-4"
              disabled={isPending}
            >
              {isPending ? "Analyzing..." : "Analyze Funnel"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Right side: Funnel visualization */}
      <Funnel
        data={data}
        isError={isError}
        error={error}
        isPending={isPending}
        time={time}
        setTime={setTime}
      />
    </div>
  );
}
