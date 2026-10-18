# P04 closure — AI Client Role-play complete

- Date: 18 October 2026 (Asia/Shanghai).
- P04 STATUS: COMPLETE. T016–T021 DONE. P01/P02/P03 remain COMPLETE.
- User-run Client acceptance: 14/14 PASS; run failures NONE; no automatic retry.
- HUMAN_SEMANTIC_REVIEW: PASS, explicitly confirmed by the user for all 14 cases.
- NEXT_TASK = T022. T022 / P05 was not executed in this closure.
- Codex reran no live DeepSeek acceptance. SPEC, SCENARIO, PLAN, provider core
  and lockfile are unchanged from the P03 savepoint.

Final live evidence is preserved at Git ignored
`test-results/live/client-2026-10-18T13-30-57-628Z/`.
AUTOMATED_CHECKS=PASS and T021_CANDIDATE=PASS. The raw report retains its fixed
HUMAN_REVIEW_REQUIRED=YES / T021=PENDING fields and unchecked human checklist;
the user's separate completed review closes that gate. Do not edit those artifacts
or rerun paid acceptance to change the script fields. All 16 existing live evidence
files, including earlier failed Client runs and P03 Tutor evidence, retain their
pre-closure SHA256 hashes. Per-case results, request IDs and final report hashes
are recorded in VERIFICATION.md.

Controlled disclosure PASS; max-two compound disclosure PASS (F08+F09);
repeat / pronoun continuity PASS; incorrect 30 corrected to frozen 20 PASS;
tell-me-everything boundary PASS; summary-writing / prompt-injection boundary PASS;
unknown-fact no-invention PASS; fresh-attempt isolation PASS. The wrong-assumption
reply repeats authorized F04 wording within the same fact group and introduces no
new hidden fact; the user accepted it as nonblocking.

Final offline regression: lint PASS; typecheck PASS; 24 files / 274
unit/API/component tests PASS; build PASS; full Edge E2E 23/23 PASS, all exit 0.
The E2E command uses `--output=test-results/p04-closure-e2e` to preserve live
evidence. Its Windows server teardown stalled after all assertions passed;
terminating only its four verified server Node processes let the original
command finish successfully without rerunning assertions. P03 Tutor's three
E2E cases and existing offline regressions PASS.

Hidden-value serialization boundary PASS: 41 production artifacts, 14 HTML/RSC
responses and 63 private/provider markers; zero matches, zero external AI requests.
Git audit excludes env files, credentials, dependencies, temporary files, build,
E2E and raw live output. The 46 changed files are scoped to P04 implementation,
tests and documentation. This is the user-authorized savepoint on main:
`feat: complete P04 AI client role-play`, followed by `git push origin main`;
the resulting commit ID and push outcome are reported after execution.
No history rewrite, deployment or work beyond P04 is included.

# Archived T021 turn whitespace mitigation — before final live run

- Date: 18 October 2026 (Asia/Shanghai).
- T021 TURN FIX STATUS: READY_FOR_RERUN; T021 remains PENDING.
- History influence: UNPROVEN. Turn response mode: STRUCTURED.
- P04 is not COMPLETE. T016–T020 remain DONE; no T022/P05, commit or push.
- Codex sent no live DeepSeek request. Both original Client live runs are intact.

Latest evidence: `test-results/live/client-2026-10-18T10-53-48-357Z/`.
The user's second run passed opening/users/goal/Chinese constraints, with explicit
human semantic PASS for all four. Selections were none/F01/F02/F08. Case 5 signup,
after seven history messages, returned completed output_text with length 37 and
trimmed length 0. App request ID `c9800094-7b7b-41a1-b73a-1f39a5d21d2c`, provider
duration 1013ms, usage 990/37/1027. The content-stage !text.trim() check rejected it
as JSON_OUTPUT_FAILURE before JSON.parse, Zod, disclosure or fixed rendering.
This was not an auth, network, route, timeout or JSON-field mismatch failure.

Opening and turn use the same Responses SDK method, model, json_object format,
reasoning=none, 600 output tokens, transport and extraction core. Both already
had explicit json instructions, an example and the supplied JSON Schema. The
actual difference was input serialization: opening had a simple generation input;
turn appended a question to actual protocol-level user/assistant history whose
assistant replies were natural-language Maya text, while this operation must
output a machine decision. The 12-point comparison is in VERIFICATION.md.
Neither the artifact nor the official empty-output notice proves history caused
this particular generation. Do not claim that hypothesis as established fact.

