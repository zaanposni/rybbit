import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { authedFetchWithError } from "../utils";
import { useStore } from "../../lib/store";

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  const { site } = useStore();

  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: async (goalId: number) => {
      try {
        return await authedFetchWithError<{ success: boolean }>(
          `${BACKEND_URL}/goal/${goalId}`,
          {
            method: "DELETE",
          }
        );
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : "Failed to delete goal"
        );
      }
    },
    onSuccess: () => {
      // Invalidate goals query to refetch without the deleted goal
      queryClient.invalidateQueries({
        queryKey: ["goals", site],
      });
    },
  });
}
