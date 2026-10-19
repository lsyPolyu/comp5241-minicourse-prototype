# COMP5241 Mini-course Learning Platform

The learning path is Dashboard → Course/Module → three short lessons with optional
Tutor support → Client interview → eight student-written fields → Feedback →
Recommendation → Progress/final summary. P01–P06 are complete; P07 is
**READY_FOR_FINAL_USER_GATE — deployment pending**. Production AI, a timed beginner trial and user visual review remain
explicit final gates. P03's current-lesson AI Tutor is complete:
4/4 live acceptance cases and human semantic review passed. Activity now supports
Maya's AI Client interview, eight student-written summary fields and structured
AI Feedback. P05 is complete: final Feedback live acceptance passed 4/4 cases
and the user confirmed human semantic review PASS. P04 Client live acceptance
passed 14/14 cases and human semantic review passed.
Task status lives in
[docs/TASKS.md](docs/TASKS.md).

Use Node 22.x and npm 10.x. This checkout has a verified portable runtime:

```powershell
$env:Path = (Join-Path (Get-Location) '.tools/node-v22.23.3-win-x64') + ';' + $env:Path
$env:npm_config_cache = Join-Path (Get-Location) '.tools/npm-cache'
node --version
npm --version
npm ci
npm run dev
```

The portable runtime is ignored by Git. On another machine, use the version
in `.nvmrc` / `.node-version` with your existing version manager.

```powershell
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
npm run start
```

`test` runs offline unit/API tests, clears provider credentials, and blocks
external fetch. `test:e2e` starts a local server on port 3100 when needed.
Windows uses installed Microsoft Edge; other platforms use Playwright Chromium.
Install the required browsers with `npx playwright install chromium firefox`.
Set `PLAYWRIGHT_CHANNEL` to select an installed Chromium channel. The release
suite also includes one Firefox core-path smoke. This checkout's isolated Firefox
cache is `.tools/p07-ui/browsers`; set `PLAYWRIGHT_BROWSERS_PATH` to its absolute
path to reuse it. Ordinary tests do not send paid AI requests.

E2E output defaults to `test-results/e2e`. The launcher rejects configured or CLI
output paths that overlap `test-results/live`, before Playwright can clean them.
Keep new release evidence in `test-results/release` and live reports in uniquely
named `test-results/live/production-*` directories. The 25 historical live files
lost during P06 remain unavailable; their recorded conclusions and loss report
are in [VERIFICATION.md](docs/VERIFICATION.md).

The only live capability entry is `npm run test:ai:live`. It loads local `.env`
and `.env.local` files and can incur API cost. It uses **DeepSeek** at
`https://api.deepseek.com`, fixed model **deepseek-flash**, through the existing
`openai` JavaScript SDK. Configure `DEEPSEEK_API_KEY` in the server environment
and authorize the minimal request budget before running it. The optional
`DEEPSEEK_MODEL` must match the fixed model. Missing credentials return
`NOT_CONFIGURED` and exit 1 before network access. Never put a
real key in source, documentation, test fixtures, or a `NEXT_PUBLIC_` variable.
The probe sends one small Responses API request with DeepSeek JSON Output
(`json_object`), then JSON.parse and Zod runtime validation. This verifies the
model response and JSON together; it does not claim provider enforcement of
the application's exact JSON Schema. SDK retries are disabled. Failures report
only safe diagnostic codes; no prompt or raw provider error is printed.
T003 is complete: the real capability request and all safety checks passed.
Recorded results are in [docs/HANDOFF.md](docs/HANDOFF.md).

Course content is typed static data in `src/content/courses/`; public lookup
only resolves published courses. Lessons use the separate campus lost-and-found
teaching example. No activity answers are included in the public content.

A root reducer and React Context share learning state across route changes.
Only **Complete Lesson** completes a lesson. Three lessons plus one activity
form four equal units: 0/25/50/75/100%. The activity completes only after a submitted summary receives valid Feedback.
Three lessons alone give 75%; even weak valid Feedback earns Activity completion. Continue
Learning opens the first incomplete lesson, then the activity. Progress also
offers a return link to the last opened lesson.

