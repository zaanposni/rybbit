import { clsx, type ClassValue } from "clsx";
import { countries } from "countries-list";
import { Duration } from "luxon";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatter = Intl.NumberFormat("en", {
  notation: "compact",
}).format;

export function formatSecondsAsMinutesAndSeconds(value: number) {
  const duration = Duration.fromMillis(value * 1000);
  const hours = Math.floor(duration.as("hours"));
  const minutes = Math.floor(duration.as("minutes") % 60);
  const seconds = Math.floor(duration.as("seconds") % 60);

  if (hours > 0) {
    return `${hours}hr ${minutes}min`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const getCountryName = (countryCode: string) => {
  return countries[countryCode as keyof typeof countries]?.name;
};

export function formatDuration(seconds: number): string {
  if (!seconds) return "0s";

  const duration = Duration.fromObject({ seconds });

  if (seconds < 60) {
    return duration.toFormat("s'S'");
  } else if (seconds < 3600) {
    return duration.toFormat("m'm' s's'");
  } else {
    return duration.toFormat("h'h' m'm'");
  }
}
