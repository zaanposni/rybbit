import { useQuery } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { authedFetch } from "../utils";
import { FunnelStep } from "./useGetFunnel";

export interface SavedFunnel {
  id: number;
  name: string;
  steps: FunnelStep[];
  configuration: {
    startDate: string;
    endDate: string;
    timezone: string;
  };
  createdAt: string;
  updatedAt: string;
  conversionRate: number | null;
  totalVisitors: number | null;
}

export function useGetFunnels(siteId?: string | number) {
  return useQuery<SavedFunnel[]>({
    queryKey: ["funnels", siteId],
    queryFn: async () => {
      if (!siteId) {
        return [];
      }

      const response = await authedFetch(`${BACKEND_URL}/funnels/${siteId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch funnels");
      }

      const result = await response.json();
      return result.data;
    },
    enabled: !!siteId,
  });
}
