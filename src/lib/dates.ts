import { TIME_ZONE } from "./constants";

export function localDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function weekStart(now = new Date(), editing = false) {
  const date = new Date(`${localDate(now)}T12:00:00Z`);
  const day = date.getUTCDay();
  date.setUTCDate(
    date.getUTCDate() -
      ((day + 6) % 7) +
      (editing && (day === 0 || day === 6) ? 7 : 0),
  );
  return date.toISOString().slice(0, 10);
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
