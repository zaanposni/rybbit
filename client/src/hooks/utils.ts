import { Time } from "@/lib/timeSelectionStore";

export function getStartAndEndDate(time: Time) {
  if (time.mode === "range") {
    return { startDate: time.startDate, endDate: time.endDate };
  }
  if (time.mode === "month") {
    return { startDate: time.month, endDate: time.month };
  }
  if (time.mode === "year") {
    return { startDate: time.year, endDate: time.year };
  }
  if (time.mode === "week") {
    return { startDate: time.week, endDate: time.week };
  }
  return { startDate: time.day, endDate: time.day };
}

export async function authedFetch(url: string) {
  return fetch(url, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  }).then((res) => res.json());
}
