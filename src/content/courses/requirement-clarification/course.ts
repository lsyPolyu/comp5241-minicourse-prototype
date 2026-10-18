import type { PublishedCourse } from "@/domain/course";
import { clientInterview } from "@/content/activities/client-interview";
import { whyClarify } from "./why-clarify";
import { whatToAsk } from "./what-to-ask";
import { structureRequirements } from "./structure-requirements";

export const requirementClarification = {
  course: {
    id: "requirement-clarification",
    slug: "requirement-clarification",
    title: "Requirement Clarification",
    description: "Turn a vague request into clear, actionable requirements. Learn what to ask, then practise with an AI client and write your own requirement summary.",
    contentVersion: "1",
    moduleIds: ["clarification-basics"],
    estimatedExperience: "About 10–15 minutes for the full learning experience",
  },
  modules: [{
    id: "clarification-basics",
    courseId: "requirement-clarification",
    title: "Clarification Basics",
    lessonIds: ["why-clarify", "what-to-ask", "structure-requirements"],
    activityIds: ["client-interview"],
  }],
  lessons: [whyClarify, whatToAsk, structureRequirements],
  activities: [clientInterview],
} as const satisfies PublishedCourse;
