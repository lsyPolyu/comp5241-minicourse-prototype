import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { checkE2EOutput, UnsafeE2EOutputError } from "./e2e-output";

try {
  const args = process.argv.slice(2);
  await checkE2EOutput(args);
  const require = createRequire(import.meta.url);
  const child = spawn(process.execPath, [require.resolve("@playwright/test/cli"), "test", ...args], {
    stdio: "inherit", windowsHide: true,
  });
  const forwardInterrupt = () => { child.kill("SIGINT"); };
  const forwardTermination = () => { child.kill("SIGTERM"); };
  process.on("SIGINT", forwardInterrupt);
  process.on("SIGTERM", forwardTermination);
  try {
    const result = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", (code, signal) => resolve({ code, signal }));
    });
    process.removeListener("SIGINT", forwardInterrupt);
    process.removeListener("SIGTERM", forwardTermination);
    if (result.signal) process.kill(process.pid, result.signal);
    else process.exitCode = result.code ?? 1;
  } finally {
    process.removeListener("SIGINT", forwardInterrupt);
    process.removeListener("SIGTERM", forwardTermination);
  }
} catch (error) {
  // Config modules can throw arbitrary data. Never print their errors or secrets.
  console.error(error instanceof UnsafeE2EOutputError ? error.message : "Unable to validate or launch E2E. Check the configuration and output paths.");
  process.exitCode = 1;
}
