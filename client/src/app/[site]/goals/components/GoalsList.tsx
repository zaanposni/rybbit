"use client";

import { Goal, PaginationMeta } from "../../../../api/analytics/useGetGoals";
import GoalCard from "./GoalCard";
import { Button } from "../../../../components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface GoalsListProps {
  goals: Goal[];
  siteId: number;
  paginationMeta: PaginationMeta;
  onPageChange: (page: number) => void;
}

export default function GoalsList({
  goals,
  siteId,
  paginationMeta,
  onPageChange,
}: GoalsListProps) {
  const { page, pageSize, total, totalPages } = paginationMeta;

  const handlePrevPage = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal) => (
          <GoalCard key={goal.goalId} goal={goal} siteId={siteId} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing {goals.length} of {total} goals
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="text-sm px-3">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
