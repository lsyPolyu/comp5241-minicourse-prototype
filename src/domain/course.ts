export type CourseCard =
  | { id: string; slug: string; title: string; description: string; availability: "available" }
  | { id: string; title: string; availability: "comingSoon" };

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string;
  contentVersion: string;
  moduleIds: readonly string[];
  estimatedExperience: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  lessonIds: readonly string[];
  activityIds: readonly string[];
}

export interface LessonReference {
  id: string;
  courseId: string;
  moduleId: string;
  order: number;
  title: string;
}

export interface LessonBlock {
  kind: "concept" | "example" | "term" | "prompt";
  heading: string;
  text: string;
}

export interface Lesson extends LessonReference {
  objective: string;
  blocks: readonly LessonBlock[];
  tutorContext: {
    objective: string;
    concepts: readonly string[];
    terms: Readonly<Record<string, string>>;
    example: string;
    allowedTopics: readonly string[];
    activityBoundary: string;
  };
}

export const summaryFieldIds = [
  "targetUser", "userGoal", "coreRequirements", "constraints",
  "priorities", "userFlow", "acceptanceCriteria", "outOfScope",
] as const;

export interface Activity {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  kind: "clientRoleplay";
  scenarioId: string;
  summaryFieldIds: typeof summaryFieldIds;
}

export interface PublishedCourse {
  course: Course;
  modules: readonly CourseModule[];
  lessons: readonly Lesson[];
  activities: readonly Activity[];
}
