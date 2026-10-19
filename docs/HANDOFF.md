# Client opening policy fix — 19 October 2026

The reported DeepSeek success followed by `OPENING_POLICY_REJECTED` / `UNSUPPORTED_VOCABULARY` comes from one generated token outside the closed public vocabulary; the log does not identify the token. `buildClientOpeningPrompt` now supplies the reviewed `initialRequest` as an exact JSON target and explicitly forbids paraphrasing. The service still validates and returns the actual provider reply. Vocabulary, schema, private-information boundaries and failure handling are preserved.

The two existing uncommitted regression tests were preserved: both failed before the prompt change and pass afterward. Final Node 22.23.3 verification: 41 test files / 481 tests PASS; lint, typecheck and production build PASS. No live DeepSeek request, commit, push or deployment ran for this fix. It remains a local change; real-provider behavior and deployment are unverified. See the current entry in [VERIFICATION.md](VERIFICATION.md).

---

# P07 release — READY_FOR_FINAL_USER_GATE (deployment pending)

- Date: 19 October 2026 (Asia/Shanghai). P01–P06 remain COMPLETE. This P07 release on `main` preserves the work after the P06 baseline `e886678`; its source revision is the normal release commit `feat: prepare P07 release and production QA` (`git log -1 --oneline`), not an empty commit.
- T033/T034/T035 browser verification PASS: complete **54/54 production-build E2E**, including Firefox, exited 0 in 2.5 minutes. Command: `npm run test:e2e -- --config=.tools/p07-release/playwright.config.ts --output=test-results/release/p07-final-host`; log `.tools/p07-release/e2e-final-host.log`, final `.last-run.json` passed.
- The previous window's run was incomplete and failed keyboard test #43. A restricted-sandbox rerun finished 53/54 with Firefox `browser.newPage: Target crashed`; the subsequent full host run passed all 54. These failed runs remain available; no paid AI ran. Trace review identified a test navigation/focus race in the old #43 failure. No additional browser-test edit or rerun was needed for this audit; the complete 54/54 result is retained.
- Artifact protection now also checks HTML/blob reporter destinations, including CLI/environment overrides. Focused guard tests 38/38 PASS. Final commit checks: lint PASS, typecheck PASS, **41 files / 479 unit/API/component tests PASS** (17.50s). The first parallel lint/test run's timeout failure is retained and explained in VERIFICATION; the normal suite passed alone without source/test-timeout changes. Existing four offline production-preflight files match their saved hashes; the 25 lost historical live artifacts remain unavailable.
- **Current scope: audit, offline regression, documentation, normal commit and push to `origin main`, then stop.** Do not change stable Tutor/Client/Feedback logic, rerun paid acceptance or start Teacher. The three existing route changes only add the P07 production duration budget.
- Local `.vercel/project.json`: `comp5241-minicourse-prototype`, project `prj_NQ6xj0ppUa4wofzzGhilQc8EPGsy`, team `team_g3BeDcP2xFVKcYHbMxC1vbvd`. Do not mix with the old Flask project.
- **User-confirmed remote state:** the GitHub repository is successfully connected to this Vercel project; Vercel shows **No Production Deployment**. A push to the connected `main` branch is expected to trigger a Git deployment. This is not evidence of an actual Ready deployment, verified Production origin or configured remote key.
- The candidate hostname probed from the project name was never a verified production URL. The user reports `404 DEPLOYMENT_NOT_FOUND`. Do not reuse it as a deliverable or infer deployment/alias state from that one response.
- After this push, the deployment and final user gate remain follow-up work: record the actual deployment ID, source revision, Ready status and stable Production origin, then verify anonymous operation without bypass headers/cookies. Any future environment check reads **names/presence only**, never secret values. This closure stops after push/status/log checks and sends no paid DeepSeek requests.
- [DEPLOYMENT.md](DEPLOYMENT.md) and [FINAL_USER_GATE.md](FINAL_USER_GATE.md) contain concrete configuration and one consolidated final gate. Required server-only variable: `DEEPSEEK_API_KEY`; optional `DEEPSEEK_MODEL=deepseek-flash`. User configures any missing key directly in Vercel Project Settings → Environment Variables; never in chat and never `NEXT_PUBLIC_`.
- P07 STATUS: **READY_FOR_FINAL_USER_GATE — deployment pending**. Production deployment/access/env/real AI/persistence and human timing/visual gates remain unproven. Do not mark P07, Student Must or AC-033 complete.

---

# Archived P06 closure — Recommendation and persistence complete

