import "server-only";
import { unstable_cache } from "next/cache";
import { z } from "zod/v4";
import { env } from "./env";
const conditionSchema = z.object({
  code: z.number().int(),
  text: z.string().min(1).max(200),
});
const providerSchema = z.object({
  current: z.object({
    temp_c: z.number(),
    is_day: z.union([z.literal(0), z.literal(1)]),
    condition: conditionSchema,
  }),
  forecast: z.object({
    forecastday: z
      .array(
        z.object({
          date: z.iso.date(),
          day: z.object({
            maxtemp_c: z.number(),
            mintemp_c: z.number(),
            condition: conditionSchema,
          }),
        }),
      )
      .min(1)
      .max(7),
  }),
});
// Keep the public response small: provider credentials and unrelated fields never leave the server.
export type WeatherData = {
  current: {
    temperature_2m: number;
    weather_code: number;
    is_day: 0 | 1;
    condition_text: string;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    condition_text: string[];
  };
};
export function getWeather(): Promise<WeatherData> {
  const hour = Math.floor(Date.now() / 3600000);
  return unstable_cache(
    async () => {
      if (!env.WEATHERAPI_KEY) throw new Error("WEATHER_NOT_CONFIGURED");
      const url = new URL("https://api.weatherapi.com/v1/forecast.json");
      url.search = new URLSearchParams({
        key: env.WEATHERAPI_KEY,
        q: "50.387776170682585,29.5044316558184",
        days: "7",
        lang: "uk",
        aqi: "no",
        alerts: "no",
      }).toString();
      try {
        const response = await fetch(url, {
          cache: "no-store",
          signal: AbortSignal.timeout(12000),
        });
        if (!response.ok) throw new Error("WEATHER_UNAVAILABLE");
        const data = providerSchema.parse(await response.json());
        const days = data.forecast.forecastday;
        return {
          current: {
            temperature_2m: data.current.temp_c,
            weather_code: data.current.condition.code,
            is_day: data.current.is_day,
            condition_text: data.current.condition.text,
          },
          daily: {
            time: days.map((day) => day.date),
            temperature_2m_max: days.map((day) => day.day.maxtemp_c),
            temperature_2m_min: days.map((day) => day.day.mintemp_c),
            weather_code: days.map((day) => day.day.condition.code),
            condition_text: days.map((day) => day.day.condition.text),
          },
        };
      } catch {
        // Never propagate provider payloads or fetch errors containing the URL/key.
        throw new Error("WEATHER_UNAVAILABLE");
      }
    },
    ["weatherapi-yosypivka-v1", String(hour)],
    { revalidate: 3600 },
  )();
}
