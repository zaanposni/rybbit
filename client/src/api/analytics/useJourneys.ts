import { useQuery } from "@tanstack/react-query";
import { authedFetch, getStartAndEndDate } from "../utils";
import { BACKEND_URL } from "../../lib/const";
import { Time } from "../../components/DateSelector/types";

export interface JourneyParams {
  siteId: string;
  steps?: number;
  timezone?: string;
  time: Time;
}

export interface Journey {
  path: string[];
  count: number;
  percentage: number;
}

export interface JourneysResponse {
  journeys: Journey[];
}

export const useJourneys = ({
  siteId,
  steps = 3,
  timezone = "UTC",
  time,
}: JourneyParams) => {
  const { startDate, endDate } = getStartAndEndDate(time);

  return useQuery<JourneysResponse>({
    queryKey: ["journeys", siteId, steps, startDate, endDate, timezone],
    queryFn: async () => {
      let url = `${BACKEND_URL}/journeys/${siteId}`;
      const params = new URLSearchParams();

      if (steps) params.append("steps", steps.toString());
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (timezone) params.append("timezone", timezone);

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const response = await authedFetch(url);
      return response.json();
    },
  });
};
