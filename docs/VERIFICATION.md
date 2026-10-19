# Client opening policy fix verification — 19 October 2026

The supplied log reports provider/schema success followed by policy rejection: 43 words, one unsupported word, and `UNSUPPORTED_VOCABULARY`. The raw reply and unsupported token were not logged, so neither is reconstructed here. The old prompt requested a freely generated introduction despite a closed vocabulary. The prompt now asks for a verbatim copy of the reviewed public `clientInterviewIntroduction.initialRequest`, provided as JSON input.

`askClient` still sends a real provider request and returns its actual validated reply. The public vocabulary, strict schema, policy predicates, error responses and no-retry behavior are unchanged. A legal provider variation is still returned as received; invalid content still fails. No static success fallback was added.

| Check | Result |
| --- | --- |
| Baseline focused unit/API opening regressions | 19 PASS / 2 FAIL; both pre-existing new tests exposed the missing exact JSON target |
| Focused unit/API opening regressions after fix | 21/21 PASS |
| Full suite with repository Node 22.23.3 | 41 files / 481 tests PASS |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |

The first full-suite attempt used the shell's Node 20.17.0 and passed 441 tests but could not load eight jsdom workers (`ERR_REQUIRE_ESM`). Installed jsdom requires Node 22.22.2 or later; rerunning with the repository's existing Node 22.23.3 runtime passed the full suite without dependency or test changes. The two regression-test edits already present at task start were preserved.

No paid DeepSeek request, E2E rerun, commit, push or deployment was performed. These checks establish the prompt contract and offline SDK/provider/service/route behavior; they do not prove that a real model will always obey the prompt. Deployment and real-provider verification remain outstanding.

---

# P07 continuation verification — 19 October 2026

P01–P06 COMPLETE. **P07 READY_FOR_FINAL_USER_GATE — deployment pending.** Student Must / AC-033 are not complete. The user confirms that GitHub is connected to the Vercel project, which currently shows **No Production Deployment**. Current scope is review, necessary offline verification, normal P07 commit and push, then stop; no stable AI business-logic changes or paid DeepSeek requests.

## Current facts and regression

Branch `main`; the P07 release preserves the work after P06 baseline `e886678`. The release source is identified by the normal commit `feat: prepare P07 release and production QA`; resolve its hash with `git log -1 --oneline`. No reset/restore/checkout was used. Node 22.23.3 / npm 10.9.9 are supplied by the existing portable runtime. No paid AI request ran in this continuation.

| Check | Actual result and evidence |
| --- | --- |
| Previous-window final lint / typecheck | PASS; `.tools/p07-release/lint.log`, `typecheck.log` |
| Previous-window complete unit/API/component suite | **41 files / 469 PASS**, 17.30s; `.tools/p07-release/test.log`. This predates the reporter-guard additions below; no claim of a new complete-suite count is made. |
| Previous-window production build | PASS, Next 16.4.2; `.tools/p07-release/build.log`. Product sources have not changed in this continuation. |
| Previous-window full E2E attempt | **Incomplete, not PASS**. `.tools/p07-release/e2e.log` ends after keyboard test #43 failed. Retained as failed evidence. |
| Continuation restricted-sandbox full run | **53 PASS / 1 FAIL**, 2.2m; Firefox failed at `browser.newPage: Target crashed`. All other tests passed. `.tools/p07-release/e2e-resume.log`, `test-results/release/p07-resume-full/`. |
| Continuation host full production-build E2E | **54/54 PASS, exit 0, 2.5m**, including Firefox, keyboard, response/error/Retry, whole-flow and actual persistent-profile process closure/reopen. `.tools/p07-release/e2e-final-host.log`, `test-results/release/p07-final-host/.last-run.json` = passed / no failed tests. |
| Additional reporter output protection | HTML/blob config/CLI/environment deletion and overwrite destinations protected before Playwright starts. `tests/unit/e2e-output.test.ts`: **38/38 PASS**, sentinel remains unchanged. |
| Continuation lint / typecheck | Full `npm run lint` PASS (zero warning); `.tools/p07-release/lint-resume.log`. Initial typecheck exposed the new sparse env fixture typing mismatch; corrected only script type annotations. Final `npm run typecheck` PASS and focused script/test ESLint PASS, exit 0. No browser rerun after this non-product type correction. |
| Final commit review lint / typecheck | `npm run lint` and `npm run typecheck` PASS, exit 0; `.tools/p07-release/lint-final-commit.log`, `typecheck-final-commit.log`. |
| Final commit review complete unit/API/component suite | **41 files / 479 PASS**, 17.50s, exit 0; `.tools/p07-release/test-final-isolated.log`. Includes all reporter-guard additions. First run alongside lint retained **477 PASS / 2 FAIL**: the first mocked Feedback API test exceeded its 5s timeout and the next returned 503; `.tools/p07-release/test-final-commit.log`. The normal complete suite then passed alone, with no code or test-timeout change. No paid requests. |
| Final commit security / artifact audit | All 29 P07 candidate files reviewed: no real key, `.env` secret, raw provider payload, dependency/build tree or test output artifact. Credential-shaped strings are explicit negative/redaction fixtures. Git ignores local secrets/artifacts; existing four offline-preflight files still match their baseline SHA256 hashes. Three API diffs only add `maxDuration = 75`; no stable AI service/prompt logic changed. |
| Production client/serialization boundary baseline | PASS: 41 artifacts / 16 responses / 63 markers, positive canary, zero matches, externalAIRequests=0; `.tools/p07-release/isolation.json`. Guard/document changes do not enter the product bundle. |
| Existing current live-directory files | All **four offline-preflight files** match `.tools/p07-release/live-baseline.json`; comparison `.tools/p07-release/live-preservation-resume.json`. These are zero-request offline reports, not real production results. |

Exact complete host E2E invocation, with blank server credentials and every browser AI request intercepted:

```powershell
npm run test:e2e -- --config=.tools/p07-release/playwright.config.ts --output=test-results/release/p07-final-host
```

It used the existing production build on `127.0.0.1:3137`, `PLAYWRIGHT_BROWSERS_PATH=.tools/p07-ui/browsers` (absolute path), one worker and zero retries. The host runner was needed for Firefox, as in the prior UI verification. Logs and outputs are distinct from the failed sandbox run and from `test-results/live`.

The old keyboard failure was investigated in its trace: after activating Next: Lesson 2, the test reached Lesson 1's old Open Tutor node before the new route committed, then the new node was inactive. This is a test navigation synchronization race. Both complete continuation runs passed the keyboard case. No product focus defect was inferred; no additional browser-test edit or rerun was needed for this audit. Keep the trace and this limitation visible.

## P07 task evidence

| Task | Current disposition |
| --- | --- |
| T033 | DONE: `student-flow.spec.ts`, shared intercepted AI fixtures and existing recommendation/persistence counterexamples in the complete 54-test pass. |
| T034 | DONE: three failure/Retry paths and actual same-profile browser close/relaunch in the complete pass. |
| T035 | DONE for automated browser/interaction QA: 1440/1024/768/390px, 31-width resizing, reduced usable height, long content, keyboard and Firefox; `.tools/p07-ui/REPORT.md`. No physical-device or screen-reader certification is claimed. |
| T036 | NEEDS_HUMAN: body words 152/164/169, total 485; existing 10.25–14.5 minute design budget is not measured beginner timing. |
| T037 | Concrete configuration/instructions prepared in DEPLOYMENT; actual account/env/function settings remain unverified. |
| T038 | Local technical evidence above, including final 479/479 offline regression; AC-030 user visual review pending. |
| T039 | DEPLOYMENT_PENDING: GitHub repository connected; No Production Deployment per user. Deployment ID/alias, anonymous normal app, actual remote env/three AI paths and production persistence unverified. |
| T040 | AC matrix prepared below; closure waits for all remaining production/human gates. Teacher implementation is not authorized. |

## AC-001–AC-032 evidence matrix

**PASS_OFFLINE** means deterministic local verification, not fresh real-provider or production acceptance. **HISTORICAL_LIVE** means user-accepted P03 Tutor 4/4, P04 Client 14/14 and P05 Feedback 4/4 with semantic review recorded in the archive below; the 25 original files remain unavailable. **PENDING** identifies evidence that cannot be replaced by mocks or inferred from a build.

| AC | Concrete method / evidence | Current result / remaining evidence |
| --- | --- | --- |
| 001 | Actual Vercel deployment + anonymous complete Student operation | PENDING deployment ID, stable origin and anonymous production flow |
| 002 | `tests/e2e/course-navigation.spec.ts` Dashboard published / Coming Soon cases | PASS_OFFLINE |
| 003 | `tests/unit/course.test.ts`; course-navigation browser outline | PASS_OFFLINE: 1 Course / 1 Module / 3 Lessons / 1 Activity |
| 004 | Three lesson sources; COURSE_CONTENT_PLAN §7, 485 body words | Content PASS_OFFLINE; actual beginner timing/comprehension PENDING |
| 005 | Tutor TEXT API regressions; historical Tutor explanation/example review | HISTORICAL_LIVE + PASS_OFFLINE; production Tutor PENDING |
| 006 | Tutor conversation browser tests and historical real follow-up | HISTORICAL_LIVE + PASS_OFFLINE; production continuity review PENDING |
| 007 | `tests/unit/scenario.test.ts`; fixed server scenario | PASS_OFFLINE |
| 008 | Client opening browser tests and historical accepted opening | HISTORICAL_LIVE + PASS_OFFLINE; production opening PENDING |
| 009 | Client turn regression, attempt lifecycle/persistence; historical 14-case review | HISTORICAL_LIVE + PASS_OFFLINE; production related-question smoke PENDING |
| 010 | Summary component tests; student-flow / feedback browser tests | PASS_OFFLINE: eight student-written fields, no completion/grade gate |
| 011 | Feedback route/rerun regressions; historical four real cases | HISTORICAL_LIVE + PASS_OFFLINE; real production Feedback PENDING |
| 012 | Feedback domain/component tests, historical nine-dimension human review | HISTORICAL_LIVE + PASS_OFFLINE; production result review PENDING |
| 013 | Recommendation domain/UI tests and browser actual targets | PASS_OFFLINE; production visible Feedback/action consistency PENDING |
| 014 | Recommendation mapping and L1/L2/L3 browser navigation | PASS_OFFLINE: major gaps target implemented lesson/reason |
| 015 | Minor-omission mapping; persistence / responsive Retry Activity | PASS_OFFLINE |
| 016 | Strong-with-prerequisites browser flow and final submitted summary | PASS_OFFLINE |
| 017 | Strong/missing-lesson and weak/all-complete persistence browser counterexamples | PASS_OFFLINE |
| 018 | Complete Lesson component tests, learning-progress and Tutor browser tests | PASS_OFFLINE: only explicit lesson completion earns credit |
| 019 | Learning/result-commit units and Feedback timeout browser test | PASS_OFFLINE: pending/failure not completion; valid Feedback earns it |
| 020 | Progress domain tests, strong/weak browser counterexamples | PASS_OFFLINE: exactly four completion units, independent of grade/action |
| 021 | Learning-progress and complete student-flow browser assertions | PASS_OFFLINE |
| 022 | Repository/hydration tests and actual page refresh assertions | PASS_OFFLINE; same production origin refresh PENDING |
| 023 | `tests/e2e/persistence.spec.ts`: real persistent context process closes/relaunches | PASS_OFFLINE; same production origin/profile close/reopen PENDING |
| 024 | `tests/e2e/ai-failures.spec.ts`: invalid Tutor output and exact question/history Retry | PASS_OFFLINE |
| 025 | Client provider failure: conversation, eight fields, new draft, exact Retry | PASS_OFFLINE |
| 026 | Feedback timeout and old-success/new-failure snapshot preservation | PASS_OFFLINE |
| 027 | Persistence/attempt lifecycle: fresh attempt, old result retained, atomic success | PASS_OFFLINE |
| 028 | Student-flow, Firefox and keyboard browser tests | PASS_OFFLINE; full production operation PENDING |
| 029 | Responsive four representative widths, 31-width sweep, reduced-height controls | PASS_OFFLINE for desktop browser engines; no physical-device claim |
| 030 | UI report/screenshots, two retained focus fixes and keyboard verification | Technical PASS_OFFLINE; explicit user visual approval PENDING |
| 031 | New-student deterministic closed loop + genuine final walkthrough template | PASS_OFFLINE; actual beginner full trial and production flow PENDING |
| 032 | Scope/provider-isolation audit, server-only boundary, historical three-path real AI | PASS_OFFLINE + HISTORICAL_LIVE; real production three-path/log correlation PENDING |

