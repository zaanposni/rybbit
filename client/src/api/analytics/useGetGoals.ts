import { useQuery } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { authedFetch } from "../utils";
import { useStore, Filter } from "../../lib/store";

export interface Goal {
  goalId: number;
  name: string | null;
  goalType: "path" | "event";
  config: {
    pathPattern?: string;
    eventName?: string;
    eventPropertyKey?: string;
    eventPropertyValue?: string | number | boolean;
  };
  createdAt: string;
  total_conversions: number;
  total_sessions: number;
  conversion_rate: number;
}

interface GoalsResponse {
  data: Goal[];
}

export function useGetGoals({
  startDate,
  endDate,
  filters,
  enabled = true,
}: {
  startDate: string;
  endDate: string;
  filters?: Filter[];
  enabled?: boolean;
}) {
  const { site } = useStore();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return useQuery({
    queryKey: ["goals", site, startDate, endDate, timezone, filters],
    queryFn: async () => {
      return authedFetch(`${BACKEND_URL}/goals/${site}`, {
        startDate,
        endDate,
        timezone,
        filters,
      }).then((res) => res.json());
    },
    enabled: !!site && enabled,
  });
}
