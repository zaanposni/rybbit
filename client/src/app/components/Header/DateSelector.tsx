"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Time, useTimeSelection } from "@/lib/timeSelectionStore";
import { DateTime } from "luxon";
import { CustomDateRangePicker } from "./CustomDateRangePicker";

const getLabel = (time: Time) => {
  if (time.mode === "range") {
    return `${time.startDate} - ${time.endDate}`;
  }

  if (time.mode === "day") {
    if (time.day === DateTime.now().toISODate()) {
      return "Today";
    }
    if (time.day === DateTime.now().minus({ days: 1 }).toISODate()) {
      return "Yesterday";
    }
    return time.day;
  }
};

export function DateSelector() {
  const { time, setTime } = useTimeSelection();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>{getLabel(time)}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            setTime({
              mode: "day",
              day: DateTime.now().toISODate(),
            })
          }
        >
          Today
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            setTime({
              mode: "range",
              startDate: DateTime.now().minus({ days: 6 }).toISODate(),
              endDate: DateTime.now().toISODate(),
            })
          }
        >
          Last 7 Days
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            setTime({
              mode: "range",
              startDate: DateTime.now().minus({ days: 29 }).toISODate(),
              endDate: DateTime.now().toISODate(),
            })
          }
        >
          Last 30 Days
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <CustomDateRangePicker />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
