import { expect, test } from "@playwright/test";

test("visitor can use the Brawl Arena vote and prediction surfaces", async ({ page }) => {
  await page.goto("/brawls");
  await expect(page.getByRole("heading", { name: /Where ideas.*meet their match/i })).toBeVisible();
  const liveHeading = page.getByText("Live Now", { exact: true });
  if (await liveHeading.count()) {
    await liveHeading.first().scrollIntoViewIfNeeded();
    await page.getByRole("link", { name: "View details" }).first().click();
    await expect(page).toHaveURL(/\/brawl\//);
    await expect(page.getByText("Your prediction", { exact: true })).toBeVisible();
  } else {
    await expect(page.getByText(/No Brawls are live right now|No Brawls in this state/i).first()).toBeVisible();
  }
});

test("competitive utility routes are public and legacy Brawl URLs redirect", async ({ page }) => {
  for (const route of ["/leagues", "/seasons", "/quests", "/picks", "/tastemakers", "/hall-of-fame"]) {
    await page.goto(route);
    await expect(page.locator("main h2").first()).toBeVisible();
  }
  await page.goto("/battles");
  await expect(page).toHaveURL(/\/brawls$/);
});
