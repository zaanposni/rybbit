import { useQuery } from "@tanstack/react-query";
import { useStore } from "../../lib/store";
import { BACKEND_URL } from "../../lib/const";
import { authedFetch } from "../utils";

export type Event = {
  timestamp: string;
  event_name: string;
  properties: string;
  user_id: string;
  hostname: string;
  pathname: string;
  querystring: string;
  page_title: string;
  referrer: string;
  browser: string;
  operating_system: string;
  country: string;
  device_type: string;
  type: string;
};

export function useGetEvents(count = 10) {
  const { site } = useStore();
  return useQuery({
    queryKey: ["events", site, count],
    refetchInterval: 5000,
    queryFn: () =>
      authedFetch(`${BACKEND_URL}/recent-events/${site}?count=${count}`).then(
        (res) => res.json()
      ),
  });
}
