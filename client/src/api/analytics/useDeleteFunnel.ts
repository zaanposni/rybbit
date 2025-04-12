import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { authedFetch } from "../utils";

/**
 * Hook for deleting a saved funnel report
 */
export function useDeleteFunnel() {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean }, Error, number>({
    mutationFn: async (reportId) => {
      const response = await authedFetch(`${BACKEND_URL}/report/${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete funnel");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate the funnels query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["funnels"] });
    },
  });
}
