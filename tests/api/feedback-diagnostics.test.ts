import { expect, test, vi } from "vitest";
import { z } from "zod";
import { feedbackSchema } from "../../src/domain/feedback";
import { feedbackSchemaIssueSchema } from "../../src/domain/feedbackDiagnostics";
import { summarizeFeedbackSchemaIssues } from "../../src/server/ai/feedbackDiagnostics";
import { fixtureAssessment } from "../fixtures/feedback";

vi.mock("server-only", () => ({}));

test("feedback diagnostics distinguish a missing field from explicit null", () => {
  for (const [value, receivedType] of [[undefined, "missing"], [null, "null"]] as const) {
    const input = { ...fixtureAssessment(), whatWentWell: value };
    if (value === undefined) delete input.whatWentWell;
    const parsed = feedbackSchema.safeParse(input);
    expect(parsed.success).toBe(false);
    if (parsed.success) return;
    const issues = summarizeFeedbackSchemaIssues(parsed.error, input);
    expect(issues).toEqual([expect.objectContaining({ path: ["whatWentWell"], code: "invalid_type", expected: "array", receivedType })]);
    expect(z.array(feedbackSchemaIssueSchema).safeParse(issues).success).toBe(true);
  }
});

function diagnose(input: unknown) {
  const parsed = feedbackSchema.safeParse(input);
  expect(parsed.success).toBe(false);
  if (parsed.success) throw new Error("Expected invalid fixture");
  const issues = summarizeFeedbackSchemaIssues(parsed.error, input);
  expect(z.array(feedbackSchemaIssueSchema).safeParse(issues).success).toBe(true);
  return issues;
}

test("preserves real feedback field paths and indexes without echoing invalid enums", () => {
  const valid = fixtureAssessment();
  const input = { ...valid, dimensions: { ...valid.dimensions, priorities: {
    ...valid.dimensions.priorities, level: "PRIVATE_MODEL_VALUE",
  } } };
  expect(diagnose(input)).toEqual([{
    path: ["dimensions", "priorities", "level"], code: "invalid_value", expected: null,
    receivedType: "string", messageCategory: "invalid_value", receivedValueCategory: "outside_allowed_values",
  }]);
  expect(JSON.stringify(diagnose(input))).not.toContain("PRIVATE_MODEL_VALUE");
});

test("reports evidence nullability and array bounds using finite labels", () => {
  const valid = fixtureAssessment();
  const evidence = { ...valid.dimensions.priorities.evidence[0], turnId: "PRIVATE_TURN_ID" };
  expect(diagnose({ ...valid, dimensions: { ...valid.dimensions, priorities: {
    ...valid.dimensions.priorities, evidence: [evidence],
  } } })).toContainEqual(expect.objectContaining({
    path: ["dimensions", "priorities", "evidence", 0, "turnId"], code: "invalid_type", expected: "null", receivedType: "string",
  }));
  expect(diagnose({ ...valid, questioning: { ...valid.questioning, evidence: [] } })).toContainEqual(expect.objectContaining({
    path: ["questioning", "evidence"], code: "too_small", receivedType: "array", receivedValueCategory: "empty",
  }));
  expect(diagnose({ ...valid, whatWentWell: Array(10).fill("PRIVATE_STRENGTH") })).toContainEqual(expect.objectContaining({
    path: ["whatWentWell"], code: "too_big", receivedType: "array", receivedValueCategory: "nonempty",
  }));
});

test("categorizes trusted feedback consistency messages while retaining custom issue paths", () => {
  const valid = fixtureAssessment();
  const cases = [
    [{ ...valid, questioning: { ...valid.questioning, problemCodes: ["questioningGap"] } }, ["questioning"], "rating_evidence_problem_code_mismatch"],
    [{ ...fixtureAssessment("Partial"), whatToImprove: [] }, ["whatToImprove"], "missing_improvement_guidance"],
    [{ ...valid, whatWentWell: [] }, ["whatWentWell"], "missing_strength_guidance"],
    [{ ...valid, dimensions: { ...valid.dimensions, priorities: { ...valid.dimensions.priorities, level: "Partial", problemCodes: ["questioningGap"] } } }, ["priorities"], "dimension_problem_code_mismatch"],
  ] as const;
  for (const [input, path, messageCategory] of cases) {
    expect(diagnose(input)).toContainEqual(expect.objectContaining({ path, code: "custom", expected: null, messageCategory }));
  }
});

