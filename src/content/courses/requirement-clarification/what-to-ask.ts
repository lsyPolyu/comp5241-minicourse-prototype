import type { Lesson } from "@/domain/course";

const objective = "Ask purposeful questions about users, goals, needs, constraints and scope. Follow up when an answer is unclear.";
const terms = {
  "Target user": "The people who will use the tool.",
  Goal: "The outcome those people want.",
  "Core requirement": "Something the tool must help people do.",
  Constraint: "A limit, such as time, budget or available devices.",
  Scope: "What this version includes; out of scope means what it leaves out.",
};
const example = 'For a campus lost-and-found tool, ask: “Who needs to update the item’s location?” and “Will students mainly use phones?” If the client says “Make it simple,” follow up: “Which task should be easier? Can you describe the last time it was difficult?”';

export const whatToAsk: Lesson = {
  id: "what-to-ask", courseId: "requirement-clarification", moduleId: "clarification-basics", order: 2,
  title: "What Should You Ask?", objective,
  blocks: [
    { kind: "concept", heading: "Five things to clarify", text: "Start with open questions that invite an explanation. Choose your next question to fill a gap in what you know, rather than reading a fixed checklist." },
    { kind: "term", heading: "Target users", text: `${terms["Target user"]} Ask: “Who will use it, and what do they need to do?”` },
    { kind: "term", heading: "Goals", text: `${terms.Goal} Ask: “What problem are they trying to solve?”` },
    { kind: "term", heading: "Core requirements", text: `${terms["Core requirement"]} Ask: “What must work first?”` },
    { kind: "term", heading: "Constraints", text: `${terms.Constraint} Ask: “What limits apply?”` },
    { kind: "term", heading: "Scope", text: `${terms.Scope} Ask: “What can wait until later?”` },
    { kind: "example", heading: "Example: follow up on an unclear answer", text: example },
    { kind: "prompt", heading: "Ask with a purpose", text: "Listen for unclear words. Confirm the specific task before discussing details such as colours. There is no required number of questions." },
  ],
  tutorContext: {
    objective, concepts: ["Five question directions", "Open questions", "Intentional follow-up questions"],
    terms, example, allowedTopics: ["target users", "goals", "core requirements", "constraints", "scope", "follow-up questions"],
    activityBoundary: "Explain why a question helps. Use the lost-and-found tool or another unrelated example. Do not role-play the activity client, disclose client answers, or conduct the whole interview for the student.",
  },
};
