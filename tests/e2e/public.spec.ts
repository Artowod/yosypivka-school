import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  // Deterministic external weather fixture; application routes and actions are real.
  await page.route("**/api/weather", (route) =>
    route.fulfill({
      json: {
        current: { temperature_2m: 21, weather_code: 1000 },
        daily: {
          time: [
            "2026-09-05",
            "2026-09-06",
            "2026-09-07",
            "2026-09-08",
            "2026-09-09",
            "2026-09-10",
            "2026-09-11",
          ],
          temperature_2m_max: [22, 23, 24, 25, 24, 22, 21],
          temperature_2m_min: [12, 13, 14, 15, 14, 12, 11],
          weather_code: [1000, 1003, 1006, 1009, 1000, 1003, 1006],
        },
      },
    }),
  );
});
test("home, class navigation and public schedule", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Маленька школа. Великі мрії." }),
  ).toBeVisible();
  await page.locator("#our-classes").getByRole("link").first().click();
  await expect(
    page.getByRole("heading", { name: "1 клас", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Розклад занять" }),
  ).toBeVisible();
  await expect(page.locator("table")).toHaveCount(6);
  await expect(
    page.getByRole("button", { name: "Змінити", exact: true }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("lightbox opens, traps focus, closes with Escape and restores focus", async ({
  page,
}) => {
  await page.goto("/classes/1/gallery");
  const trigger = page.getByRole("button", { name: /Відкрити Фото/ }).first();
  await trigger.click();
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  await expect(modal.locator("img")).toBeVisible();
  await page.keyboard.press("Tab");
  expect(
    await page.evaluate(
      () => document.activeElement?.closest("dialog") !== null,
    ),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(modal).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
test("archive loads more records, bounds DOM, preserves URL filters", async ({
  page,
}) => {
  await page.goto("/archive");
  await expect(
    page.getByRole("button", { name: /Відкрити Фото/ }).first(),
  ).toBeVisible();
  for (let i = 0; i < 25; i++) {
    await page.evaluate(() =>
      window.scrollTo(0, document.body.scrollHeight - 600),
    );
    await page.waitForTimeout(350);
    if (await page.getByText("Усі світлини цього періоду вже тут").isVisible())
      break;
  }
  await expect(
    page.getByText("Усі світлини цього періоду вже тут"),
  ).toBeVisible();
  expect(
    await page.getByRole("button", { name: /Відкрити Фото/ }).count(),
  ).toBeLessThan(100);
  const galleryFilter = page.getByRole("combobox", {
    name: "Галерея",
    exact: true,
  });
  await galleryFilter.click();
  await page.getByRole("option", { name: "2 клас", exact: true }).click();
  await expect(page).toHaveURL(/gallery=class_2/);
  await page.reload();
  await expect(galleryFilter).toHaveText("2 клас");
});
test("responsive pages have no horizontal overflow", async ({ page }, info) => {
  for (const route of [
    "/",
    "/history",
    "/school-life",
    "/classes/4",
    "/archive",
  ]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      ),
      route,
    ).toBe(true);
  }
  await page.goto("/");
  await page.screenshot({
    path: `test-results/home-${info.project.name}.png`,
    fullPage: false,
  });
  await page.goto("/classes/1");
  await page
    .locator("#schedule")
    .screenshot({ path: `test-results/schedule-${info.project.name}.png` });
});
test("unauthenticated admin access and invalid class are handled", async ({
  page,
}) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/classes/9");
  await expect(
    page.getByRole("heading", { name: "Такої сторінки ще немає" }),
  ).toBeVisible();
});

test("navigation sticks at the top and a new route starts at zero", async ({
  page,
}) => {
  const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
  await page.goto("/");
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  const nav = page.getByRole("navigation", { name: "Основна навігація" });
  if (!isMobile) {
    await expect
      .poll(async () => Math.abs((await nav.boundingBox())!.y))
      .toBeLessThan(1);
    await nav.getByRole("link", { name: "Наша історія" }).click();
  } else {
    await page
      .locator("footer")
      .getByRole("link", { name: "Наша історія" })
      .click();
  }
  await expect(page).toHaveURL(/\/history$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  if (isMobile)
    await page.getByRole("button", { name: "Відкрити меню" }).click();
  const classes = nav.locator("details");
  await classes.locator("summary").click();
  await expect(classes).toHaveAttribute("open", "");
  await expect(classes.locator("summary svg")).toBeVisible();
  await classes.locator("summary").click();
  await expect(classes).not.toHaveAttribute("open", "");
  await page.evaluate(() =>
    window.scrollTo({ top: document.body.scrollHeight, behavior: "instant" }),
  );
  await page.locator("footer").getByRole("link", { name: "Фотоархів" }).click();
  await expect(page).toHaveURL(/\/archive$/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("four scenic backgrounds cycle every twenty seconds and respect reduced motion", async ({
  page,
}) => {
  await page.goto("/");
  const scenes = page.locator('body > div[aria-hidden="true"] > div');
  await expect(scenes).toHaveCount(4);
  for (let phase = 0; phase < 4; phase++) {
    await scenes.evaluateAll((elements, phase) => {
      for (const element of elements) {
        for (const animation of element.getAnimations()) {
          animation.pause();
          animation.currentTime = phase * 20000 + 1000;
        }
      }
    }, phase);
    await expect(scenes.nth(phase)).toHaveCSS("opacity", "1");
    await expect(scenes.nth((phase + 1) % 4)).toHaveCSS("opacity", "0");
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(scenes.first()).toHaveCSS("animation-name", "none");
  await expect(scenes.first()).toHaveCSS("opacity", "1");
});

test("archive dropdowns support keyboard, outside click and month URL state", async ({ page }) => {
  await page.goto("/archive");
  const month = page.getByRole("combobox", { name: "Місяць", exact: true });
  const gallery = page.getByRole("combobox", { name: "Галерея", exact: true });
  await expect(month).toBeDisabled();
  await page.getByRole("spinbutton", { name: "Рік" }).fill("2026");
  await page.getByRole("heading", { level: 1 }).click();
  await expect(month).toBeEnabled();
  await month.click();
  await expect(month).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("listbox", { name: "Місяць" })).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/month=1/);
  await expect(month).toHaveText("січень");
  await expect(month).toBeFocused();
  await gallery.click();
  await page.keyboard.press("Escape");
  await expect(gallery).toHaveAttribute("aria-expanded", "false");
  await gallery.click();
  await page.getByRole("heading", { level: 1 }).click();
  await expect(gallery).toHaveAttribute("aria-expanded", "false");
  await page.reload();
  await expect(month).toHaveText("січень");
});
