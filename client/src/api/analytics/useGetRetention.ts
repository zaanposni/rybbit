import { useQuery } from "@tanstack/react-query";
import { BACKEND_URL } from "../../lib/const";
import { useStore } from "../../lib/store";
import { authedFetch } from "../utils";

// Define the interface for processed retention data
export interface ProcessedRetentionData {
  cohorts: Record<string, { size: number; percentages: (number | null)[] }>;
  maxPeriods: number;
  mode: "day" | "week";
}

export type RetentionMode = "day" | "week";

export function useGetRetention(mode: RetentionMode = "week") {
  const { site } = useStore();
  return useQuery<ProcessedRetentionData>({
    queryKey: ["retention", site, mode],
    queryFn: () =>
      authedFetch(`${BACKEND_URL}/retention/${site}?mode=${mode}`)
        .then((res) => res.json())
        .then((data) => data.data),
  });
}
