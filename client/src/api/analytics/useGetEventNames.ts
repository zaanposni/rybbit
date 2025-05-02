import { useQuery } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { useStore, getFilteredFilters, EVENT_FILTERS } from "../../lib/store";
import { authedFetchWithError } from "../utils";
import { getQueryTimeParams } from "./utils";
import { buildUrl } from "../utils";

export type EventName = {
  eventName: string;
  count: number;
};

export function useGetEventNames() {
  const { site, time, filters } = useStore();

  const timeParams = getQueryTimeParams(time);
  const filteredFilters = getFilteredFilters(EVENT_FILTERS);

  return useQuery({
    queryKey: ["event-names", site, timeParams, filteredFilters],
    enabled: !!site,
    queryFn: () => {
      const url = buildUrl(`${BACKEND_URL}/events/names/${site}`, {
        ...Object.fromEntries(new URLSearchParams(timeParams)),
        filters: filteredFilters.length > 0 ? filteredFilters : undefined,
      });

      return authedFetchWithError<{ data: EventName[] }>(url).then(
        (res) => res.data
      );
    },
  });
}