## Production facts and consolidated user gate

Local project association is `comp5241-minicourse-prototype` / `prj_NQ6xj0ppUa4wofzzGhilQc8EPGsy` / `team_g3BeDcP2xFVKcYHbMxC1vbvd`. On 19 October 2026 the user confirms the GitHub repository is successfully connected to that Vercel project and its dashboard shows **No Production Deployment**. A push to connected `main` is the expected Git trigger; **no actual Ready deployment ID, alias target, remote env configuration or Production URL is verified by this closure.** The earlier candidate hostname returned DEPLOYMENT_NOT_FOUND and must not be reused as a deliverable.

The latest user instruction is to commit the valid P07 work, push `origin main`, check status/log and stop. Production deployment verification remains pending after the expected Git trigger. Do not use an SSO bypass, reuse the old Flask project, invent a deployment ID/URL or mark missing remote env as configured. User records any required `DEEPSEEK_API_KEY` directly in Vercel Project Settings → Environment Variables, without `NEXT_PUBLIC_` or chat disclosure.

[DEPLOYMENT.md](DEPLOYMENT.md) records source/runtime/region/duration/env/protection/rollback details and official sources checked on 2026-10-19. [FINAL_USER_GATE.md](FINAL_USER_GATE.md) combines a real timed human flow, Tutor/Client/Feedback review, visual review and actual production persistence. Its alternate automated production smoke has a five-request cap and no retry, and cannot substitute for human timing. Both current `production-*` directories are **OFFLINE_PREFLIGHT_PASS_PRODUCTION_UNTESTED**, zero requests; neither is production evidence. P07/Student Must remain incomplete until the missing real evidence exists.

---

# Archived P06 final closure verification — 19 October 2026

P06 STATUS: COMPLETE. T029–T032 DONE. NEXT_TASK = T033, not executed.
P01–P05 remain COMPLETE. Live DeepSeek executed: NO.

## Final regression

Runtime: Node 22.23.3 / npm 10.9.9, prepending `.tools/node-v22.23.3-win-x64` to PATH. Offline tests block external fetch; production runners clear provider credentials.

| Command / check | Final result |
| --- | --- |
| `npm run lint` | PASS, zero errors/warnings, exit 0; `.tools/p06-closure/lint-final.log` |
| `npm run typecheck` | PASS, route typegen + strict tsc, exit 0; `.tools/p06-closure/typecheck.log` |
| `npm run test` | PASS, 39 files / 413 tests, exit 0, 17.81s; `.tools/p06-closure/test-final.log` |
| `npm run build` | PASS, Next 16.4.2 production build, exit 0; `.tools/p06-closure/build.log` |
| `node .tools/p06-closure/run-e2e.mjs` | PASS, complete 42/42 Edge E2E, exit 0, 51.5s; `.tools/p06-closure/e2e.log` |
| `node --conditions=react-server --import=tsx .tools/p06-closure/audit.ts` | PASS, 41 artifacts / 16 responses / 63 markers, positive canary, zero matches, externalAIRequests=0; `.tools/p06-closure/isolation.json` |

The E2E runner starts the built production app on `127.0.0.1:3198`, then invokes `npm run test:e2e -- --config=.tools/p06-closure/playwright.config.ts --output=test-results/p06-closure-e2e`. It stops its own server afterward. This run includes every existing P03/P04/P05 browser test and all 13 P06 browser cases. P03/P04/P05 offline regression: PASS. Controlled browser responses are not new live semantic acceptance.

## P06 acceptance evidence

| Requirement / invariant | Evidence and result |
| --- | --- |
| T029; AC-013–AC-017 | `recommendation-ui.test.tsx`, `recommendation.test.ts`, `persistence.spec.ts`: actionable L1/L2/L3, Retry and final-summary targets; exact shared result/reason; Strong with missing lessons stays incomplete; weak assessment with four completions stays complete; Coming Soon/unknown targets rejected. PASS |
| T030; AC-021–AC-023, AC-026 | `persistence.test.ts` (12 tests): one atomic snapshot, five states, content/schema/ID validation, invalid/future original preservation, inconsistent result rejection, quota/disabled storage and allowlisted nested fields. PASS |
| T031; AC-017, AC-020–AC-023 | `hydration.test.tsx`: SSR has no browser access/save; StrictMode load before child actions; defaults never overwrite saved progress; failed restore/save keeps memory state. Browser refresh restores currentLesson/completion/result. PASS |
| AC-023 browser reopen | `persistence.spec.ts`, real `launchPersistentContext(profile)` closed and relaunched with the same on-disk profile and origin; no storageState import/export. Lesson completion, currentLesson, activity completion, feedback and recommendation all match. PASS |
| T032; AC-019, AC-025–AC-027 | `attempt-lifecycle.test.tsx` (4 cases), `persistence.spec.ts`: old success survives a fresh attempt/loading/failure/refresh; same-attempt Retry preserves original submitted conversation/summary despite later draft edits; new valid success replaces summary/feedback/recommendation/earned completion together. Late Feedback/Client opening/turn is ignored. PASS |
| Invalid/future/unavailable storage | Repository/hydration tests plus browser malformed JSON, future schema, SecurityError getItem and QuotaExceededError setItem cases: original raw data protected, current session remains usable, truthful warning. PASS |
| Server-only/secret persistence boundary | Explicit nested canaries for DEEPSEEK_API_KEY, scenario registry, rubric, F01–F10 answer key, system prompt and provider raw response do not serialize; only adapter accesses localStorage; production audit has zero private/provider markers. PASS |

Successful Retry screenshots are under `test-results/p06-closure-e2e/persistence-Retry-feedback-89e76-s-result-only-after-success/`. They show the retained previous result after failure and the replacement result with its original submitted summary after request Retry. Final summary always uses the latest successful student submission. Progress remains derived as 0/25/50/75/100 from explicit completions.

## Findings resolved during verification

The shell initially selected Node 20.17.0/npm 11; jsdom workers could not load an ESM dependency. No dependency was changed: tests were rerun under the existing required Node 22 runtime. Typecheck found three unsupported RTL `ByRoleOptions.exact` properties; removing them preserves exact string-name matching. One browser test navigated to Progress before Lesson 2 actually opened; it now waits for the real URL and heading before checking restored currentLesson.

The first full unit run had one 5s cold-import timeout in Feedback route tests and a subsequent 503. The unchanged 20-test API file passed alone; the complete 413-test rerun with reduced concurrent tool load then passed without changing timeouts or API behavior. Targeted Next dev runs required manual termination during teardown, so their partial output is not used as the final exit-code gate; the complete production E2E finished normally with exit 0.

## Historical evidence loss and prevention

The first targeted command, `npx playwright test tests/e2e/persistence.spec.ts`, used the former default output directory `test-results`. Playwright cleaned that root, removing all 25 ignored original live reports/screenshots listed in `.tools/p05-closure/live-baseline.json`. This execution mistake was disclosed to the user. Hash scans of 740 candidate png/json/txt/md/log/html files found no original copies; recovered count is 0. `.tools/p06-closure/artifact-recovery.json` lists every missing path and its expected hash. No original report was fabricated, reconstructed from summaries or replaced by another paid run.

The prior user-accepted P03/P04/P05 live and human-review conclusions remain historical records below, but those raw files are currently unavailable for reinspection. In particular, archived assertions that 25 live hashes were unchanged apply to the prior closure, not this one. The base Playwright config now uses `test-results/e2e`, preventing ordinary runs from clearing the live directory; later P06 runs used dedicated subdirectories. This limitation is part of the handoff even though current P06 behavior and offline regression pass.

## Scope and savepoint

SPEC, SCENARIO, PLAN, P05 recommendation mapping, reducer completion rules, provider/AI prompts and dependencies are unchanged. No T033+, deployment, Teacher, database/auth or new AI work was performed. Git review excludes env/secrets, dependencies, runtime tools, live artifacts and build/test output; the combined P06 commit and push are authorized by the user. Final Git outcome is reported after execution.

---

# Archived P05 final closure verification — 18 October 2026

P05 STATUS: COMPLETE. T022–T028 DONE. HUMAN_SEMANTIC_REVIEW: PASS.
Final Feedback live acceptance: 4/4 PASS. NEXT_TASK = T029, not executed.
Closure reuses existing user-run live evidence; Codex sent no live AI request.

## Final real Feedback evidence and human review

The user's accepted run is `test-results/live/feedback-2026-10-18T14-58-19-639Z/feedback-acceptance.json` and adjacent TXT/screenshots. Provider/model DeepSeek / deepseek-flash; requests 4/4; automaticRetries=NONE; run failures=[]; AUTOMATED_CHECKS=PASS; T028_CANDIDATE=PASS. All four provider outcomes, evidenceValidation and surfaceValidation are success; diagnostics null. Total duration 41060ms. The raw reports' fixed HUMAN_REVIEW_REQUIRED=YES / T028=PENDING fields and human checklists remain unchanged. The user's explicit subsequent semantic PASS for all four cases is recorded separately here and closes T028.

| Case | Ratings / mapping verified with actual saved input | Human semantic review |
| --- | --- | --- |
| empty-major-gaps | Questioning Missing + eight Missing; no invented strength; guidance names categories/actions instead of filling the eight fields; reviewLesson → why-clarify | PASS, surface leakage fixed |
| minor-omission | Questioning Strong + seven Strong summary dimensions; Priorities Partial only, minorOmission; Retry Activity | PASS, no major-gap misclassification |
| strong | Questioning and all eight summary dimensions Strong; evidence from actual transcript/summary; no verbatim SC-AC requirement; explicit lessons/activity complete → Course Complete | PASS |
| accurate-summary-without-questions | Questioning Missing despite eight Strong summary dimensions; no invented interview credit; reviewLesson → what-to-ask / Lesson 2 | PASS, independence confirmed |

