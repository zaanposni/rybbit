"use client";

import { useDeleteFunnel } from "@/api/analytics/useDeleteFunnel";
import { useGetFunnel } from "@/api/analytics/useGetFunnel";
import { SavedFunnel } from "@/api/analytics/useGetFunnels";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { DateRangeMode, Time } from "@/components/DateSelector/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  BarChart2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
} from "lucide-react";
import { DateTime } from "luxon";
import { useState } from "react";
import { toast } from "sonner";
import { getStartAndEndDate } from "../../../../api/utils";
import { EditFunnelDialog } from "./EditFunnel";
import { Funnel } from "./Funnel";
import { useDebounce } from "@uidotdev/usehooks";

interface FunnelRowProps {
  funnel: SavedFunnel;
}

export function FunnelRow({ funnel }: FunnelRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Time state for funnel visualization - default to last 7 days
  const [time, setTime] = useState<Time>({
    mode: "range",
    startDate: DateTime.now().minus({ days: 7 }).toISODate(),
    endDate: DateTime.now().toISODate(),
    wellKnown: "Last 7 days",
  } as DateRangeMode);

  // Debounce time changes
  const debouncedTime = useDebounce(time, 300);
  const { startDate, endDate } = getStartAndEndDate(debouncedTime);

  // Funnel data fetching
  const {
    data,
    isError,
    error,
    isLoading: isPending,
    isSuccess,
  } = useGetFunnel(
    expanded
      ? {
          steps: funnel.steps,
          startDate,
          endDate,
        }
      : undefined
  );

  // Delete funnel mutation
  const { mutate: deleteFunnel, isPending: isDeleting } = useDeleteFunnel();

  // Handle expansion
  const handleExpand = () => {
    setExpanded(!expanded);
  };

  // Format date string
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "Unknown date";
    }
  };

  // Handle funnel deletion
  const handleDeleteFunnel = async () => {
    try {
      await deleteFunnel(funnel.id);
      toast.success("Funnel deleted successfully");
    } catch (error) {
      console.error("Error deleting funnel:", error);
      throw error; // Let the ConfirmationModal handle the error display
    }
  };

  return (
    <Card className="mb-4 overflow-hidden">
      {/* Header row (always visible) */}
      <div className="flex items-center justify-between p-4">
        <div
          className="flex items-center space-x-4 flex-grow cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
          onClick={handleExpand}
        >
          <div className="bg-neutral-100 dark:bg-neutral-800 p-2 rounded-md">
            <BarChart2 className="h-5 w-5 text-neutral-500" />
          </div>
          <div>
            <h3 className="font-medium">{funnel.name}</h3>
            <div className="text-sm text-neutral-500 flex items-center gap-2">
              <span>{funnel.steps.length} steps</span>
              <span>•</span>
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {formatDate(funnel.createdAt)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-neutral-500">Conversion</div>
            <div className="font-semibold">
              {(funnel.conversionRate || 0).toFixed(1)}%
            </div>
          </div>

          <div className="flex gap-2">
            {/* Edit button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditModalOpen(true);
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>

            {/* Delete button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteModalOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="ml-2"
              onClick={handleExpand}
            >
              {expanded ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>
        </div>
      </div>

      {/* Expandable content */}
      {expanded && (
        <div className="border-t border-neutral-200 dark:border-neutral-800">
          <div className="p-4">
            {isPending ? (
              <div className="flex justify-center items-center h-[400px]">
                <div className="animate-pulse flex items-center">
                  <div className="h-2 w-2 bg-neutral-500 rounded-full mr-1 animate-bounce"></div>
                  <div className="h-2 w-2 bg-neutral-500 rounded-full mr-1 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="h-2 w-2 bg-neutral-500 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            ) : isError ? (
              <div className="text-red-500 p-4 text-center">
                Error loading funnel:{" "}
                {error instanceof Error ? error.message : "Unknown error"}
              </div>
            ) : data?.data && data.data.length > 0 ? (
              <Funnel
                data={data}
                isError={isError}
                error={error}
                isPending={isPending}
                time={time}
                setTime={setTime}
              />
            ) : (
              <div className="text-center p-6 text-neutral-500">
                No funnel data available
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        title="Delete Funnel"
        description={`Are you sure you want to delete "${funnel.name}"? This action cannot be undone.`}
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        onConfirm={handleDeleteFunnel}
        primaryAction={{
          children: isDeleting ? "Deleting..." : "Delete",
          variant: "destructive",
        }}
      >
        <span></span>
      </ConfirmationModal>

      {/* Edit Funnel Modal */}
      {isEditModalOpen && (
        <EditFunnelDialog
          funnel={funnel}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </Card>
  );
}
