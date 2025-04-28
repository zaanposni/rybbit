"use client";

import { useState } from "react";
import { Goal } from "../../../../api/analytics/useGetGoals";
import { useDeleteGoal } from "../../../../api/analytics/useDeleteGoal";
import { Pencil, Trash } from "lucide-react";
import { Button } from "../../../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../../components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
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
import GoalFormModal from "./GoalFormModal";

interface GoalsListProps {
  goals: Goal[];
  siteId: number;
}

export default function GoalsList({ goals, siteId }: GoalsListProps) {
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);
  const [goalToDelete, setGoalToDelete] = useState<Goal | null>(null);
  const deleteGoalMutation = useDeleteGoal();

  const handleDelete = async () => {
    if (!goalToDelete) return;

    try {
      await deleteGoalMutation.mutateAsync(goalToDelete.goalId);
      setGoalToDelete(null);
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="text-left py-2 font-medium">Name</th>
              <th className="text-left py-2 font-medium">Type</th>
              <th className="text-right py-2 font-medium">Conversions</th>
              <th className="text-right py-2 font-medium">Conversion Rate</th>
              <th className="text-right py-2 font-medium w-[60px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {goals.map((goal) => (
              <tr
                key={goal.goalId}
                className="border-b border-neutral-800/40 hover:bg-neutral-800/20"
              >
                <td className="py-3">{goal.name || `Goal #${goal.goalId}`}</td>
                <td className="py-3">
                  {goal.goalType === "path" ? (
                    <div className="flex items-center">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/10 text-blue-500 mr-2">
                        <span className="text-xs">/</span>
                      </span>
                      <span className="text-sm truncate max-w-[250px]">
                        {goal.config.pathPattern}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10 text-green-500 mr-2">
                        <span className="text-xs">E</span>
                      </span>
                      <span className="text-sm truncate max-w-[250px]">
                        {goal.config.eventName}
                      </span>
                    </div>
                  )}
                </td>
                <td className="py-3 text-right">{goal.total_conversions}</td>
                <td className="py-3 text-right">
                  {(goal.conversion_rate * 100).toFixed(2)}%
                </td>
                <td className="py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setGoalToEdit(goal)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setGoalToDelete(goal)}
                        className="text-red-500 focus:text-red-500"
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Goal Modal */}
      {goalToEdit && (
        <GoalFormModal
          isOpen={!!goalToEdit}
          onClose={() => setGoalToEdit(null)}
          siteId={siteId}
          goal={goalToEdit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!goalToDelete}
        onOpenChange={(open) => !open && setGoalToDelete(null)}
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
    </div>
  );
}
