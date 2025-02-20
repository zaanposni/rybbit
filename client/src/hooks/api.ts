import {
  keepPreviousData,
  useQuery,
  UseQueryResult,
} from "@tanstack/react-query";
import { useStore } from "../lib/store";
import { authedFetch, getStartAndEndDate } from "./utils";
import { BACKEND_URL } from "../lib/const";

export type APIResponse<T> = {
  data: T;
  error?: string;
};

export function useGetLiveUsercount() {
  const { site } = useStore();
  return useQuery({
    queryKey: ["live-user-count", site],
    queryFn: () =>
      authedFetch(`${BACKEND_URL}/live-user-count/${site}`).then((res) =>
        res.json()
      ),
  });
}

type PeriodTime = "current" | "previous";

export function useGenericQuery<T>(
  endpoint: string,
  periodTime?: PeriodTime
): UseQueryResult<APIResponse<T>> {
  const { time, previousTime, site } = useStore();
  const timeToUse = periodTime === "previous" ? previousTime : time;
  const { startDate, endDate } = getStartAndEndDate(timeToUse);

  return useQuery({
    queryKey: [endpoint, timeToUse, site],
    queryFn: () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return authedFetch(
        `${BACKEND_URL}/${endpoint}?startDate=${startDate}&endDate=${endDate}&timezone=${timezone}&site=${site}`
      ).then((res) => res.json());
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
  const { time, previousTime, bucket, site } = useStore();
  const timeToUse = periodTime === "previous" ? previousTime : time;

  const { startDate, endDate } = getStartAndEndDate(timeToUse);

  return useQuery({
    queryKey: ["pageviews", timeToUse, bucket, site],
    queryFn: () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return authedFetch(
        `${BACKEND_URL}/pageviews?startDate=${startDate}&endDate=${endDate}&timezone=${timezone}&bucket=${bucket}&site=${site}`
      ).then((res) => res.json());
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

export type GetSitesResponse = {
  site_id: number;
  site_name: string;
  domain: string;
  created_at: string;
  updated_at: string;
  created_by: string;
}[];

export function useGetSites() {
  return useGenericQuery<GetSitesResponse>("get-sites");
}

export function addSite(domain: string, name: string) {
  return authedFetch(`${BACKEND_URL}/add-site`, {
    method: "POST",
    body: JSON.stringify({
      domain,
      name,
    }),
  });
}

export function deleteSite(siteId: string) {
  return authedFetch(`${BACKEND_URL}/delete-site/${siteId}`, {
    method: "POST",
  });
}

export type ListUsersResponse = {
  id: string;
  name: string;
  username: string;
  email: string;
  emailVerified: boolean;
  role: string;
  createdAt: string;
  updatedAt: string;
}[];

export function useListUsers() {
  return useGenericQuery<ListUsersResponse>("list-users");
}
