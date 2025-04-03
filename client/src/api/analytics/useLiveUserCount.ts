import { useQuery } from "@tanstack/react-query";
import { useStore } from "../../lib/store";
import { BACKEND_URL } from "../../lib/const";
import { authedFetch } from "../utils";

export function useGetLiveUsercount() {
  const { site } = useStore();
  return useQuery({
    queryKey: ["live-user-count", site],
    refetchInterval: 5000,
    queryFn: () =>
      authedFetch(`${BACKEND_URL}/live-user-count/${site}`).then((res) =>
        res.json()
      ),
  });
}
