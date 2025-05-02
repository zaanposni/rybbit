import { useQuery } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { useStore, getFilteredFilters, EVENT_FILTERS } from "../../lib/store";
import { authedFetchWithError } from "../utils";
import { getQueryTimeParams } from "./utils";
import { buildUrl } from "../utils";

export type EventProperty = {
  propertyKey: string;
  propertyValue: string;
  count: number;
};

export function useGetEventProperties(eventName: string | null) {
  const { site, time, filters } = useStore();

  const timeParams = getQueryTimeParams(time);
  const filteredFilters = getFilteredFilters(EVENT_FILTERS);

  return useQuery({
    queryKey: [
      "event-properties",
      site,
      eventName,
      timeParams,
      filteredFilters,
    ],
    enabled: !!site && !!eventName,
    queryFn: () => {
      const url = buildUrl(`${BACKEND_URL}/events/properties/${site}`, {
        ...Object.fromEntries(new URLSearchParams(timeParams)),
        eventName,
        filters: filteredFilters.length > 0 ? filteredFilters : undefined,
      });

      return authedFetchWithError<{ data: EventProperty[] }>(url).then(
        (res) => res.data
      );
    },
  });
}
