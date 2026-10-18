"use client";

import { useTutorSession } from "@/state/TutorProvider";

export function useTutor(courseId: string, lessonId: string) {
  const tutor = useTutorSession(courseId, lessonId);
  const snapshot = tutor.session.pendingRequest ?? tutor.session.failedRequest;
  return {
    ...tutor,
    pending: tutor.session.pendingRequest !== null,
    messages: snapshot ? [...tutor.session.messages, { id: `${snapshot.turnId}:user`, role: "user" as const, content: snapshot.request.question }] : tutor.session.messages,
  };
}
