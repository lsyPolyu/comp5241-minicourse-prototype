# P03 implementation handoff

- Date: 18 October 2026 (Asia/Shanghai).
- P03 STATUS: COMPLETE. T012-T015: DONE. P01/P02 remain COMPLETE.
- Live semantic acceptance: 4/4 PASS. Human semantic review: PASS.
- Hidden-fact boundary: PASS. Provider errors: NONE. Automatic retries: NONE.
- Case 1 duration: 12.213s; providerOutcome: success.
- Shared request/connection policy: 60s/60s for all operations; browser 65s,
  harness 67s. The successful suite supersedes the historical 10.712s timeout.
- Current Tutor mode: TEXT. Structured operations: JSON Output + JSON.parse + Zod.
- NEXT_TASK = T016, as a later implementation position only; not executed.
- Starting P02 savepoint: b06392a91660016aaa304848fa697ac8de71c6f5.
- Closure reuses the user's live evidence and completed human review; no new
  live AI request, reset, deployment, persistence or T016/P04 change.
- The user authorized the P03 savepoint `feat: complete P03 AI tutor` and
  push from main to origin/main after the final regression and Git audit.

## Architectural correction authorized by the user

Two independent live follow-up runs returned completed output_text containing
whitespace only under Tutor JSON Output mode: 71 characters, then 52 characters.
The latter has trimmedTextLength=0 and usage 1172/52/1224. Adding a concrete
JSON example did not resolve it. The earlier first-turn successes do not
establish a reliable natural-language Tutor contract.

Decision: Tutor migrated to plain text response mode. The user explicitly
authorized this correction; SPEC is unchanged. PLAN's provider/Tutor contract
and TASKS implementation notes now reflect the final mode. Do not continue
JSON prompt experiments or classify these observed failures as network/auth.

## Current provider and application contracts

One server-only DeepSeek SDK client remains shared: deepseek-flash,
https://api.deepseek.com, DEEPSEEK_API_KEY, maxRetries=0, logLevel=off,
reasoning.effort=none. Tutor output stays at 900 tokens. All operations now use
AI_REQUEST_TIMEOUT_MS=60000 and AI_CONNECTION_TIMEOUT_MS=60000 via the same
requestResponse function, with one per-request Agent destroyed in finally.
Browser AbortController waits 65s; both live scripts derive 67s from that public
client constant. AI_CAPABILITY_TIMEOUT_MS is a compatibility alias, not a
capability-only transport branch. No capability probe was run.

- requestTextResponse: Tutor only; text.format.type=text. Extract canonical
  message/output_text items, trim, require 1-4000 characters, return string.
  No JSON instruction/example, JSON.parse, generated object schema or
  relatedToLesson flag on this path.
- requestStructuredResponse: capability, Client and Feedback operation types;
  text.format.type=json_object, JSON.parse, then supplied Zod schema. Invalid
  model JSON remains rejected with JSON_OUTPUT_FAILURE; mismatch remains
  SCHEMA_VALIDATION_FAILURE. P01 foundation tests remain.
- Both interfaces use the same production SDK/extraction/error/telemetry core.
  No copied transport, fake answer, arbitrary object coercion or automatic Retry.
- Tutor response status must be completed; missing/malformed output/content,
  unusable message state, non-string text, empty/whitespace and oversized text
  fail safely. Empty text diagnostic is TEXT_OUTPUT_FAILURE, not a JSON error.
  Bare TypeError during the SDK's pre-return text derivation maps to invalid
  response on Tutor only; real fetch failures still map to NETWORK.
- The same-origin HTTP envelope remains JSON protocol data:
  success {ok:true,requestId,data:string}, or the existing friendly error.
  This does not ask the model to generate JSON.
- Browser string validation, state and reducer consume the validated text.
  Assistant history is exactly the student's displayed natural-language answer.
  The route never sends diagnostics, provider headers, prompts or raw errors.

## Teaching, history and learning safety

Published course/lesson IDs resolve trusted content server-side. Only the
current lesson identity/objective/blocks/Tutor concepts/terms/example/topics
are selected. No other lesson body/objective, private scenario, F01-F10,
rubric or learning state enters trusted context. History and questions stay
untrusted user/assistant data; forged system roles and extra fields are rejected.

The prompt retains beginner-friendly, concise English teaching, explanation,
examples, simplification, follow-up coherence, current-lesson scope and brief
redirection. It cannot act as the Activity client, reveal private facts, write
the eight fields or claim completion. All JSON-only Tutor instructions are gone.

Root sessions still isolate course/lesson, retain drafts/history across
navigation, route in-flight responses correctly and ignore stale IDs. Failure
preserves the failed snapshot and any new draft; explicit Retry sends that same
snapshot once without duplicating turns. Replies render as React text.
Tutor never dispatches a learning-completion action. Explicit Complete Lesson
alone controls completion; the P02 three-lessons=75% rule is unchanged.

## Current offline verification