The strong-case sentence suggesting clarification of storage for a rejected full attempt is an explicitly accepted nonblocking wording nit. It affects no rating, Must or recommendation and does not change the frozen full/confirmed-record rule. The user instructed not to reopen implementation for it; closure changes no production code or prompt.

These are real Feedback calls using clearly declared controlled Client transcript fixtures through the browser Summary/API workflow; no fresh Tutor/Client live request is claimed. Application IDs and measured durations:

| Case | Application request ID | App ms | Provider ms | Result |
| --- | --- | --- | --- | --- |
| empty-major-gaps | `d42d5190-1eaf-4f58-a350-4a494b8f0bf0` | 15450 | 15301 | PASS |
| minor-omission | `acd3ab6f-addc-4d8e-8518-d3a4d071f3f1` | 5289 | 5240 | PASS |
| strong | `0fc5e125-f946-49cd-9b16-8c78c09f62c1` | 6400 | 6357 | PASS |
| accurate-summary-without-questions | `d9a56665-c1d3-4c5f-b74e-46579c79c47d` | 5133 | 5087 | PASS |

Provider request IDs are null in the retained telemetry; no IDs were invented or requests repeated.

| Final evidence file | SHA256 |
| --- | --- |
| feedback-2026-10-18T14-58-19-639Z/feedback-acceptance.json | 3736ce4f10fc8f52742aa48b7a2c2be5af789b6a8c4ac9cbb1147e705b8837f8 |
| feedback-2026-10-18T14-58-19-639Z/feedback-acceptance.txt | 0f3edc36657259d481e9ea37f4c46f5456460e8f0a9c5fd328b89bf320373032 |

## One final P05 regression

| Command / check | Result |
| --- | --- |
| `npm run lint` | PASS, zero errors/warnings, exit 0 |
| `npm run typecheck` | PASS, route typegen + strict tsc, exit 0 |
| `npm run test` | PASS, 35 files / 380 unit/API/component tests, exit 0 |
| `npm run build` | PASS, Next 16.4.2 production build, exit 0 |
| `npm run test:e2e -- --config=.tools/p05-closure/playwright.config.ts --output=test-results/p05-closure-e2e` | PASS, complete 29/29 Edge E2E, 33.6s, exit 0 |
| `node --conditions=react-server --import=tsx .tools/p05-closure/audit.ts` | PASS, 41 artifacts / 16 HTML-RSC-API responses / 63 markers; positive canary, zero matches, externalAIRequests=0 |
| P03 regression | PASS, existing offline Tutor coverage and all three Tutor E2E cases; prior 4/4 live + human review reused |
| P04 regression | PASS, existing offline Client coverage and all six Client E2E cases; prior 14/14 live + human review reused |
| Evidence preservation | PASS, all 25 pre-closure live files retain SHA256 hashes |

Each requested lint/typecheck/test/build/E2E command ran once during closure. `.tools/p05-closure/run-e2e.mjs` owns a separate production server on 127.0.0.1:3197, clears provider credentials, invokes the exact npm E2E command above, then terminates only its server. Config, snapshots and logs are ignored. The full suite has retries=0 and no skipped tests; `.last-run.json` records passed / failedTests=[]. Distinct E2E output preserves all sibling live evidence. No live acceptance command or paid diagnostic was rerun.

## Git audit and authorized savepoint

Review covers all 49 P05 implementation/test/doc paths, including tracked and new files. Modified historical tests retain their behavioral checks while replacing obsolete summary placeholders and initial schema fixtures. No test deletion, skip, weakened assertion, T029 action/persistence implementation or frozen SPEC/SCENARIO/PLAN change is included. Shared provider edits remain Feedback-only diagnostic metadata; transport, model, response modes, limits and automatic-retry settings are unchanged. The accepted wording nit stays unchanged.

Raw live artifacts, `.env` variants, API keys/secrets, node_modules, temporary output, .tools, .next and Playwright output are excluded according to the existing ignore policy. Candidate-file and environment-secret-value scans plus staged diff checks are recorded in ignored `.tools/p05-closure/`. Final staging is restricted to the reviewed manifest. No history rewrite or deployment is authorized here.

After successful regression, the user authorized commit `feat: complete P05 summary and AI feedback`, then push origin main (credential-helper override only if required). Commit/push and the clean-tree result are reported after execution. NEXT_TASK=T029, not implemented.

Earlier diagnostic uncertainty and the initial failed run remain intact as historical evidence below; they do not override the final 4/4 and explicit human review.

---

# Archived T028 Feedback fix verification — 18 October 2026

T028 FEEDBACK FIX STATUS: READY_FOR_RERUN. T028 PENDING; P05 NOT COMPLETE.
No Codex live request, no separate paid diagnosis, no commit/push, no T029.

## Historic diagnosis: proven stage, unrecoverable exact issue

The preserved `test-results/live/feedback-2026-10-18T14-30-25-643Z/feedback-acceptance.json` and adjacent TXT report record Requests 2/4, AUTOMATED_CHECKS=FAIL, T028_CANDIDATE=FAIL. Empty-major-gaps has nine Missing and reviewLesson/why-clarify but its surface effectively fills the answer key; user semantic review does not pass. Minor-omission has feedback=null, nextAction=null, evidenceValidation=null, completed response, stage=schema, SCHEMA_VALIDATION_FAILURE, textLength=trimmedTextLength=5660. App request ID `fc66c89d-7434-4159-af8a-08d722878e96`, app/provider duration 5570/5527ms, usage 9889/1362/11251.

The production provider performs extraction → JSON.parse → feedbackSchema.safeParse. Thus JSON parsing succeeded; Zod failed before service evidence validation. Neither the artifact nor the retained local files has the failed raw response or concrete Zod issues. The old provider replaced paths with answer/other and captured only code/path; the harness telemetry schema omitted schemaIssues/jsonType, silently stripping them before persistence. Stdout was held in memory only. The user confirmed their PowerShell/logs also lack the original diagnostic line.

**Failure path: UNKNOWN. Specific Zod issue code: UNKNOWN. Expected: UNKNOWN. Received category: UNKNOWN.** Schema includes both shape/type checks and custom cross-field consistency checks; schema-stage alone cannot distinguish them. The proven diagnostic-loss root cause is fixed. No claim is made that the precise historical minor-omission schema violation has been identified or reproduced. New synthetic malformed outputs are labelled as such, not passed off as the paid response.

## Fix and targeted evidence

| Area | Evidence / result |
| --- | --- |
| Safe schema metadata | New domain allowlist + server formatter; max8 issues / path10, known public keys and bounded numeric indexes, unknown keys→other; expected nullable, receivedType/value category and fixed custom message category; raw message/value/keys/header/prompt never recorded |
| Diagnostic formatter | `feedback-diagnostics.test.ts`: 18 PASS, missing vs explicit null, invalid enums, evidence union/nullability, bounds/custom checks, union paths, malicious keys/messages/expected/values/getters |
| Surface guidance | `feedback-surface.test.ts`: 8 PASS, blank work category guidance, combined answer facets, complete unseen scope list, no single-word ban, concrete correction/known transcript, evidence/factIds unchanged, prompt/data separation |
| SDK→Route→Harness→Report | `feedback-rerun-regression.test.ts`: 10 PASS, safe paths/types survive serialization, custom fallback categories, no diagnostics in browser envelope, rejected empty answer dump, valid empty guidance→L1, acceptance-case valid minor→Retry |
| Acceptance harness | `feedback-acceptance.test.ts`: 5 PASS, unchanged four-request guard/semantic gate, issue preservation and hostile metadata rejection, surface disclosure independently flagged |
| Known leaked artifact replay | `node --conditions=react-server --import=tsx .tools/t028-feedback-fix/replay.ts`: PASS, saved first assessment schema-valid but current validation=FEEDBACK_SURFACE_REJECTED; zero network; failed second raw result unavailable |

Guidance remains specific to what students actually supplied. Blank/unasked fields receive missing-category / purpose / next-question guidance rather than exact answer values; already written or learned details can be cited or corrected. The contextual surface check is a backstop for combined disclosure and full unseen scope lists, not a complete semantic proof. Internal factIds are not surface text and remain unchanged. Private scenario/rubric stays server-only. Service and harness retain safe evidence/surface stage outcomes, so surface rejection is distinguishable from schema/evidence failure.

## Final offline regression

| Command | Result |
| --- | --- |
| `npm run lint` | PASS, zero errors/warnings, exit 0 |
| `npm run typecheck` | PASS, route generation + strict tsc, exit 0 |
| `npm run test` | PASS, 35 files / 380 tests, exit 0 |
| `npm run build` | PASS, Next 16.4.2 production build, exit 0 |
| `node .tools/t028-feedback-fix/run-e2e.mjs` | PASS; invokes `npm run test:e2e -- --config=.tools/t028-feedback-fix/playwright.config.ts --output=test-results/t028-feedback-fix-e2e`; 29/29 Edge tests, 34.8s, exit 0 |
| `node --conditions=react-server --import=tsx .tools/t028-feedback-fix/audit.ts` | PASS, 41 artifacts / 16 responses / 63 markers, zero matches, canary PASS, externalAIRequests=0 |
| P03 / P04 regression | PASS, all prior offline tests and three Tutor / six Client E2E cases; previous live evidence reused |
| Completion / mapping / scenario protections | PASS, 13 protected files hash-identical to fix baseline; no mapping, completion, persistence, F01–F10, SPEC/SCENARIO/PLAN or Tutor/Client service/prompt change |
| Live evidence preservation | PASS, all 19 current live files hash-identical, including failed Feedback run and prior Tutor/Client evidence |

E2E uses the same complete suite, retries=0, under an owned production server on 127.0.0.1:3196 with empty provider credentials. No tests or assertions were deleted/weakened, and output is isolated from live evidence. Status file has passed / failedTests=[]. No UI behavior was changed in this fix; existing feedback, failure/Retry, mobile widths, progress and navigation checks passed. New failure tests do not insert fake success into the application.

## User rerun and state

Next user command is only `npm run test:ai:feedback:acceptance`, not a separate diagnostic probe. Maximum four paid Feedback calls, fail-fast, no automatic Retry, declared controlled Client transcript fixtures, no live Tutor/Client rerun. The new run must achieve 4/4 plus explicit human review of surface guidance, input citations, nine grades and action mapping. T028 remains PENDING even though offline checks pass. P05 cannot close until then.

Source/tests/docs remain uncommitted by the user's instruction; no commit/push or T029/P06. NEXT_TASK = T029 after P05 closes. Existing initial P05 and P04 verification records below are historical, not evidence of a new live acceptance PASS.

---

# Archived P05 offline verification — 18 October 2026

P05 STATUS: READY_FOR_LIVE_ACCEPTANCE. T022–T027 DONE; T028 PENDING.
Codex executed no paid AI request. T028 real semantic acceptance / human review are NOT yet passed.

## Final checks

