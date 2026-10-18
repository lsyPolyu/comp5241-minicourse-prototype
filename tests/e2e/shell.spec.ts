import { expect, test } from "@playwright/test";

test("the local application renders its shell without a runtime error", async ({ page }) => {
  const runtimeErrors: string[] = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(runtimeErrors).toEqual([]);
});

test("global destinations and breadcrumbs give an accurate return path", async ({ page }) => {
  await page.goto("/");
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  await expect(navigation.getByRole("link", { name: "Dashboard", exact: true })).toHaveAttribute("aria-current", "page");
  await navigation.getByRole("link", { name: "Progress", exact: true }).click();
  await expect(page).toHaveURL("/progress");
  await expect(page.getByRole("heading", { level: 1, name: "Progress" })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Progress", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(navigation.getByRole("link", { name: "Dashboard", exact: true })).not.toHaveAttribute("aria-current");
  await page.getByRole("navigation", { name: "Breadcrumb", exact: true }).getByRole("link", { name: "Dashboard" }).click();
  await expect(page).toHaveURL("/");
});

test("an unknown address has no false current destination and can return home", async ({ page }) => {
  const response = await page.goto("/this-page-does-not-exist");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "We couldn’t find that page" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Main navigation" }).locator('[aria-current="page"]')).toHaveCount(0);
  await page.getByRole("link", { name: "Return to Dashboard", exact: true }).click();
  await expect(page).toHaveURL("/");
});

test("keyboard users can skip the header and use the controls", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
  await page.keyboard.press("Tab");
  const writingField = page.getByLabel("Writing field", { exact: true });
  await expect(writingField).toBeFocused();
  await writingField.fill("Keyboard example");
  await page.keyboard.press("Tab");
  const errorField = page.getByLabel("Error state example", { exact: true });
  await expect(errorField).toBeFocused();
  await errorField.fill("Clear the example error");
  await expect(errorField).not.toHaveAttribute("aria-invalid", "true");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Focus writing field" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(writingField).toBeFocused();
});

test("the shell reflows at narrow widths with navigation still reachable", async ({ page }) => {
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expect(page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Progress" })).toBeInViewport();
  }
  await page.setViewportSize({ width: 320, height: 900 });
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Progress" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Progress" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
