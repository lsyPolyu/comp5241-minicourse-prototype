"use client";

import { useEffect } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLearning } from "@/state/LearningProvider";

export function CompleteLessonButton({ courseId, lessonId }: { courseId: string; lessonId: string }) {
  const { state, dispatch } = useLearning();
  const completed = state.courses[courseId].completedLessonIds.includes(lessonId);
  useEffect(() => {
    dispatch({ type: "LESSON_OPENED", courseId, lessonId });
  }, [courseId, lessonId, dispatch]);

  return <div className="lesson-completion">
    <Button disabled={completed} onClick={() => dispatch({ type: "LESSON_COMPLETED", courseId, lessonId })}>
      {completed && <Check size={18} aria-hidden="true" />}
      {completed ? "Completed" : "Complete Lesson"}
    </Button>
    <span role="status" aria-label="Lesson completion" className="supporting-text">{completed ? "This lesson is completed." : "Complete this lesson when you are ready."}</span>
  </div>;
}
