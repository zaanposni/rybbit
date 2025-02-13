import {
  keepPreviousData,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import { useTimeSelection } from "../lib/timeSelectionStore";
import { authedFetch, getStartAndEndDate } from "./utils";

export type APIResponse<T> = {
  data: T;
  error?: string;
};

type PeriodTime = "current" | "previous";

export function useGenericQuery<T>(
  endpoint: string,
  periodTime?: PeriodTime
): UseQueryResult<APIResponse<T>> {
  const { time, previousTime } = useTimeSelection();
  const timeToUse = periodTime === "previous" ? previousTime : time;
  const { startDate, endDate } = getStartAndEndDate(timeToUse);

  return useQuery({
    queryKey: [endpoint, timeToUse],
    queryFn: () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return authedFetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/${endpoint}?startDate=${startDate}&endDate=${endDate}&timezone=${timezone}`
      );
    },
    staleTime: Infinity,
    placeholderData: keepPreviousData,
  });
}

export type GetCountriesResponse = {
  country: string;
  count: number;
  percentage: number;
}[];

export function useGetCountries() {
  return useGenericQuery<GetCountriesResponse>("countries");
}

export type GetDevicesResponse = {
  device_type: string;
  count: number;
  percentage: number;
}[];

export function useGetDevices() {
  return useGenericQuery<GetDevicesResponse>("devices");
}

export type GetOperatingSystemsResponse = {
  operating_system: string;
  count: number;
  percentage: number;
}[];

export function useGetOperatingSystems() {
  return useGenericQuery<GetOperatingSystemsResponse>("operating-systems");
}

export type GetBrowsersResponse = {
  browser: string;
  count: number;
  percentage: number;
}[];

export function useGetBrowsers() {
  return useGenericQuery<GetBrowsersResponse>("browsers");
}

export type GetPagesResponse = {
  pathname: string;
  count: number;
  percentage: number;
}[];

export function useGetPages() {
  return useGenericQuery<GetPagesResponse>("pages");
}

export type GetReferrersResponse = {
  referrer: string;
  count: number;
  percentage: number;
}[];

export function useGetReferrers() {
  return useGenericQuery<GetReferrersResponse>("referrers");
}

export type GetPageViewsResponse = {
  time: string;
  pageviews: number;
}[];

export function useGetPageviews(
  periodTime?: PeriodTime
): UseQueryResult<APIResponse<GetPageViewsResponse>> {
  const { time, previousTime, bucket } = useTimeSelection();
  const timeToUse = periodTime === "previous" ? previousTime : time;

  const { startDate, endDate } = getStartAndEndDate(timeToUse);

  return useQuery({
    queryKey: ["pageviews", timeToUse, bucket],
    queryFn: () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return authedFetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/pageviews?startDate=${startDate}&endDate=${endDate}&timezone=${timezone}&bucket=${bucket}`
      );
    },
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  });
}

export type GetOverviewResponse = {
  sessions: number;
  pageviews: number;
  users: number;
  pages_per_session: number;
  bounce_rate: number;
  session_duration: number;
};

export function useGetOverview(periodTime?: PeriodTime) {
  return useGenericQuery<GetOverviewResponse>("overview", periodTime);
}