test("flattens union branch issues and preserves their parent paths", () => {
  const input = { dimensions: { priorities: { evidence: [{ quote: 3, factId: false }] } } };
  const schema = z.object({ dimensions: z.object({ priorities: z.object({ evidence: z.array(z.union([
    z.object({ quote: z.string() }), z.object({ factId: z.string() }),
  ])) }) }) });
  const parsed = schema.safeParse(input);
  if (parsed.success) throw new Error("Expected invalid fixture");
  expect(summarizeFeedbackSchemaIssues(parsed.error, input)).toEqual([
    expect.objectContaining({ path: ["dimensions", "priorities", "evidence", 0, "quote"], expected: "string", receivedType: "number" }),
    expect.objectContaining({ path: ["dimensions", "priorities", "evidence", 0, "factId"], expected: "string", receivedType: "boolean" }),
  ]);
});

test("caps issue count and path depth and redacts arbitrary keys, messages and schema metadata", () => {
  const privateValue = "PRIVATE_PROMPT_HEADER_SECRET";
  const rawIssues = [
    { code: "invalid_type", path: [privateValue, Symbol(privateValue), "dimensions", 2, 10000, -1, ...Array(9).fill("level")], expected: privateValue, message: privateValue },
    { code: "invalid_value", path: ["answer"], values: [privateValue], message: privateValue },
    { code: privateValue, path: [], message: privateValue },
    { code: "custom", path: [], message: `Rating, evidence and problem codes must agree.${privateValue}`, params: { privateValue } },
    { code: "unrecognized_keys", path: [], keys: [privateValue], message: privateValue },
    ...Array.from({ length: 20 }, () => ({ code: "custom", path: [], message: privateValue })),
  ];
  const result = summarizeFeedbackSchemaIssues(new z.ZodError(rawIssues as z.core.$ZodIssue[]), { answer: privateValue });
  expect(result).toHaveLength(8);
  expect(result[0]).toMatchObject({ path: ["other", "other", "dimensions", 2, "other", "other", "level", "level", "level", "level"], expected: null });
  expect(result[1]).toMatchObject({ code: "invalid_value", receivedType: "string", receivedValueCategory: "outside_allowed_values" });
  expect(result[2]).toMatchObject({ code: "unknown", messageCategory: "unknown" });
  expect(result[3]).toMatchObject({ code: "custom", messageCategory: "custom" });
  expect(JSON.stringify(result)).not.toContain(privateValue);
  expect(z.array(feedbackSchemaIssueSchema).safeParse(result).success).toBe(true);
});

test("never evaluates input getters or mistakes inherited properties for submitted values", () => {
  const getter = vi.fn(() => { throw new Error("PRIVATE_GETTER"); });
  const input = Object.create({ explanation: "PRIVATE_PROTOTYPE" });
  Object.defineProperty(input, "answer", { get: getter });
  const error = new z.ZodError([
    { code: "invalid_type", path: ["answer"], expected: "string", message: "PRIVATE_MESSAGE" },
    { code: "invalid_type", path: ["explanation"], expected: "string", message: "PRIVATE_MESSAGE" },
  ]);
  expect(summarizeFeedbackSchemaIssues(error, input)).toEqual([
    expect.objectContaining({ path: ["answer"], receivedType: "unknown" }),
    expect.objectContaining({ path: ["explanation"], receivedType: "missing" }),
  ]);
  expect(getter).not.toHaveBeenCalled();
});

test.each([
  undefined, null, "text", 3, true, BigInt(3), Symbol("PRIVATE_SYMBOL"), () => "PRIVATE_FUNCTION", [], {},
])("received root type remains a category for %s", (input) => {
  const error = new z.ZodError([{ code: "custom", path: [], message: "PRIVATE_MESSAGE" }]);
  const result = summarizeFeedbackSchemaIssues(error, input);
  expect(feedbackSchemaIssueSchema.safeParse(result[0]).success).toBe(true);
  expect(JSON.stringify(result)).not.toContain("PRIVATE");
});

test("report schema rejects arbitrary strings, indexes, fields and oversized paths", () => {
  const valid = summarizeFeedbackSchemaIssues(new z.ZodError([{ code: "custom", path: [], message: "private" }]), null)[0];
  for (const override of [
    { code: "PRIVATE" }, { expected: "PRIVATE" }, { receivedType: "PRIVATE" }, { messageCategory: "PRIVATE" },
    { receivedValueCategory: "PRIVATE" }, { path: ["PRIVATE"] }, { path: [10000] }, { path: [-1] },
    { path: Array(11).fill("level") }, { rawMessage: "PRIVATE" },
  ]) expect(feedbackSchemaIssueSchema.safeParse({ ...valid, ...override }).success).toBe(false);
});
