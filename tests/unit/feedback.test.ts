import { expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { feedbackSchema } from "@/domain/feedback";
import { validateFeedback } from "@/server/ai/validateFeedback";
import { fixtureAssessment, fixtureSummary, fixtureTranscript, emptyAssessment } from "../fixtures/feedback";
import { emptySummary } from "@/domain/summary";
const request = { courseId: "requirement-clarification" as const, scenarioId: "club-signup-v1" as const,
  attemptId: "a", submissionId: "s", requestId: "r", summarySnapshot: fixtureSummary, transcript: fixtureTranscript };
it("accepts all nine dimensions, allows all missing and keeps questioning separate", () => {
  expect(validateFeedback(fixtureAssessment(), request).questioning.level).toBe("Strong");
  const assessment = fixtureAssessment();
  assessment.questioning = emptyAssessment().questioning;
  assessment.whatToImprove = ["Ask purposeful questions before summarizing the client's needs."];
  expect(validateFeedback(assessment, { ...request, transcript: [] }).dimensions.constraints.level).toBe("Strong");
  const reverse = emptyAssessment();
  reverse.questioning = fixtureAssessment().questioning;
  reverse.whatWentWell = ["Your question asks who needs the software and why."];
  expect(validateFeedback(reverse, { ...request, summarySnapshot: emptySummary }).dimensions.constraints.level).toBe("Missing");
  expect(validateFeedback(emptyAssessment(), { ...request, transcript: [], summarySnapshot: emptySummary })).toEqual(emptyAssessment());
});
it.each([
  (a: ReturnType<typeof fixtureAssessment>) => { delete (a.dimensions as Partial<typeof a.dimensions>).constraints; },
  (a: ReturnType<typeof fixtureAssessment>) => Object.assign(a.dimensions, { duplicate: a.dimensions.userGoal }),
  (a: ReturnType<typeof fixtureAssessment>) => Object.assign(a, { dimensions: [a.dimensions.userGoal, a.dimensions.userGoal] }),
  (a: ReturnType<typeof fixtureAssessment>) => Object.assign(a.dimensions.userGoal, { level: "Excellent" }),
  (a: ReturnType<typeof fixtureAssessment>) => { a.dimensions.userGoal.explanation = " "; },
  (a: ReturnType<typeof fixtureAssessment>) => { a.dimensions.userGoal.problemCodes = ["goalMisunderstood"]; },
  (a: ReturnType<typeof fixtureAssessment>) => Object.assign(a, { score: 100 }),
  (a: ReturnType<typeof fixtureAssessment>) => { a.dimensions.userGoal.level = "Missing"; a.dimensions.userGoal.evidence = []; },
])("rejects malformed dimensions/ratings/gaps, duplicates and extra scores %#", (mutate) => {
  const assessment = fixtureAssessment(); mutate(assessment);
  expect(feedbackSchema.safeParse(assessment).success).toBe(false);
});
it.each([
  (a: ReturnType<typeof fixtureAssessment>) => { a.questioning.evidence[0].quote = "I invented this quote"; },
  (a: ReturnType<typeof fixtureAssessment>) => { a.questioning.evidence[0].turnId = "answer"; },
  (a: ReturnType<typeof fixtureAssessment>) => { a.dimensions.userGoal.evidence[0].fieldId = "targetUser"; },
  (a: ReturnType<typeof fixtureAssessment>) => { a.dimensions.userGoal.evidence[0].factId = "F01"; },
  (a: ReturnType<typeof fixtureAssessment>) => Object.assign(a.dimensions.userGoal.evidence[0], { factId: "F11" }),
  (a: ReturnType<typeof fixtureAssessment>) => { a.questioning.evidence = a.dimensions.userGoal.evidence; },
])("rejects fabricated or wrong-source quotes/turns/fields/facts %#", (mutate) => {
  const assessment = fixtureAssessment(); mutate(assessment);
  expect(() => validateFeedback(assessment, request)).toThrow();
});
it("does not credit the client or scenario as the student's question or blank summary", () => {
  const assessment = fixtureAssessment();
  assessment.questioning.evidence = [{ source: "turn", turnId: "answer", fieldId: null, quote: fixtureTranscript[2].text, factId: "F01" }];
  expect(() => validateFeedback(assessment, request)).toThrow();
  expect(() => validateFeedback(fixtureAssessment(), { ...request, summarySnapshot: emptySummary })).toThrow();
});
it("requires useful improvement guidance for gaps and strength feedback when Strong is identified", () => {
  expect(feedbackSchema.safeParse({ ...emptyAssessment(), whatToImprove: [] }).success).toBe(false);
  expect(feedbackSchema.safeParse({ ...fixtureAssessment(), whatWentWell: [] }).success).toBe(false);
});
it("rejects whitespace as a quotation instead of treating it as meaningful evidence", () => {
  const assessment = fixtureAssessment(); assessment.questioning.evidence[0].quote = " ";
  expect(feedbackSchema.safeParse(assessment).success).toBe(false);
});
