"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Goal } from "../../../../api/analytics/useGetGoals";
import { Button } from "../../../../components/ui/button";
import {
  FileText,
  MoreHorizontal,
  MousePointerClick,
  Pencil,
  Trash,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/alert-dialog";
import { useDeleteGoal } from "../../../../api/analytics/useDeleteGoal";
import GoalFormModal from "./GoalFormModal";

interface GoalCardProps {
  goal: Goal;
  siteId: number;
}

export default function GoalCard({ goal, siteId }: GoalCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteGoalMutation = useDeleteGoal();

  const handleDelete = async () => {
    try {
      await deleteGoalMutation.mutateAsync(goal.goalId);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  return (
    <>
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-lg">
              {goal.name || `Goal #${goal.goalId}`}
            </CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pb-2 flex-grow">
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="text-sm text-gray-500 mr-2">Type:</span>
              {goal.goalType === "path" ? (
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">Path Goal</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <MousePointerClick className="w-4 h-4 text-amber-500" />
                  <span className="text-sm">Event Goal</span>
                </div>
              )}
            </div>
            <div>
              <span className="text-sm text-gray-500">Pattern:</span>
              <div className="mt-1 text-sm truncate">
                {goal.goalType === "path" ? (
                  <code className="bg-neutral-800/50 px-1 py-0.5 rounded">
                    {goal.config.pathPattern}
                  </code>
                ) : (
                  <code className="bg-neutral-800/50 px-1 py-0.5 rounded">
                    {goal.config.eventName}
                  </code>
                )}
              </div>
              {goal.goalType === "event" && goal.config.eventPropertyKey && (
                <div className="mt-1 text-xs text-gray-500">
                  Property:{" "}
                  <code className="bg-neutral-800/50 px-1 py-0.5 rounded">
                    {goal.config.eventPropertyKey} ={" "}
                    {String(goal.config.eventPropertyValue)}
                  </code>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="grid grid-cols-2 gap-2 p-4 mt-auto bg-neutral-800/20 rounded-b-lg">
          <div className="text-center">
            <div className="font-bold text-lg">{goal.total_conversions}</div>
            <div className="text-xs text-gray-500">Conversions</div>
          </div>
          <div className="text-center">
            <div className="font-bold text-lg">
              {(goal.conversion_rate * 100).toFixed(2)}%
            </div>
            <div className="text-xs text-gray-500">Conversion Rate</div>
          </div>
        </CardFooter>
      </Card>

      {/* Edit Goal Modal */}
      {isEditModalOpen && (
        <GoalFormModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          siteId={siteId}
          goal={goal}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete this goal?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              goal and remove it from all reports.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} variant="destructive">
              {deleteGoalMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
