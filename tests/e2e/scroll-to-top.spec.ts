import { expect, test } from "@playwright/test";
test("scroll-to-top appears after one viewport and returns public pages to the start", async ({
  page,
}) => {
  for (const route of ["/", "/history", "/classes/1"]) {
    await page.goto(route);
    const button = page.getByRole("button", {
      name: "Прокрутити на початок сторінки",
      includeHidden: true,
    });
    await expect(button).toBeHidden();
    await page.evaluate(() =>
      window.scrollTo({ top: window.innerHeight - 1, behavior: "instant" }),
    );
    await expect(button).toBeHidden();
    await page.evaluate(() =>
      window.scrollTo({ top: window.innerHeight + 100, behavior: "instant" }),
    );
    await expect(button).toBeVisible();
    const box = await button.boundingBox();
    expect(box!.width).toBe(box!.height);
    expect(box!.width).toBeGreaterThanOrEqual(44);
    await button.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(button).toBeHidden();
  }
});
test("scroll-to-top respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/history");
  await page.evaluate(() =>
    window.scrollTo({ top: window.innerHeight + 100, behavior: "instant" }),
  );
  const button = page.getByRole("button", {
    name: "Прокрутити на початок сторінки",
  });
  await expect(button).toBeVisible();
  await button.click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
