import { useQuery } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { useStore } from "../../lib/store";
import { authedFetchWithError } from "../utils";
import { getQueryTimeParams } from "./utils";

export type EventName = {
  eventName: string;
  count: number;
};

export function useGetEventNames() {
  const { site, time } = useStore();

  const timeParams = getQueryTimeParams(time);

  return useQuery({
    queryKey: ["event-names", site, timeParams],
    enabled: !!site,
    queryFn: () =>
      authedFetchWithError<{ data: EventName[] }>(
        `${BACKEND_URL}/events/names/${site}?${timeParams}`
      ).then((res) => res.data),
  });
}