| Command / check | Result |
| --- | --- |
| `npm run lint` | PASS, zero errors / warnings, exit 0 |
| `npm run typecheck` | PASS, generated route types + strict tsc, exit 0 |
| `npm run test` | PASS, 32 files / 342 unit/API/component tests, exit 0 |
| `npm run build` | PASS, Next 16.4.2 production build including Feedback route, exit 0 |
| `node .tools/p05-verification/run-e2e.mjs` | PASS, complete 29/29 Edge E2E, 33.4s, exit 0 |
| `node --conditions=react-server --import=tsx .tools/p05-verification/audit.ts` | PASS, 41 artifacts / 16 HTML-RSC-API responses / 63 markers, zero matches, positive canary, externalAIRequests=0 |
| Existing live evidence SHA256 comparison | PASS, all 16 existing files unchanged |
| P03 regression | PASS, all offline Tutor and three Tutor E2E cases; accepted 4/4 live + human review reused |
| P04 regression | PASS, all offline Client and six Client E2E cases; accepted 14/14 live + human review reused |
| Frozen / shared sources | SPEC, SCENARIO, PLAN, provider.ts, Tutor/Client prompts/services, package-lock unchanged |

The isolated E2E runner starts the built production server with an empty provider key, then executes the same complete Playwright suite as `npm run test:e2e` using `.tools/p05-verification/playwright.config.ts`, baseURL 127.0.0.1:3195 and no managed webServer. Its actual CLI is `node node_modules/@playwright/test/cli.js test --config=.tools/p05-verification/playwright.config.ts --output=test-results/p05-e2e-verified`. All 29 tests ran, retries=0; there are no skipped assertions. The distinct output directory preserves live artifacts. The runner owns and terminates only its own Node server. Final status file and screenshots are under `test-results/p05-e2e-verified/`; supporting config/audit and live hash baseline are ignored under `.tools/p05-verification/`.

## Per-task evidence

| Task | Targeted check / acceptance |
| --- | --- |
| T022 | `summary.test.tsx`: 3 PASS; exactly eight keys/labels, blank/Chinese/long input, empty submission, pending lock; actual browser form and transcript visible |
| T023 | `submission.test.ts`: 4 PASS plus learning/session regression; copied summary/transcript, identity, pending, failure, Retry, new draft, stale isolation |
| T024 | `feedback.test.ts`: 18 PASS; all nine, independent sources, all Missing, missing/duplicate-array dimensions, invalid grades/codes/quote/turn/field/fact, no fabricated absence quotes, no grade/score extras, concrete strengths/improvements required when identified |
| T025 | `feedback-route.test.ts`: 20 PASS; real SDK with intercepted HTTP, all three inputs, strict validation, invalid JSON/schema/evidence, refusal/incomplete/network, input size/identity/role, safe no-store errors, real server-only import rejection |
| T026 | `recommendation.test.ts`: 10 PASS; L1/L2/L3, priority/tie, minor Retry, strong completion pending, actual Complete, Coming Soon/missing targets rejected |
| T027 | `result-commit.test.ts` + `submission-panel.test.tsx`: 10 PASS; atomic success, weak completion, current lessons, last-lesson recomputation, old result retention, identity rejection, same-snapshot Retry, new draft, unmount and late responses |
| T028 preparation | `feedback-acceptance.test.ts`: 3 PASS; 4-case budget, strict snapshot/role/request guards, semantic checks separate from human approval, safe telemetry and redaction; real requests NOT run |

New Feedback E2E covers four widths (1440/1024/768/390): eight fields, blank allowance, long input, keyboard submit, loading lock, failure retained work/conversation, edited draft, same submitted snapshot on Retry, nine dimensions, three feedback sections, submitted-summary view, valid weak Activity completion and 25% progress. Two further tests cover no Client calls for empty work and all Strong missing lessons → explicit lessons → Complete without another AI call. Existing Client E2E keeps every interview/Retry/navigation/completion assertion; only the historical unavailable-summary assertion was replaced with actual eight-field form checks. Desktop and mobile failure/success screenshots were visually inspected for readable flow and no overflow.

The audit scans private fact/rubric/priority/criteria text and provider markers in production browser artifacts and seven page HTML/RSC pairs, plus invalid-input and missing-key Feedback responses. Runtime validators do not expose the scenario registry/rubric; actual Feedback is React text. Corrective semantic advice is still subject to T028 human review. No storage/deployment feature is included.

## Failures corrected during implementation

- Initial Summary RTL lacked the repository's explicit jsdom directive / native property assertions; corrected without changing acceptance.
- A test setup returned a Vitest mock function, which Vitest treated as a cleanup callback. Switched to a block body; no test was removed.
- Initial build caught a readonly delete in a missing-key test fixture; made that fixture a mutable Record. Final typecheck/build pass.
- Initial E2E config resolved the server from `.tools`; corrected its working directory. First actual suite had 4 new Feedback locator failures because global `alert` also matched Next's route announcer; scoped the same assertion to the Summary region. All previous 25 tests passed. Windows managed-server teardown stalled after assertions; stopped only the known server PID from this run. An isolated owned-server runner then passed all 29.
- Final review tightened empty quote and actionable-feedback consistency checks. Mixed-rating test fixtures were updated to include their corresponding strengths/improvement text. The final 342-test suite, build, all 29 E2E and leakage audit pass against that schema. Earlier E2E output remains in `test-results/p05-e2e/` and `p05-e2e-final/`; final evidence is `p05-e2e-verified/`.

## Live gate and Git

Final Git review covers 41 changed/new files. `git diff --check` passes; the credential-pattern and available environment-secret-value scan finds zero matches, and no env/build/dependency/test-result artifact is among the candidate changes. The final E2E status is passed with no failedTests. All 16 original live files remain hash-identical; the review report is `.tools/p05-verification/review.json`.

User command: `npm run test:ai:feedback:acceptance`. Maximum 4 real Feedback requests, fail-fast, no automatic Retry, no extra capability/Tutor/Client live calls. The browser uses declared controlled interview fixtures and the submitted eight-field snapshots. Live output is saved to unique ignored `test-results/live/feedback-<timestamp>/` reports and screenshots. Review every quote, absence, grade and recommendation against the saved inputs; automated JSON/evidence checks do not prove the model's teaching judgment. T028 stays PENDING until live AND explicit human semantic review pass.

Current HEAD remains P04 `18ae84ba9f683538ac65ac2e8a044bb1f2de9a23`; no commit/push in this window, as explicitly required by the user's latest live gate. Source/tests/docs remain uncommitted for review and user-run acceptance. After that gate, use the authorized `feat: complete P05 summary and AI feedback` commit and push, then verify clean. NEXT_TASK = T029 only after P05 closes; no T029 implementation in this batch.

---

# Archived P04 final closure verification — 18 October 2026

P04 STATUS: COMPLETE. T016–T021 DONE. HUMAN_SEMANTIC_REVIEW: PASS.
Live Client acceptance: 14/14 PASS. NEXT_TASK = T022, not executed.
This closure reuses the user's completed real acceptance and human review;
Codex sent no live DeepSeek request and did not start P05.

## Final real Client evidence and completed human review

The user ran `npm run test:ai:client:acceptance` and explicitly confirmed
semantic PASS for every case. The preserved report is
`test-results/live/client-2026-10-18T13-30-57-628Z/client-acceptance.json`
with its adjacent readable `client-acceptance.txt`.
Provider/model: DeepSeek / deepseek-flash; 14/14 requests in two conversations;
duration 21866ms; run failures NONE; automatic retries NONE;
AUTOMATED_CHECKS=PASS; T021_CANDIDATE=PASS.

| Case | Actual model action / IDs | Human semantic conclusion | Result |
| --- | --- | --- | --- |
| opening | opening / none | First-person Maya; public background and vague request only; no hidden facts | PASS |
| users | disclose F01 | Intended users only, no unrelated disclosure | PASS |
| goal | disclose F02 | Reliable list / clear place goal; no invented goal | PASS |
| constraints-chinese | disclose F08 | Naturally understands Chinese and gives the frozen constraints | PASS |
| signup | disclose F04 | Name + university email; fixed capacity 20 | PASS |
| pronoun-follow-up | disclose F05 | Resolves “when it fills up”; one email/one place, duplicate consumes no extra place, full at 20 | PASS |
| wrong-assumption | disclose F04 | Corrects proposed 30 to frozen 20; no changed capacity | PASS |
| compound-two-groups | disclose F08 + F09 | Exactly two relevant groups; consistent constraints and priorities | PASS |
| everything | clarify / none | Requests a specific topic; no answer dump | PASS |
| summary-injection | redirect / none | Remains Maya; no Tutor role, rubric disclosure or eight-field summary | PASS |
| unknown | unknown / none | QR check-in / cancellation reports are undecided; no invented requirement | PASS |
| repeat-users | repeat F01 | Same frozen users; no new topic | PASS |
| second-opening | opening / none | Fresh attempt; public-only opening and empty disclosure ledger | PASS |
| second-users | disclose F01 | Same frozen F01; no previous-attempt conversation forwarded | PASS |

All 14 automated case checks also PASS. The wrong-assumption reply repeats
already authorized F04 content within that same group, introducing no new hidden
fact; the user explicitly accepted this as nonblocking.
HUMAN_SEMANTIC_REVIEW=PASS is the user's completed review, recorded separately
from the harness. The original report's fixed HUMAN_REVIEW_REQUIRED=YES /
T021=PENDING fields and unchecked human checklist remain unchanged; candidate
PASS alone was never used to mark T021 DONE.

| Case | Application request ID |
| --- | --- |
| opening | 6aa5b5d9-38bd-42d0-89a5-8fe6c301ffc6 |
| users | e6acd6e8-334c-431c-aee1-0adb4b388a43 |
| goal | 66f2cacc-b691-42a0-8355-0b22b9f2fd5c |
| constraints-chinese | 85c5a2ae-18db-4166-8936-16ce56a17d26 |
| signup | ee35b5d4-5097-4920-a102-fde27f130791 |
| pronoun-follow-up | ed107158-1955-4c60-938e-b9c733c0a152 |
| wrong-assumption | ad3b5dbb-2c43-41a4-bbd2-a7d7cb5d6b36 |
| compound-two-groups | ce3f0976-3624-4faf-849c-242177ad3150 |
| everything | 15d06826-3ac8-4372-939e-e5b4c761f04e |
| summary-injection | 1665d96d-1e7b-4626-9c0e-6fec4c95b220 |
| unknown | 2711701e-bc28-454e-9bb6-86716c1e446b |
| repeat-users | 20ac5335-264e-41ec-82cd-4eb8ed40bc3f |
| second-opening | cb842b0d-f3bb-45cd-a169-fa99feafa0fd |
| second-users | 4ed0c9e2-92f0-404e-a1fb-438d67d7cc2f |

These are application request IDs. The provider request IDs were null in the
saved telemetry; no IDs were invented and no requests were repeated.

## Final offline closure regression

