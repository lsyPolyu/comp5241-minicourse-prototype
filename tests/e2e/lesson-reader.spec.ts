import { expect, test } from "@playwright/test";

const course = "/courses/requirement-clarification";

test("three real lessons support previous/next navigation and an activity return path", async ({ page }) => {
  await page.goto(`${course}/lessons/why-clarify`);
  const navigation = page.getByRole("navigation", { name: "Lesson navigation" });
  await expect(page.getByRole("article", { name: "Lesson content" })).toContainText("An assumption");
  await expect(navigation.getByRole("link", { name: /Previous/ })).toHaveCount(0);
  await expect(page.getByRole("navigation", { name: "Breadcrumb", exact: true })).toContainText("Clarification Basics");
  await navigation.getByRole("link", { name: "Next: Lesson 2" }).click();
  await expect(page.getByRole("article")).toContainText("Which task should be easier?");
  await navigation.getByRole("link", { name: "Next: Lesson 3" }).click();
  await expect(page.getByRole("article")).toContainText("Acceptance Criteria");
  await expect(page.getByRole("article")).toContainText("Out of Scope");
  await navigation.getByRole("link", { name: "Previous: Lesson 2" }).click();
  await expect(page).toHaveURL(`${course}/lessons/what-to-ask`);
  await navigation.getByRole("link", { name: "Next: Lesson 3" }).click();
  await navigation.getByRole("link", { name: "Next: Activity" }).click();
  await expect(page).toHaveURL(`${course}/activity`);
});

test("lesson content and navigation reflow without horizontal scrolling", async ({ page }) => {
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${course}/lessons/structure-requirements`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("article")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("navigation", { name: "Lesson navigation" }).getByRole("link", { name: "Previous: Lesson 2" }).click();
    await expect(page).toHaveURL(`${course}/lessons/what-to-ask`);
  }
});
