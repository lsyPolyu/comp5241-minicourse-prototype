import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { assertE2EOutputSafe, checkE2EOutput, e2eOutputOptions, e2eRepositoryRoot, unsafeE2EOutputMessage } from "../../scripts/e2e-output";

const root = e2eRepositoryRoot;
const live = join(root, "test-results/live");
const require = createRequire(import.meta.url);

function temporaryConfig(config: unknown) {
  const directory = mkdtempSync(join(tmpdir(), "comp5241-e2e-output-"));
  writeFileSync(join(directory, "package.json"), JSON.stringify({ type: "module" }));
  const configFile = join(directory, "playwright.config.mjs");
  writeFileSync(configFile, `export default ${JSON.stringify(config)};\n`);
  return { directory, configFile };
}

describe("E2E output evidence protection", () => {
  it("accepts the actual repository config's separate E2E output", async () => {
    expect(await checkE2EOutput([], root)).toEqual([join(root, "test-results/e2e")]);
  });

  it.each(["test-results/live", "test-results/live/feedback-run", "test-results", ".", "..", "test-results/e2e/../live"])(
    "rejects an equal, child or ancestor output: %s", (output) => {
      expect(() => assertE2EOutputSafe([resolve(root, output)], [live])).toThrow(unsafeE2EOutputMessage);
    },
  );

  it.each(["test-results/e2e", "test-results/live-archive", "test-results/lively", ".tools/e2e-artifacts"])(
    "allows separate directories without confusing name prefixes: %s", (output) => {
      expect(() => assertE2EOutputSafe([resolve(root, output)], [live])).not.toThrow();
    },
  );

  it.each([
    ["--config", "custom.ts"], ["-c", "custom.ts"], ["--config=custom.ts"], ["-ccustom.ts"], ["-c=custom.ts"], ["-xccustom.ts"],
  ])("parses config option %j", (...args) => {
    expect(e2eOutputOptions([...args, "--list"])).toEqual({ config: "custom.ts", output: undefined });
  });

  it("resolves repeated options as the CLI does and stops options at --", () => {
    expect(e2eOutputOptions(["--output=test-results", "--output", "test-results/e2e", "-c", "old.ts", "--config=new.ts"]))
      .toEqual({ config: "new.ts", output: "test-results/e2e" });
    expect(e2eOutputOptions(["--list", "--", "--output=test-results", "-c", "other.ts"]))
      .toEqual({ config: undefined, output: undefined });
  });

  it.each([["--config"], ["-c"], ["--output"], ["--output="], ["--config="]])("rejects missing path values %j", (...args) => {
    expect(() => e2eOutputOptions(args)).toThrow();
  });

  it("reads project outputs relative to the selected config directory", async () => {
    const { directory, configFile } = temporaryConfig({ outputDir: "./safe", projects: [{ name: "inherited" }, { name: "separate", outputDir: "./other" }] });
    expect(await checkE2EOutput(["--config", configFile], root)).toEqual([join(directory, "safe"), join(directory, "other")]);
  });

  it("rejects a dangerous project even when its parent config is safe", async () => {
    const { configFile } = temporaryConfig({ outputDir: "./safe", projects: [{ name: "unsafe", outputDir: live }] });
    await expect(checkE2EOutput(["-c", configFile], root)).rejects.toThrow(unsafeE2EOutputMessage);
  });

  it("uses CLI output for every project and resolves it from cwd", async () => {
    const { configFile } = temporaryConfig({ outputDir: live, projects: [{ outputDir: live }, {}] });
    const safe = join(root, "test-results/e2e/cli-override");
    expect(await checkE2EOutput([`--config=${configFile}`, "--output", safe], root)).toEqual([safe, safe]);
    await expect(checkE2EOutput(["--config", configFile, "--output=test-results"], root)).rejects.toThrow(unsafeE2EOutputMessage);
  });

  it("matches directory config discovery and the package-level default output", async () => {
    const { directory } = temporaryConfig({});
    const nested = join(directory, "nested"); mkdirSync(nested);
    writeFileSync(join(nested, "playwright.config.mjs"), "export default {};\n");
    await expect(checkE2EOutput(["-c", nested], directory)).rejects.toThrow(unsafeE2EOutputMessage);
  });

  it.each([["html", "outputFolder"], ["blob", "outputDir"]])("protects configured %s reporter cleanup", async (name, key) => {
    const { configFile } = temporaryConfig({ outputDir: "./safe", reporter: [[name, { [key]: live }]] });
    await expect(checkE2EOutput(["-c", configFile], root, {})).rejects.toThrow(unsafeE2EOutputMessage);
    await expect(checkE2EOutput(["-c", configFile, "--reporter=list"], root, {})).resolves.toHaveLength(1);
  });

  it.each([
    ["--reporter=html", "PLAYWRIGHT_HTML_OUTPUT_DIR"], ["--reporter=html", "PLAYWRIGHT_HTML_REPORT"],
    ["--add-reporter=blob", "PLAYWRIGHT_BLOB_OUTPUT_DIR"],
  ])("protects CLI reporter %s with %s", async (arg, name) => {
    await expect(checkE2EOutput([arg], root, { [name]: "test-results" })).rejects.toThrow(unsafeE2EOutputMessage);
  });

  it("handles separate/repeated CLI reporter values, additive reporters, and -- boundary", async () => {
    const env = { PLAYWRIGHT_HTML_OUTPUT_DIR: live };
    await expect(checkE2EOutput(["--reporter", "html", "--reporter", "list"], root, env)).resolves.toHaveLength(1);
    await expect(checkE2EOutput(["--reporter=list", "--add-reporter", "list,html"], root, env)).rejects.toThrow(unsafeE2EOutputMessage);
    await expect(checkE2EOutput(["--", "--reporter=html"], root, env)).resolves.toHaveLength(1);
    await expect(checkE2EOutput([], root, { ...env, PW_TEST_REPORTER: "html" })).rejects.toThrow(unsafeE2EOutputMessage);
  });

  it("resolves config paths from configDir and reporter environment paths from cwd", async () => {
    const { directory, configFile } = temporaryConfig({ outputDir: "./safe", reporter: [["html", { outputFolder: "test-results/live" }]] });
    await expect(checkE2EOutput(["-c", configFile], root, {})).resolves.toHaveLength(1);
    await expect(checkE2EOutput(["-c", configFile], directory, {})).rejects.toThrow(unsafeE2EOutputMessage);
    await expect(checkE2EOutput(["-c", configFile], root, { PLAYWRIGHT_HTML_OUTPUT_DIR: "test-results/live" })).rejects.toThrow(unsafeE2EOutputMessage);
  });

  it("protects blob explicit files and filenames that escape a safe output directory", async () => {
    for (const settings of [{ outputFile: join(live, "old.zip") }, { outputDir: "./safe", fileName: join(live, "old.zip") }]) {
      const { configFile } = temporaryConfig({ outputDir: "./safe", reporter: [["blob", settings]] });
      await expect(checkE2EOutput(["-c", configFile], root, {})).rejects.toThrow(unsafeE2EOutputMessage);
    }
    for (const env of [{ PLAYWRIGHT_BLOB_OUTPUT_FILE: join(live, "old.zip") }, { PLAYWRIGHT_BLOB_OUTPUT_NAME: join(live, "old.zip") }]) {
      await expect(checkE2EOutput(["--reporter=blob"], root, env)).rejects.toThrow(unsafeE2EOutputMessage);
    }
    await expect(checkE2EOutput(["--reporter=blob"], root, {
      PLAYWRIGHT_BLOB_OUTPUT_DIR: live, PLAYWRIGHT_BLOB_OUTPUT_FILE: join(root, "blob-report/safe.zip"),
    })).resolves.toHaveLength(1);
  });

  it("checks built-in reporter configDir overrides", async () => {
    const { configFile } = temporaryConfig({ outputDir: "./safe", reporter: [["html", { configDir: live, outputFolder: "." }]] });
    await expect(checkE2EOutput(["-c", configFile], root, {})).rejects.toThrow(unsafeE2EOutputMessage);
  });

  it("rejects before Playwright starts and leaves a live sentinel untouched", () => {
    const { directory, configFile } = temporaryConfig({ outputDir: "./test-results/e2e" });
    const sentinelDir = join(directory, "test-results/live"); mkdirSync(sentinelDir, { recursive: true });
    const sentinel = join(sentinelDir, "previous-live-evidence.txt");
    writeFileSync(sentinel, "Existing evidence must survive.\n");
    const before = readFileSync(sentinel);
    const launcher = join(root, "scripts/run-e2e.ts");
    const result = spawnSync(process.execPath, ["--import", pathToFileURL(require.resolve("tsx")).href, launcher,
      "--config", configFile, "--output", dirname(sentinelDir), "--list"], {
      cwd: directory, encoding: "utf8", timeout: 15_000,
      env: { ...process.env, DEEPSEEK_API_KEY: "", DEEPSEEK_MODEL: "" },
    });
    expect(result.status).toBe(1); expect(result.error).toBeUndefined();
    expect(result.stderr).toContain(unsafeE2EOutputMessage);
    expect(result.stdout).not.toContain("Listing tests");
    expect(readFileSync(sentinel)).toEqual(before);
    expect(readdirSync(sentinelDir)).toEqual(["previous-live-evidence.txt"]);
  });

  it("rejects reporter cleanup before Playwright starts and preserves prior evidence", () => {
    const { directory, configFile } = temporaryConfig({ outputDir: "./test-results/e2e" });
    const sentinelDir = join(directory, "test-results/live"); mkdirSync(sentinelDir, { recursive: true });
    const sentinel = join(sentinelDir, "previous-live-evidence.txt"); writeFileSync(sentinel, "Existing evidence must survive.\n");
    const result = spawnSync(process.execPath, ["--import", pathToFileURL(require.resolve("tsx")).href, join(root, "scripts/run-e2e.ts"),
      "--config", configFile, "--reporter=html", "--list"], {
      cwd: directory, encoding: "utf8", timeout: 15_000,
      env: { ...process.env, DEEPSEEK_API_KEY: "", DEEPSEEK_MODEL: "", PLAYWRIGHT_HTML_OUTPUT_DIR: "test-results" },
    });
    expect(result.status).toBe(1); expect(result.error).toBeUndefined();
    expect(result.stderr).toContain(unsafeE2EOutputMessage); expect(result.stdout).not.toContain("Listing tests");
    expect(readFileSync(sentinel, "utf8")).toBe("Existing evidence must survive.\n");
    expect(readdirSync(sentinelDir)).toEqual(["previous-live-evidence.txt"]);
  });
});
