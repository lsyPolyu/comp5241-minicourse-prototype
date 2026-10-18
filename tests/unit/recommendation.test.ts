import { expect, it } from "vitest";
import { selectRecommendation } from "@/domain/recommendation";
import { fixtureAssessment } from "../fixtures/feedback";
import { courseRegistry } from "@/content/courses/registry";
const id = "requirement-clarification";
const complete = { completedLessonIds: courseRegistry[id].lessons.map((lesson) => lesson.id), activityCompleted: true };
it("strong plus earned completion maps to Complete; missing lessons remain a separate pending state", () => {
  expect(selectRecommendation(fixtureAssessment(), id, complete).recommendation?.kind).toBe("courseComplete");
  const pending = selectRecommendation(fixtureAssessment(), id, { ...complete, completedLessonIds: ["why-clarify"] });
  expect(pending.recommendation).toBeNull(); expect(pending.completionPending?.missingLessonIds).toEqual(["what-to-ask", "structure-requirements"]);
  expect(selectRecommendation(fixtureAssessment(), id, { ...complete, activityCompleted: false }).recommendation).toBeNull();
});
it("non-core omissions map to Retry on the same implemented activity", () => {
  const assessment = fixtureAssessment(); assessment.dimensions.outOfScope = fixtureAssessment("Partial").dimensions.outOfScope;
  assessment.whatToImprove = ["Record the omitted scope boundary from the interview."];
  expect(selectRecommendation(assessment, id, complete)).toMatchObject({ recommendation: { kind: "retryActivity", activityId: "client-interview", reason: expect.stringContaining("Out of Scope") }, completionPending: null });
});
it.each([["userGoal", "why-clarify"], ["questioning", "what-to-ask"], ["constraints", "structure-requirements"]] as const)("maps Missing %s to %s", (dimension, lessonId) => {
  const assessment = fixtureAssessment();
  if (dimension === "questioning") assessment.questioning = fixtureAssessment("Missing").questioning;
  else assessment.dimensions[dimension] = fixtureAssessment("Missing").dimensions[dimension];
  assessment.whatToImprove = [`Clarify the missing ${dimension} information.`];
  expect(selectRecommendation(assessment, id, complete).recommendation).toMatchObject({ kind: "reviewLesson", lessonId });
});
it("uses goal → questioning → summary priority and stable field order, irrespective of completion", () => {
  const assessment = fixtureAssessment("Missing");
  expect(selectRecommendation(assessment, id, complete).recommendation).toMatchObject({ lessonId: "why-clarify" });
  assessment.dimensions.userGoal = fixtureAssessment().dimensions.userGoal;
  assessment.whatWentWell = ["Your summary explains the user's goal."];
  expect(selectRecommendation(assessment, id, complete).recommendation).toMatchObject({ lessonId: "what-to-ask" });
  assessment.questioning = fixtureAssessment().questioning;
  const selection = selectRecommendation(assessment, id, complete);
  expect(selection.recommendation).toMatchObject({ lessonId: "structure-requirements", reason: expect.stringContaining("Target User") });
  expect(selectRecommendation(assessment, id, { completedLessonIds: [], activityCompleted: false })).toEqual(selection);
});
it.each([["userGoal", "goalMisunderstood", "why-clarify"], ["questioning", "questioningGap", "what-to-ask"], ["priorities", "summaryGap", "structure-requirements"]] as const)("maps a core Partial gap %s without grade thresholds", (dimension, code, lessonId) => {
  const assessment = fixtureAssessment(); const partial = fixtureAssessment("Partial");
  if (dimension === "questioning") { assessment.questioning = partial.questioning; assessment.questioning.problemCodes = [code]; }
  else { assessment.dimensions[dimension] = partial.dimensions[dimension]; assessment.dimensions[dimension].problemCodes = [code]; }
  assessment.whatToImprove = [`Correct the core ${dimension} gap identified in your evidence.`];
  expect(selectRecommendation(assessment, id, complete).recommendation).toMatchObject({ lessonId });
});
it("rejects Coming Soon, prototype keys and missing implemented targets", () => {
  for (const courseId of ["git-basics", "toString", "missing"]) expect(() => selectRecommendation(fixtureAssessment(), courseId, complete)).toThrow();
  const content = courseRegistry[id];
  expect(() => selectRecommendation(fixtureAssessment("Missing"), id, complete, { [id]: { ...content, lessons: [] } })).toThrow();
  expect(() => selectRecommendation(fixtureAssessment("Partial"), id, complete, { [id]: { ...content, activities: [] } })).toThrow();
});
