import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { FilterParameter, useStore } from "../../lib/store";
import { APIResponse } from "../types";
import { BACKEND_URL } from "../../lib/const";
import { getStartAndEndDate, authedFetch } from "../utils";

type PeriodTime = "current" | "previous";

export type SingleColResponse = {
  value: string;
  count: number;
  percentage: number;
  avg_session_duration?: number;
  bounce_rate?: number;
};

export function useSingleCol({
  parameter,
  limit = 1000,
  periodTime,
  useFilters = true,
}: {
  parameter: FilterParameter;
  limit?: number;
  periodTime?: PeriodTime;
  useFilters?: boolean;
}): UseQueryResult<APIResponse<SingleColResponse[]>> {
  const { time, previousTime, site, filters } = useStore();
  const timeToUse = periodTime === "previous" ? previousTime : time;
  const { startDate, endDate } = getStartAndEndDate(timeToUse);

  return useQuery({
    queryKey: [parameter, timeToUse, site, filters, limit, useFilters],
    queryFn: () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return authedFetch(`${BACKEND_URL}/single-col/${site}`, {
        startDate,
        endDate,
        timezone,
        parameter,
        limit,
        filters: useFilters ? filters : undefined,
      }).then((res) => res.json());
    },
    staleTime: Infinity,
    placeholderData: (_, query: any) => {
      if (!query?.queryKey) return undefined;
      const prevQueryKey = query.queryKey as [string, string, string];
      const [, , prevSite] = prevQueryKey;

      if (prevSite === site) {
        return query.state.data;
      }
      return undefined;
    },
  });
}

export function useSingleColRealtime({
  parameter,
  limit = 1000,
  minutes = 30,
}: {
  parameter: FilterParameter;
  limit?: number;
  minutes?: number;
}): UseQueryResult<APIResponse<SingleColResponse[]>> {
  const { time, previousTime, site, filters } = useStore();

  return useQuery({
    queryKey: [parameter, site, limit, minutes],
    queryFn: () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return authedFetch(`${BACKEND_URL}/single-col/${site}`, {
        timezone,
        parameter,
        limit,
        minutes,
      }).then((res) => res.json());
    },
    staleTime: Infinity,
    placeholderData: (_, query: any) => {
      if (!query?.queryKey) return undefined;
      const prevQueryKey = query.queryKey as [string, string, string];
      const [, , prevSite] = prevQueryKey;

      if (prevSite === site) {
        return query.state.data;
      }
      return undefined;
    },
  });
}
