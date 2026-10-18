import type { Lesson } from "@/domain/course";

const objective = "Tell a feature request apart from the real problem, and spot assumptions that need checking.";
const terms = {
  Requirement: "A requirement describes something the software needs to support.",
  Clarification: "Clarification means asking questions to make vague or missing information clear.",
  "User goal": "A user goal is the outcome someone wants, rather than a particular screen or feature.",
  Assumption: "An assumption is something you believe without checking it with the client.",
};
const example = '“We need a better lost-and-found app” is a request, but “better” does not explain the problem. Ask: “Who loses things, and what is difficult now?” You learn that students cannot tell whether an item has been handed in. Their goal is to find the right collection location quickly.';

export const whyClarify: Lesson = {
  id: "why-clarify", courseId: "requirement-clarification", moduleId: "clarification-basics", order: 1,
  title: "What is Requirement Clarification?",
  objective,
  blocks: [
    { kind: "concept", heading: "Start with the problem", text: `${terms.Requirement} ${terms.Clarification} ${terms["User goal"]}` },
    { kind: "example", heading: "Example: a campus lost-and-found tool", text: example },
    { kind: "term", heading: "Check your assumptions", text: `${terms.Assumption} A map or AI image search might sound useful, but neither is a confirmed need. Building too soon can solve the wrong problem.` },
    { kind: "prompt", heading: "Turn a request into a clearer need", text: 'Before: “Build a better app.” After clarification: “Help students check whether their lost item has been handed in and where to collect it.” Ask why a feature matters before choosing how to build it.' },
  ],
  tutorContext: {
    objective, concepts: ["Request versus real problem", "User goals before features", "Check assumptions before building"],
    terms, example, allowedTopics: ["requirements", "clarification", "user goals", "assumptions"],
    activityBoundary: "Explain this lesson using the lost-and-found example. Do not act as the activity client, invent client facts, or write the student's activity summary.",
  },
};
