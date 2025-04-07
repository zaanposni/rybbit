"use client";

import { useState, useEffect } from "react";
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
import { Plus, Trash2, Search, Save } from "lucide-react";
import { Time } from "@/components/DateSelector/types";
import { DateTime } from "luxon";
import {
  useGetFunnel,
  FunnelStep,
  useSaveFunnel,
} from "@/api/analytics/useGetFunnel";
import { SavedFunnel } from "@/api/analytics/useGetFunnels";
import { Funnel } from "./Funnel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { getStartAndEndDate } from "../../../../api/utils";
import { useDebounce } from "@uidotdev/usehooks";

interface EditFunnelDialogProps {
  funnel: SavedFunnel;
  isOpen: boolean;
  onClose: () => void;
}

export function EditFunnelDialog({
  funnel,
  isOpen,
  onClose,
}: EditFunnelDialogProps) {
  // Time state - initialized from funnel configuration
  const [time, setTime] = useState<Time>({
    mode: "range",
    startDate: DateTime.now().minus({ days: 7 }).toISODate(),
    endDate: DateTime.now().toISODate(),
    wellKnown: "Last 7 days",
  });

  // Funnel steps state - initialized from funnel
  const [steps, setSteps] = useState<FunnelStep[]>(funnel.steps);

  // Debounce steps and time changes
  const debouncedSteps = useDebounce(steps, 300);
  const debouncedTime = useDebounce(time, 300);

  // Funnel name - initialized from funnel
  const [name, setName] = useState(funnel.name);

  const { startDate, endDate } = getStartAndEndDate(debouncedTime);

  // Funnel analysis query
  const {
    data,
    isError,
    error,
    isLoading: isPending,
  } = useGetFunnel({
    steps: debouncedSteps,
    startDate,
    endDate,
  });

  // Funnel save mutation
  const {
    mutate: saveFunnel,
    isPending: isSaving,
    error: saveError,
  } = useSaveFunnel();

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

  // Query funnel without saving
  const handleQueryFunnel = () => {
    // Validate steps have values
    const hasEmptySteps = steps.some((step) => !step.value);
    if (hasEmptySteps) {
      alert("All steps must have values");
      return;
    }
  };

  // Update funnel
  const handleUpdateFunnel = () => {
    // Validate name
    if (!name.trim()) {
      alert("Please enter a funnel name");
      return;
    }

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
      // Fall back to last 7 days for all-time
      startDate = DateTime.now().minus({ days: 7 }).toISODate();
      endDate = DateTime.now().toISODate();
    }

    // Update funnel with the report ID
    saveFunnel(
      {
        steps,
        startDate,
        endDate,
        name,
        reportId: funnel.id,
      },
      {
        onSuccess: () => {
          // Close dialog on successful save
          onClose();
          // Show success message
          toast?.success("Funnel updated successfully");
        },
        onError: (error) => {
          // Show error but don't close dialog
          toast?.error(`Failed to update funnel: ${error.message}`);
        },
      }
    );
  };

  // Load existing funnel data on first render
  useEffect(() => {
    // Pre-load the funnel visualization
    handleQueryFunnel();
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[80vw]">
        <DialogHeader>
          <DialogTitle>Edit Funnel</DialogTitle>
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

            {/* Funnel Steps in a boxed container */}
            <Card className="border border-neutral-200 dark:border-neutral-800">
              <CardHeader className="px-4 py-3">
                <CardTitle className="text-base">Funnel Steps</CardTitle>
              </CardHeader>
              <CardContent className="px-4 py-3 space-y-4">
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

                <Button variant="outline" onClick={addStep} className="w-full">
                  <Plus className="mr-2 h-4 w-4" /> Add Step
                </Button>
              </CardContent>
            </Card>

            {/* Query Funnel button on the left side */}
            <Button
              onClick={handleQueryFunnel}
              disabled={isPending}
              className="w-full"
              variant="accent"
            >
              <Search className="mr-2 h-4 w-4" />
              {isPending ? "Querying..." : "Query Funnel"}
            </Button>
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
                <div className="text-lg font-medium mb-2">Funnel Preview</div>
                <p className="text-sm text-neutral-500">
                  Configure your funnel steps and click "Query Funnel" to
                  preview results
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div className="text-sm text-red-500">
            {(isError || saveError) &&
              (error instanceof Error || saveError instanceof Error
                ? (error || saveError)?.message
                : "An error occurred")}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateFunnel}
              disabled={isSaving}
              variant="success"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? "Saving..." : "Update Funnel"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