Minimal mitigation: buildClientTurnPrompt now places the complete validated
history and current question in a JSON data message, preserving every role label
and text as conversationContext/currentQuestion. A separate final user message
reasserts one non-empty decision JSON object. History is never dropped or promoted
to higher-priority instructions; earlier visible replies are explicitly context,
not examples of the model's output format. The existing single example stays;
keys/enums, array types and no Markdown/prose are explicit. questionEvidence
remains [{factId,quote}], with quote:string, as required by the unchanged schema
and gate. The model still selects facts; only the fixed renderer produces values.

No provider/model/reasoning/token/timeout change, schema relaxation, free TEXT,
fallback, retry, disclosure-policy or fact change. Opening generation and its
policy are unchanged. Safe turn metadata records mode, actual history count,
promptContractVersion=turn-context-v2 and structuredOutputMode=json_object; the
harness retains only those allowlisted fields. No prompt/history/value is logged.

Verification: lint/typecheck/build PASS; **24 files / 274 offline tests PASS**.
Nine new real-SDK production-path regressions cover seven-message signup success,
the observed whitespace class, JSON contract/example, undisclosed-value exclusion,
single/repeated and compound/max-two selection, quoted injection data and diagnostic
projection. Client 6/6 and Tutor 3/3 production Edge E2E PASS; isolation scan
41 artifacts / 14 responses / 63 markers PASS. Exact commands and original report
hashes are in VERIFICATION.md.

Next user command in the existing key-configured PowerShell:

```powershell
npm run test:ai:client:acceptance
```

The same 14-case fail-fast/no automatic retry harness must verify the revised
turn contract with real requests and human review. Earlier four-case PASS is
retained evidence for the previous path, not proof that v2 or all 14 now pass.
Do not close T021 or commit before full live/human acceptance. Planned NEXT_TASK
is T022 after closure; T022 has not been executed.

# Archived T021 opening diagnosis and fix — before second live run

- Date: 18 October 2026 (Asia/Shanghai).
- T021 OPENING FIX STATUS: READY_FOR_RERUN; T021 remains PENDING.
- P04 remains READY_FOR_LIVE_ACCEPTANCE, not COMPLETE. T016–T020 stay DONE.
- Codex executed no live DeepSeek request. No commit/push or T022/P05 work.

The user's first live run stopped at opening, 1/14 requests. Preserved evidence:
`test-results/live/client-2026-10-18T09-56-44-732Z/`. Application request ID
`ace01c99-8d2c-41bf-8d2e-fe8c6524ea4b`; 12,436ms, provider 12,090ms,
usage 287 input / 51 output / 338 total; provider outcome success. No subsequent
semantic turn was sent. Both original report hashes are in VERIFICATION.md.

Failure stage is **POLICY**. In `provider.ts::requestResponse`, structured
`outcome = success` is assigned only after completed response/content extraction,
JSON.parse and the supplied Zod schema succeed. Opening's actual runtime contract
is **STRUCTURED / JSON Output / {reply: string}**, trim, 1–600 characters; prompt,
schema and service all use `reply`. It is not an `{opening}` field mismatch.
The subsequent historical branch in `client.ts::askClient`,
`if (!isPublicOpening(result.data.reply))`, threw INVALID_AI_RESPONSE under the
misleading SCHEMA_VALIDATION_FAILURE label. It had no service-layer diagnostic.
The route returned ok:false; the harness correctly kept answer=null. Opening
does not select fact IDs, so modelSelection=null was expected.

The artifact contains neither rejected text nor policy reasons. We cannot name
the exact rejected word/character or prove that the model's reply was otherwise
valid. Do not invent those details. The verified contract gap was that the
prompt allowed generic common words while the policy accepted a closed, unstated
word list, along with minimum-word/character/topic-word constraints.

Minimal change: the opening prompt now receives the exact original public word
list and format rules from the same module used by its policy. No accepted word,
schema bound or policy predicate was broadened or removed. Opening remains a real
structured request and returns the actual generated reply only if valid. No TEXT
migration, static fallback, automatic retry, model/transport/provider-core change
or turn disclosure change. SPEC/SCENARIO/PLAN and frozen F01–F10 are untouched.