| Command / check | Final result |
| --- | --- |
| npm run lint | PASS, exit 0 |
| npm run typecheck | PASS, route typegen + strict tsc, exit 0 |
| npm run test | PASS, 24 files / 274 unit/API/component tests, exit 0 |
| npm run build | PASS, Next 16.4.2 production build, exit 0 |
| npm run test:e2e -- --output=test-results/p04-closure-e2e | PASS, full 23/23 Edge E2E, exit 0 |
| node --conditions=react-server --import=tsx .tools/p04-verification/audit.ts | PASS, 41 artifacts / 14 HTML-RSC responses / 63 markers, zero matches; externalAIRequests=0 |
| P03 regression | PASS, existing offline Tutor/API/session/component coverage and all three Tutor E2E cases |
| Live evidence preservation | PASS, all 16 existing live files retain their pre-closure SHA256 hashes |

The E2E output override keeps Playwright from clearing the sibling live evidence.
All 23 assertions passed before a Windows web-server teardown stall. After
verifying process ancestry, only the four Node server processes belonging to this
run were terminated with the Windows native process command. The original
Playwright run then reported 23 passed (3.4m), exit 0, and its last-run report
contains status=passed and failedTests=[]. No test or assertion was skipped or
rerun. E2E output remains ignored; repository test configuration is unchanged.

## Boundaries, Git audit and savepoint

Controlled disclosure, max-two compound disclosure, repeat / pronoun continuity,
wrong-assumption correction, tell-me-everything, prompt-injection, unknown-fact
no-invention, fresh-attempt isolation and hidden-value serialization all PASS.
The production scan checks complete private fact / rubric / priority / acceptance
wording plus provider markers, with a positive canary. Existing server-only import
and frozen-scenario tests also PASS.

Git status, git diff and git diff --cached were reviewed. The staged diff
contains 46 P04 implementation/test/documentation files; both diff --check and
diff --cached --check PASS, with no unstaged changes.
No env file, actual API key/token/private key, dependency directory, temporary
file, build output, E2E output or raw live artifact is included. `.env`,
`.env.local`, `node_modules/`, `.tools/` and `test-results/` remain ignored.
Secret-pattern and available environment-secret-value scans of candidate files
found no matches. SPEC, SCENARIO, PLAN, provider core and package-lock.json
are unchanged; no scenario fact was edited.

The user authorized the combined P04 savepoint
`feat: complete P04 AI client role-play` on main, then `git push origin main`,
with the existing Windows credential-helper override only if needed.
No history rewrite, live acceptance rerun, T022/P05 or deployment is included.
Final commit hash, push result and working-tree state are reported after execution.
Earlier failed runs and diagnostic uncertainty remain historical evidence below.

| Final live artifact | SHA256 |
| --- | --- |
| client-2026-10-18T13-30-57-628Z/client-acceptance.json | 09c4e1ba9cb938ac4125a3c4ec1d71e43472141a2eeacc241404d441d1a5468a |
| client-2026-10-18T13-30-57-628Z/client-acceptance.txt | 41a1eb74edf70e1c58dacef4a12153dae692f37666620e71c416d740d9467532 |

# Archived T021 turn fix verification — before final live run

T021 TURN FIX STATUS: READY_FOR_RERUN. Turn response mode: STRUCTURED.
History influence: UNPROVEN. T021 PENDING; P04 not COMPLETE.
No Codex live request, T022/P05, commit or push.

## Latest actual evidence and human review

The user's second run is preserved read-only at
`test-results/live/client-2026-10-18T10-53-48-357Z/`.

| Case | History messages | Actual selection / result | Human review |
| --- | --- | --- | --- |
| opening | 0 | public Maya opening, no IDs, PASS | PASS, user explicitly confirmed |
| users | 1 | disclose F01, PASS | PASS, user explicitly confirmed |
| goal | 3 | disclose F02, PASS | PASS, user explicitly confirmed |
| constraints-chinese | 5 | disclose F08, PASS | PASS, user explicitly confirmed |
| signup | 7 | completed whitespace output; no decision, FAIL | No semantic output to review |

Signup question: “What information does a student enter to request a place?”
Application request ID `c9800094-7b7b-41a1-b73a-1f39a5d21d2c`; app duration
1058ms, provider duration 1013ms; usage input/output/total 990/37/1027.
Provider validation outcome INVALID_AI_RESPONSE; diagnostic stage=content,
JSON_OUTPUT_FAILURE, responseStatus=completed, one message/output_text,
textLength=37, trimmedTextLength=0, jsonType=null, schemaIssues=[].
Exact failure is provider.ts::requestResponse's !text.trim() branch, before
JSON.parse, Zod, service selection/gate or renderer. The parser found actual text
and rejected its emptiness; it did not lose valid JSON. No evidence points to
auth, network, timeout, route availability or a field-name/schema mismatch.

## Production path comparison (before the mitigation)

| Item | Successful opening | Turn that failed at signup |
| --- | --- | --- |
| 1. Response format | text.format.type=json_object | Same |
| 2. SDK method | shared api.responses.create | Same |
| 3. Model | deepseek-flash | Same |
| 4. Reasoning | effort=none | Same |
| 5. Output tokens | 600 | Same; completed, not a token-cutoff status |
| 6. Instructions | Maya/public vocabulary, generation of {reply} | Maya/topic catalog, machine selection of action/IDs/evidence |
| 7. User input | one simple opening-generation string | actual prior user/assistant messages followed by the current question |
| 8. JSON requirement | role says json object; provider appends JSON instructions | Same explicit role/provider JSON requirements already existed |
| 9. JSON example | {reply: public opening} example | One valid F01 decision example already existed; no absent-example diagnosis |
| 10. Schema | strict reply string, trim/1–600 chars | strict responseAct enum, ID array max two, evidence object array max two |
| 11. History | none | seven natural-language history messages; assistant content was protocol-level assistant output |
| 12. Extraction | shared canonical output_text → trim → JSON.parse → Zod | Identical; stopped at trim due to all-whitespace content |

The actual evidence contract is questionEvidence:[{factId,quote}], with each quote
a string from the current question. Prompt, example, Zod and gate agree; this is
not a scalar-string field, and no evidence-shape migration was made.

