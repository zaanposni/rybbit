"use client";
import { Filters } from "./Filters/Filters";

import { Button } from "@/components/ui/button";
import { goBack, goForward, Time, useStore } from "@/lib/store";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DateTime } from "luxon";

import { usePathname } from "next/navigation";
import { useGetSites } from "../../../../hooks/api";
import { DateSelector } from "./DateSelector";

const canGoForward = (time: Time) => {
  const currentDay = DateTime.now().startOf("day");
  if (time.mode === "day") {
    return !(DateTime.fromISO(time.day).startOf("day") >= currentDay);
  }

  if (time.mode === "range") {
    return !(DateTime.fromISO(time.endDate).startOf("day") >= currentDay);
  }

  if (time.mode === "week") {
    return !(DateTime.fromISO(time.week).startOf("week") >= currentDay);
  }

  if (time.mode === "month") {
    return !(DateTime.fromISO(time.month).startOf("month") >= currentDay);
  }

  if (time.mode === "year") {
    return !(DateTime.fromISO(time.year).startOf("year") >= currentDay);
  }

  return false;
};

export function SubHeader() {
  const { time } = useStore();
  const { data: sites } = useGetSites();
  const pathname = usePathname();

  const site = sites?.data?.find(
    (site) => site.siteId === Number(pathname.slice(1))
  );

  return (
    <div className="flex gap-2 mb-3 mt-1 justify-between">
      <Filters />
      <div className="flex items-center gap-2">
        <DateSelector />
        <div className="flex items-center">
          <Button variant="default" size="icon" onClick={goBack}>
            <ChevronLeft />
          </Button>
          <Button
            variant="default"
            size="icon"
            onClick={goForward}
            disabled={!canGoForward(time)}
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
