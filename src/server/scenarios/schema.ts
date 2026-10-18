import "server-only";
import { z } from "zod";
import { summaryFieldIds } from "@/domain/course";

import { factIdSchema } from "@/domain/client";
export { factIds, factIdSchema, type FactId } from "@/domain/client";

const text = z.string().trim().min(1);
const factReferences = z.array(factIdSchema).min(1)
  .refine((ids) => new Set(ids).size === ids.length, "Fact references must be unique.")
  .readonly();
const referenceSchema = z.strictObject({
  factIds: factReferences,
  description: text,
}).readonly();
const factSchema = z.strictObject({
  topic: text,
  clientWording: text,
  elicitedBy: text,
  disclosureConstraint: text,
}).readonly();
const prioritySchema = z.strictObject({
  factIds: factReferences,
  description: text,
  reason: text,
}).readonly();
const rubricSchema = z.strictObject({
  factIds: factReferences,
  strong: text,
  partialOrMissing: text,
}).readonly();

export const scenarioSchema = z.strictObject({
  scenarioId: z.literal("club-signup-v1"),
  version: z.literal(1),
  background: text,
  facts: z.record(factIdSchema, factSchema).readonly(),
  priorities: z.strictObject({
    must: z.array(prioritySchema).min(1).readonly(),
    should: z.array(prioritySchema).min(1).readonly(),
    could: z.array(prioritySchema).min(1).readonly(),
  }).readonly(),
  acceptanceCriteria: z.record(z.enum([
    "SC-AC-01", "SC-AC-02", "SC-AC-03", "SC-AC-04", "SC-AC-05", "SC-AC-06", "SC-AC-07",
  ]), referenceSchema).readonly(),
  referenceUserFlow: referenceSchema,
  outOfScope: referenceSchema,
  rubric: z.record(z.enum(["questioning", ...summaryFieldIds]), rubricSchema).readonly(),
}).readonly();

export type Scenario = z.infer<typeof scenarioSchema>;
