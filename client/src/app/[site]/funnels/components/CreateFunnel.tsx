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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";

export function CreateFunnelDialog() {
  const [open, setOpen] = useState(false);
  const { site } = useStore();

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

  // Funnel name
  const [name, setName] = useState("New Funnel");

  // Funnel analysis mutation
  const {
    mutate: analyzeFunnel,
    data,
    isError,
    error,
    isPending,
    reset,
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

    // Get dates based on time selection
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
      name,
    });
  };

  // Reset form when dialog closes
  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex gap-2">
          <Plus className="w-4 h-4" /> Create Funnel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[80vw]">
        <DialogHeader>
          <DialogTitle>Create Funnel</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-[600px_3fr] gap-6 my-4">
          {/* Left side: Funnel configuration form */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">
                Funnel Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter funnel name"
              />
            </div>

            <div className="mt-4">
              <label className="text-sm font-medium mb-1 block">
                Funnel Steps
              </label>
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col space-y-2 mb-4">
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

              <Button variant="outline" onClick={addStep} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Step
              </Button>
            </div>
          </div>

          {/* Right side: Funnel visualization (if data exists) */}
          {data?.data && data.data.length > 0 ? (
            <Funnel
              data={data}
              isError={isError}
              error={error}
              isPending={isPending}
              time={time}
              setTime={setTime}
            />
          ) : (
            <div className="flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 rounded-lg h-full">
              <div className="text-center p-6">
                <div className="text-lg font-medium mb-2">Preview</div>
                <p className="text-sm text-neutral-500">
                  Configure your funnel steps and analyze to preview the funnel
                  visualization
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="text-sm text-red-500">
            {isError &&
              (error instanceof Error ? error.message : "An error occurred")}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Analyzing..." : "Analyze Funnel"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
