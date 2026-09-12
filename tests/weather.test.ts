import { afterEach, beforeEach, expect, it, vi } from "vitest";
const cache = vi.hoisted(() => new Map<string, unknown>());
vi.mock("next/cache", () => ({
  unstable_cache: (fn: () => Promise<unknown>, keys: string[]) => async () => {
    const key = JSON.stringify(keys);
    if (cache.has(key)) return cache.get(key);
    const data = await fn();
    cache.set(key, data);
    return data;
  },
}));
vi.mock("@/lib/env", () => ({ env: { WEATHERAPI_KEY: "test-weather-key" } }));
vi.mock("@/lib/logging", () => ({ logError: vi.fn() }));
import { getWeather } from "@/lib/weather";
import { GET } from "@/app/api/weather/route";
const forecast = (temperature: number, count = 7) => ({
  current: {
    temp_c: temperature,
    is_day: 1,
    condition: { code: 1000, text: "Ясно" },
  },
  forecast: {
    forecastday: Array.from({ length: count }, (_, i) => ({
      date: `2026-09-0${i + 1}`,
      day: {
        maxtemp_c: temperature,
        mintemp_c: 12,
        condition: { code: 1000, text: "Ясно" },
      },
    })),
  },
});
beforeEach(() => {
  cache.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-05T10:15:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it("shares the forecast within an hour but returns fresh data on the first request of the next hour", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(Response.json(forecast(21)))
    .mockResolvedValueOnce(Response.json(forecast(24)));
  vi.stubGlobal("fetch", fetchMock);
  expect((await getWeather()).current.temperature_2m).toBe(21);
  vi.setSystemTime(new Date("2026-09-05T10:59:59Z"));
  expect((await getWeather()).current.temperature_2m).toBe(21);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const url = new URL(fetchMock.mock.calls[0][0]);
  expect(url.hostname).toBe("api.weatherapi.com");
  expect(url.searchParams.get("q")).toBe("50.387776170682585,29.5044316558184");
  expect(url.searchParams.get("lang")).toBe("uk");
  expect(url.searchParams.get("days")).toBe("7");
  vi.setSystemTime(new Date("2026-09-05T11:00:00Z"));
  expect((await getWeather()).current.temperature_2m).toBe(24);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
it("does not add a second browser/CDN cache to the server cache", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json(forecast(21))),
  );
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
});
it("does not cache failed upstream requests, so retry can recover", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(Response.json(forecast(24))),
  );
  expect((await GET()).status).toBe(503);
  expect((await GET()).status).toBe(200);
});

it("accepts shorter forecasts available on the provider plan without inventing days or leaking secrets", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(Response.json(forecast(21, 3))),
  );
  const response = await GET();
  const data = await response.json();
  expect(data.daily.time).toHaveLength(3);
  expect(data.current.condition_text).toBe("Ясно");
  expect(JSON.stringify(data)).not.toContain("test-weather-key");
});
it("hides provider error details and credentials", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockRejectedValue(
        new Error("https://api.weatherapi.com/?key=test-weather-key"),
      ),
  );
  const response = await GET();
  expect(response.status).toBe(503);
  expect(await response.text()).not.toContain("test-weather-key");
});
