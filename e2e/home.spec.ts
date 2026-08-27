import { expect, test } from "@playwright/test";

test("visitor can browse the live brawl and discover a product", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Where products.*compete for attention/i })).toBeVisible();
  await expect(page.getByText("The Daily Brawl", { exact: true }).first()).toBeVisible();
  await page.getByRole("link", { name: "Discover", exact: true }).first().click();
  await expect(page).toHaveURL(/\/discover$/);
  await expect(page.getByRole("heading", { name: /Discover the next thing/i })).toBeVisible();
});
