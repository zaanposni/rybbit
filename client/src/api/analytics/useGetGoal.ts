import { useQuery } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { authedFetch } from "../utils";
import { useStore, Filter } from "../../lib/store";
import { Goal } from "./useGetGoals";

interface GetGoalResponse {
  data: Goal;
}

export function useGetGoal({
  goalId,
  startDate,
  endDate,
  filters,
  enabled = true,
}: {
  goalId: number;
  startDate: string;
  endDate: string;
  filters?: Filter[];
  enabled?: boolean;
}) {
  const { site } = useStore();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return useQuery({
    queryKey: ["goal", site, goalId, startDate, endDate, timezone, filters],
    queryFn: async () => {
      return authedFetch(`${BACKEND_URL}/goal/${goalId}/${site}`, {
        startDate,
        endDate,
        timezone,
        filters,
      }).then((res) => res.json());
    },
    enabled: !!site && !!goalId && enabled,
  });
}
