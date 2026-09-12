import { test, expect } from "@playwright/test";

test("knowledge groups open one at a time and restore the selected group on return", async ({ page }) => {
  await page.goto("/knowledge");
  const about = page.getByRole("button", { name: "Про заклад", exact: true });
  const education = page.getByRole("button", { name: "Організація навчального процесу", exact: true });
  await expect(page.getByRole("button", { name: "Інформація для учнів" })).toHaveCount(0);
  await about.click();
  await expect(about).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByRole("link", { name: "Розклад дзвінків", exact: true })).toHaveCount(0);
  await education.click();
  await expect(about).toHaveAttribute("aria-expanded", "false");
  await expect(education).toHaveAttribute("aria-expanded", "true");
  await page.getByRole("link", { name: "Протоколи педрад", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "Навігаційний шлях" })).toContainText("Організація навчального процесу");
  await expect(page.getByRole("button", { name: /^Відкрити Протокол/ })).toHaveCount(5);
  await page.getByRole("link", { name: "Назад до розділів" }).click();
  await expect(education).toHaveAttribute("aria-expanded", "true");
  await education.click();
  await expect(education).toHaveAttribute("aria-expanded", "false");
});

test("local document modal works with keyboard and shows original download", async ({ page }) => {
  await page.goto("/knowledge/education/protocols");
  const trigger = page.getByRole("button", { name: /^Відкрити Протокол/ }).first();
  await trigger.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("img").first()).toBeVisible();
  await expect(dialog.getByRole("link", { name: "Завантажити PDF" })).toHaveAttribute("download", "");
  await expect(dialog.locator("iframe")).toHaveCount(0);
  await page.keyboard.press("Shift+Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.goto("/knowledge/about/territory");
  await page.getByRole("button", { name: /^Відкрити Територія/ }).click();
  await expect(page.getByRole("dialog").getByRole("link", { name: "Завантажити DOCX" })).toBeVisible();
  await expect(page.getByRole("dialog").locator("table").first()).toBeVisible();
});

test("knowledge pages, real staff and history fit the viewport; hidden routes stay unavailable", async ({ page }, info) => {
  for (const route of ["/knowledge", "/knowledge/about/information", "/knowledge/about/finance", "/knowledge/transparency/admission", "/school-life", "/history"]) {
    await page.goto(route);
    await expect(page.locator("h1")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), route).toBe(true);
  }
  await expect(page.locator("#school-history")).toContainText("1925");
  await page.goto("/school-life#teachers");
  await expect(page.locator("#teachers h3")).toHaveCount(6);
  await page.goto("/knowledge#about");
  await expect(page.getByRole("button", { name: "Про заклад", exact: true })).toHaveAttribute("aria-expanded", "true");
  await page.screenshot({ path: `test-results/knowledge-${info.project.name}.png`, fullPage: true });
  const response = await page.goto("/knowledge/about/facilities");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { name: "Такої сторінки ще немає" })).toBeVisible();
});

test("hidden, unknown and mismatched knowledge URLs return HTTP 404", async ({ request }) => {
  for (const path of [
    "/knowledge/about/programs",
    "/knowledge/transparency/license",
    "/knowledge/students/information",
    "/knowledge/about/protocols",
    "/knowledge/about/nonexistent",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(404);
  }
  const published = await request.get("/knowledge/education/protocols");
  expect(published.status()).toBe(200);
});
