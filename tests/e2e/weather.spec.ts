import { expect, test } from "@playwright/test";
test("weather updates after an hour without reloading the page", async ({
  page,
}) => {
  let requests = 0;
  await page.clock.install();
  await page.route("**/api/weather", (route) => {
    requests++;
    return route.fulfill({
      json: {
        current: { temperature_2m: 18 + requests * 3, weather_code: 1000 },
        daily: {
          time: Array.from({ length: 7 }, (_, i) => `2026-09-0${i + 1}`),
          temperature_2m_max: Array(7).fill(25),
          temperature_2m_min: Array(7).fill(12),
          weather_code: [1135, 1009, 1183, 1213, 1255, 1276, 1000],
        },
      },
    });
  });
  await page.goto("/");
  const weather = page
    .locator("header summary")
    .filter({ hasText: "Йосипівка" });
  await expect(weather).toContainText("21°");
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "hidden",
    });
    document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
  });
  await page.clock.fastForward(3600001);
  await expect(weather).toContainText("24°");
  expect(requests).toBe(2);
  // Simulate a suspended browser: wall time advances while timers do not run.
  const now = await page.evaluate(() => Date.now());
  await page.clock.setSystemTime(now + 2 * 3600000);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    document.dispatchEvent(new Event("visibilitychange", { bubbles: true }));
  });
  await expect(weather).toContainText("27°");
  expect(requests).toBe(3);
  await weather.click();
  await expect(
    page.getByRole("img", { name: "Туман", exact: true }),
  ).toHaveAttribute("viewBox", "0 0 64 64");
  await expect(page.getByRole("img", { name: "Сніг", exact: true })).toHaveAttribute("viewBox", "0 0 64 64");
  await expect(
    page.getByRole("img", { name: "Гроза", exact: true }),
  ).toHaveAttribute("viewBox", "0 0 64 64");
});
