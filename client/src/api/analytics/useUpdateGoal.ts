import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { authedFetchWithError } from "../utils";
import { useStore } from "../../lib/store";

export interface UpdateGoalRequest {
  goalId: number;
  siteId: number;
  name?: string;
  goalType: "path" | "event";
  config: {
    pathPattern?: string;
    eventName?: string;
    eventPropertyKey?: string;
    eventPropertyValue?: string | number | boolean;
  };
}

interface UpdateGoalResponse {
  success: boolean;
  goalId: number;
}

export function useUpdateGoal() {
  const queryClient = useQueryClient();
  const { site } = useStore();

  return useMutation<UpdateGoalResponse, Error, UpdateGoalRequest>({
    mutationFn: async (goalData) => {
      try {
        return await authedFetchWithError<UpdateGoalResponse>(
          `${BACKEND_URL}/goal/update`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(goalData),
          }
        );
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to update goal"
        );
      }
    },
    onSuccess: () => {
      // Invalidate goals query to refetch with the updated goal
      queryClient.invalidateQueries({
        queryKey: ["goals", site],
      });
    },
  });
}
