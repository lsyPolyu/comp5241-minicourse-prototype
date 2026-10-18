# COMP5241 Mini-course Learning Platform

The learning path is Dashboard → Course → three short lessons → explicit
completion → Progress. P03's optional current-lesson AI Tutor is complete:
4/4 live acceptance cases and human semantic review passed. Activity has an unavailable
entry shell. Task status lives in
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
npm run test:e2e
npm run build
npm run start
```

`test` runs offline unit/API tests, clears provider credentials, and blocks
external fetch. `test:e2e` starts a local server on port 3100 when needed.
Windows uses installed Microsoft Edge; other platforms use Playwright Chromium
(`npx playwright install chromium`). Set `PLAYWRIGHT_CHANNEL` to select an
installed browser channel. Ordinary tests do not send paid AI requests.

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
form four equal units: 0/25/50/75/100%. In P02 the activity stays incomplete,
so completing all three lessons gives 75%, without Course Complete. Continue
Learning opens the first incomplete lesson, then the activity. Progress also
offers a return link to the last opened lesson.

State lasts for the current visit. Refreshing or reopening starts a new session;
the repository/localStorage adapter is scheduled for T030–T031. No browser
storage calls are present in P02. Activity request/attempt completion rules are
tested only as pure domain logic; no interview or submission flow is exposed.

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

No deployment, account, or database is configured. See
[docs/HANDOFF.md](docs/HANDOFF.md) for verification and remaining blockers.
