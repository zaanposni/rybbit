"use client";
import { ListFilterPlus, Plus } from "lucide-react";
import { Button } from "../../../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../../components/ui/dropdown-menu";
import { FilterParameter, FilterType } from "../../../../../lib/store";
import { useMemo, useState } from "react";
import { sleep } from "../../../../../lib/utils";
import { cn } from "../../../../../lib/utils";
import { ValueFilter } from "./ValueFilter";

const FilterOptions: { label: string; value: FilterParameter }[] = [
  {
    label: "Path",
    value: "pathname",
  },
  {
    label: "Page Title",
    value: "page_title",
  },
  {
    label: "Query",
    value: "querystring",
  },
  {
    label: "Referrer",
    value: "referrer",
  },
  {
    label: "Channel",
    value: "channel",
  },
  {
    label: "Country",
    value: "country",
  },
  {
    label: "Region",
    value: "iso_3166_2",
  },
  {
    label: "City",
    value: "city",
  },
  {
    label: "Device Type",
    value: "device_type",
  },
  {
    label: "Operating System",
    value: "operating_system",
  },
  {
    label: "Browser",
    value: "browser",
  },
  {
    label: "Language",
    value: "language",
  },
  {
    label: "Entry Page",
    value: "entry_page",
  },
  {
    label: "Exit Page",
    value: "exit_page",
  },
  {
    label: "Screen Dimensions",
    value: "dimensions",
  },
  {
    label: "Event Name",
    value: "event_name",
  },
];

export function NewFilterButton() {
  const [selectedFilter, setSelectedFilter] = useState<{
    label: string;
    value: FilterParameter;
  } | null>(null);

  const [selectedOperator, setSelectedOperator] =
    useState<FilterType>("equals");

  const [open, setOpen] = useState(false);

  const onClose = async () => {
    setOpen(false);
    await sleep(100);
    setSelectedFilter(null);
    setSelectedOperator("equals");
  };

  const operatorOptions: { label: string; value: FilterType }[] =
    useMemo(() => {
      if (
        selectedFilter?.value === "referrer" ||
        selectedFilter?.value === "page_title" ||
        selectedFilter?.value === "language" ||
        selectedFilter?.value === "country" ||
        selectedFilter?.value === "region" ||
        selectedFilter?.value === "city" ||
        selectedFilter?.value === "iso_3166_2" ||
        selectedFilter?.value === "entry_page" ||
        selectedFilter?.value === "exit_page" ||
        selectedFilter?.value === "querystring"
      ) {
        return [
          { label: "Is", value: "equals" },
          { label: "Is not", value: "not_equals" },
          { label: "Contains", value: "contains" },
          { label: "Not contains", value: "not_contains" },
        ];
      }
      return [
        { label: "Is", value: "equals" },
        { label: "Is not", value: "not_equals" },
      ];
    }, []);

  return (
    <DropdownMenu
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
      open={open}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="default"
          className="px-3"
          onClick={() => setOpen(true)}
        >
          <ListFilterPlus className="w-4 h-4" />
          Filter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {selectedFilter ? (
          <div className="flex flex-col gap-2 p-2">
            <div>{selectedFilter.label}</div>
            <div className="flex flex-col items-center gap-2 text-sm">
              <div className="flex w-full rounded-md overflow-hidden">
                {operatorOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant={"default"}
                    className={cn(
                      "flex-1 rounded-none text-xs h-8 border-neutral-700 transition-[background-color,color]",
                      selectedOperator === option.value
                        ? "bg-neutral-900 text-white dark:bg-neutral-750"
                        : "bg-white text-neutral-700 hover:bg-neutral-100 dark:bg-neutral-850 dark:text-neutral-300  dark:hover:text-neutral-100"
                    )}
                    onClick={() => setSelectedOperator(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>

              <ValueFilter
                parameter={selectedFilter.value}
                type={selectedOperator}
                onComplete={() => onClose()}
              />
            </div>
          </div>
        ) : (
          FilterOptions.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={(e) => {
                e.preventDefault();
                setSelectedFilter(option);
              }}
            >
              {option.label}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
