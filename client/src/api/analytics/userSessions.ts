import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import {
  getFilteredFilters,
  SESSION_PAGE_FILTERS,
  useStore,
} from "../../lib/store";
import { APIResponse } from "../types";
import { getStartAndEndDate, authedFetch } from "../utils";

export type UserSessionsResponse = {
  session_id: string;
  browser: string;
  operating_system: string;
  device_type: string;
  country: string;
  firstTimestamp: string;
  lastTimestamp: string;
  duration: number; // Duration in seconds
  pageviews: {
    pathname: string;
    querystring: string;
    title: string;
    timestamp: string;
    referrer: string;
  }[];
}[];

export function useGetUserSessions(userId: string) {
  const { time, site, filters } = useStore();
  const { startDate, endDate } = getStartAndEndDate(time);

  return useQuery({
    queryKey: ["user-sessions", userId, time, site, filters],
    queryFn: () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return authedFetch(`${BACKEND_URL}/user/${userId}/sessions/${site}`, {
        startDate,
        endDate,
        timezone,
        filters,
      }).then((res) => res.json());
    },
    staleTime: Infinity,
  });
}

export type GetSessionsResponse = {
  session_id: string;
  user_id: string;
  country: string;
  city: string;
  iso_3166_2: string;
  language: string;
  device_type: string;
  browser: string;
  operating_system: string;
  referrer: string;
  channel: string;
  session_end: string;
  session_start: string;
  session_duration: number;
  pageviews: number;
  events: number;
  entry_page: string;
  exit_page: string;
}[];

export function useGetSessionsInfinite(userId?: string) {
  const { time, site, filters } = useStore();
  const { startDate, endDate } = getStartAndEndDate(time);

  const filteredFilters = getFilteredFilters(SESSION_PAGE_FILTERS);

  return useInfiniteQuery<APIResponse<GetSessionsResponse>>({
    queryKey: ["sessions-infinite", time, site, filteredFilters, userId],
    queryFn: ({ pageParam = 1 }) => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return authedFetch(`${BACKEND_URL}/sessions/${site}`, {
        startDate: userId ? undefined : startDate,
        endDate: userId ? undefined : endDate,
        timezone,
        filters: filteredFilters,
        page: pageParam,
        userId,
      }).then((res) => res.json());
    },
    initialPageParam: 1,
    getNextPageParam: (
      lastPage: APIResponse<GetSessionsResponse>,
      allPages
    ) => {
      // If we have data and it's a full page (100 items), there might be more
      if (lastPage?.data && lastPage.data.length === 100) {
        return allPages.length + 1;
      }
      return undefined;
    },
    staleTime: Infinity,
  });
}

export interface SessionDetails {
  session_id: string;
  user_id: string;
  country: string;
  iso_3166_2: string;
  language: string;
  device_type: string;
  browser: string;
  browser_version: string;
  operating_system: string;
  operating_system_version: string;
  screen_width: number;
  screen_height: number;
  referrer: string;
  session_end: string;
  session_start: string;
  pageviews: number;
  entry_page: string;
  exit_page: string;
}

export interface PageviewEvent {
  timestamp: string;
  pathname: string;
  hostname: string;
  querystring: string;
  page_title: string;
  referrer: string;
  type: string;
  event_name?: string;
  properties?: string;
}

export interface SessionPageviewsAndEvents {
  session: SessionDetails;
  pageviews: PageviewEvent[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export function useGetSessionDetails(
  sessionId: string | null,
  limit = 100,
  offset = 0
) {
  const { site } = useStore();

  return useQuery<APIResponse<SessionPageviewsAndEvents>>({
    queryKey: ["session-details", sessionId, site, limit, offset],
    queryFn: () => {
      if (!sessionId) throw new Error("Session ID is required");

      return authedFetch(
        `${BACKEND_URL}/session/${sessionId}/${site}?limit=${limit}&offset=${offset}`
      ).then((res) => res.json());
    },
    enabled: !!sessionId && !!site,
    staleTime: Infinity,
  });
}

export function useGetSessionDetailsInfinite(sessionId: string | null) {
  const { site } = useStore();

  return useInfiniteQuery<APIResponse<SessionPageviewsAndEvents>>({
    queryKey: ["session-details-infinite", sessionId, site],
    queryFn: ({ pageParam = 0 }) => {
      if (!sessionId) throw new Error("Session ID is required");
      const limit = 100;

      return authedFetch(
        `${BACKEND_URL}/session/${sessionId}/${site}?limit=${limit}&offset=${pageParam}`
      ).then((res) => res.json());
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      if (lastPage?.data?.pagination?.hasMore) {
        return lastPage.data.pagination.offset + lastPage.data.pagination.limit;
      }
      return undefined;
    },
    enabled: !!sessionId && !!site,
    staleTime: Infinity,
  });
}