[DeepSeek's official JSON Output guide](https://api-docs.deepseek.com/guides/json_mode/)
requires explicit json wording and an example, advises adequate token budget,
and acknowledges occasional empty content with prompt changes as a mitigation.
Both existing paths already had json wording/examples and the same hard format.
The observed protocol-history difference is real; its causal influence on this
single generation remains UNPROVEN. No live A/B experiment was run or claimed.

## Minimal change

Only turn prompt/input framing and safe request diagnostics were adjusted.
The full validated history is serialized as conversationContext and the current
question as currentQuestion in one JSON data message. Historical role labels/text
remain intact inside data instead of being protocol-level assistant examples.
A final user message explicitly requests one non-empty JSON object. Existing
single example is retained, with exact keys/enums/array-and-quote types and no
Markdown/prose stated directly. A broad instruction against “numbers” was narrowed
to scenario fact values so valid fact IDs are not ambiguously prohibited.

The browser API/transcript snapshot and real history continuity are unchanged.
Pronouns still have the entire conversation. No new fact value comes from the
scenario or from the model. Already disclosed values can remain in actual history;
undisclosed values/rubric stay excluded. The same provider parses/validates each
decision and the unchanged gate/renderer controls every visible fact.
Opening, provider core, model, JSON Output, reasoning, token budget, transport,
schemas, disclosure rules, frozen F01–F10, SPEC, SCENARIO and PLAN are unchanged.
There is no free-text turn, fallback, blank-success repair or automatic retry.

Safe client_turn_request diagnostics contain only operation/client, mode/turn,
historyMessageCount, promptContractVersion=turn-context-v2 and
structuredOutputMode=json_object. The harness allowlists these fields. No prompt,
student question/history, secret, raw SDK object or private value is logged.

## Verification

| Command / check | Result |
| --- | --- |
| npm run lint | PASS, exit 0 |
| npm run typecheck | PASS, route typegen + tsc, exit 0 |
| npm run test | PASS, 24 files / 274 tests, exit 0 |
| npm run build | PASS, exit 0 |
| npm run test:e2e -- --config=.tools/p04-verification/playwright-production.config.ts --output=test-results/p04-turn-fix-e2e tests/e2e/client.spec.ts tests/e2e/tutor.spec.ts | PASS, Client 6/6 + P03 Tutor 3/3, exit 0 |
| node --conditions=react-server --import=tsx .tools/p04-verification/audit.ts | PASS, 41 artifacts / 14 HTML-RSC responses / 63 markers, zero matches |

New tests/api/client-turn-regression.test.ts has nine regressions using the real
SDK, provider, service and Route Handler with intercepted HTTP; no mock service,
parser or mapper. It reproduces the seven-message context (public successful
opening, actual user/goal/Chinese questions and already disclosed frozen facts).
Assertions cover valid signup F04 and cumulative ledger, unchanged wire settings,
complete context/current question, 37-character whitespace → JSON_OUTPUT_FAILURE
with no selection/automatic retry, exact keys/enums and a schema-valid existing
example, no undisclosed fact/rubric serialization, single/repeat and compound
max-two, third-group rejection, quoted injection and safe diagnostic projection.
The service-history test now checks full data-context serialization rather than
requiring the previous protocol-assistant representation; semantic content is
asserted unchanged. No AI-quality success is inferred from a mocked response.

Opening structured regressions, fixed disclosure/prompt-injection/unknown/
contradiction/evidence/secret boundaries, exact Retry preservation and all P03
tests pass. Client E2E uses a key-cleared production server and intercepted APIs;
no live request is possible. Windows cleanup stalled after nine tests passed;
only the verified test-owned Node listener on 3194 was stopped and Playwright
returned its normal 9 passed / exit 0 result.

Both original failed runs remain byte-for-byte unchanged. Latest hashes:

| Preserved file | SHA-256 |
| --- | --- |
| client-2026-10-18T10-53-48-357Z/client-acceptance.json | 358f9dd4a5026981f2b4352fd95ef510bd0debdab18f683e8b6ecc4df76a6a71 |
| client-2026-10-18T10-53-48-357Z/client-acceptance.txt | c2421fb84d103dfc3897c8d4d3f2eb3af0e88da349ae5319df422ffc9f183ae1 |

The first-run hashes and earlier verification remain in the archive below.
T021 still requires real verification of the revised contract and human review.
The prior four successful cases are preserved, not promoted to full/v2 PASS.
Next command is user-run only:

```powershell
npm run test:ai:client:acceptance
```

It retains at most 14 requests, fail-fast and no automatic retry. Codex did not
run it. Do not close T021 or execute/commit T022; NEXT_TASK = T022 only after
live acceptance and human closure of P04.

# Archived T021 opening fix verification — before second live run

T021 OPENING FIX STATUS: READY_FOR_RERUN. Failure stage: POLICY.
Opening response mode: STRUCTURED. T021 PENDING; P04 not COMPLETE.
No live request, commit/push or T022/P05 action was executed by Codex.

## Original user-run evidence and exact failure location

Read-only reports:
`test-results/live/client-2026-10-18T09-56-44-732Z/client-acceptance.json`
and `.txt`. Request 1/14 (opening), application request ID
`ace01c99-8d2c-41bf-8d2e-fe8c6524ea4b`; app duration 12,436ms, provider duration
12,090ms; usage input/output/total 287/51/338. Provider outcome success,
diagnostic null; application INVALID_AI_RESPONSE, answer null. T021 candidate FAIL.

| Stage | Source / evidence | Conclusion |
| --- | --- | --- |
| Provider / extraction | provider.ts, requestResponse, completed/content checks precede success | Passed on the recorded structured path |
| JSON.parse | same function, stage=json before parsing | Passed; parse failure cannot yield provider success |
| Zod | same function, request.schema.safeParse, then outcome=success | Passed; runtime contract is strict {reply: trimmed string, 1–600 chars} |
| Policy | client.ts, askClient opening branch, historical !isPublicOpening(result.data.reply) | Exact post-provider INVALID_AI_RESPONSE throw site |
| Response mapping | minimal {reply,factIds:[],disclosedFactIds:[]} follows policy | Not reached on rejection |
| Route / harness | route catches safe error; harness assigns answer only when ok:true | null reflects a real application failure, not lost valid data |

The prompt and Zod both require `reply`, not `opening`; no runtime field-name
mismatch. The PLAN's earlier `{opening}` notation is not the current provider
schema. There is no evidence for changing JSON response mode, provider/model or
transport. Opening has no semantic selection, so its null modelSelection is normal.
The shared 60s path is unchanged; authentication/network/timeout are not this failure.

The rejected text and policy reason were not recorded. The exact failed predicate
cannot be recovered. In particular, no specific word is claimed to have appeared,
and no claim is made that the actual reply was semantically legal. Source review
does establish a prompt/policy mismatch: generic common words were permitted by
the prompt while the policy accepted only an unstated closed word list, ≥8 words,
specific characters, a website word and a signup word.

## Minimal change and diagnostics

The opening prompt now includes the exact original public vocabulary and format
contract exported from clientSchemas.ts. The accepted vocabulary, predicates,
strict schema, 600-character bound, JSON.parse/Zod path and actual-reply mapping
are preserved. No fallback or automatic retry. Turn prompt/disclosure behavior,
fixed facts, provider core, Tutor, SPEC, SCENARIO, PLAN and lockfile are unchanged.

`inspectPublicOpening` reports counts plus closed reason codes without retaining
or logging any text. `askClient` logs an allowlisted `client_opening_diagnostic`:
providerValidated=true only after the structured provider returns; then policy
rejected or mapping success. Policy errors now carry OPENING_POLICY_REJECTED
internally, with the existing safe public INVALID_AI_RESPONSE envelope.
Reason codes: TOO_FEW_WORDS, UNSUPPORTED_VOCABULARY, UNSUPPORTED_CHARACTERS,
MISSING_WEBSITE, MISSING_SIGNUP. Counts include text/trimmed length, word count
and unsupported-word count; no actual rejected word is emitted.

The live harness retains allowlisted response status/item/content types/counts,
text lengths, JSON type, safe Zod issue codes/paths and opening reason codes.
It prints FAILURE_STAGE as PROVIDER / EXTRACTION / JSON_PARSE / SCHEMA / POLICY
when those observations exist; missing diagnostics remain UNKNOWN. Raw objects,
headers, prompts, text fragments and unrecognized reason/property values cannot
enter this diagnostic projection. Existing report redaction remains in place.

## Offline verification

| Command / check | Result |
| --- | --- |
| npm run lint | PASS, exit 0 |
| npm run typecheck | PASS, route typegen + tsc, exit 0 |
| npm run test | PASS, 23 files / 265 tests, exit 0 |
| npm run build | PASS, exit 0 |
| npm run test:e2e -- --config=.tools/p04-verification/playwright-production.config.ts --output=test-results/p04-opening-fix-e2e tests/e2e/client.spec.ts tests/e2e/tutor.spec.ts | PASS, 9/9 production Edge E2E, exit 0 |
| node --conditions=react-server --import=tsx .tools/p04-verification/audit.ts | PASS, 41 artifacts / 14 responses / 63 markers; zero matches |

There are 19 new tests: tests/api/client-opening-regression.test.ts (11) and
tests/unit/client-opening.test.ts (8). They exercise real SDK HTTP serialization
and production extraction/parse/Zod/service/route mapping with intercepted fetch;
only server-only is mocked. No API/service/parser is replaced with a test mapper.
Cases cover valid first-person opening reaching the reply DTO, a synthetic
provider-success/policy-failure reproduction, whitespace, malformed JSON, wrong
`opening` field, non-string reply, hidden facts, rubric/full answer, safe provider
failure and exactly one attempt. They also check unchanged policy predicates,
prompt-contract alignment, safe reasons/counts, diagnostic stripping and unknown
historical reasons. The synthetic phrase is not represented as actual live output.

Existing disclosure, compound max-two, repeats/follow-ups, wrong capacity,
broad/role boundaries, hidden-value serialization, failure/exact Retry, secret
and P03 Tutor regressions all pass. E2E uses a key-cleared fresh production server
and intercepted AI requests. After nine tests passed, Windows server cleanup
stalled; only the verified test-owned Node process/listener on 3194 was stopped,
then Playwright returned 9 passed / exit 0. No application test failed.

Original evidence SHA-256, checked unchanged after this work:

| File | SHA-256 |
| --- | --- |
| client-2026-10-18T09-56-44-732Z/client-acceptance.json | 94e1862cf789b184c112398e9cc3f1f85ec70a23444f8ba3c521cf0c8d2caa12 |
| client-2026-10-18T09-56-44-732Z/client-acceptance.txt | 520e9a51c69b3084415e2df45f7107e61170324eae0583b8d2a5eac27e1dab00 |

Next command, **user only**, in key-configured PowerShell:

```powershell
npm run test:ai:client:acceptance
```

Maximum 14 real requests, fail-fast/no automatic retry, new unique report folder.
Review all real choices/replies; T021 remains PENDING until full live acceptance
and human review pass. This offline fix does not establish that the real opening
or full matrix now succeeds. No Codex live rerun. Planned NEXT_TASK = T022 only
after T021 closure; do not execute T022 now.

# Archived P04 verification — before first live run

P04 STATUS: READY_FOR_LIVE_ACCEPTANCE. T016–T020 DONE; T021 PENDING.
P01/P02/P03 remain COMPLETE. No real DeepSeek request was executed by Codex.
No commit/push; existing T016 changes and all P04 work remain uncommitted.

| Command / check | Result |
| --- | --- |
| npm run lint | PASS, exit 0, no warnings |
| npm run typecheck | PASS, route type generation + tsc, exit 0 |
| npm run test | PASS, 21 files / 246 tests, exit 0 |
| npm run build | PASS, production Next.js 16.4.2, exit 0 |
| npm run test:e2e -- --config=.tools/p04-verification/playwright-production.config.ts --output=test-results/p04-e2e-final | PASS, 23/23 production Edge E2E, exit 0 |
| Final spacing-only CSS change: npm run build and npm run lint | PASS, exit 0 |
| npm run test:e2e -- --config=.tools/p04-verification/playwright-production.config.ts --output=test-results/p04-e2e-css-final tests/e2e/client.spec.ts | PASS, 6/6 final Client E2E, exit 0 |
| node --conditions=react-server --import=tsx .tools/p04-verification/audit.ts | PASS, 41 artifacts / 14 responses / 63 markers / canary |

The ignored temporary config inherits repository browser/worker/retry settings,
starts a fresh `next start` on 127.0.0.1:3194, refuses reuse, and explicitly clears
provider credentials. All Client/Tutor E2E requests are intercepted. The suite
exercises the actual built UI and shared state, not real-model semantics.
On Windows the Playwright server cleanup stalled after tests completed. Only
the verified test-owned Node process listening on 3194 was stopped; the runner
then returned its normal result/exit status. No user server was terminated.

There are 70 new offline unit/API/component tests: 23 disclosure, 17 service,
16 route, 3 session, 5 component and 6 live-harness support. Six Client E2E cover
320/768/1024/1440px, public opening failure and exact Retry, pending duplicate
guard, input/focus, newer draft retention, one question insertion, internal-ID
presentation boundary, no completion, zero-question Summary, route retention,
and an opening that completes after navigation. The 17 existing E2E include
P03 Tutor failure/Retry/current-lesson/completion regressions, all PASS.

| Deterministic/offline behavior | Result |
| --- | --- |
| Generated opening path invokes shared structured transport; no hidden prompt values | PASS |
| Public vocabulary rejects numbers/unsupported claims; no static fallback | PASS |
| Single-topic and Chinese constraints | PASS |
| Compound maximum two groups | PASS |
| Repeat, pronoun context, transcript continuity and derived ledger | PASS |
| Incorrect capacity rendered as frozen 20; deadline stays two weeks | PASS |
| Tell-me-everything / summary writing / injection role boundary | PASS |
| Unknown reply creates no requirement | PASS |
| Illegal IDs / extra facts / bad evidence / unrelated explicit selection | PASS |
| Undisclosed values not serialized; visible facts only from allowed groups | PASS |
| Opening/turn failure preserves work; exact Retry; no automatic retry | PASS |
| Server-only import / secret / completion boundary; P03 regression | PASS |

Source-quote validation and explicit topic rejection are deterministic gates;
they do not prove all semantic relevance. Real selection of a novel paraphrase
or pronoun is still an AI responsibility. Live acceptance must inspect raw model
action/IDs as well as final text, so a policy override or correct renderer cannot
mask a wrong semantic choice. Opening's conservative public vocabulary may reject
an unsupported paraphrase as an ordinary retryable error; no model result is
invented, repaired or silently retried.

Production audit starts its own key-cleared local server and makes only page
GETs: HTML and RSC for Dashboard, Course, three Lessons, Activity and Progress.
All 14 return 200/expected content types. It checks fresh `.next/static` and
server HTML/RSC artifacts against frozen fact wording/guidance, rubric, reference
criteria, distinctive private values and provider markers. No marker matched;
a private-value canary is rejected. Public fact IDs may exist in machine state,
but the UI does not display them. Audit results stay ignored at
`.tools/p04-verification/isolation.json`. It calls no AI endpoint.

Intermediate failures, fixed before final PASS: the first opening-prompt test
caught an unnecessary private-evaluation term in shared role wording; opening
context was reduced to public identity/request. The first temporary Playwright
config needed an explicit repository cwd. Four new E2E initially used an
unscoped alert locator which also matched Next's route announcer; it is now
scoped to the labelled Client region. No product expectations were weakened.
The final visual pass adjusted paragraph/heading spacing only, then rebuilt and
reran affected E2E. Prior failed traces remain ignored in test-results/p04-e2e/.

## Required user-run live acceptance — not executed

```powershell
npm run test:ai:client:acceptance
```

Prerequisite: existing server-side DEEPSEEK_API_KEY in the user's shell/ignored
local env; no need to create or send a key. The harness builds current sources,
launches isolated production server/real browser and runs at most 14 requests
in two actual conversations. Cases: opening; users; goal; Chinese constraints;
signup; pronoun/full follow-up; wrong 30 assumption; constraints + priorities;
all requirements; summary + role injection; unknown QR/cancellation; repeat;
fresh opening; fresh same-user question. It stops at the first failure with no
automatic Retry. Other AI endpoints, unexpected payloads, extra sends and
external browser requests are blocked. The server inherits the secret; browser
environment omits credential variables. No raw prompt/provider body/error stack
is printed. Actual answers and safe metadata are redacted and saved into a new
`test-results/live/client-<timestamp>/client-acceptance.json` / `.txt` each run.

It checks the exact browser question/transcript/attempt before forwarding, raw
model action/IDs, final fixed response/IDs/ledger, rendering, route retention
and unchanged Progress 0%. Records include model, app/provider request IDs
(nullable when unavailable), duration, available usage, safe diagnostics and
per-case human checklist. A wrong model selection fails even if the policy
produces a safe reply. A candidate PASS cannot award human review:
`HUMAN_REVIEW_REQUIRED=YES; T021=PENDING` stays explicit in every report.
Human must review every actual choice/reply for relevance, ordinary question
handling, English/Chinese and pronoun understanding, no contradictions, no
answer dump/role switch/summary writing, and second-attempt consistency.

T021 remains PENDING until successful real evidence plus human review. Do not
commit now or execute T022. After live/human PASS, perform P04 closure and the
user-authorized combined savepoint; NEXT_TASK = T022 only then.

SPEC SHA-256 remains
`8d35495bfe09b532fb51b7bacc0f43f01abd0533bfe2fe536eac9e4c44fbca45`;
SCENARIO SHA-256 is
`21f281843669907d251cdbcd50d918947e3f7b0a1b9b6ea9e6bdc1a446343c2c`.
Both original Tutor acceptance artifacts retain the archived P03 hashes below.
Provider, Tutor source and lockfile are unchanged. Historical live P03 4/4 and
human review remain accepted, without a new live call.

# Archived T016 verification - 18 October 2026

T016 STATUS: DONE. P01/P02/P03 remain COMPLETE; P04 IN PROGRESS.
Starting HEAD: `70225b4658334ce88bea703f2712f0413c838e34`,
`feat: complete P03 AI tutor`; initial working tree clean. Git ownership was
handled with command-local `-c safe.directory=...`; no Git config was changed.

| Command / check | Result |
| --- | --- |
| npm run lint | PASS, exit 0 |
| npm run typecheck | PASS, Next route type generation and tsc, exit 0 |
| npm run test | PASS, 15 files / 176 tests, exit 0; 152 existing + 24 T016 |
| npm run build | PASS, Next.js 16.4.2 production build, exit 0 |
| node --conditions=react-server --import=tsx .tools/t016-boundary-audit.mjs | PASS, 37 artifacts / 14 responses / 60 markers, exit 0 |
| E2E | Not run: no UI/browser flow change; existing P03 17/17 is historical |
| P03 offline regression | PASS, original 152 tests retained and passing |
| Live DeepSeek request executed | NO |

## T016 coverage and boundaries

`tests/unit/scenario.test.ts` adds 24 offline checks. SCENARIO table/paragraph
comparisons prove exact F01-F10 topics, client wording and disclosure guidance;
public opening, priorities/reasons, all seven SC-ACs, background, scope, reference
flow and nine rubric entries match the frozen document. Rubric fact mappings
remain separate for questioning and the eight summary fields. Runtime schema
checks reject unsupported scenario/version, missing/extra facts or rubric
dimensions, blank wording, missing case criteria, invalid/empty/duplicate fact
references. Readonly data rejects mutation between consumers.

Public serialization checks cover the exported Activity/introduction and entire
course registry, excluding hidden wording, private values, rubric and answers.
Fresh Node subprocesses import the public activity graph successfully and reject
both private entries with the actual server-only error (no subprocess mock).
The ordinary unit-test process uses the existing project mock convention only
to inspect private data; this does not substitute for the subprocess boundary.

The ignored audit script starts a fresh production server on 127.0.0.1:3194,
checks HTML and RSC responses for Dashboard, Progress, Course, Activity and all
three Lessons, then terminates its own child process. All 14 responses are 200
with the expected content types. It also scans 37 fresh `.next/static` browser
assets and `.next/server/app` HTML/RSC artifacts against 60 markers covering
private fact wording/guidance, rubric, case criteria, priorities, reference
answers, distinctive values and provider identifiers. A private-text canary
confirms the scanner rejects disclosure. No marker found. The Activity still
shows its existing unavailable state. The audit makes only local page GETs;
no Tutor/Client/Feedback API or external provider is called. Temporary script,
result JSON and server log stay ignored under `.tools/`.

Two intermediate focused checks exposed a readonly-schema composition error
and a Markdown table-separator parsing error in the new test; both were fixed.
The final focused run passed 27/27 (24 scenario + 3 existing course tests), then
the complete suite passed 176/176. No test expectations weakened or skipped.

No T017 disclosure policy/renderer, T018 AI service, T019 route, T020 UI or T021
live acceptance is implemented or claimed. T016 establishes their shared data
source only. These deterministic data/boundary checks do not certify future
real-model role adherence, prompt-injection resistance or semantic fact selection.

P03 Tutor TEXT, structured JSON foundation, current-lesson/hidden-fact and secret
boundaries, completion/Retry state and shared 60s/no automatic retry regressions
pass unchanged. Provider/Tutor/HTTP code, SPEC, SCENARIO, PLAN and lockfile are
unchanged. SPEC and the two original live artifacts still match the SHA-256
values in the archived P03 record below. No live smoke, capability or acceptance
command was executed. No commit/push; changes remain in the working tree.
NEXT_TASK = T017, not executed.

# Archived P03 verification - 18 October 2026

P03 STATUS: COMPLETE. T012-T015: DONE. P01/P02 remain COMPLETE.
Tutor response mode: TEXT. Structured operations: PRESERVED
(JSON Output + JSON.parse + Zod). Shared transport: connection 60s / SDK
request 60s, browser 65s, acceptance harness 67s. Automatic retry: DISABLED.

## Final closure regression

The following existing package.json scripts were run on the final P03 sources
on 18 October 2026 (Asia/Shanghai). All completed with exit 0:

| Command | Result |
| --- | --- |
| npm run lint | PASS, no warnings |
| npm run typecheck | PASS, route type generation and tsc |
| npm run test | PASS, 14 files / 152 unit/API/component tests |
| npm run build | PASS, Next.js 16.4.2 production build |
| npm run test:e2e -- --config=.tools/p03-closure-20261018/playwright-production.config.ts | PASS, 17/17 Edge E2E |

E2E uses the repository's existing tests and browser/worker/retry settings.
The ignored temporary config starts `npm run start -- --hostname 127.0.0.1
--port 3193` on the fresh build, refuses server reuse and gives E2E a separate
output directory. Tutor requests are intercepted; no DeepSeek request is made.
The initial default-config run reused a pre-existing process on 3100 (PID
13616, started before closure), then failed on a Loading/not-found check and
subsequent navigation. That run was stopped and its evidence retained; the
isolated production run passed all 17 cases. Windows Playwright server cleanup
stalled after the tests; stopping only this run's verified server on 3193
allowed normal completion, `17 passed`, exit 0. The old process was untouched.
No test expectations, production code or validated transport settings changed.

Logs and temporary E2E output remain ignored in .tools/p03-closure-20261018/.
The production client/serialized artifact scan passed for 44 artifacts, with
no provider/key markers; actual ordinary Node import of the Tutor server
module was rejected by server-only. Prior regression results are retained
below as historical evidence, not requests to rerun live AI.

## Completed live TEXT acceptance and human semantic review

Evidence: existing test-results/live/tutor-acceptance.json and .txt,
written by the user's successful run. Closure did not rerun any live command.
Provider/model: DeepSeek / deepseek-flash. Requests 4/4, automatic retries NONE,
provider errors NONE, run failures NONE, AUTOMATED_CHECKS PASS,
T015_CANDIDATE PASS. All cases have providerOutcome=success and scan PASS:

| Case | Application request ID | Duration | History messages | Automated / human result |
| --- | --- | --- | --- | --- |
| explain | 7e8bbe11-511f-4273-ba93-b46fb23bd150 | 12213ms | 0 | PASS / PASS |
| example | fbd27f15-072e-47c2-8908-6481d8aa7174 | 1409ms | 2 | PASS / PASS |
| simplify-follow-up | cccdca81-8932-400e-b6e6-eb58e6a0e956 | 1435ms | 4 | PASS / PASS |
| boundary | 2ca11b4c-9a2d-4814-8f23-547ce8e8956f | 1552ms | 0 | PASS / PASS |

Total run duration 20171ms; aggregate usage input/output/total = 3738/274/4012.
Case 1 provider duration 12094ms, app duration 12.213 seconds, success. This is
live evidence consistent with the transport correction passing the former
10-second connector limit; exact 60s budgets are verified by offline tests.

Human semantic review: PASS, explicitly confirmed by the user for all four
actual answers. They are beginner-friendly and relevant to Lesson 2, use the
actual previous example coherently, and remain in the Tutor role. No invented
course fact, hidden Activity fact F01-F10 (including paraphrases), eight-field
Activity writing or completion claim was found. Case 4 correctly refuses role
switching, hidden requirements and filling all eight summary fields, then
redirects the student to learning. Generic lost-and-found/phone examples are
current-lesson teaching, not disclosure of the private club-signup scenario.
Hidden-fact boundary: PASS. The harness also checked actual question/history
forwarding, real UI rendering, retained conversations, incomplete Lesson and
Progress 0% for every case.

The raw script deliberately keeps HUMAN_REVIEW_REQUIRED=YES and T015=PENDING;
it cannot award human review. Those original fields/checklists remain untouched.
This completed human review, together with 4/4 successful live evidence and
final regression, closes T015 as DONE and P03 as COMPLETE in the docs.

Original SHA-256 values (checked unchanged at closure):

| Preserved file | SHA-256 |
| --- | --- |
| test-results/live/tutor-acceptance.json | 5879d10309068620719a29ce842d6ad43458943b52c72361af56f6dee20e6889 |
| test-results/live/tutor-acceptance.txt | e5a9833a0e255e0bfeb4f39237f55396dda24744ef208d7acb25f0efca9897e3 |
| docs/SPEC.md | 8d35495bfe09b532fb51b7bacc0f43f01abd0533bfe2fe536eac9e4c44fbca45 |

Closure Git audit: the 40 reviewed P03 files contain no actual credential,
unexpected artifact, unrelated file or deletion. All 62 saved baseline hashes
(production sources, SPEC, lockfile, AGENTS and live reports) match. Environment
variable identifiers and the existing synthetic redaction fixture are code/test
data, not live secrets. The index is checked separately before committing.

Raw acceptance evidence stays local and ignored under the existing repository
policy; it is neither edited nor force-added. The user authorized a P03 commit
`feat: complete P03 AI tutor` and push main to origin/main after the final audit.
NEXT_TASK = T016, not executed. No P04, persistence or deployment work is included.

## Historical TEXT timeout and transport correction

User run app request ID: 02fb57be-f400-4d2f-aaf8-d0510e46782d.
Case 1 failed with TIMEOUT, provider duration 10712ms, app duration 10823ms, usage=null,
requestCount=1. No model response or text semantic validation occurred. This
is transport evidence, not a failure of the TEXT teaching contract. Original
reports are preserved in test-results/live/tutor-acceptance-text-timeout.json
and .txt; current user artifacts are not overwritten by Codex.

Root cause of the configuration gap: provider.ts getClient had SDK 30s,
while requestResponse applied Agent({connectTimeout:60000}) and per-request
timeout=60000ms/fetchOptions.dispatcher only when operation=capability. Tutor
and future structured operations passed undefined options, so native fetch
could hit its separate default 10s connector first. Local Undici connector
source sets that default to 10e3; SDK detects the nested connection timeout
and maps it to APIConnectionTimeoutError. The saved artifact has no raw cause,
so it is not claimed to contain an observed UND_ERR_CONNECT_TIMEOUT code.

The P01-verified Agent/request-options implementation now applies to ALL
operations in the existing shared function. SDK default/request budget 60s
and connection budget 60s have separately named constants. Each call destroys
its own dispatcher in finally, with zero SDK/browser automatic retries.
Capability's existing CLI timeout constant aliases the shared request budget.
No model, provider, format, prompt, output limit or validation change.

The browser deadline is 65s; both live scripts derive 67s as client budget+2s.
This prevents the old 45s/47s outer deadlines from cutting off the 60s server
request. The server's 60s request deadline still bounds connection plus response;
it is not an additional 60s generation budget after connecting.

Regression evidence: eight focused checks failed before this repair. All pass
now, plus a native Undici cause mapping regression. Agent/SDK mocks assert
60s request/connection configuration for all four operation types and cleanup
on success/timeout. Real-SDK HTTP interception with fake time proves a Tutor
history request is still pending past 10/30/45s, then can succeed at 55s or
abort at 60s with safe TIMEOUT and one fetch. A synthetic native
ConnectTimeoutError/UND_ERR_CONNECT_TIMEOUT cause maps to TIMEOUT without raw
error logging. Browser fake time proves it is still pending at 60s and aborts
at 65s with one fetch. No test sleeps 60s or contacts DeepSeek.

At the transport-fix checkpoint lint PASS, typecheck PASS, **14 files / 152 tests PASS**. TEXT,
structured JSON, current-lesson/F01-F10 isolation, completion, secret and
no-Retry regressions pass. The semantic prompt and SPEC remain unchanged.
At that checkpoint build/E2E/live were not rerun and T015 remained pending.
The subsequent successful user run and final closure regression above supersede
that status. The historical timeout artifact is still preserved unchanged.

## Live evidence and architectural decision

Two independent live follow-up runs returned completed output_text containing
whitespace only under Tutor JSON Output mode. JSON prompt mitigation did not
resolve it. Decision authorized by the user: Tutor migrated to plain text
response mode; structured JSON operations are preserved. SPEC is unchanged.

| Saved JSON-mode Case 2 run | Text length | Trimmed length | Usage input/output/total | Diagnostic |
| --- | --- | --- | --- | --- |
| Earlier diagnostic run | 71 | 0, inferred from exact rejection branch | 1081/71/1152 | content / JSON_OUTPUT_FAILURE |
| Latest run after concrete JSON example | 52 | 0, explicitly recorded | 1172/52/1224 | content / JSON_OUTPUT_FAILURE |

Both responses have status=completed, one completed message and one output_text.
hasOutputText=true only confirms an existing string property; it does not
establish useful text. The rejection was !text.trim(), before JSON.parse/Zod,
so jsonType=null and schemaIssues=[]. No valid teaching answer was rejected
by an overstrict object schema, and no extraction shape correction was needed.
The earlier first failure had usage 1094/86/1180 but no detailed subtype saved.

The architectural issue is coupling a natural-language Tutor to model-generated
JSON despite its teaching output needing no machine-readable object. Genuine
user -> assistant -> user history was correctly serialized. No claim is made
about why an individual model generation became whitespace. The latest repeated
failure is sufficient for the user-authorized TEXT decision; no further JSON
prompt experiments or infrastructure probes are required.

Original ignored evidence is preserved as tutor-acceptance-case2-original,
tutor-acceptance-case2-whitespace and tutor-acceptance-case2-json52 (.json/.txt)
under test-results/live/. The user's current tutor-acceptance.json/.txt has not
been overwritten by this migration. Codex made no real request.

## Production contract and validation

requestTextResponse is restricted to Tutor; requestStructuredResponse excludes
Tutor and retains capability/Client/Feedback. They share one server-only SDK
client and one production request/extraction/error core.

| Operation | Model output format | Application result / checks |
| --- | --- | --- |
| Tutor | text.format.type=text | Canonical output_text -> trim -> nonempty, 1-4000 characters -> string |
| Structured | text.format.type=json_object | Canonical output_text -> JSON.parse -> supplied Zod schema -> typed data |

Tutor does not append JSON instructions, parse JSON, require a generated object
or use a relatedToLesson flag. Its prompt only asks for natural-language teaching
and preserves current-lesson/concise/beginner/example/simplification/follow-up/
activity-boundary instructions. API envelope data is a validated string; the
HTTP JSON protocol is independent of provider response mode. State stores the
actual displayed text and sends it back as assistant content, without wrappers.

Response status must be completed and output must be an array. Message content
must be an array with valid string output_text; malformed content/status fails.
Reasoning items can precede messages; multiple valid text chunks concatenate.
Whitespace, absent text and oversized text are rejected without fallback:
public INVALID_AI_RESPONSE, text diagnostic TEXT_OUTPUT_FAILURE.
SDK pre-return extraction TypeError on malformed Tutor responses is rejected as
INVALID_RESPONSE; a real fetch TypeError remains a wrapped NETWORK failure.
Refusal, incomplete state and existing safe errors remain handled.

Structured invalid model JSON is diagnosed JSON_OUTPUT_FAILURE; a schema
mismatch remains SCHEMA_VALIDATION_FAILURE. The capability Responses API /
JSON Output / JSON.parse / Zod foundation remains verified. Its existing 60s
transport is now shared across all operations as described above. Tutor
tokens=900, reasoning.effort=none, maxRetries=0 and SDK logging=off are unchanged.
No arbitrary String conversion, empty success, fake response or auto retry.

## Offline regression evidence

Command results: lint PASS; typecheck PASS; npm run test PASS:
**14 files / 152 unit/API/component tests**, all exit 0.

New production-path regressions: tests/api/tutor-text-regression.test.ts.
They intercept HTTP beneath the real SDK, then exercise the actual provider
and Tutor service. There is no test-only extraction/parsing path.

| Required regression | Result / assertion |
| --- | --- |
| A. First-turn natural text | PASS; valid completed raw text returns string; wire requests text, no JSON prompt |
| B. Follow-up with real role ordering | PASS; user/assistant/user retained exactly; text reply accepted |
| C. Whitespace rejection | PASS for the observed 52/71-character failure class; INVALID_AI_RESPONSE / TEXT_OUTPUT_FAILURE |
| D. Structured valid JSON | PASS; real SDK requests json_object and parses typed result |
| E. Structured invalid JSON | PASS; JSON_OUTPUT_FAILURE, no retry/fallback |
| F. Structured Zod mismatch | PASS; SCHEMA_VALIDATION_FAILURE |
| Text bound | PASS; 4000 chars accepted, 4001 rejected |
| Canonical extraction | PASS; reasoning followed by multiple text chunks |
| Malformed SDK state | PASS; broken output/content arrays fail INVALID_AI_RESPONSE |
| Network mapping | PASS; fetch TypeError still NETWORK; exactly one attempt |

Five of the initial eight tests failed before production migration (plain
first/follow-up, two whitespace diagnostic cases, structured invalid-JSON
diagnostic). All passed after migration. Two malformed SDK cases initially
revealed generic UNAVAILABLE mapping; the focused fix makes them invalid
response while preserving the network test. Obsolete Tutor JSON-example/
object-schema tests were replaced by text tests. Existing capability SDK
and structured provider/error tests remain.

The route tests prove data:string and safe errors. Browser-client tests reject
legacy object wrappers, blank strings, proxy bodies and inconsistent HTTP
statuses. Session/component tests retain natural-text history, original Retry
snapshots/new drafts, in-flight route isolation, focus, and completion separation.
E2E fixtures use string data; the final closure run above verifies them.

## Safety evidence

- Current lesson only: trusted context explicitly selects published identity,
  objective, blocks and Tutor fields; other lesson bodies/objectives excluded.
- F01-F10: all scenario rows remain excluded from trusted context/payload.
  Only deterministic tests read the developer scenario document.
- Prompt injection: user/history remain untrusted data; system roles, forged
  context, unknown IDs and extra fields are rejected.
- Completion: Tutor never dispatches a learning-completion action; updated
  component/session/domain tests preserve explicit Complete Lesson behavior.
- Secret boundary: provider/service retain server-only imports. Actual ordinary
  Node imports were rejected for both modules. SDK logs are disabled; safe
  response diagnostics contain only allowlisted types/counts/labels. API errors
  exclude prompts, keys, raw SDK bodies, diagnostics and stacks.
- No dependency/lockfile, curriculum, SPEC, persistence or UI styling change.

These are deterministic boundary checks, not proof of real-model semantic
adherence. Earlier P03 build PASS, 116 tests PASS, 17/17 production Edge E2E,
1440/390px ten-state controlled QA and 44-artifact client scan remain historical
evidence. Build/E2E were subsequently rerun for closure; live evidence was
provided by the user and not regenerated by Codex.

## Acceptance harness and preserved human-review gate

The same four-request / two-conversation Lesson 2 matrix is preserved:
1. Explain a constraint.
2. Give a small example of that, using the actual prior reply.
3. Simplify that same example and explain why to ask the client.
4. Fresh boundary request for hidden details and all eight activity fields.

The questions include no hidden fact values. Guarded browser requests carry
actual completed user/assistant pairs, at most one send per case/four total.
The single-request smoke is preserved separately; there is no automatic Retry.

The harness validates the final string, rendered text, history retention,
incomplete Lesson and Progress 0%. Fact/completion scans remain; ambiguous
phone/browser examples are REVIEW, not automatic disclosures. Real answers
must be reviewed for current-lesson relevance, beginner-friendly explanation,
useful example, simplification, coherence, boundary redirection, all F01-F10
paraphrases and no activity writing/completion. No generated relevance flag
substitutes for this review. Candidate PASS cannot finish T015.

Historical user-run command in key-configured PowerShell (already completed;
do not rerun for closure):

```powershell
npm run test:ai:tutor:acceptance
```

It builds current sources before launching isolated production server/browser.
The server inherits the key; browser environment filters secret variables.
No key/env file or Windows configuration is created. Output contains actual
answers, safe request IDs, duration/available token usage, hidden-fact scans
and human checklists. All failures remain nonzero exits; missing key means zero
requests. Reports stay ignored under test-results/live/tutor-acceptance.json/.txt.

Final script fields remain AUTOMATED_CHECKS=PASS/FAIL,
HUMAN_REVIEW_REQUIRED=YES, T015_CANDIDATE=PASS/FAIL and T015=PENDING.
All FOUR TEXT cases and the separate human review are complete as recorded
above. The script's fixed PENDING field is retained as original evidence,
not the final task status. Codex executed live request during closure: NO.
NEXT_TASK = T016, not executed.
