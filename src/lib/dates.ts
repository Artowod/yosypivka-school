import { TIME_ZONE } from "./constants";

export function localDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function formatDate(
  value: string,
  options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  },
) {
  return new Intl.DateTimeFormat("uk-UA", {
    timeZone: TIME_ZONE,
    ...options,
  }).format(new Date(value.length === 10 ? `${value}T12:00:00Z` : value));
}
export function currentDay(now = new Date()) {
  return (new Date(`${localDate(now)}T12:00:00Z`).getUTCDay() + 6) % 7;
}
