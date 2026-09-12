import { weatherCondition } from "@/lib/weatherCondition";
import styles from "./WeatherIcon.module.scss";

export function WeatherIcon({
  code,
  description,
}: {
  code: number;
  description?: string;
}) {
  const { icon, label } = weatherCondition(code, true, description);
  const sunny = ["☀", "⛅", "🌦"].includes(icon);
  const rainy = ["🌦", "🌧", "🌨", "⛈"].includes(icon);
  const snowy = ["❄", "🌨"].includes(icon);
  const foggy = icon === "🌫";
  const cloudy = icon !== "☀" && icon !== "—";
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 64 64"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      {sunny && (
        <g stroke="#efb438" strokeWidth="3" strokeLinecap="round">
          <path d="M23 5v4m0 29v4M5 23h4m29 0h4M10 10l3 3m20 20 3 3M10 36l3-3m20-20 3-3" />
          <circle cx="23" cy="23" r="11" fill="#ffda62" stroke="#f3b944" />
        </g>
      )}
      {cloudy && (
        <g>
          <path
            d="M14 38a9 9 0 0 1 0-18 13 13 0 0 1 25-2 10 10 0 0 1 13 10 7 7 0 0 1-1 10Z"
            fill="#8ebdd5"
          />
          <path
            d="M20 41a8 8 0 0 1-1-16 12 12 0 0 1 22-1 9 9 0 1 1 9 17Z"
            fill="#e2f3fc"
            stroke="#79afcb"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </g>
      )}
      {rainy && (
        <g fill="#4aa7df">
          <path d="M20 43s-5 6-5 9a3 3 0 0 0 6 0c0-3-1-9-1-9Z" />
          <path d="M44 44s-5 6-5 9a3 3 0 0 0 6 0c0-3-1-9-1-9Z" />
          {!snowy && icon !== "⛈" && (
            <path d="M32 46s-5 6-5 9a3 3 0 0 0 6 0c0-3-1-9-1-9Z" />
          )}
        </g>
      )}
      {snowy && (
        <g stroke="#5b9fcc" strokeWidth="2" strokeLinecap="round">
          <path d="M31 44v14m-6-11 12 8m-12 0 12-8" />
          {!rainy && (
            <path d="M15 45v10m-4-8 8 6m-8 0 8-6m29-8v10m-4-8 8 6m-8 0 8-6" />
          )}
        </g>
      )}
      {foggy && (
        <g strokeWidth="3" strokeLinecap="round">
          <path d="M10 46h31m5 0h8M18 57h30" stroke="#8ebbc0" />
          <path d="M7 52h12m6 0h31" stroke="#b9ccd7" />
        </g>
      )}
      {icon === "⛈" && (
        <path
          d="m32 36-7 15h7l-3 11 14-18h-8l4-8Z"
          fill="#ffd35d"
          stroke="#e5aa31"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      )}
      {icon === "—" && (
        <g>
          <circle cx="32" cy="32" r="20" fill="#e3f0f5" />
          <path
            d="M24 32h16"
            stroke="#79afcb"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}
