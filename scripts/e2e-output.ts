import { existsSync, realpathSync, statSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const e2eRepositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const unsafeE2EOutputMessage = "E2E output overlaps protected test-results/live. Use a separate output directory such as test-results/e2e.";

export class UnsafeE2EOutputError extends Error {
  constructor() { super(unsafeE2EOutputMessage); }
}

export function e2eOutputOptions(args: readonly string[]) {
  let config: string | undefined;
  let output: string | undefined;
  let reporter: string | undefined;
  let additionalReporter: string | undefined;
  for (let index = 0; index < args.length && args[index] !== "--"; index++) {
    const arg = args[index];
    // Commander also accepts attached short values, including the -x boolean prefix.
    const shortConfig = /^-x*c(?:=)?(.*)$/.exec(arg);
    const option = arg === "--config" || shortConfig ? "config" :
      ["--output", "--reporter", "--add-reporter"].includes(arg) ? arg.slice(2) : null;
    let value: string | undefined;
    if (option) value = shortConfig?.[1] || args[++index];
    else if (arg.startsWith("--config=")) { value = arg.slice("--config=".length); }
    else if (arg.startsWith("--output=")) { value = arg.slice("--output=".length); }
    else if (arg.startsWith("--reporter=")) { value = arg.slice("--reporter=".length); }
    else if (arg.startsWith("--add-reporter=")) { value = arg.slice("--add-reporter=".length); }
    else continue;
    if (!value || value.startsWith("-")) throw new Error("Missing E2E path option.");
    if (option === "config" || arg.startsWith("--config=")) config = value;
    else if (option === "reporter" || arg.startsWith("--reporter=")) reporter = value;
    else if (option === "add-reporter" || arg.startsWith("--add-reporter=")) additionalReporter = value;
    else output = value;
  }
  return { config, output, ...(reporter === undefined ? {} : { reporter }),
    ...(additionalReporter === undefined ? {} : { additionalReporter }) };
}

function canonicalPath(input: string) {
  let ancestor = resolve(input);
  const suffix: string[] = [];
  while (!existsSync(ancestor)) {
    suffix.unshift(basename(ancestor));
    const parent = dirname(ancestor);
    if (parent === ancestor) throw new Error("Unable to resolve E2E output.");
    ancestor = parent;
  }
  return resolve(realpathSync(ancestor), ...suffix);
}

function contains(parent: string, child: string) {
  const path = relative(parent, child);
  return path === "" || (!isAbsolute(path) && path !== ".." && !path.startsWith(`..${sep}`));
}

export function assertE2EOutputSafe(outputs: readonly string[], protectedDirectories: readonly string[]) {
  const protectedPaths = protectedDirectories.map(canonicalPath);
  for (const output of outputs.map(canonicalPath)) {
    if (protectedPaths.some((protectedPath) => contains(output, protectedPath) || contains(protectedPath, output))) {
      throw new UnsafeE2EOutputError();
    }
  }
}

type Reporter = [string, Record<string, unknown>?];
interface OutputConfig { outputDir?: string; projects?: { outputDir?: string }[]; reporter?: string | Reporter[] }

function packageDirectory(configDir: string, cwd: string) {
  let directory = configDir;
  while (!existsSync(join(directory, "package.json")) && dirname(directory) !== directory) directory = dirname(directory);
  return existsSync(join(directory, "package.json")) ? directory : cwd;
}

function reporterOutputs(config: OutputConfig, options: ReturnType<typeof e2eOutputOptions>, configDir: string,
  cwd: string, env: Readonly<Record<string, string | undefined>>) {
  const fromCli = (value: string): Reporter[] => value.split(",").map((name) => [name]);
  const reporters = options.reporter ? fromCli(options.reporter) :
    typeof config.reporter === "string" ? [[config.reporter] as Reporter] : config.reporter ?? [];
  if (!Array.isArray(reporters)) throw new Error("Invalid E2E reporters.");
  const all = [...reporters, ...fromCli(options.additionalReporter ?? ""), [env.PW_TEST_REPORTER ?? ""] as Reporter];
  return all.flatMap((reporter) => {
    if (!Array.isArray(reporter)) throw new Error("Invalid E2E reporter.");
    const [name, settings = {}] = reporter;
    if (name !== "html" && name !== "blob") return [];
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) throw new Error("Invalid E2E reporter options.");
    const pathOption = (key: string) => {
      const value = settings[key];
      if (value !== undefined && typeof value !== "string") throw new Error("Invalid E2E reporter path.");
      return value;
    };
    const reporterDir = resolve(cwd, pathOption("configDir") ?? configDir);
    const packageDir = packageDirectory(reporterDir, cwd);
    if (name === "html") {
      const fromEnv = env.PLAYWRIGHT_HTML_OUTPUT_DIR || env.PLAYWRIGHT_HTML_REPORT;
      const folder = pathOption("outputFolder");
      return [fromEnv ? resolve(cwd, fromEnv) : folder ? resolve(reporterDir, folder) : join(packageDir, "playwright-report")];
    }
    // Installed blob reporter: explicit file overrides directory; otherwise the
    // directory is recursively removed and fileName may escape that directory.
    const file = env.PLAYWRIGHT_BLOB_OUTPUT_FILE || pathOption("outputFile");
    if (file) return [resolve(env.PLAYWRIGHT_BLOB_OUTPUT_FILE ? cwd : reporterDir, file)];
    const fromEnv = env.PLAYWRIGHT_BLOB_OUTPUT_DIR;
    const folder = pathOption("outputDir");
    const directory = fromEnv ? resolve(cwd, fromEnv) : folder ? resolve(reporterDir, folder) : join(packageDir, "blob-report");
    const fileName = env.PLAYWRIGHT_BLOB_OUTPUT_NAME ?? pathOption("fileName");
    return fileName ? [directory, resolve(directory, fileName)] : [directory];
  });
}

/** Match installed Playwright: project > config > nearest package's test-results. */
export async function checkE2EOutput(args: readonly string[], cwd = process.cwd(),
  env: Readonly<Record<string, string | undefined>> = process.env) {
  const options = e2eOutputOptions(args);
  const requested = resolve(cwd, options.config || ".");
  let configDir = requested;
  let configFile: string | undefined;
  if (!statSync(requested).isDirectory()) { configFile = requested; configDir = dirname(requested); }
  else {
    configFile = ["ts", "js", "mts", "mjs", "cts", "cjs"].map((extension) => join(requested, `playwright.config.${extension}`)).find(existsSync);
  }
  const config = configFile ? (await import(pathToFileURL(configFile).href)).default as OutputConfig : {};
  if (!config || typeof config !== "object" || Array.isArray(config)) throw new Error("Invalid E2E configuration.");
  if (config.projects !== undefined && !Array.isArray(config.projects)) throw new Error("Invalid E2E projects.");
  const packageDir = packageDirectory(configDir, cwd);
  const defaultOutput = join(packageDir, "test-results");
  const projects = config.projects || [config];
  const outputs = projects.map((project) => {
    if (!project || typeof project !== "object") throw new Error("Invalid E2E project.");
    const configured = project.outputDir || config.outputDir;
    if (configured !== undefined && typeof configured !== "string") throw new Error("Invalid E2E output.");
    return options.output ? resolve(cwd, options.output) : configured ? resolve(configDir, configured) : defaultOutput;
  });
  assertE2EOutputSafe([...outputs, ...reporterOutputs(config, options, configDir, cwd, env)],
    [join(e2eRepositoryRoot, "test-results/live"), join(cwd, "test-results/live")]);
  return outputs;
}