- Date: 19 October 2026 (Asia/Shanghai).
- P06 STATUS: COMPLETE. T029–T032 DONE. P01–P05 remain COMPLETE.
- NEXT_TASK = T033. Stop before T033; no P07, deployment or new AI feature.
- Existing uncommitted P06 work after `4c36667` was preserved and completed.
- Live DeepSeek executed: NO. No new paid acceptance or human semantic gate was needed.

RecommendationCard consumes the existing P05 result/action/reason. Review actions open the three implemented lessons; Retry Activity starts a distinct attempt for the same scenario; final summary shows the latest successful student submission only after all three lessons and the activity are complete. Strong feedback with missing lessons stays incomplete; weak feedback does not undo earned completion.

The replaceable LearningRepository saves one validated snapshot at `comp5241:learning:v1`. Explicit lesson completion, current lesson, earned activity completion, attempt metadata and the latest successful summary/feedback/recommendation are saved together. Progress and completion are derived. Hydration blocks interaction/save until load and validation complete; unsupported/invalid data is retained and write-protected. Storage denial or quota failure keeps the current memory session and displays an honest warning.

Retry clears the new conversation/draft while retaining the previous successful result and earned completion. New loading/failure never replaces those results. Request Retry uses the original submitted snapshot with a new request ID; one valid success replaces the result/completion pair atomically. Late Feedback and Client opening/turn responses cannot modify a replacement attempt. Unfinished cross-close practice restores metadata and its previous result, with no automatic request or claim that drafts were saved.

## Final P06 verification

Node 22.23.3 / npm 10.9.9 from `.tools/node-v22.23.3-win-x64` were used. Final lint (zero warnings), typecheck, 39 files / 413 unit/API/component tests, production build and full 42/42 Edge E2E (51.5s) all passed. The full E2E ran against the built production server; controlled AI routes and blank server credentials prevented paid requests. Closing the actual persistent browser process and relaunching the same profile restored all five learning states. P03 Tutor, P04 Client and P05 Feedback/mapping offline regressions passed.

Production boundary audit: 41 artifacts / 16 HTML-RSC/API responses / 63 private/provider markers, positive canary, zero matches, zero external AI requests. Snapshot allowlist tests exclude secret/provider/scenario/rubric/answer-key/system-prompt fields. SPEC, SCENARIO, PLAN, P05 mapping, reducer completion rules, AI services/prompts and dependencies were not changed. Details and commands are in VERIFICATION.md.

## Missing historical live artifacts

The first targeted Playwright run used its previous default output root, `test-results`, and deleted the 25 ignored files under `test-results/live`. This was an execution mistake, disclosed to the user. Baseline hashes survive in `.tools/p05-closure/live-baseline.json`, but a hash scan of 740 local candidates found no original copies. The original reports/screenshots were not recovered or reconstructed, and no paid AI was rerun. Historical accepted live/human conclusions remain recorded below; the old artifact paths and unchanged-file claims are historical and no longer describe current availability.

Playwright now defaults to `test-results/e2e`; all later P06 runs use separate subdirectories. The recovery investigation is `.tools/p06-closure/artifact-recovery.json`. This limitation must remain visible in any later evidence review.

## Git closure and next task

The user authorized one combined `feat: complete P06 recommendation and persistence` commit on main and push to origin/main. Only P06 source/tests, isolated Playwright output configuration and these three status documents belong in the savepoint. Runtime files, env, dependencies, build output and test artifacts stay ignored. The actual hash, push result and final clean-tree state are reported after execution. Do not execute T033 in this task.

---

# Archived P05 closure — Summary and AI Feedback complete

- Date: 18 October 2026 (Asia/Shanghai).
- P05 STATUS: COMPLETE. T022–T028 DONE. P01/P02/P03/P04 remain COMPLETE.
- Final user-run Feedback live acceptance: 4/4 PASS; run failures NONE; automatic retries NONE.
- HUMAN_SEMANTIC_REVIEW: PASS, explicitly confirmed by the user for all four cases.
- NEXT_TASK = T029. No T029 / P06 work in this closure.
- Codex reran no live DeepSeek command. Existing live evidence is sufficient.

## Final evidence and accepted teaching behavior

