import { z } from "zod";
import { summaryFieldIds } from "./course";

export const summarySchema = z.strictObject({
  targetUser: z.string(), userGoal: z.string(), coreRequirements: z.string(),
  constraints: z.string(), priorities: z.string(), userFlow: z.string(),
  acceptanceCriteria: z.string(), outOfScope: z.string(),
});
export type StructuredSummary = z.infer<typeof summarySchema>;
export const emptySummary: Readonly<StructuredSummary> = Object.freeze({
  targetUser: "", userGoal: "", coreRequirements: "", constraints: "",
  priorities: "", userFlow: "", acceptanceCriteria: "", outOfScope: "",
});
export const summaryFields = summaryFieldIds.map((id) => ({ id, ...{
  targetUser: { label: "Target User", hint: "Who will use the software? Describe their relevant background." },
  userGoal: { label: "User Goal", hint: "What problem do they want to solve, and what result do they need?" },
  coreRequirements: { label: "Core Requirements", hint: "What must the software help people do?" },
  constraints: { label: "Constraints", hint: "What limits affect the work, such as time, devices or budget?" },
  priorities: { label: "Must / Should / Could", hint: "Separate essentials, useful additions and optional extras. Explain your choices." },
  userFlow: { label: "User Flow", hint: "Describe the steps from the user's starting point to the result." },
  acceptanceCriteria: { label: "Acceptance Criteria", hint: "Write observable outcomes that show the requirements work, including important edge cases." },
  outOfScope: { label: "Out of Scope", hint: "What will this version leave out?" },
}[id] }));
