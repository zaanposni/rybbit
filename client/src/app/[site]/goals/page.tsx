"use client";

import { useState } from "react";
import { useStore } from "../../../lib/store";
import { DateSelector } from "../../../components/DateSelector/DateSelector";
import { useGetGoals } from "../../../api/analytics/useGetGoals";
import { getStartAndEndDate } from "../../../api/utils";
import { Card } from "../../../components/ui/card";
import GoalsList from "./components/GoalsList";
import CreateGoalButton from "./components/CreateGoalButton";

export default function GoalsPage() {
  const { time, filters, site, setTime } = useStore();
  const { startDate, endDate } = getStartAndEndDate(time);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 9; // Show 9 cards (3x3 grid)

  // Handle the case where startDate or endDate might be null (for 'all-time' mode)
  const queryStartDate = startDate || "2020-01-01"; // Default fallback date
  const queryEndDate = endDate || new Date().toISOString().split("T")[0]; // Today

  // Fetch goals data with pagination
  const { data: goalsData, isLoading } = useGetGoals({
    startDate: queryStartDate,
    endDate: queryEndDate,
    filters,
    page: currentPage,
    pageSize,
  });

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    // Scroll to top of page when changing pages
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <div className="p-6 h-full space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Conversion Goals</h1>
        <div className="flex items-center gap-4">
          <DateSelector time={time} setTime={setTime} />
          <CreateGoalButton siteId={Number(site)} />
        </div>
      </div>

      <Card className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse">Loading goals data...</div>
          </div>
        ) : !goalsData || goalsData.data.length === 0 ? (
          <div className="py-10 text-center">
            <h3 className="text-lg font-medium">No goals configured yet</h3>
            <p className="text-sm text-gray-500 mt-2">
              Create your first conversion goal to start tracking important user
              actions.
            </p>
          </div>
        ) : (
          <GoalsList
            goals={goalsData.data}
            siteId={Number(site)}
            paginationMeta={goalsData.meta}
            onPageChange={handlePageChange}
          />
        )}
      </Card>
    </div>
  );
}
