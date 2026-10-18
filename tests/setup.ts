import { beforeEach, vi } from "vitest";

function isolateProviderNetwork() {
  vi.stubEnv("DEEPSEEK_API_KEY", "");
  vi.stubEnv("DEEPSEEK_MODEL", "");
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => {
      throw new Error("Network disabled in offline tests. Use the explicit live command.");
    }),
  );
}

isolateProviderNetwork();
beforeEach(isolateProviderNetwork);

// Each component test starts a distinct browser visit. Reopen tests inject their
// repository explicitly; unrelated tests must not inherit another test's progress.
beforeEach(() => {
  if (typeof window !== "undefined") window.localStorage.clear();
});
