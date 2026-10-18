import { expect, test } from "@playwright/test";
const course = "/courses/requirement-clarification";
const activity = `${course}/activity`;
const opening = "Hi, I'm Maya. Our club needs a simple website so students can sign up for events more easily. Can you help us work out what it should do?";
const users = "The main users are students at our university, including people who have never joined the club. Most will use their phones. I also need to see who has registered.";
const failure = { ok: false, requestId: "controlled", error: { code: "TIMEOUT", message: "Maya took too long. Your work is still here. Retry.", retryable: true } };
const success = (reply: string, factIds: string[] = []) => ({ ok: true, requestId: "controlled", data: { reply, factIds, disclosedFactIds: factIds } });

for (const width of [1440, 1024, 768, 320]) {
  test(`Client opening, failure and exact Retry preserve work at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 950 });
    const requests: unknown[] = [];
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let release!: () => void;
    const waiting = new Promise<void>((resolve) => { release = resolve; });
    await page.route("**/api/ai/client", async (route) => {
      requests.push(route.request().postDataJSON());
      if (requests.length === 1 || requests.length === 4) await route.fulfill({ status: 504, json: failure });
      else if (requests.length === 2) { await waiting; await route.fulfill({ json: success(opening) }); }
      else await route.fulfill({ json: success(users, ["F01"]) });
    });
    await page.goto(activity);
    const clientPanel = page.getByRole("region", { name: "Ask the client", exact: true });
    expect(requests).toHaveLength(0);
    await page.getByRole("button", { name: "Start interview", exact: true }).click();
    await expect(clientPanel.getByRole("alert")).toContainText("Your work is still here");
    await expect(page.getByRole("log")).toHaveCount(0);
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(page.getByRole("status", { name: "Client request status" })).toContainText("getting ready");
    await expect(page.getByRole("button", { name: "Start interview", exact: true })).toBeDisabled();
    release();
    await expect(page.getByRole("log", { name: "Client conversation" })).toContainText(opening);
    expect(requests[1]).toEqual(requests[0]);
    const input = page.getByLabel("Your question", { exact: true });
    const send = page.getByRole("button", { name: "Send question", exact: true });
    await input.fill("Who is this for?"); await send.focus(); await page.keyboard.press("Enter");
    await expect(page.getByRole("log")).toContainText(users);
    await expect(input).toBeFocused();
    await input.fill("Who are the users again?"); await send.click();
    await expect(clientPanel.getByRole("alert")).toBeVisible();
    await expect(page.getByRole("log")).toContainText(users);
    expect(requests).toHaveLength(4);
    await input.fill("Keep this new draft");
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(clientPanel.getByRole("alert")).toHaveCount(0);
    expect(requests[4]).toEqual(requests[3]);
    await expect(input).toHaveValue("Keep this new draft");
    await expect(input).toBeFocused();
    await expect(page.getByRole("log").getByText("Who are the users again?", { exact: true })).toHaveCount(1);
    expect(await page.locator("body").textContent()).not.toMatch(/F01|F08|disclosedFactIds/);
    await page.getByRole("link", { name: "Back to course", exact: true }).click();
    await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    await page.getByRole("link", { name: "AI Client Requirement Clarification", exact: true }).click();
    await expect(page.getByRole("log")).toContainText(users);
    await expect(input).toHaveValue("Keep this new draft");
    await page.getByRole("button", { name: "Continue to summary", exact: true }).click();
    await expect(page.getByText(/summary form is not available yet/)).toBeVisible();
    await expect(page.getByRole("heading", { name: "Write your own requirement summary", exact: true })).toBeFocused();
    await expect(page.getByText(/Activity incomplete/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`client-${width}.png`), fullPage: true });
    expect(errors).toEqual([]);
  });
}
test("zero questions can reach the Summary handoff without a model request", async ({ page }) => {
  let calls = 0;
  await page.route("**/api/ai/client", async (route) => { calls++; await route.abort(); });
  await page.goto(activity);
  await page.getByRole("button", { name: "Continue to summary", exact: true }).click();
  await expect(page.getByText(/summary form is not available yet/)).toBeVisible();
  expect(calls).toBe(0);
});
test("an opening arriving after navigation is retained in its attempt", async ({ page }) => {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/api/ai/client", async (route) => { await wait; await route.fulfill({ json: success(opening) }); });
  await page.goto(activity);
  await page.getByRole("button", { name: "Start interview" }).click();
  await page.getByRole("link", { name: "Back to course", exact: true }).click();
  release();
  await page.getByRole("link", { name: "AI Client Requirement Clarification", exact: true }).click();
  await expect(page.getByRole("log")).toContainText(opening);
  await expect(page.getByRole("button", { name: "Start interview" })).toHaveCount(0);
});
