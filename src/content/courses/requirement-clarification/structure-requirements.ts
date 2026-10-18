import type { Lesson } from "@/domain/course";

const objective = "Organize confirmed information into eight fields, with clear priorities, a user flow and verifiable acceptance criteria.";
const terms = {
  "Target User": "Who uses the tool.",
  "User Goal": "The outcome they want.",
  "Core Requirements": "What the software needs to do.",
  Constraints: "Limits the solution must respect.",
  "Must / Should / Could": "Essential needs, important additions, and optional extras, in that order.",
  "User Flow": "The steps someone takes to finish a task.",
  "Acceptance Criteria": "Observable conditions for checking that a requirement works.",
  "Out of Scope": "What this version will not include.",
  "User Story": "A short description of who wants to do what and why.",
};
const example = 'For the campus lost-and-found tool, a flow is: choose a category → view matching items → find the collection location. “Make searching easy” is vague. “When a student searches by category, matching items show the collection location” can be checked. Finding the location is a Must; decorative themes could wait.';

export const structureRequirements: Lesson = {
  id: "structure-requirements", courseId: "requirement-clarification", moduleId: "clarification-basics", order: 3,
  title: "From Conversation to Structured Requirements", objective,
  blocks: [
    { kind: "concept", heading: "Give each fact a place", text: "Turn your conversation into a short summary. Use these eight fields to separate the problem, the solution and its boundaries." },
    ...Object.entries(terms).filter(([label]) => label !== "User Story").map(([heading, text]) => ({ kind: "term" as const, heading, text })),
    { kind: "example", heading: "Example: make the requirement checkable", text: example },
    { kind: "term", heading: "A useful sentence pattern", text: `A User Story is ${terms["User Story"].toLowerCase()} You do not need a separate story field.` },
    { kind: "prompt", heading: "Keep the summary honest", text: "Write only what the client confirmed. Revisit the conversation for gaps instead of inventing answers. You may leave a field blank and learn from feedback." },
  ],
  tutorContext: {
    objective, concepts: ["Eight summary fields", "Priorities", "Observable acceptance criteria", "Confirmed information only"],
    terms, example, allowedTopics: ["structured requirements", ...Object.keys(terms)],
    activityBoundary: "Explain the field meanings and writing patterns using the lost-and-found example. Do not read or write the student's full activity summary, invent client facts, or supply activity answers. Suggest reviewing their own interview.",
  },
};
