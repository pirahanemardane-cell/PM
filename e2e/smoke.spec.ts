import { test, expect } from "@playwright/test";

test.describe("storefront smoke", () => {
  test("home returns 200 and has main landmark", async ({ page }) => {
    const res = await page.goto("/", { waitUntil: "domcontentloaded" });
    expect(res?.ok()).toBeTruthy();
    await expect(page.locator("#main-content, main").first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("products listing loads", async ({ page }) => {
    const res = await page.goto("/products", { waitUntil: "domcontentloaded" });
    expect(res?.ok()).toBeTruthy();
  });

  test("cart page loads", async ({ page }) => {
    const res = await page.goto("/cart", { waitUntil: "domcontentloaded" });
    expect(res?.ok()).toBeTruthy();
  });

  test("health api ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
  });
});
