"use client";

import Link from "next/link";
import { courseHref, getCourseById } from "@/content/courses/registry";
import { useLearning } from "@/state/LearningProvider";

export function RetryActivityLink({ courseId, activityId, variant = "primary" }: {
  courseId: string;
  activityId?: string;
  variant?: "primary" | "secondary";
}) {
  const { dispatch } = useLearning();
  const content = getCourseById(courseId);
  const activity = content?.activities.find(({ id }) => activityId ? id === activityId : true);
  if (!content || !activity) return null;

  return <Link className={`ui-button ui-button--${variant}`} href={`${courseHref(content)}/activity`}
    onNavigate={() => dispatch({ type: "RETRY_ACTIVITY", courseId, attemptId: crypto.randomUUID() })}>
    Retry Activity
  </Link>;
}
