"use client";
import { useQuery } from "@tanstack/react-query";
import type { WeatherData } from "@/lib/weather";
import { weatherCondition } from "@/lib/weatherCondition";
import { formatDate } from "@/lib/dates";
import { WeatherIcon } from "../WeatherIcon/WeatherIcon";
import { Loader } from "../Loader/Loader";
import styles from "./WeatherWidget.module.scss";
export function WeatherWidget() {
  const query = useQuery<WeatherData>({
    queryKey: ["weather", "weatherapi"],
    queryFn: async () => {
      const response = await fetch("/api/weather", { cache: "no-store" });
      if (!response.ok) throw new Error("WEATHER_FAILED");
      return response.json();
    },
    staleTime: 3600000,
    refetchInterval: 3600000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: false,
  });
  if (query.isError)
    return (
      <details className={styles.weather}>
        <summary>☀ Погода недоступна</summary>
        <div className={styles.forecast}>
          <button className="secondary" onClick={() => void query.refetch()}>
            Не вдалося оновити погоду. Натисни на мене, щоб спробувати ще раз.
          </button>
        </div>
      </details>
    );
  if (!query.data)
    return (
      <details className={styles.weather}>
        <summary>☀ Погода…</summary>
        <div className={styles.forecast}>
          <Loader label="Дізнаємося погоду в Йосипівці…" />
        </div>
      </details>
    );
  const data = query.data;
  const current = weatherCondition(
    data.current.weather_code,
    data.current.is_day !== 0,
    data.current.condition_text,
  );
  return (
    <details className={styles.weather}>
      <summary>
        <span role="img" aria-label={current.label} title={current.label}>
          {current.icon}
        </span>
        <strong>{Math.round(data.current.temperature_2m)}°</strong>
        <span>Йосипівка</span>
        <svg
          className={styles.chevron}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </summary>
      <div className={styles.forecast}>
        <strong>
          Зараз: {current.label} ·{" "}
          {data.daily.time.length === 7
            ? "прогноз на тиждень"
            : `прогноз на ${data.daily.time.length} дні`}
        </strong>
        <div>
          {data.daily.time.map((date, index) => (
            <div key={date}>
              <small>{formatDate(date, { weekday: "long" })}</small>
              <WeatherIcon
                code={data.daily.weather_code[index]}
                description={data.daily.condition_text?.[index]}
              />
              <b>{Math.round(data.daily.temperature_2m_max[index])}°</b>
              <small>{Math.round(data.daily.temperature_2m_min[index])}°</small>
            </div>
          ))}
        </div>
        <small>
          Іконки вище показують прогноз на день, а не погоду зараз.{" "}
        </small>
        <a href="https://www.weatherapi.com/" target="_blank" rel="noreferrer">
          Дані WeatherAPI.com
        </a>
      </div>
    </details>
  );
}
