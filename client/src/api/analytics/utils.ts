import { Time } from "../../components/DateSelector/types";
import { getStartAndEndDate } from "../utils";

/**
 * Generates URL query parameters for time filtering
 * @param time Time object from store
 * @returns URL query string with time parameters
 */
export function getQueryTimeParams(time: Time): string {
  const { startDate, endDate } = getStartAndEndDate(time);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const params = new URLSearchParams();

  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  params.append("timezone", timezone);

  return params.toString();
}
