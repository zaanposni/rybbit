import { useQuery } from "@tanstack/react-query";
import { useStore } from "../../lib/store";
import { BACKEND_URL } from "../../lib/const";
import { authedFetch } from "../utils";

export function useGetLiveUsercount(minutes = 5) {
  const { site } = useStore();
  return useQuery({
    queryKey: ["live-user-count", site, minutes],
    refetchInterval: 5000,
    queryFn: () =>
      authedFetch(
        `${BACKEND_URL}/live-user-count/${site}?minutes=${minutes}`
      ).then((res) => res.json()),
  });
}
