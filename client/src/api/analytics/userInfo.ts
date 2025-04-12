import { useQuery } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { authedFetch } from "../utils";

export type UserInfo = {
  duration: number;
  sessions: number;
  country: string;
  iso_3166_2: string;
  language: string;
  device_type: string;
  browser: string;
  browser_version: string;
  operating_system: string;
  operating_system_version: string;
  screen_height: number;
  screen_width: number;
  last_seen: string;
  first_seen: string;
  pageviews: number;
  events: number;
};

export function useUserInfo(siteId: number, userId: string) {
  return useQuery<UserInfo>({
    queryKey: ["user-info", userId, siteId],
    queryFn: () => {
      console.info("Fetching user info");

      return authedFetch(`${BACKEND_URL}/user/info/${userId}/${siteId}`)
        .then((res) => res.json())
        .then((res) => res.data);
    },
  });
}
