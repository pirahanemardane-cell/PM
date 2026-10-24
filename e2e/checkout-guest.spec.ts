import { test, expect } from "@playwright/test";

test.describe("checkout path", () => {
  test("checkout page responds", async ({ page }) => {
    const res = await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    expect(res).toBeTruthy();
    expect(res!.status()).toBeLessThan(500);
  });
});
