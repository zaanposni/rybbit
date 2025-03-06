"use client";

import { useMemo, useState } from "react";

import { Button } from "../../../../../components/ui/button";

import { ChevronsUpDown, Plus } from "lucide-react";

import { getCountryName } from "../../../../../lib/utils";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../../../../components/ui/command";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../../components/ui/popover";

import { FilterParameter, addFilter } from "../../../../../lib/store";

import { useSingleCol } from "../../../../../hooks/api";
import { MultiSelect } from "../../../../../components/MultiSelect";

interface ValueFilterProps {
  parameter: FilterParameter;

  type: "equals" | "not_equals" | "contains" | "not_contains";

  onComplete?: () => void;
}

export function ValueFilter({ parameter, type, onComplete }: ValueFilterProps) {
  const { data, isLoading } = useSingleCol({
    parameter,
    limit: 1000,
    useFilters: false,
  });

  const [selectedValues, setSelectedValues] = useState<string[]>([]);

  const suggestions = useMemo(() => {
    return (
      data?.data
        ?.map((item) => item.value)
        .filter(Boolean)
        .map((val) => {
          if (parameter === "country") {
            return {
              value: val,
              label: getCountryName(val),
            };
          }
          return {
            value: val,
            label: val,
          };
        }) || []
    );
  }, [data]);

  const handleChange = (selected: any) => {
    const values = selected.map((item: { value: string }) => item.value);
    setSelectedValues(values);
  };

  const handleApply = () => {
    if (parameter && type && selectedValues.length > 0) {
      addFilter({
        parameter,
        type,
        value: selectedValues,
      });
      setSelectedValues([]);
      if (onComplete) {
        onComplete();
      }
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <MultiSelect
        options={suggestions}
        onChange={handleChange}
        placeholder="Select values..."
        isLoading={isLoading}
      />
      <Button
        onClick={handleApply}
        disabled={selectedValues.length === 0}
        className="mt-2"
      >
        Apply Filter
      </Button>
    </div>
  );
}