LearningRepository saves a validated snapshot at `comp5241:learning:v1`. The same
browser and origin restore lesson completion, current lesson, activity completion,
latest successful Feedback and Recommendation after refresh or browser reopen.
Progress is derived from explicit completions. A fresh practice clears its own
conversation/draft while preserving the previous successful result and earned
completion until another valid success replaces them. Unfinished drafts and chat
history remain in memory across navigation; they are not promised across closure.
Unavailable storage keeps the current visit usable and displays a warning.

Outfit and Geist are self-hosted with their OFL licenses in `src/app/fonts/`;
builds do not download fonts. Tutor uses the same-origin `POST /api/ai/tutor`
route and existing server-only DeepSeek transport. The server resolves a
published course/lesson ID and sends only that lesson's trusted content.
Requests cannot supply system instructions or replacement lesson context.
Question length is limited to 1,200 characters; requests include at most six
recent completed question/answer pairs. Full per-lesson conversations and
drafts remain in memory during the visit, including while changing routes.

Tutor requests plain-text model output and validates a trimmed, nonempty answer
of at most 4,000 characters. The application envelope carries `data` as a string;
capability and other structured operations retain JSON Output + JSON.parse + Zod.
Loading preserves input and prevents duplicate sends.
Failures preserve work; explicit Retry resends the failed question/history
snapshot and keeps any new draft. Tutor never completes a lesson or activity.

Offline tests and intercepted browser tests do not contact DeepSeek. For the
separately authorized **single-request product smoke**, build first, then run:

```powershell
npm run test:ai:tutor
```

This starts an isolated local production server, opens Lesson 2 in a browser,
asks **What is a constraint?** once and checks that completion stays unchanged.
It uses `DEEPSEEK_API_KEY` from the process or ignored local env files. Missing
credentials produce `BLOCKED_BY_EXECUTION_ENVIRONMENT` with zero requests and
a nonzero exit. Do not paste keys into chat or tracked files. Results, when
the browser flow runs, are written to ignored `test-results/live/tutor-smoke.json`.
There is no automatic retry. The one-request smoke does not certify T015's
full explanation/example/simplification/follow-up/boundary matrix.

**T015 semantic acceptance is complete** (18 October 2026): the existing four
real TEXT cases, human semantic review and hidden-fact boundary all passed.
Closure reused that evidence without making another live request. See
[docs/VERIFICATION.md](docs/VERIFICATION.md). Do not rerun the live suite for closure.

For a separately authorized future **T015 semantic acceptance** run, use your own
PowerShell with `DEEPSEEK_API_KEY` already configured:

```powershell
npm run test:ai:tutor:acceptance
```

It builds the current app, then opens an isolated production server and browser.
It sends at most **four requests in two conversations**, all on Lesson 2:
explanation → a related example → simplify that example and explain why to ask;
then a fresh boundary/hidden-information/activity-writing request. The actual
browser payload must contain the genuine previous questions and replies.
No scenario fact values are seeded into questions. Any failure stops the suite;
there are no automatic retries, model comparisons or provider probes. Existing
provider reasoning is retained. All operations share an explicit 60s SDK request
budget and 60s connection timeout; browser wait is 65s and harness wait is 67s.

Read the printed real answers and per-case human checklist. The scan catches
distinctive facts and flags ambiguous signals for review; it cannot prove
teaching quality or exclude every paraphrased disclosure. Generic phone/browser
examples can be legitimate lesson teaching. Reports are saved in ignored
`test-results/live/tutor-acceptance.json` and `tutor-acceptance.txt`, with
redacted answers, application/provider request IDs, durations and available
token usage. Keys stay on the Node server and are removed from browser env.
The script always reports `HUMAN_REVIEW_REQUIRED = YES` and `T015 = PENDING`;
candidate PASS alone is not completion. The completed human review is recorded
separately in the docs; the original artifact retains those fixed script fields.
Do not rerun successful cases or run the single smoke first.
The capability probe `test:ai:live` is separate from P03 verification.

P04 Client acceptance is complete: the user's final run passed all 14 cases,
followed by a separate human semantic review PASS. Closure reuses this evidence
without another live request. See [docs/VERIFICATION.md](docs/VERIFICATION.md).
The historical user-run command in key-configured PowerShell was:

```powershell
npm run test:ai:client:acceptance
```