The successful run is preserved at ignored `test-results/live/feedback-2026-10-18T14-58-19-639Z/`. AUTOMATED_CHECKS=PASS and T028_CANDIDATE=PASS; total duration 41060ms. Raw reports keep their fixed HUMAN_REVIEW_REQUIRED=YES / T028=PENDING fields: the user's subsequent explicit human-review conclusion closes that gate and is recorded here, without changing original artifacts. The Client transcript is explicitly a controlled fixture; the four Feedback requests are real DeepSeek / deepseek-flash calls through the production Summary UI/API.

| Case | Final actual behavior | Human review |
| --- | --- | --- |
| empty-major-gaps | Questioning plus all eight summary fields Missing; no fabricated strengths; category/action guidance without full answer-key replacement; reviewLesson → why-clarify | PASS |
| minor-omission | Questioning Strong; core summary dimensions Strong; only Priorities Partial / minorOmission; Retry Activity, no major-gap classification | PASS |
| strong | Nine Strong with genuine transcript/summary evidence; no verbatim SC-AC requirement; all explicit prerequisites satisfied, Course Complete | PASS |
| accurate-summary-without-questions | Questioning Missing independently of eight Strong summary dimensions; no invented interview credit; reviewLesson → what-to-ask / Lesson 2 | PASS |

The strong case's one improvement sentence about storage behavior for a rejected full attempt is an accepted nonblocking wording nit. It changes no rating, Must, recommendation or frozen requirement; the existing scenario already excludes an extra confirmed record when full. The user explicitly instructed that this wording must not reopen implementation. No product or prompt change was made during closure.

## Final regression and boundaries

One closure regression: lint PASS (0 warnings); typecheck PASS; 35 files / 380 unit/API/component tests PASS; production build PASS; full Edge E2E 29/29 PASS (33.6s), all exit 0. Existing P03 Tutor / P04 Client regressions PASS; their earlier accepted live evidence was reused. E2E invoked `npm run test:e2e` with a separate built production server and output directory to preserve live artifacts; exact command is in VERIFICATION.md.

Production boundary audit PASS: 41 artifacts / 16 HTML-RSC-API responses / 63 private/provider markers; positive canary, zero matches, zero external AI requests. All 25 existing live files, including the initial failed Feedback reports and prior Tutor/Client evidence, retain their pre-closure SHA256 hashes. SPEC, SCENARIO, PLAN, F01–F10, pure recommendation/completion rules and Tutor/Client services/prompts are unchanged in closure. Feedback structured JSON architecture, safe diagnostics, no automatic retry and server-only rubric remain intact.

## Savepoint and phase boundary

The user authorized one combined P05 commit `feat: complete P05 summary and AI feedback` on main, followed by push to origin/main. Git review covers the existing P05 implementation, tests, live harness and closure docs. Raw live reports/screenshots, env files, secrets, dependencies, temporary tools and build/E2E output stay ignored and outside the savepoint. The final commit hash, push result and clean-tree check are reported after execution.

T029 is only the handoff position. P06 recommendation actions / persistence / recovery and later deployment were not started. Historical preparation/failure records follow and do not override this completed P05 status.

---

# Archived T028 Feedback fix — READY_FOR_RERUN

- Date: 18 October 2026 (Asia/Shanghai).
- T022–T027 remain DONE. T028 PENDING. P05 is NOT COMPLETE.
- Codex sent no live DeepSeek request. No diagnostic-only paid rerun, T029/P06, commit or push.
- Existing uncommitted P05 work is preserved on main; HEAD remains `18ae84ba9f683538ac65ac2e8a044bb1f2de9a23`.

## Actual first live run and evidence limit

The user's `test-results/live/feedback-2026-10-18T14-30-25-643Z/` run sent 2/4 requests and failed overall. The first empty-major-gaps case passed automated structure/grade/mapping checks but the user rejected its answer-replacing surface feedback, so it has NO human semantic PASS. The second minor-omission case had a completed response, 5660 non-whitespace characters, duration 5570ms (provider 5527ms), usage 9889/1362/11251, and failed at schema with SCHEMA_VALIDATION_FAILURE. The last two cases did not run.

JSON.parse succeeded and `feedbackSchema.safeParse` rejected the second result before evidence validation or recommendation. **The exact historical failure path, Zod issue code, expected type and received category are UNKNOWN.** The old provider reduced paths to answer/other and omitted type details; the Feedback harness then discarded schemaIssues/jsonType and kept stdout only in memory. No failed raw model result or stdout log was saved. The user explicitly checked their PowerShell/logs and confirmed there is no ai_response_diagnostic line to recover. It would be false to claim a particular field or nullability rule caused this run. No schema, enum, evidence rule or acceptance criterion was relaxed to guess a fix.

## Changes

