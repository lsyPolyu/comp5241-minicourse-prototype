import { expect, test } from "@playwright/test";

const course = "/courses/requirement-clarification";
const titles = ["What is Requirement Clarification?", "What Should You Ask?", "From Conversation to Structured Requirements"];

for (const width of [1440, 390]) {
  test(`explicit completion stays consistent across the learning path at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    const aiRequests: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("request", (request) => { if (new URL(request.url()).pathname.startsWith("/api/")) aiRequests.push(request.url()); });
    const noOverflow = async () => expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

    await page.goto("/");
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    await page.getByRole("link", { name: "View course", exact: true }).click();
    await page.getByRole("link", { name: titles[0], exact: true }).click();
    await page.getByRole("article").evaluate((node) => node.scrollIntoView({ block: "end" }));
    await expect(page.getByRole("button", { name: "Complete Lesson", exact: true })).toBeEnabled();
    await page.getByRole("link", { name: "Back to course", exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    await page.getByRole("link", { name: "Continue Learning", exact: true }).click();
    await page.getByRole("button", { name: "Complete Lesson", exact: true }).click();
    await expect(page.getByRole("button", { name: "Completed", exact: true })).toBeDisabled();
    await expect(page.getByRole("status", { name: "Lesson completion" })).toHaveText("This lesson is completed.");
    await noOverflow();
    await page.getByRole("link", { name: "Back to course", exact: true }).click();
    const firstRow = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: titles[0], exact: true }) });
    await expect(firstRow).toContainText("Completed");
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Progress", exact: true }).click();
    await expect(page.getByText("1 of 3 lessons completed", { exact: true })).toBeVisible();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    await noOverflow();

    await page.getByRole("link", { name: "Continue Learning", exact: true }).click();
    await expect(page).toHaveURL(`${course}/lessons/what-to-ask`);
    await page.getByText("Ask AI Tutor", { exact: true }).click();
    await expect(page.getByText(/The Tutor is not available yet/)).toBeVisible();
    await page.getByRole("link", { name: "Next: Lesson 3" }).click();
    await page.getByRole("link", { name: "Previous: Lesson 2" }).click();
    await page.getByRole("button", { name: "Complete Lesson", exact: true }).click();
    await page.getByRole("link", { name: "Back to course", exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    await page.getByRole("link", { name: "Continue Learning", exact: true }).click();
    await expect(page).toHaveURL(`${course}/lessons/structure-requirements`);
    await page.getByRole("button", { name: "Complete Lesson", exact: true }).click();
    await page.getByRole("link", { name: "Back to course", exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "75");
    await expect(page.getByText("3 of 3 lessons completed", { exact: true })).toBeVisible();
    await expect(page.getByText("Activity incomplete", { exact: true })).toBeVisible();
    await expect(page.getByText("Course Complete", { exact: true })).toHaveCount(0);
    await page.getByRole("link", { name: "Continue Learning", exact: true }).click();
    await expect(page).toHaveURL(`${course}/activity`);
    await expect(page.getByText("Practice is not available yet", { exact: true })).toBeVisible();
    await noOverflow();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Progress", exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "75");
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Dashboard", exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "75");
    await expect(page.getByRole("link", { name: "Continue Learning", exact: true })).toHaveAttribute("href", `${course}/activity`);
    await noOverflow();
    expect(errors).toEqual([]);
    expect(aiRequests).toEqual([]);
  });
}

test("current lesson survives route navigation; continue points to the first incomplete lesson", async ({ page }) => {
  await page.goto(`${course}/lessons/structure-requirements`);
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Progress", exact: true }).click();
  await expect(page.getByText(/Last opened: Lesson 3/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Return to this lesson" })).toHaveAttribute("href", `${course}/lessons/structure-requirements`);
  await expect(page.getByRole("link", { name: "Continue Learning" })).toHaveAttribute("href", `${course}/lessons/why-clarify`);
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
});

test("keyboard completion works and a fresh visit has no persisted completion", async ({ page }) => {
  await page.goto(`${course}/lessons/why-clarify`);
  const button = page.getByRole("button", { name: "Complete Lesson", exact: true });
  await button.focus();
  await expect(button).toBeFocused();
  expect(await button.evaluate((node) => getComputedStyle(node).outlineStyle)).toBe("solid");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "Completed", exact: true })).toBeDisabled();
  await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Progress", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
  await page.reload();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  await expect(page.getByText(/Refreshing or reopening the site starts a new session/)).toBeVisible();
});