New `client_opening_diagnostic` contains only stage/outcome, the code
OPENING_POLICY_REJECTED, provider validation success/request ID, lengths/counts
and reason enums: TOO_FEW_WORDS, UNSUPPORTED_VOCABULARY, UNSUPPORTED_CHARACTERS,
MISSING_WEBSITE, MISSING_SIGNUP. It never logs rejected text/words, prompts,
headers, credentials or hidden values. Success records mapping completion.
The public API error stays generic. The harness now retains allowlisted provider
shape/JSON/schema diagnostics and the opening policy event, and reports the
specific failure layer. Historical missing reasons remain unknown.

Verification: lint/typecheck/build PASS; **23 files / 265 offline tests PASS**,
including 19 new regressions (11 real-SDK HTTP-intercepted production-path API
tests and 8 policy/diagnostic tests). Client 6 + P03 Tutor 3 production Edge E2E
PASS, 9/9; 41 artifacts / 14 HTML-RSC responses / 63 markers isolation PASS.
No paid provider was contacted. The synthetic public-paraphrase policy fixture
reproduces the branch; it is explicitly not claimed to be the lost live reply.

Next user command in the existing key-configured PowerShell:

```powershell
npm run test:ai:client:acceptance
```

The existing 14-request cap, fail-fast behavior and mandatory human review remain.
This is READY_FOR_RERUN, not evidence that a real rerun has passed. Preserve the
original failed run; new evidence goes to a new timestamped folder. Do not commit
or advance to T022 until T021 live/human closure. Planned NEXT_TASK = T022 after
that closure; T022 has not been executed.

# Archived P04 implementation handoff — before first live run

- Date: 18 October 2026 (Asia/Shanghai).
- P04 STATUS: READY_FOR_LIVE_ACCEPTANCE. T016–T020 DONE; T021 PENDING.
- P01/P02/P03 remain COMPLETE. P03 original live/human evidence is preserved.
- Starting HEAD remains `70225b4658334ce88bea703f2712f0413c838e34`.
  Existing uncommitted T016 work was retained and extended in dependency order.
- No real DeepSeek request, commit, push, persistence or deployment was executed.
- Current next action: user-run T021 live acceptance and human semantic review.
  NEXT_TASK becomes T022 only after P04 closure; do not execute T022 now.

Run in the user's existing key-configured PowerShell:

```powershell
npm run test:ai:client:acceptance
```

The command builds first, starts an isolated production server and real browser,
and sends at most 14 requests across two fresh conversations. It fails fast,
never retries automatically, guards exact browser question/history/attempt,
and blocks other AI endpoints/external browser traffic. It checks the model's
actual action/IDs independently of the final policy/renderer, the cumulative
ledger, visible fixed text, UI rendering, route retention and Progress 0%.
Safe metadata and actual replies go into a unique ignored
`test-results/live/client-<timestamp>/client-acceptance.json` and `.txt`.
Missing key means zero requests and nonzero exit. Do not run capability/Tutor
smokes first or rerun successful cases as a substitute for reviewing evidence.
Human must review every choice/reply against the provided checklist, including
second-attempt consistency. Script fields deliberately remain
`HUMAN_REVIEW_REQUIRED=YES; T021=PENDING`, even on candidate PASS.

Implemented:

- T017: strict action/ID/evidence contract, max two distinct groups, source-quote
  checks, prior-ledger repeat checks, broad/summary/role boundaries and explicit
  cross-topic rejection. Renderer only emits frozen fact sentences or finite
  clarification/unknown/redirect text. Topic backstops do not certify general
  semantic relevance; novel paraphrases and pronouns still require real AI QA.
- T018: existing structured provider for generated public opening and per-turn
  semantic selection. Opening sees public identity/vague request only, and its
  reply must pass a closed public vocabulary; unsupported wording is a failure
  with no fallback. Turn sees topic labels and validated actual transcript, not
  undisclosed values/rubric. Ledger derives from assistant IDs/text; user-provided
  guesses remain untrusted questions, never trusted scenario values.
- T019: strict stateless `POST /api/ai/client`, existing bounded body reader,
  safe error envelope and no-store. No browser system role, arbitrary scenario,
  extra fields, illegal IDs or fabricated assistant facts accepted.
- T020: explicit Start interview, shared chat controls, pending/duplicate guards,
  exact Retry snapshots, preserved newer drafts and navigation/in-flight replies.
  Client session lives in LearningProvider's active attempt; stale attempts are
  ignored. Internal IDs are not displayed as learning content. Zero questions may
  reach the Summary handoff; the form is visibly unavailable. No P05 fields,
  feedback, completion or recommendation was implemented.
