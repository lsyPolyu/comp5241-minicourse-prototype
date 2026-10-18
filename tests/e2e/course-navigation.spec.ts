import { expect, test } from "@playwright/test";

const course = "/courses/requirement-clarification";
const lessons = [
  ["why-clarify", "What is Requirement Clarification?"],
  ["what-to-ask", "What Should You Ask?"],
  ["structure-requirements", "From Conversation to Structured Requirements"],
];

test("Dashboard has one available course and three unlinked Coming Soon entries", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("article")).toHaveCount(4);
  for (const title of ["Git Basics", "Working with AI Coding Agents", "Communication Skills"]) {
    const entry = page.getByRole("article").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
    await expect(entry).toContainText("Coming Soon");
    await expect(entry.getByRole("link")).toHaveCount(0);
    await expect(entry.getByRole("paragraph")).toHaveCount(0);
  }
  await page.getByRole("link", { name: "View course", exact: true }).click();
  await expect(page).toHaveURL(course);
  await expect(page.getByRole("heading", { name: "Clarification Basics", exact: true })).toBeVisible();
});

test("the outline opens each registered lesson and the activity shell", async ({ page }) => {
  await page.goto(course);
  for (const [id, title] of lessons) {
    await page.getByRole("link", { name: title, exact: true }).click();
    await expect(page).toHaveURL(`${course}/lessons/${id}`);
    await expect(page.getByRole("heading", { level: 1, name: title, exact: true })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main navigation" }).locator("[aria-current]")).toHaveCount(0);
    await page.getByRole("link", { name: "Back to course", exact: true }).click();
  }
  await page.getByRole("link", { name: "AI Client Requirement Clarification", exact: true }).click();
  await expect(page).toHaveURL(`${course}/activity`);
  await expect(page.getByRole("heading", { level: 1, name: "AI Client Requirement Clarification" })).toBeVisible();
  await expect(page.getByText("Practice is not available yet", { exact: true })).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveCount(0);
});

test("unknown courses, lessons and Coming Soon URLs show not-found", async ({ page }) => {
  for (const url of ["/courses/missing", "/courses/git-basics", `${course}/lessons/missing`, "/courses/git-basics/activity", "/courses/missing/lessons/why-clarify"]) {
    await page.goto(url);
    await expect(page.getByRole("heading", { level: 1, name: "We couldn’t find that page" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Return to Dashboard" })).toBeVisible();
  }
});
