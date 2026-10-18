"use client";

import { useLearning } from "@/state/LearningProvider";

export function useAttempt(courseId: string) {
  const { state, dispatch } = useLearning();
  const attempt = state.activeAttempts[courseId];
  const course = state.courses[courseId];
  return {
    attempt,
    metadata: course.latestAttemptMeta,
    restored: !attempt && course.latestAttemptMeta !== null,
    startNew: () => dispatch({ type: "RETRY_ACTIVITY", courseId, attemptId: crypto.randomUUID() }),
  };
}
