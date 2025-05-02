import { useQuery } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { useStore } from "../../lib/store";
import { authedFetchWithError } from "../utils";
import { getQueryTimeParams } from "./utils";

export type EventProperty = {
  propertyKey: string;
  propertyValue: string;
  count: number;
};

export function useGetEventProperties(eventName: string | null) {
  const { site, time } = useStore();

  const timeParams = getQueryTimeParams(time);
  const eventNameParam = eventName
    ? `&eventName=${encodeURIComponent(eventName)}`
    : "";

  return useQuery({
    queryKey: ["event-properties", site, eventName, timeParams],
    enabled: !!site && !!eventName,
    queryFn: () =>
      authedFetchWithError<{ data: EventProperty[] }>(
        `${BACKEND_URL}/events/properties/${site}?${timeParams}${eventNameParam}`
      ).then((res) => res.data),
  });
}
