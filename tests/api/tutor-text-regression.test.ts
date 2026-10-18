import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { z } from "zod";
import { TUTOR_ANSWER_LIMIT } from "@/domain/tutor";

vi.mock("server-only", () => ({}));
const fetchMock = vi.fn<typeof fetch>();
beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("DEEPSEEK_API_KEY", "offline-test-key");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.spyOn(console, "info").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

const question = "What is a constraint in requirement clarification?";
const answer = "A constraint is a limit, such as which devices people can use.";
const history = [{ role: "user", content: question }, { role: "assistant", content: answer }];
function wireResponse(text: unknown) {
  return new Response(JSON.stringify({ object: "response", status: "completed",
    output: [{ type: "message", role: "assistant", status: "completed", content: [{ type: "output_text", text, annotations: [] }] }],
    usage: { input_tokens: 1172, output_tokens: 52, total_tokens: 1224 },
  }), { headers: { "content-type": "application/json" } });
}

it.each([false, true])("Tutor real SDK path accepts plain text (follow-up=%s), preserving actual history", async (followUp) => {
  const { askTutor } = await import("@/server/ai/tutor");
  fetchMock.mockResolvedValue(wireResponse(`  ${answer}\n`));
  const conversation = followUp ? history : [];
  const currentQuestion = followUp ? "Can you give a small lost-and-found example of that?" : question;
  const result = await askTutor({ courseId: "requirement-clarification", lessonId: "what-to-ask", question: currentQuestion, conversation });
  expect(result.data).toBe(answer);
  const request = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
  expect(request).toMatchObject({ model: "deepseek-flash", text: { format: { type: "text" } }, reasoning: { effort: "none" }, max_output_tokens: 900 });
  expect(request.input).toEqual([...conversation, { role: "user", content: currentQuestion }]);
  expect(request.instructions).not.toMatch(/json|relatedToLesson|schemaName/i);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it.each([52, 71])("Tutor rejects the observed completed whitespace-only response class (%s characters)", async (length) => {
  const { askTutor } = await import("@/server/ai/tutor");
  fetchMock.mockResolvedValue(wireResponse(" ".repeat(length)));
  await expect(askTutor({ courseId: "requirement-clarification", lessonId: "what-to-ask", question: "Give an example of that.", conversation: history }))
    .rejects.toMatchObject({ code: "INVALID_AI_RESPONSE", diagnostic: "TEXT_OUTPUT_FAILURE" });
  const event = vi.mocked(console.info).mock.calls.find(([name]) => name === "ai_response_diagnostic");
  expect(JSON.parse(event![1] as string)).toMatchObject({ stage: "content", diagnostic: "TEXT_OUTPUT_FAILURE", textLength: length, trimmedTextLength: 0, jsonType: null, schemaIssues: [] });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toMatch(/offline-test-key|which devices/);
});

it.each([
  ['{"ok":true}', null],
  ['{"ok":', "JSON_OUTPUT_FAILURE"],
  ['{"ok":"yes"}', "SCHEMA_VALIDATION_FAILURE"],
])("structured real SDK path retains JSON Output + JSON.parse + Zod: %s", async (text, diagnostic) => {
  const { requestStructuredResponse } = await import("@/server/ai/provider");
  fetchMock.mockResolvedValue(wireResponse(text));
  const result = requestStructuredResponse({ operation: "capability", instructions: "Return a json object.", input: "Check capability.", schemaName: "check", schema: z.strictObject({ ok: z.boolean() }) });
  if (diagnostic) await expect(result).rejects.toMatchObject({ code: "INVALID_AI_RESPONSE", diagnostic });
  else expect((await result).data).toEqual({ ok: true });
  const request = JSON.parse(fetchMock.mock.calls[0][1]!.body as string);
  expect(request.text.format.type).toBe("json_object");
  expect(request.instructions).toContain("properties");
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("Tutor rejects oversized text instead of truncating or returning a fallback", async () => {
  const { askTutor } = await import("@/server/ai/tutor");
  fetchMock.mockResolvedValue(wireResponse("x".repeat(TUTOR_ANSWER_LIMIT + 1)));
  await expect(askTutor({ courseId: "requirement-clarification", lessonId: "what-to-ask", question, conversation: [] }))
    .rejects.toMatchObject({ code: "INVALID_AI_RESPONSE" });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it.each([
  { object: "response", status: "completed", output: null },
  { object: "response", status: "completed", output: [{ type: "message", status: "completed", content: null }] },
])("Tutor rejects malformed response state even when SDK text extraction fails %#", async (body) => {
  const { askTutor } = await import("@/server/ai/tutor");
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } }));
  await expect(askTutor({ courseId: "requirement-clarification", lessonId: "what-to-ask", question, conversation: [] }))
    .rejects.toMatchObject({ code: "INVALID_AI_RESPONSE", diagnostic: "INVALID_RESPONSE" });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("Tutor accepts reasoning before multiple canonical text chunks and keeps the length bound inclusive", async () => {
  const { askTutor } = await import("@/server/ai/tutor");
  const text = "a".repeat(TUTOR_ANSWER_LIMIT);
  fetchMock.mockResolvedValue(new Response(JSON.stringify({ object: "response", status: "completed", output: [
    { type: "reasoning", summary: [] },
    { type: "message", status: "completed", content: [{ type: "output_text", text: text.slice(0, 2000) }, { type: "output_text", text: text.slice(2000) }] },
  ] }), { headers: { "content-type": "application/json" } }));
  expect((await askTutor({ courseId: "requirement-clarification", lessonId: "what-to-ask", question, conversation: [] })).data).toBe(text);
});

it("SDK network TypeError retains safe network mapping and is never retried", async () => {
  const { askTutor } = await import("@/server/ai/tutor");
  fetchMock.mockRejectedValue(new TypeError("private network failure"));
  await expect(askTutor({ courseId: "requirement-clarification", lessonId: "what-to-ask", question, conversation: [] }))
    .rejects.toMatchObject({ code: "UNAVAILABLE", diagnostic: "NETWORK" });
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(vi.mocked(console.info).mock.calls)).not.toMatch(/private|offline-test-key/);
});
