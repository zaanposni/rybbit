import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { authedFetch } from "../utils";
import { useStore } from "../../lib/store";

export type FunnelStep = {
  value: string;
  name?: string;
  type: "page" | "event";
};

export type FunnelRequest = {
  steps: FunnelStep[];
  startDate: string;
  endDate: string;
  name?: string;
};

export type SaveFunnelRequest = {
  steps: FunnelStep[];
  startDate: string;
  endDate: string;
  name: string;
  reportId?: number;
};

export type FunnelResponse = {
  step_number: number;
  step_name: string;
  visitors: number;
  conversion_rate: number;
  dropoff_rate: number;
};

/**
 * Hook for analyzing conversion funnels through a series of steps
 */
export function useGetFunnel() {
  const { site } = useStore();
  const queryClient = useQueryClient();

  return useMutation<{ data: FunnelResponse[] }, Error, FunnelRequest>({
    mutationFn: async (funnelConfig) => {
      // If name is provided, save the funnel configuration
      const saveConfiguration = !!funnelConfig.name;

      // Add timezone to the request
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const fullConfig = {
        ...funnelConfig,
        timezone,
      };

      // First, analyze the funnel to get conversion data
      const analyzeResponse = await authedFetch(
        `${BACKEND_URL}/funnel/${site}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fullConfig),
        }
      );

      if (!analyzeResponse.ok) {
        const errorData = await analyzeResponse.json();
        throw new Error(errorData.error || "Failed to analyze funnel");
      }

      const analyzeResult = await analyzeResponse.json();

      // If name is provided, save the funnel configuration with the results
      if (saveConfiguration) {
        const saveResponse = await authedFetch(
          `${BACKEND_URL}/funnel/create/${site}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(fullConfig),
          }
        );

        if (!saveResponse.ok) {
          console.error("Failed to save funnel:", await saveResponse.json());
          // Continue even if save fails, just show the analysis
        } else {
          // Invalidate the funnels query to refresh the list
          queryClient.invalidateQueries({ queryKey: ["funnels", site] });
        }
      }

      return analyzeResult;
    },
  });
}

/**
 * Hook for saving funnel configurations without analyzing them
 */
export function useSaveFunnel() {
  const { site } = useStore();
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; funnelId: number },
    Error,
    SaveFunnelRequest
  >({
    mutationFn: async (funnelConfig) => {
      // Add timezone to the request
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const fullConfig = {
        ...funnelConfig,
        timezone,
      };

      // Save the funnel configuration
      const saveResponse = await authedFetch(
        `${BACKEND_URL}/funnel/create/${site}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fullConfig),
        }
      );

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        throw new Error(errorData.error || "Failed to save funnel");
      }

      // Invalidate the funnels query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["funnels", site] });

      return saveResponse.json();
    },
  });
}
