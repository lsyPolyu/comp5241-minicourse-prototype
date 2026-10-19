import { describe, expect, it } from "vitest";
import { emptySummary } from "../../src/domain/summary";
import {
  matchesProductionRequest, productionOptions, productionOrigin, productionSummary, PRODUCTION_COURSE_ID,
  PRODUCTION_QUESTIONS, ProductionRequestGuard, redactReport, safeIdentifier,
} from "../live/production-acceptance-support";

const origin = "https://student-demo.vercel.app";
const tutor = { purpose: "tutor" as const, input: { courseId: PRODUCTION_COURSE_ID, lessonId: "why-clarify",
  question: PRODUCTION_QUESTIONS.tutor, conversation: [] } };

describe("production acceptance execution boundary", () => {
  it("requires an explicit HTTPS production origin and has an isolated offline mode", () => {
    expect(productionOptions(["--url", `${origin}/`])).toEqual({ offline: false, origin });
    expect(productionOptions(["--offline"])).toEqual({ offline: true, origin: null });
    for (const input of [[], [origin], ["--offline", "--url", origin], ["--url", origin, "--retry"]]) {
      expect(() => productionOptions(input)).toThrow();
    }
  });

  it.each(["http://student-demo.vercel.app", "https://localhost", "https://127.0.0.1", "https://2130706433",
    "https://[::1]", "https://test.localhost", "https://host.internal", "https://api.deepseek.com", "https://api.openai.com",
    "https://demo.test", "https://demo.invalid", "https://demo.example", "https://demo.vercel.app:8443",
    "https://user:secret@demo.vercel.app", `${origin}/activity`, `${origin}/?token=value`, `${origin}/#key`])(
    "rejects an unsafe or ambiguous target: %s", (url) => expect(() => productionOrigin(url)).toThrow(),
  );

  it("forwards only the exact expected shape, URL and method", () => {
    expect(matchesProductionRequest("/api/ai/tutor", "POST", tutor.input, tutor)).toBe(true);
    expect(matchesProductionRequest("/api/ai/client", "POST", tutor.input, tutor)).toBe(false);
    expect(matchesProductionRequest("/api/ai/tutor", "GET", tutor.input, tutor)).toBe(false);
    expect(matchesProductionRequest("/api/ai/tutor", "POST", { ...tutor.input, secret: "unapproved" }, tutor)).toBe(false);
    expect(matchesProductionRequest("/api/ai/tutor", "POST", { ...tutor.input, question: "changed" }, tutor)).toBe(false);
  });

  it("consumes a permit once and halts on duplicates, including automatic retry", () => {
    const guard = new ProductionRequestGuard(origin);
    guard.arm(tutor);
    expect(guard.claim(`${origin}/api/ai/tutor`, "POST", tutor.input)).toBe(true);
    expect(guard.claim(`${origin}/api/ai/tutor`, "POST", tutor.input)).toBe(false);
    expect(guard.count).toBe(1);
    expect(() => guard.arm(tutor)).toThrow();
  });

  it("permits only a strict real opening with the browser-generated attempt identity", () => {
    const opening = { mode: "opening", courseId: PRODUCTION_COURSE_ID, scenarioId: "club-signup-v1", attemptId: "browser-attempt" };
    const expected = { purpose: "client-opening" as const };
    expect(matchesProductionRequest("/api/ai/client", "POST", opening, expected)).toBe(true);
    expect(matchesProductionRequest("/api/ai/client", "POST", { ...opening, courseId: "other" }, expected)).toBe(false);
    expect(matchesProductionRequest("/api/ai/client", "POST", { ...opening, hiddenFacts: [] }, expected)).toBe(false);
    expect(matchesProductionRequest("/api/ai/client", "POST", { ...opening, attemptId: "" }, expected)).toBe(false);
  });

  it("enforces the five-call ceiling across valid requests", () => {
    const guard = new ProductionRequestGuard(origin);
    for (let i = 0; i < 5; i++) {
      guard.arm(tutor);
      expect(guard.claim(`${origin}/api/ai/tutor`, "POST", tutor.input)).toBe(true);
    }
    expect(guard.count).toBe(5);
    expect(() => guard.arm(tutor)).toThrow();
  });

  it.each([`${origin}/api/ai/tutor?retry=1`, "https://other.vercel.app/api/ai/tutor", "https://api.deepseek.com/api/ai/tutor"])(
    "rejects unexpected destinations and query strings: %s", (target) => {
      const guard = new ProductionRequestGuard(origin); guard.arm(tutor);
      expect(guard.claim(target, "POST", tutor.input)).toBe(false);
      expect(guard.count).toBe(0);
    },
  );

  it("requires feedback to contain the actual visible transcript, eight fields and same attempt", () => {
    const transcript = [{ id: "open", role: "assistant" as const, text: "Hello" }];
    const body = { courseId: PRODUCTION_COURSE_ID, scenarioId: "club-signup-v1", attemptId: "attempt",
      submissionId: "submission", requestId: "request", transcript, summarySnapshot: emptySummary };
    const expected = { purpose: "feedback" as const, attemptId: "attempt", summary: emptySummary,
      transcript: transcript.map(({ role, text }) => ({ role, text })) };
    expect(matchesProductionRequest("/api/ai/feedback", "POST", body, expected)).toBe(true);
    expect(matchesProductionRequest("/api/ai/feedback", "POST", { ...body, attemptId: "other" }, expected)).toBe(false);
    expect(matchesProductionRequest("/api/ai/feedback", "POST", { ...body, transcript: [] }, expected)).toBe(false);
    expect(matchesProductionRequest("/api/ai/feedback", "POST", { ...body, summarySnapshot: { ...emptySummary, userGoal: "injected" } }, expected)).toBe(false);
  });

  it("uses real visible content without claiming unasked facts are known", () => {
    const summary = productionSummary("The user wants fewer missed messages.");
    expect(Object.keys(summary)).toHaveLength(8);
    expect(summary.userGoal).toContain("fewer missed messages");
    expect(summary.priorities).toContain("have not asked");
    expect(summary.coreRequirements).toContain("still need to ask");
  });

  it("redacts environment secrets and token-shaped output without logging arbitrary identifiers", () => {
    expect(redactReport({ text: "private-value sk-abcdefghijk" }, ["private-value"])).toEqual({ text: "[REDACTED] [REDACTED]" });
    expect(safeIdentifier("req_123:456")).toBe("req_123:456");
    expect(safeIdentifier("Bearer secret\nheaders")).toBeNull();
    expect(safeIdentifier(null)).toBeNull();
  });
});
