# COMP5241 Mini-course Learning Platform

P02 provides the static learning path: Dashboard → Course → three short
lessons → explicit completion → Progress. Activity has an unavailable entry
shell; Tutor and Client are not connected. Task status lives in
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
builds do not download fonts. The shared AI transport is not exposed by a page
or API route. P02 does not run the paid capability check.

No deployment, account, or database is configured. See
[docs/HANDOFF.md](docs/HANDOFF.md) for verification and remaining blockers.