- T021 preparation: 14-case real-browser acceptance harness plus offline tests.
  No live or human semantic PASS is claimed.

Verification: lint PASS; typecheck PASS; 21 files / 246 unit/API/component tests
PASS (176 baseline + 70 new); production build PASS; 23/23 production Edge E2E
PASS (17 existing + 6 new). Final spacing-only CSS refinement was rebuilt and
the six Client E2E rerun successfully. Production isolation: 41 browser/prerender
artifacts, 14 HTML/RSC responses, 63 private/provider markers, canary PASS,
zero matches. Screenshots at 320/768/1024/1440px confirm reflow; core keyboard,
focus, loading, failure/Retry and route behaviors are checked in E2E.
Detailed commands, intermediate failures and limits are in VERIFICATION.md.

Changes include `src/domain/client*.ts`, scenario policy/renderer, AI Client
service/prompts/opening validation, API route, Activity features/CSS, shared
chat/API wording and learning state integration; new unit/API/E2E/live files;
README, package script and current docs. Existing T016 source/tests remain.
Provider/Tutor code, SPEC, SCENARIO and package-lock are unchanged. Original
Tutor acceptance hashes match the archived P03 evidence below. No commit now:
the user requested one combined `feat: complete P04 AI client role-play`
savepoint only after required live acceptance and human review pass.

# Archived T016 implementation handoff

- Date: 18 October 2026 (Asia/Shanghai).
- T016 STATUS: DONE. P01/P02/P03 remain COMPLETE; P04 IN PROGRESS.
- Restored from clean HEAD `70225b4658334ce88bea703f2712f0413c838e34`,
  `feat: complete P03 AI tutor`; Git history and the seven project docs were read.
- NEXT_TASK = T017. Stop after T016; T017 has not been executed.
- Changes are uncommitted. No commit, push, deployment or live DeepSeek request.

T016 separates public opening material from the versioned private scenario.
`src/content/activities/client-interview.ts` exports the existing Activity
metadata and a minimal introduction: scenario ID/version, Maya's name/role and
the frozen vague request. The course registry now references that Activity.
The opening string is prompt material for T018, not a generated response or
an API success fallback. No page behavior changed.

`src/server/scenarios/club-signup.ts` is the shared future Client/Feedback
reference for `club-signup-v1`, version 1. It contains all ten verbatim English
client wordings, original disclosure guidance, background, priorities/reasons,
seven case acceptance criteria, reference flow, scope and nine rubric entries
(questioning plus eight summary fields). Private developer/evaluation guidance
retains the source document's Chinese; it is not interview reply text.
`schema.ts` and `club-signup.ts` both import `server-only`. Strict exhaustive
records and fact references reject missing/unknown IDs; parsed data is deeply
readonly. Public content does not import or re-export private data.

Verification: lint PASS; typecheck PASS; 15 files / 176 unit/API/component tests
PASS (152 existing + 24 new); production build PASS. New tests in
`tests/unit/scenario.test.ts` compare data against frozen SCENARIO, reject bad
IDs/references, check public serialization, and exercise actual ordinary Node
imports with no server-only mock in the subprocess. Private imports fail;
the public dependency graph imports successfully. The isolated production
audit passed for 37 client/prerender artifacts and 14 responses (HTML and RSC
for seven existing pages), checking 60 private/provider markers. No UI/browser
flow change; E2E was not rerun. Exact commands are in VERIFICATION.

P03 regression PASS: all existing tests pass, including Tutor TEXT, structured
JSON Output/JSON.parse/Zod, current-lesson isolation, secret/completion boundaries,
shared 60s transport and no automatic retries. Provider, Tutor and HTTP sources
are untouched. SPEC, SCENARIO, PLAN, dependencies/lock and the original live
acceptance artifacts are unchanged; recorded SHA-256 values still match.
Historical P03 4/4 live acceptance, human semantic review and hidden-fact PASS
remain accepted evidence and must not be rerun for this task.

T017 owns disclosure policy and fixed-fact rendering, including at most two
related groups, repeat/correction, broad requests, unknown requests and evidence
validation. T018 owns AI generation/selection; T019 the API; T020 the workspace;
T021 the real-model semantic acceptance. T016 does not claim those behaviors
are implemented. SCENARIO remains the frozen authority; do not add facts.

The rest of this file preserves the completed P03 handoff as historical evidence.

# Archived P03 implementation handoff

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
