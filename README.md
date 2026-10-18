# COMP5241 Mini-course Learning Platform

P01 implements the foundation and static shell only. Learning features and
course data start in P02. Task status lives in [docs/TASKS.md](docs/TASKS.md).

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

The Dashboard and Progress destinations are explicitly labelled static
development previews. Outfit and Geist are self-hosted with their OFL licenses
in `src/app/fonts/`; builds do not download fonts. The shared AI transport is
not yet exposed by a page or API route.

No deployment, account, or database is configured in P01. See
[docs/HANDOFF.md](docs/HANDOFF.md) for verification and remaining blockers.
