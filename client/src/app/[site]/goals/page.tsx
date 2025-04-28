"use client";

import { useState } from "react";
import { useGetGoals } from "../../../api/analytics/useGetGoals";
import { getStartAndEndDate } from "../../../api/utils";
import { SESSION_PAGE_FILTERS, useStore } from "../../../lib/store";
import { SubHeader } from "../components/SubHeader/SubHeader";
import CreateGoalButton from "./components/CreateGoalButton";
import GoalsList from "./components/GoalsList";

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
    <div className="p-2 md:p-4 max-w-[1400px] mx-auto space-y-3">
      <SubHeader availableFilters={SESSION_PAGE_FILTERS} />
      <div className="flex items-center justify-between">
        <div />
        <CreateGoalButton siteId={Number(site)} />
      </div>

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
    </div>
  );
}