This builds current sources and uses an isolated production server and Edge browser.
It makes at most **14 real requests in two conversations**, stopping at the first
failure with no automatic Retry. It covers opening, users/goals, Chinese constraints,
signup, pronoun follow-up, incorrect capacity, two-topic disclosure, broad answers,
summary writing/role injection, unknown matters, repeats and a fresh attempt.
Reports preserve actual replies, model-selected IDs, approved IDs, request IDs,
latency/available usage and human-review checklists in a unique ignored
`test-results/live/client-<timestamp>/` folder. The raw semantic choice must pass;
a correct fixed renderer cannot hide a wrong model topic. Review every actual
reply before closing T021. Candidate PASS retains `HUMAN_REVIEW_REQUIRED=YES`
and `T021=PENDING` in the original report; the completed human review and final
T021 DONE status are recorded separately in the docs. Codex did not rerun this
paid acceptance for closure.

The same-origin `POST /api/ai/client` accepts strict `opening` or `turn` requests
for the fixed course/scenario/attempt. The server validates transcript roles and
assistant text, restores disclosed IDs, and sends only public topics plus already
disclosed conversation to the shared structured provider. A policy validates
selection/evidence before rendering frozen fact text, at most two relevant groups.
Opening generation uses public information and a closed public vocabulary; an
unsupported response is an error with explicit Retry, never a static success.
The opening prompt shares that exact public vocabulary/format contract. Safe
acceptance diagnostics distinguish provider parse/schema failures from opening
policy rejection using reason codes and counts, without logging rejected text.
Turn semantic selection keeps JSON Output and the strict decision schema. Its
complete validated conversation is passed as JSON context data, followed by a
JSON-only output instruction; prior natural-language Maya replies remain context.
Safe turn diagnostics record only mode, history count and the prompt contract
version. Whitespace output remains a failure with explicit Retry.
Client sessions, drafts and failed request snapshots survive route changes in the
current visit. Any number of questions, including zero, can reach the Summary
handoff. Neither a Client reply nor that handoff completes the Activity.

The GitHub repository is connected to the separate Vercel project
`comp5241-minicourse-prototype`, as confirmed by the user on 19 October 2026.
Vercel currently shows **No Production Deployment**. Pushing this P07 release
commit to `origin main` is expected to trigger a Git deployment; an actual Ready
deployment, Production URL and remote environment configuration remain unverified. See
[deployment instructions](docs/DEPLOYMENT.md), the
[consolidated final gate](docs/FINAL_USER_GATE.md), and
[current handoff](docs/HANDOFF.md).


P05 Feedback uses `POST /api/ai/feedback` and the same shared structured DeepSeek
transport: JSON Output → JSON.parse → strict Zod → evidence/rubric validation.
The server combines the fixed private scenario with the actual Client transcript
and submitted eight-field snapshot. Questioning and summary are independent.
Empty fields are allowed; only Strong / Partial / Missing are assessment levels.
Deterministic TypeScript selects the next action; Strong with unfinished lessons
has a completion-pending explanation. Failure preserves work and previous results;
Retry sends the original submission, while stale responses cannot finish a newer
submission. No automatic summary writing or automatic request retry exists.

T028 is complete. The historical user-run command in key-configured PowerShell was:

```powershell
npm run test:ai:feedback:acceptance
```

It sends at most four real Feedback requests and stops at the first failure,
with no automatic Retry. Client conversations use clearly labelled controlled
fixtures; it does not rerun live Tutor/Client acceptance. Every case goes through
the real Summary submit UI and Feedback route. Unique reports/screenshots go to
`test-results/live/feedback-<timestamp>/`. Read all actual feedback against the
saved transcript/summary and complete the human checklist. Candidate PASS alone
does not close T028 by itself. The user has now confirmed the final 4/4 human
semantic review separately; original reports retain their fixed script fields.
Do not rerun accepted live evidence for closure. See HANDOFF for the savepoint.


The first user-run Feedback acceptance stopped at 2/4: empty feedback disclosed
replacement answers, and minor-omission failed Zod without retained issue detail.
The T028 fix now keeps safe schema paths/types in reports and separates private
assessment facts from student-facing guidance, with a contextual surface check.
The subsequent final run passed 4/4 plus explicit human review, completing
T028/P05. Initial failures and final evidence are preserved. Closure reuses them
without paid reruns; NEXT_TASK is T029, outside this savepoint.
