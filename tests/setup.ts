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
