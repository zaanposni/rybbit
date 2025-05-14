import { useGetOverviewPastMinutes } from "./useGetOverview";
import { useQuery } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { authedFetch } from "../utils";

/**
 * A wrapper around useGetOverviewPastMinutes that adds support for
 * conditional fetching based on viewport visibility
 */
export function useGetOverviewWithInView({
  pastMinutes = 24 * 60,
  site,
  isInView = true,
}: {
  pastMinutes?: number;
  site?: number | string;
  isInView?: boolean;
}) {
  // Always call the useQuery hook, but conditionally enable the fetch
  return useQuery({
    queryKey: ["overview-past-minutes", pastMinutes, site],
    queryFn: () => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return authedFetch(`${BACKEND_URL}/overview/${site}`, {
        pastMinutes,
        timezone,
      }).then((res) => res.json());
    },
    enabled: isInView, // Only fetch when in view
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