Feedback schema errors now carry bounded, allowlisted schemaIssues through provider → harness → serialized JSON/TXT report: public field path (including evidence indexes), code, expected (null when Zod supplies none), receivedType, messageCategory and receivedValueCategory. Unknown property names become other. At most 8 issues / 10 path elements are retained. Raw values, Zod messages, union branch payloads, prompts, rubric, secret, headers and rejected model JSON are never emitted. Custom relational checks retain finite message categories. Tutor/Client diagnostic behavior and transport remain unchanged.

The Feedback prompt separates PRIVATE EVALUATION REFERENCE from STUDENT-FACING SURFACE CONTRACT. For unasked/blank work, explanations and improvements identify missing information categories, why they matter and focused next questions; they cannot fill the eight fields from the answer key. Existing student wording and learned transcript facts can still receive concrete citations/corrections. Internal evidence/factIds remain available for validation/ratings/mapping without being treated as permission for surface disclosure.

A server-only contextual surface backstop checks the combined explanation / whatWentWell / whatToImprove. It rejects combinations of previously unelicited concrete answer relationships or an almost complete unseen scope list, while allowing topic-level guidance and specific corrections of attempted/learned facts. It does not replace model feedback, ban individual words, alter evidence, choose recommendations or change grades. Novel paraphrases still require live human semantic review. The original saved empty-case assessment is schema-valid but is now rejected as FEEDBACK_SURFACE_REJECTED in an offline read-only replay. Original evidence files remain unchanged.

The service/harness distinguish evidence rejection from surface rejection using safe stage/outcome labels; invalid surface feedback returns the usual friendly INVALID_AI_RESPONSE and cannot complete the Activity. The harness also checks surface disclosure independently. A valid minor-omission fixture using the acceptance interview/summary passes the real SDK HTTP-intercepted route and unchanged deterministic Retry mapping. This proves the valid contract, not the absent historical model output or a future real-model PASS.

## Final offline verification

lint PASS (0 warnings); typecheck PASS; **35 files / 380 unit/API/component tests PASS**; production build PASS; **29/29 full Edge E2E PASS** through `npm run test:e2e` with an isolated production server, retries=0. Nine dimensions, questioning/summary independence, strict nullable evidence, invalid schema, safe diagnostics, category-level empty guidance, valid detailed corrections, minor→Retry, completion atomicity and P03/P04 regressions PASS offline.

Production scan: 41 artifacts / 16 HTML-RSC-API responses / 63 private/provider markers, positive canary, zero matches and zero external AI requests. All 19 existing live files retain SHA256 hashes. The 13 protected source/doc/lock files match the beginning of this fix, including SPEC, SCENARIO, PLAN, F01–F10 registry, mapping/build-result/completion/progress logic and Tutor/Client services/prompts. Provider edits are only the Feedback diagnostic import/type/formatter branch; model, transport, limits, response format and retries are unchanged. Detailed evidence is in VERIFICATION.md and ignored `.tools/t028-feedback-fix/`.

## Next user command — one unified acceptance rerun

```powershell
npm run test:ai:feedback:acceptance
```

Run from this repository with the existing server-side key configured. No separate diagnostic request is needed. The suite still permits at most four real Feedback requests, stops at the first failure, has no automatic retry, and does not rerun Tutor/Client live acceptance. Fresh reports/screenshots go to unique `test-results/live/feedback-<timestamp>/` folders, including safe schemaIssues if the new run fails. All four cases and explicit human semantic review must pass before T028 DONE / P05 COMPLETE. Candidate PASS alone is insufficient. Preserve original reports.

No commit/push until that gate. NEXT_TASK = T029 only after P05 acceptance; it was not implemented here.

---

# Archived P05 implementation — ready for live Feedback acceptance

- Date: 18 October 2026 (Asia/Shanghai).
- P05 STATUS: READY_FOR_LIVE_ACCEPTANCE. T022–T027 DONE; T028 PENDING.
- P01/P02/P03/P04 remain COMPLETE; T021 and its 14/14 live + human review remain accepted.
- Starting / current HEAD: `18ae84ba9f683538ac65ac2e8a044bb1f2de9a23` on main.
- No paid DeepSeek request by Codex. No T029+, persistence or deployment.
- Working tree contains this P05 batch, deliberately uncommitted. The user's latest instruction forbids commit/push until live Feedback acceptance AND human review pass.

## Implemented and verified

