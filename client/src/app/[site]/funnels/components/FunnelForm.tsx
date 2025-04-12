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
import { Plus, Trash2, Search, Save, ListFilterPlus } from "lucide-react";
import { Time } from "@/components/DateSelector/types";
import { DateTime } from "luxon";
import { FunnelStep, useGetFunnel } from "@/api/analytics/useGetFunnel";
import { Funnel } from "./Funnel";
import { useDebounce } from "@uidotdev/usehooks";
import { getStartAndEndDate } from "../../../../api/utils";
import { ReactNode } from "react";
import { Filter } from "../../../../lib/store";
import { FilterComponent } from "../../components/shared/Filters/FilterComponent";

interface FunnelFormProps {
  name: string;
  setName: (name: string) => void;
  steps: FunnelStep[];
  setSteps: (steps: FunnelStep[]) => void;
  time: Time;
  setTime: (time: Time) => void;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  onSave: () => void;
  onCancel: () => void;
  onQuery: () => void;
  saveButtonText: string;
  isSaving: boolean;
  isError: boolean;
  isPending: boolean;
  error: unknown;
  saveError: unknown;
  funnelData: any;
}

export function FunnelForm({
  name,
  setName,
  steps,
  setSteps,
  time,
  setTime,
  filters,
  setFilters,
  onSave,
  onCancel,
  onQuery,
  saveButtonText,
  isSaving,
  isError,
  isPending,
  error,
  saveError,
  funnelData,
}: FunnelFormProps) {
  // Debounce steps and time changes
  const debouncedSteps = useDebounce(steps, 300);
  const debouncedTime = useDebounce(time, 300);
  const [showFilters, setShowFilters] = useState(filters.length > 0);

  const { startDate, endDate } = getStartAndEndDate(debouncedTime);

  // Get error message as string
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    return "An error occurred";
  };

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

  // Handle filter operations
  const updateFilter = (filter: Filter | null, index: number) => {
    if (filter === null) {
      const newFilters = [...filters];
      newFilters.splice(index, 1);
      setFilters(newFilters);
      return;
    }
    const newFilters = [...filters];
    newFilters[index] = filter;
    setFilters(newFilters);
  };

  const addFilter = () => {
    setFilters([
      ...filters,
      {
        parameter: "pathname",
        type: "equals",
        value: [],
      },
    ]);
    setShowFilters(true);
  };

  return (
    <>
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

          {/* Filters Section */}
          <Card className="border border-neutral-200 dark:border-neutral-800">
            <CardHeader className="px-4 py-3 flex flex-row justify-between items-center">
              <CardTitle className="text-base">Funnel Filters</CardTitle>
              {!showFilters && (
                <Button variant="outline" size="sm" onClick={addFilter}>
                  <ListFilterPlus className="mr-2 h-4 w-4" />
                  Add Filters
                </Button>
              )}
            </CardHeader>
            {showFilters && (
              <CardContent className="px-4 py-3 space-y-4">
                <div className="flex flex-col gap-2">
                  {filters.map((filter, index) => (
                    <FilterComponent
                      key={index}
                      filter={filter}
                      index={index}
                      updateFilter={updateFilter}
                    />
                  ))}
                </div>
                <div className="flex justify-between">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={addFilter}
                    className="gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Add Filter
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Query Funnel button on the left side */}
          <Button
            onClick={onQuery}
            disabled={isPending}
            className="w-full"
            variant="accent"
          >
            <Search className="mr-2 h-4 w-4" />
            {isPending ? "Querying..." : "Query Funnel"}
          </Button>
        </div>

        {/* Right side: Funnel visualization (if data exists) */}
        {funnelData?.data && funnelData.data.length > 0 ? (
          <Funnel
            data={funnelData}
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
                Configure your funnel steps and click "Query Funnel" to preview
                results
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-red-500">
          {(() => {
            if (isError) {
              return error instanceof Error
                ? error.message
                : "An error occurred";
            } else if (saveError) {
              return saveError instanceof Error
                ? saveError.message
                : "An error occurred while saving";
            }
            return null;
          })()}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving} variant="success">
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : saveButtonText}
          </Button>
        </div>
      </div>
    </>
  );
}
