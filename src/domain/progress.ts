import type { PublishedCourse } from "./course";
import type { CourseLearningState } from "./learning";

export function getProgress(content: PublishedCourse, state: CourseLearningState) {
  const completedLessons = content.lessons.filter(({ id }) => state.completedLessonIds.includes(id)).length;
  const activityCompleted = state.earnedActivityCompletion !== null;
  const completedUnits = completedLessons + (activityCompleted ? 1 : 0);
  const totalUnits = content.lessons.length + content.activities.length;
  return {
    completedLessons,
    totalLessons: content.lessons.length,
    activityCompleted,
    completedUnits,
    totalUnits,
    percentage: Math.round(completedUnits / totalUnits * 100),
    courseCompleted: completedUnits === totalUnits,
    moduleCompleted: completedUnits === totalUnits,
  };
}

export type ContinueLearningTarget =
  | { kind: "lesson"; lessonId: string }
  | { kind: "activity" }
  | { kind: "progress" };

export function getContinueLearningTarget(content: PublishedCourse, state: CourseLearningState): ContinueLearningTarget {
  const nextLesson = content.lessons.find(({ id }) => !state.completedLessonIds.includes(id));
  if (nextLesson) return { kind: "lesson", lessonId: nextLesson.id };
  if (!getProgress(content, state).activityCompleted) return { kind: "activity" };
  return { kind: "progress" };
}
