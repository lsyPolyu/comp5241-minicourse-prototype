import { expect, test } from "vitest";

test("ordinary tests clear provider credentials and block external fetch", async () => {
  expect(process.env.DEEPSEEK_API_KEY).toBe("");
  await expect(fetch("https://example.invalid/offline-test")).rejects.toThrow(
    "Network disabled in offline tests",
  );
});
