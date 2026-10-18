import { z } from "zod";
import { feedbackMatchesSubmission, feedbackSchema } from "./feedback";
import type { CourseLearningState, LatestSuccessfulResult, RequestIdentity, SubmittedSnapshot } from "./learning";
import { selectRecommendation } from "./recommendation";

export const feedbackResponseSchema = z.strictObject({
  attemptId: z.string().min(1), submissionId: z.string().min(1), requestId: z.string().min(1),
  scenarioVersion: z.literal("1"), assessment: feedbackSchema,
});
export function buildLearningResult(response: z.infer<typeof feedbackResponseSchema>, identity: RequestIdentity, snapshot: SubmittedSnapshot,
  courseId: string, course: CourseLearningState, receivedAt: string): LatestSuccessfulResult {
  const data = feedbackResponseSchema.parse(response);
  if (data.attemptId !== identity.attemptId || data.submissionId !== identity.submissionId || data.requestId !== identity.requestId ||
    snapshot.submissionId !== identity.submissionId || !Number.isFinite(Date.parse(receivedAt)) ||
    !feedbackMatchesSubmission(data.assessment, snapshot)) throw new Error("Feedback does not match the submitted work.");
  return structuredClone({ ...identity, scenarioVersion: data.scenarioVersion, summarySnapshot: snapshot.summary, feedback: data.assessment, receivedAt,
    ...selectRecommendation(data.assessment, courseId, { completedLessonIds: course.completedLessonIds, activityCompleted: true }) });
}
