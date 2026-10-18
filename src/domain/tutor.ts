import { z } from "zod";

export const TUTOR_QUESTION_LIMIT = 1200;
export const TUTOR_ANSWER_LIMIT = 4000;
export const TUTOR_HISTORY_LIMIT = 12;

export const tutorMessageSchema = z.strictObject({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(TUTOR_ANSWER_LIMIT),
});
export type TutorMessage = z.infer<typeof tutorMessageSchema>;

export const tutorRequestSchema = z.strictObject({
  courseId: z.string().min(1).max(80),
  lessonId: z.string().min(1).max(80),
  question: z.string().trim().min(1).max(TUTOR_QUESTION_LIMIT),
  conversation: z.array(tutorMessageSchema).max(TUTOR_HISTORY_LIMIT),
}).superRefine(({ conversation }, context) => {
  if (conversation.length % 2 !== 0 || conversation.some((message, index) => message.role !== (index % 2 === 0 ? "user" : "assistant"))) {
    context.addIssue({ code: "custom", path: ["conversation"], message: "History must contain completed question/answer pairs." });
  }
});
export type TutorRequest = z.infer<typeof tutorRequestSchema>;

// Application envelope validates a string; no model-generated JSON object is required.
export const tutorTextSchema = z.string().trim().min(1).max(TUTOR_ANSWER_LIMIT);
export type TutorAnswer = z.infer<typeof tutorTextSchema>;
