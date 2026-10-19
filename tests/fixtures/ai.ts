import type { BrowserContext, Page, Route } from "@playwright/test";
import type { ClientRequest } from "../../src/domain/client";
import type { CourseLearningState } from "../../src/domain/learning";
import type { FeedbackRequest } from "../../src/domain/submission";
import type { TutorRequest } from "../../src/domain/tutor";
import { emptyAssessment, fixtureAssessment } from "./feedback";

export const courseId = "requirement-clarification";
export const coursePath = `/courses/${courseId}`;
export const activityPath = `${coursePath}/activity`;
export const lessonIds = ["why-clarify", "what-to-ask", "structure-requirements"];
export const tutorAnswer = "A constraint is a limit the solution must respect, such as the devices students use.";
export const clientOpening = "Our club needs a simple website so students can sign up for events more easily.";
export const clientAnswer = "Students at our university use their phones, and Maya needs to see who registered.";

export function feedbackResponse(request: FeedbackRequest) {
  const question = request.transcript.find((turn) => turn.role === "user");
  const assessment = question ? fixtureAssessment("Strong", request.summarySnapshot) : emptyAssessment();
  if (question) assessment.questioning.evidence = [{ source: "turn", turnId: question.id, fieldId: null, quote: question.text, factId: null }];
  return { ok: true, requestId: "controlled-feedback", data: {
    attemptId: request.attemptId, submissionId: request.submissionId, requestId: request.requestId,
    scenarioVersion: "1", assessment,
  } };
}

type Purpose = "tutor" | "client" | "feedback";
type Response = { status?: number; json: unknown };

/** Test-only HTTP interception. Unknown AI purposes are blocked before the server. */
export function controlledAi() {
  const requests = { tutor: [] as TutorRequest[], client: [] as ClientRequest[], feedback: [] as FeedbackRequest[] };
  const unexpected: string[] = [];
  const responses: Record<Purpose, (Response | Promise<Response>)[]> = { tutor: [], client: [], feedback: [] };
  async function handle(route: Route) {
    const path = new URL(route.request().url()).pathname;
    const request = route.request().postDataJSON();
    let purpose: Purpose;
    let response: Response;
    if (path === "/api/ai/tutor") {
      purpose = "tutor"; requests.tutor.push(request);
      response = { json: { ok: true, requestId: "controlled-tutor", data: tutorAnswer } };
    } else if (path === "/api/ai/client") {
      purpose = "client"; requests.client.push(request);
      const facts = request.mode === "opening" ? [] : ["F01"];
      response = { json: { ok: true, requestId: "controlled-client", data: {
        reply: request.mode === "opening" ? clientOpening : clientAnswer, factIds: facts, disclosedFactIds: facts,
      } } };
    } else if (path === "/api/ai/feedback") {
      purpose = "feedback"; requests.feedback.push(request);
      response = { json: feedbackResponse(request) };
    } else {
      unexpected.push(path); await route.abort("blockedbyclient"); return;
    }
    const queued = responses[purpose].shift();
    await route.fulfill(queued ? await queued : response);
  }
  return {
    requests, unexpected,
    install: (target: Page | BrowserContext) => target.route("**/api/ai/**", handle),
    respondNext: (purpose: Purpose, response: Response | Promise<Response>) => { responses[purpose].push(response); },
  };
}

export function savedCourse(page: Page): Promise<CourseLearningState | null> {
  return page.evaluate((id) => {
    const raw = localStorage.getItem("comp5241:learning:v1");
    return raw ? JSON.parse(raw).courses[id] : null;
  }, courseId);
}
