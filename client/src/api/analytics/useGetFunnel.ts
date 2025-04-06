import { useMutation } from "@tanstack/react-query";
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
  timezone: string;
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

  return useMutation<{ data: FunnelResponse[] }, Error, FunnelRequest>({
    mutationFn: async (funnelConfig) => {
      const response = await authedFetch(`${BACKEND_URL}/funnel/${site}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(funnelConfig),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze funnel");
      }

      return response.json();
    },
  });
}
