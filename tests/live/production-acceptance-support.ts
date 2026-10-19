import { clientRequestSchema, type ClientRequest } from "../../src/domain/client";
import { feedbackRequestSchema } from "../../src/domain/submission";
import { tutorRequestSchema, type TutorRequest } from "../../src/domain/tutor";
import { summarySchema, type StructuredSummary } from "../../src/domain/summary";

export const PRODUCTION_REQUEST_BUDGET = 5;
export const PRODUCTION_COURSE_ID = "requirement-clarification";
export const PRODUCTION_LESSONS = ["why-clarify", "what-to-ask", "structure-requirements"] as const;
export const PRODUCTION_STORAGE_KEY = "comp5241:learning:v1";
export const PRODUCTION_QUESTIONS = {
  tutor: "In this lesson, explain why clarifying a user's goal matters before choosing features. Give a small example.",
  followUp: "In your previous example, what short follow-up question would clarify that goal? Explain why it helps.",
  client: "Who will use this website, and what problem do they need it to solve?",
} as const;

export function productionOrigin(input: string): string {
  let url: URL;
  try { url = new URL(input); } catch { throw new Error("EXPLICIT_HTTPS_PRODUCTION_ORIGIN_REQUIRED"); }
  const host = url.hostname.toLowerCase();
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
    (url.pathname !== "/" && url.pathname !== "") || url.port || !host.includes(".") ||
    host.includes(":") || /^[\d.]+$/.test(host) ||
    /(^|\.)(localhost|local|internal|invalid|test|example)$/.test(host) ||
    /(^|\.)(deepseek\.com|openai\.com|anthropic\.com)$/.test(host)) {
    throw new Error("EXPLICIT_HTTPS_PRODUCTION_ORIGIN_REQUIRED");
  }
  return url.origin;
}

export function productionOptions(args: string[]): { offline: boolean; origin: string | null } {
  if (args.length === 1 && args[0] === "--offline") return { offline: true, origin: null };
  if (args.length !== 2 || args[0] !== "--url") throw new Error("USE_--url_HTTPS_PRODUCTION_ORIGIN_OR_--offline");
  return { offline: false, origin: productionOrigin(args[1]) };
}

type VisibleTurn = { role: "user" | "assistant"; text: string };
export type ExpectedProductionRequest =
  | { purpose: "tutor"; input: TutorRequest }
  | { purpose: "client-opening" }
  | { purpose: "client"; input: ClientRequest }
  | { purpose: "feedback"; attemptId: string; summary: StructuredSummary; transcript: readonly VisibleTurn[] };

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function matchesProductionRequest(path: string, method: string, body: unknown, expected: ExpectedProductionRequest): boolean {
  const operation = expected.purpose === "client-opening" ? "client" : expected.purpose;
  if (method !== "POST" || path !== `/api/ai/${operation}`) return false;
  if (expected.purpose === "client-opening") {
    const actual = clientRequestSchema.safeParse(body);
    return actual.success && actual.data.mode === "opening";
  }
  if (expected.purpose === "tutor") {
    const actual = tutorRequestSchema.safeParse(body);
    return actual.success && same(actual.data, tutorRequestSchema.parse(expected.input));
  }
  if (expected.purpose === "client") {
    const actual = clientRequestSchema.safeParse(body);
    return actual.success && same(actual.data, clientRequestSchema.parse(expected.input));
  }
  const actual = feedbackRequestSchema.safeParse(body);
  return actual.success && actual.data.attemptId === expected.attemptId &&
    same(actual.data.summarySnapshot, summarySchema.parse(expected.summary)) &&
    same(actual.data.transcript.map(({ role, text }) => ({ role, text })), expected.transcript);
}

/** A permit is consumed before forwarding. No retry or duplicate can reuse it. */
export class ProductionRequestGuard {
  count = 0;
  blocked = 0;
  private expected: ExpectedProductionRequest | null = null;

  constructor(readonly origin: string) {}

  arm(expected: ExpectedProductionRequest) {
    if (this.expected || this.count >= PRODUCTION_REQUEST_BUDGET || this.blocked) throw new Error("REQUEST_GUARD_CANNOT_ARM");
    this.expected = expected;
  }

  claim(url: string, method: string, body: unknown): boolean {
    const target = new URL(url);
    if (target.origin !== this.origin || target.search || target.hash || !this.expected ||
      this.count >= PRODUCTION_REQUEST_BUDGET || this.blocked ||
      !matchesProductionRequest(target.pathname, method, body, this.expected)) {
      this.expected = null;
      this.blocked += 1;
      return false;
    }
    this.expected = null;
    this.count += 1;
    return true;
  }
}

/** Only student-visible interview content is used; no reference-answer fixture. */
export function productionSummary(clientAnswer: string): StructuredSummary {
  return summarySchema.parse({
    targetUser: `My first interview answer: ${clientAnswer}`,
    userGoal: `My first interview answer: ${clientAnswer}`,
    coreRequirements: "I still need to ask what the website must do before stating its requirements.",
    constraints: "I have not asked about delivery time, devices, budget or other constraints yet.",
    priorities: "I have not asked the client to distinguish Must, Should and Could yet.",
    userFlow: "I have not clarified the steps or exception paths yet.",
    acceptanceCriteria: "I have not agreed observable success criteria or edge cases with the client yet.",
    outOfScope: "I have not clarified what the first version should leave out yet.",
  });
}

/** Reports omit errors, headers, environment values and provider payloads. */
export function safeIdentifier(value: string | null | undefined): string | null {
  return value && /^[A-Za-z0-9_.:-]{1,200}$/.test(value) ? value : null;
}

export function redactReport<T>(value: T, secrets: readonly string[]): T {
  return JSON.parse(JSON.stringify(value, (_key, part: unknown) => {
    if (typeof part !== "string") return part;
    let safe = part;
    for (const secret of secrets) if (secret) safe = safe.split(secret).join("[REDACTED]");
    return safe.replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "[REDACTED]");
  })) as T;
}
