import { expect, test } from "@playwright/test";

const course = "/courses/requirement-clarification";
const lesson2 = `${course}/lessons/what-to-ask`;
const answer = "A constraint is a limit the solution must respect, such as the devices students can use.";
const success = (text: string) => ({ ok: true, requestId: "controlled-test", data: text });
const failure = { ok: false, requestId: "controlled-failure", error: { code: "TIMEOUT", message: "The Tutor took too long. Your work is still here. Retry.", retryable: true } };

for (const width of [1440, 390]) {
  test(`Tutor supports questions, failure and exact Retry at ${width}px without completing the lesson`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const requests: unknown[] = [];
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let release!: () => void;
    const waiting = new Promise<void>((resolve) => { release = resolve; });
    await page.route("**/api/ai/tutor", async (route) => {
      requests.push(route.request().postDataJSON());
      if (requests.length === 1) { await waiting; await route.fulfill({ json: success(answer) }); }
      // A controlled application failure envelope; no provider is contacted.
      else if (requests.length === 2) await route.fulfill({ json: failure });
      else await route.fulfill({ json: success("For example, a tool that must work on phones has a device constraint.") });
    });
    await page.goto("/");
    await page.getByRole("link", { name: "View course", exact: true }).click();
    await page.getByRole("link", { name: "What Should You Ask?", exact: true }).click();
    if (width < 1024) await page.getByText("Open Tutor", { exact: true }).click();
    const input = page.getByLabel("Your question", { exact: true });
    await input.fill("What is a constraint?");
    const send = page.getByRole("button", { name: "Send question", exact: true });
    await send.focus();
    await page.keyboard.press("Enter");
    await expect(send).toBeDisabled();
    await expect(input).toHaveValue("What is a constraint?");
    await expect(page.getByRole("status", { name: "Tutor request status" })).toContainText("answering");
    await expect(page.getByRole("article", { name: "Lesson content" })).toContainText("Five things to clarify");
    await expect.poll(() => requests.length).toBe(1);
    release();
    await expect(page.getByRole("log")).toContainText(answer);
    await expect(input).toBeFocused();
    await expect(page.getByRole("button", { name: "Complete Lesson", exact: true })).toBeEnabled();
    await page.getByRole("navigation", { name: "Main navigation" }).getByRole("link", { name: "Progress", exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    await page.getByRole("link", { name: "Return to this lesson", exact: true }).click();
    await expect(page).toHaveURL(lesson2);
    if (width < 1024) await page.getByText("Open Tutor", { exact: true }).click();
    await expect(page.getByRole("log")).toContainText(answer);
    await input.fill("Can you give a simpler example?");
    await send.click();
    await expect(page.getByRole("complementary", { name: "Ask AI Tutor" }).getByRole("alert")).toContainText("Your work is still here");
    await expect(input).toHaveValue("Can you give a simpler example?");
    await expect(page.getByRole("log")).toContainText(answer);
    await input.fill("A new draft to keep");
    const retry = page.getByRole("button", { name: "Retry", exact: true });
    await retry.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("log")).toContainText("a device constraint");
    expect(requests[2]).toEqual(requests[1]);
    expect(requests[1]).toEqual({ courseId: "requirement-clarification", lessonId: "what-to-ask", question: "Can you give a simpler example?", conversation: [{ role: "user", content: "What is a constraint?" }, { role: "assistant", content: answer }] });
    await expect(page.getByRole("log").getByText("Can you give a simpler example?", { exact: true })).toHaveCount(1);
    await expect(input).toHaveValue("A new draft to keep");
    await expect(input).toBeFocused();
    await expect(retry).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole("button", { name: "Complete Lesson", exact: true }).click();
    await page.getByRole("link", { name: "Back to course", exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "25");
    expect(errors).toEqual([]);
  });
}

test("a reply arriving after navigation stays in its original lesson session", async ({ page }) => {
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/ai/tutor", async (route) => { await waiting; await route.fulfill({ json: success(answer) }); });
  await page.goto(lesson2);
  await page.getByLabel("Your question", { exact: true }).fill("What is a constraint?");
  await page.getByRole("button", { name: "Send question", exact: true }).click();
  await page.getByRole("link", { name: "Previous: Lesson 1" }).click();
  release();
  await expect(page.getByRole("log")).toHaveCount(0);
  await page.getByRole("link", { name: "Next: Lesson 2" }).click();
  await expect(page.getByRole("log")).toContainText(answer);
  await page.getByRole("link", { name: "Back to course", exact: true }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
});