| Check | Result |
| --- | --- |
| npm run lint | PASS |
| npm run typecheck | PASS |
| npm run test | 14 files / 152 tests PASS |
| npm run build | PASS, Next.js 16.4.2 production build |
| npm run test:e2e, isolated production server | 17/17 Edge tests PASS |
| Tutor first-turn and follow-up text | PASS through actual SDK with intercepted HTTP |
| Tutor 52/71-character whitespace rejection | PASS, TEXT_OUTPUT_FAILURE |
| Structured valid JSON / invalid JSON / Zod mismatch | PASS |
| Malformed SDK response / inclusive length bound / network mapping | PASS |
| F01-F10, other-lesson and injection isolation | PASS, deterministic context tests |
| Secret boundary | PASS, safe errors/logs and actual server-only import rejection |
| Completion, draft/history and Retry regressions | PASS |

New tests are in tests/api/tutor-text-regression.test.ts (12 cases). Five of
the initial eight failed before the mode migration; all passed afterwards.
Two additional malformed-SDK cases also failed before the focused error fix.
No test-only extraction helper bypasses the production path. Historical
JSON-Tutor prompt tests were replaced; capability SDK tests are preserved.

Earlier P03 implementation evidence (before this contract correction):
build PASS, 116 tests PASS, 17/17 production Edge E2E PASS, 1440/390px visual
QA with ten controlled states, actual server-only rejection and 44-artifact
client scan PASS. These controlled results do not prove real teaching.
Closure reran lint/typecheck/test/build and the full E2E suite against the
final TEXT/shared-transport sources. A separate production server on port 3193
avoided reusing the old process on 3100. Temporary config, logs and E2E output
are ignored under .tools/p03-closure-20261018/; no live command was rerun.

## T015 live acceptance and human review complete

The user's latest TEXT reports are test-results/live/tutor-acceptance.json
and .txt. Requests=4/4, provider errors=NONE, retries=NONE,
AUTOMATED_CHECKS=PASS and T015_CANDIDATE=PASS. All four cases have
providerOutcome=success, no failures and hidden-fact/claim scan PASS:

| Case | Conversation / history messages | App duration | Result |
| --- | --- | --- | --- |
| explain | A / 0 | 12213ms | PASS |
| example | A / 2 | 1409ms | PASS |
| simplify-follow-up | A / 4 | 1435ms | PASS |
| boundary | B / 0 | 1552ms | PASS |

Case 1 app ID: 7e8bbe11-511f-4273-ba93-b46fb23bd150; provider duration
12094ms, outcome success. The successful 12.213s request is live evidence
consistent with the shared transport fix exceeding the former 10s limit;
offline tests verify the exact 60s connection/request configuration.

The user explicitly confirmed human semantic review PASS for all four answers:
beginner-friendly, relevant to Lesson 2, coherent with actual prior replies,
within the Tutor role, no invented course fact, no F01-F10 disclosure and no
Activity writing/completion. Case 4 refuses the role switch, hidden requirements
and filling all eight summary fields, then redirects the student to learning.
Generic lost-and-found/phone examples are teaching examples, not private
club-signup facts. The harness also confirms real answers rendered, retained
history, incomplete Lesson and Progress 0%.

The original harness deliberately leaves HUMAN_REVIEW_REQUIRED=YES and
T015=PENDING because it cannot certify human judgment. Those raw fields are
preserved unchanged. T015 DONE / P03 COMPLETE are recorded here using both
the 4/4 evidence and the user's subsequent explicit human-review conclusion.
Do not rerun live acceptance or the separate smoke/capability probes for closure.

Keys stay on the Node server; secret variables are filtered from browser env.
Only allowlisted numeric/enum diagnostics are persisted. No env file or
Windows setting was created/changed. Existing test:ai:tutor stays a separate
single-request smoke, now using string responses; do not run it first.

Ignored evidence snapshots in test-results/live/:
- tutor-acceptance-case2-original.json/.txt: first failure, subtype unrecorded.
- tutor-acceptance-case2-whitespace.json/.txt: 71-character JSON-mode failure.
- tutor-acceptance-case2-json52.json/.txt: 52-character failure after JSON prompt change.
- tutor-acceptance-text-timeout.json/.txt: first TEXT request, transport TIMEOUT.
- Current tutor-acceptance.json/.txt is the successful 4/4 TEXT run, unchanged
  by Codex; SHA-256 hashes are recorded in VERIFICATION. No artifact is committed.

## Files and phase boundary

Production correction: src/server/ai/provider.ts, errors.ts, tutor.ts,
tutorPrompt.ts; src/domain/tutor.ts, tutorSession.ts; src/state/TutorProvider.tsx.
The existing route's TutorAnswer type now denotes string without changing its
safe envelope implementation. Live scripts/cases/support, API/SDK/session/
component/client tests and E2E fixtures were migrated. README, PLAN, TASKS,
HANDOFF and VERIFICATION reflect the contract; no dependencies or lock change.
Transport-only changes: provider.ts and lib/api/client.ts, both live wait
limits, provider/SDK/client tests and timeout documentation. Tutor semantic
prompt, text validation and structured JSON path are unchanged in this turn.

The savepoint includes the existing P03 implementation, tests and closure docs.
Final regression is PASS; exact commands and artifact hashes are in VERIFICATION.
SPEC, package-lock, validated production sources and raw live artifacts were
unchanged during closure. No temporary E2E output, env file or credential belongs
in the commit. NEXT_TASK = T016, not executed in this closure. The remaining
Student workflow and deployment belong to later phases.