The Activity now retains the interview alongside exactly eight student-written fields. Empty fields and zero questions can be submitted. Drafts live in the root learning reducer across route navigation; each submission copies the summary and all completed Client turns with stable turn IDs. In-flight Client requests prevent submitting an incomplete conversation. Feedback pending freezes editing and duplicate sends. Failure retains the transcript, eight fields, submitted snapshot, existing completion and last successful result. Explicit Retry changes only requestId, reusing the same attempt / submission / summary / transcript, even if the student edited a newer draft.

The Node Feedback route loads the same frozen server-only scenario version and rubric as Client. It sends scenario + actual transcript + summary to the existing real structured provider once, then JSON.parse / strict Zod / evidence and relevant-fact validation. It does not use Tutor text mode, another transport, a fake fallback or automatic retry. The public assessment uses PLAN's `questioning`, fixed `dimensions`, `level`, `explanation`, `evidence`, `problemCodes`, `whatWentWell`, `whatToImprove`. Quotes must be actual substrings of the correct student user turn or same summary field; absence never invents a quotation. No-question / blank-field credit is rejected, and findings must include appropriate strengths/improvement guidance. Runtime evidence checks cannot certify semantic quality; T028 remains mandatory.

Recommendation uses one pure mapping: goal misunderstanding first, questioning second, summary last, with stable field-order ties. Missing and major Partial gaps map to published L1/L2/L3; minor omissions map to the existing Activity. Nine Strong with missing lessons produces `recommendation=null` and `completionPending`; only actual explicit lessons plus valid Feedback allow Course Complete. Lesson completion recomputes the recent result without another AI request, including lessons completed while feedback was pending.

One matching success event writes the summary snapshot / assessment / mapped action / earned Activity completion together. Weak valid Feedback completes the Activity; pending, failed, mismatched or stale responses cannot. A newer failure preserves the previous successful result and earned completion. UI displays nine ruled dimension rows, exact quoted evidence, What you did well, What to improve, Recommended next action and the submitted summary. The editable draft and submitted result are distinct. T029's actionable recommendation card / retry-practice controls and P06 persistence remain future work.

## Verification

Final lint (zero warnings), typecheck, 32 files / 342 unit/API/component tests, production build and full 29/29 Edge E2E PASS. T022–T027 each received targeted checks before batch regression. E2E covers 1440/1024/768/390px summary/failure/Retry/result, empty/no-question success, late navigation, grade-independent completion and Strong-to-Complete recomputation. Desktop/mobile screenshots were visually inspected. Existing P03 Tutor and P04 Client regressions PASS.

Production leakage audit PASS: 41 artifacts / 16 HTML-RSC-API responses / 63 private/provider markers, positive canary, zero matches and zero external AI requests. All 16 existing live evidence files retain their baseline SHA256 hashes. SPEC, SCENARIO, PLAN, provider core, Tutor/Client services/prompts and package-lock remain unchanged. Exact commands, prior failed checks and final results are in VERIFICATION.md.

## Required next step: user-run T028

In this project directory, with the existing server-side DEEPSEEK_API_KEY configured in your PowerShell:

```powershell
npm run test:ai:feedback:acceptance
```

This builds current sources, launches an isolated production server/browser, and sends at most **4 real Feedback requests**. No automatic retry; first failure stops further paid requests. The Client interview is an explicitly labelled controlled fixture, not new Client live evidence, so Tutor/Client acceptance is not rerun. All four cases submit through the real Summary UI and Feedback API: empty gaps, minor omission, strong, accurate summary without questions. Strong/minor cases explicitly complete lessons through client navigation. Request guards permit only the expected snapshot once; all other AI and off-origin browser requests are blocked. Secrets are removed from browser env and redacted in reports. Logs expose allowlisted diagnostics only.

Evidence goes to unique ignored `test-results/live/feedback-<timestamp>/feedback-acceptance.json`, `.txt` and case screenshots. Inspect ALL actual assessments against their saved inputs: independent questioning/summary ratings, every quote/absence, nine levels, concrete advice, correct action and no private rubric dump or replacement summary. Candidate PASS alone never marks T028 done. Raw reports retain HUMAN_REVIEW_REQUIRED=YES / T028=PENDING; record the human conclusion separately, preserving original artifacts.

Once that gate passes, close T028/P05 and make the already-authorized single savepoint `feat: complete P05 summary and AI feedback`, push and verify a clean tree. **NEXT_TASK = T029 after P05 acceptance; do not implement it in this batch.** The currently pending action is T028 live + human review.

---

# Archived P04 closure — AI Client Role-play complete

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
