# P01 implementation handoff

- Date: 18 October 2026 (Asia/Shanghai).
- Phase: **P01 — Foundation + static shell**.
- **P01 STATUS: COMPLETE. T003 STATUS: DONE.** T001–T005 are Done; real capability, safety checks, and final regression passed.
- **NEXT_TASK = T006**, after user review. T006 / P02 were not started.
- Current continuation: the user explicitly authorized the P01 Git save point and push to `origin main`; no business code changes, T006 / P02 work, reset, clean, or deployment.

## DeepSeek capability completion — 18 October 2026

The user authorized OID-02's provider migration from OpenAI to **DeepSeek**,
using the existing `openai` JavaScript package as a compatible SDK. The active
baseline is `https://api.deepseek.com`, **deepseek-flash**, server-only
`DEEPSEEK_API_KEY`, and **DeepSeek JSON Output + JSON.parse + Zod validation**.
The application transport interface is retained. No product scope, UI, course
data, or T006 / P02 work was added.

The 10-second connection limit was located and overridden only for capability:
both its SDK request timeout and connection timeout are now **60,000ms**.
Offline tests passed before the **single** authorized live request. It passed
in **975ms** (provider log: 969ms), with **127 input / 12 output / 139 total
tokens**. SDK Request ID was **null**, so none is claimed and no additional
request was made to obtain one. Authentication, model access, JSON Output,
JSON.parse, and Zod validation all passed. The configured user environment
key was inherited only by the subprocess; no key was displayed or saved.

Final regression after live success: lint, typecheck, **44/44 unit/API tests**,
and production build passed. Real server-only import rejection passed; 12
client JS files, 4 manifests, and 20 HTML/RSC files contain neither provider
markers nor the configured secret. **T003 is DONE; P01 is COMPLETE.**

## Resume summary

The previous session left a minimal App Router skeleton, strict TypeScript,
PostCSS / ESLint / Next configuration, React dependencies, a partial npm
lockfile, project registry / version files, and a verified portable Node runtime.
node_modules contained unregistered dependencies, so its existence did not prove
installation or task completion. No task had completion evidence;
docs/HANDOFF.md did not exist. Tracked and staged diffs were empty; the app,
planning documents, design references, and several skills were untracked.

This session read the requested product / planning / design sources, recovered
the existing runtime and dependency installation, and verified T001 before
starting T002. It then established offline tests, the shared AI transport and
blocked live check, canonical tokens and controls, self-hosted fonts, and the
static shared shell. Correct existing configuration was retained rather than
reinitializing the app. No Stitch generation or skill downloads were used.

Before the provider migration, 19 original authority / reference files,
excluding TASKS, matched the foundation session's SHA256 baseline. The earlier
migration updated PLAN / TASKS / HANDOFF and preserved its 25-file protected
baseline. This timeout continuation preserves SPEC, PLAN, PRODUCT, course /
scenario requirements, DESIGN, and UI. Package / lock changes only add the
pinned Undici dispatcher dependency required to override connection timeout
per capability request. Existing user changes, skills, downloads, and unrelated files are preserved. Ignored
.tools/resume-before/ stores the starting app/config files for local review.
Because the app is untracked, review used those baselines and full new-file
inspection in addition to tracked/staged git diff and whitespace checks.

## Environment and skills

- Used: **Node 22.23.3 / npm 10.9.9** from .tools/node-v22.23.3-win-x64.
- The new shell initially selected Node 20.17.0 / npm 11.12.0. PATH was corrected per command; system installations were not changed. Use the PowerShell setup in README for another shell.
- Registry verified: https://registry.npmjs.org/. Existing project .npmrc remains unchanged (save-exact, engine-strict); no global npm settings changed.
- Skills applied: **context-engineering**, **incremental-implementation**, **frontend-ui-engineering**. The AI subtask also used existing openai-docs guidance to check official model / SDK documentation.
- No applicable AGENTS file existed initially. next dev generated root AGENTS.md; its instruction to read installed Next documentation was followed. It remains untracked with the scaffold.
- No next-best-practices skill was installed or invented. Next implementation used node_modules/next/dist/docs/ for installed version 16.4.2.
- The earlier migration used **context-engineering** and **incremental-implementation**. This timeout continuation used **incremental-implementation**, current official DeepSeek docs, installed Next server/client guidance, and the actual Node / SDK implementation. No global runtime settings changed.

## Task results

| Task | Status | Evidence |
| --- | --- | --- |
| T001 | **Done** | Existing scaffold completed with exact supported dependencies. Real dev page rendered in Edge; lint, strict typecheck, build passed. npm ls --depth=0 and lockfile dry-run exit 0. |
| T002 | **Done** | Vitest unit/API entry and Playwright real-local-server smoke run independently. Ordinary tests clear credentials and block external fetch. An ignored intentional failing probe returned exit 1. |
| T003 | **Done** | One real DeepSeek / deepseek-flash capability request passed: 975ms, 127 input / 12 output / 139 total tokens; SDK Request ID null. Authentication, model access, JSON Output / parse / Zod passed. 44 offline tests and lint / typecheck / build passed; server-only and client secret scans passed. |
| T004 | **Done** | Button / Card / Field / StatusPanel, tokens, local fonts. Browser checks cover normal, disabled, error, reset, 2px teal keyboard focus, loaded fonts, reduced motion, and readable narrow layout. |
| T005 | **Done** | Shared header, one main, skip link, breadcrumbs, exact current navigation, loading and 404 return paths. Five shell E2E cases and build passed; Progress is only a labelled static destination. |

CP-01A and CP-01B are satisfied: real shared-transport capability and the static
shell are verified. This does **not** claim future Tutor / Client / Feedback
features or full real-AI Student acceptance have passed.
No full-product AC completion or WCAG conformance is claimed.

## Implementation decisions and design

- App Router / React / strict TypeScript / Tailwind / Lucide / npm, one project lockfile. No shadcn, global store, database, auth, or content pipeline.
- Frozen A Editorial Learning Workspace: warm paper #FAF8F2, ink #252925, teal #28625B, restrained apricot support, canonical status colors and spacing. Flat sections and dividers with one bounded form, no nested cards or fake metrics.
- Outfit headings 500–600 and Geist body 400–600 use next/font/local. Unmodified Latin variable WOFF2 files and OFL licenses live in src/app/fonts/, sourced from Fontsource 5.3.0 with package integrity and font axes checked. Build does not download fonts.
- Header contains only Mini-course, COMP5241, Dashboard, Progress. Current items match exact paths; unknown routes select neither. Content is capped at 1200px and reflows to one column.
- Home is an explicit development control preview, with real focus / reset behavior and a removable local error example. /progress establishes navigation only. Neither page contains course data, earned completion, AI results, or persistence.
- Loading uses a plain status and usable return link. Current pages are static; no artificial delay or extra preview route was added to force loading.
- Known capture deviations corrected where applicable: supporting text >=14px, readable placeholders, defined control borders, 8px controls / 12px containers, consistent teal actions / focus, readable disabled text, state words and symbols, return-link targets >=44px.
- Completed learning state visibility is deferred to actual progress implementation. P01 does not invent completed records to imitate screenshots. AC-030 user visual approval remains outstanding.

## AI capability and secret safety

Provider is **DeepSeek** at **https://api.deepseek.com**. The existing official
OpenAI JavaScript SDK 7.36.0 is retained solely as an API-compatible client.
Model is fixed to **deepseek-flash**; optional DEEPSEEK_MODEL must match it.
Only DEEPSEEK_API_KEY is read for authentication. `requestStructuredResponse`
and its input / typed result interface remain unchanged.

Responses `create` uses `text.format.type=json_object`, a prompt containing
json and the target format, and maxRetries:0. The capability prompt requests
only `{"ok":true,"message":"capability-ok"}`, with the existing
`reasoning.effort=none` setting and a 128-token output cap. Other operation
placeholders retain their existing settings; this continuation does not
establish a future Tutor / Client / Feedback reasoning policy.
One response is enough to verify normal model
content, network / model access, JSON.parse, and Zod validation together; no
additional plain-text request is needed. No OpenAI JSON Schema helper or
provider guarantee of the application's exact schema is assumed. DeepSeek's
Responses API is stateless; unsupported `store` is not sent. One shared lazy
client and existing operation token caps are retained. Purpose-specific
business services and API routes are not implemented.

Original timeout definitions and correction:

- Application SDK default: **30,000ms**, originally `src/server/ai/provider.ts:31`, retained for non-capability operations.
- Native Node 22.23.3 fetch uses bundled Undici 6.28.1. Its embedded `internal/deps/undici/undici` source, `buildConnector`, defines `timeout = timeout == null ? 1e4 : timeout`: **10,000ms connection timeout**, independent of the SDK timer. No additional application AbortSignal / AbortController timeout was found in the live path. `node_modules/openai/client.mjs` detects native connection timeouts and throws APIConnectionTimeoutError, which `src/server/ai/errors.ts` normalizes to TIMEOUT.
- A local-only stalled TLS handshake with the same SDK, native fetch, 30,000ms timeout, and zero retries produced `UND_ERR_CONNECT_TIMEOUT` after **10,621ms**; no provider request or real credential was used. The historical user's TIMEOUT log did not retain its underlying cause, so the precise network fault in that request is not claimed.
- Updated capability: **60,000ms** in `AI_CAPABILITY_TIMEOUT_MS`; SDK per-request `timeout` and an isolated `undici@7.30.1` Agent's `connectTimeout` both use it. The Agent is passed only through capability's `fetchOptions.dispatcher` and destroyed after completion / failure. No global dispatcher or unrelated HTTP timeout changed.
- Offline regression proves capability remains pending past 10s and 30s, aborts at 60s, and does not retry. Other operations retain their default request options.

Refusal, incomplete / empty output, invalid JSON / schema, timeout, rate limit,
network, and configuration failures become existing safe application errors.
Allowlisted diagnostics distinguish authentication, balance (HTTP 402), model
access / not found, invalid request, provider, JSON, and schema failures; raw
provider data / cause is discarded. No automatic retry or fallback exists.
SDK payload logging is off. Logs contain only operation, provider, model,
request ID, usage, duration, outcome and safe diagnostics, without original
error payload / stack, prompt, key, or student text.

Earlier missing-key observations applied to that process only. This
continuation confirmed the user's environment has DEEPSEEK_API_KEY configured;
the fresh subprocess inherited it without writing .env / .env.local.
The CLI remains excluded from ordinary tests. Exactly one paid capability
request was executed after offline tests passed:

    npm run test:ai:live
    status: passed; secret: configured; exit 0
    provider: DeepSeek; baseURL: https://api.deepseek.com; model: deepseek-flash
    timeoutMs: 60000; thinking: disabled
    authentication / modelAccess / normalResponse: PASS
    jsonOutput / jsonParse / zodValidation: PASS
    durationMs: 975; requestId: null
    usage: inputTokens 127; outputTokens 12; totalTokens 139

The SDK did not return a Request ID; null is recorded without substituting a
response ID or making another request. Safe output is preserved in Git ignored
`.tools/t003-timeout-live.log`. No repeat request was made after success.

SDK imports and credential access are confined to server-only modules.
.env.example contains an empty key; actual .env variants are ignored.
The real server-only guard rejected an ordinary import of the transport;
the explicit react-server CLI imported it and passed the real capability
check. The fresh production build's 12 client JS files,
4 client reference manifests and 20 HTML / RSC files contain no SDK / server
AI / provider / secret markers, including an exact in-memory comparison with
the configured key. No public secret environment names or
credential-like source strings were found; .env variants remain Git ignored.
This applies to the current static shell: transport is not imported by any
page or API. Repeat boundary checks when future APIs are connected.

Official sources: [Responses API](https://api-docs.deepseek.com/api/create-response/),
[compatibility guide](https://api-docs.deepseek.com/guides/responses_api/),
[JSON Output](https://api-docs.deepseek.com/guides/json_mode/),
[error codes](https://api-docs.deepseek.com/quick_start/error_codes/).

## Verification

| Command / check | Actual result |
| --- | --- |
| npm run lint | PASS, exit 0, no warnings |
| npm run typecheck | PASS after live success, generated route types + strict tsc, exit 0. |
| npm run test | PASS after live success, 3 files / 44 tests, exit 0; no paid requests |
| npm run test:e2e | Prior foundation evidence: PASS, 5 tests on real dev server and installed Edge, exit 0; not rerun because UI hashes are unchanged. |
| npm run build | PASS, Next 16.4.2 Turbopack; /, /_not-found, /progress, /icon.svg |
| npm run start smoke | Prior foundation evidence: PASS, production Dashboard/Progress 200, unknown route 404; navigation / focus; no successful-route console/runtime errors. Not rerun for this provider-only change. |
| npm run test:ai:live | PASS, exactly one live request, exit 0; 975ms; Request ID null; usage 127 / 12 / 139; authentication / model access / JSON Output / JSON.parse / Zod PASS. |
| Capability safety | PASS: real default-import server-only rejection; 12 client JS / 4 manifests / 20 HTML-RSC files clean, including actual configured key comparison; no credential patterns / public secret names; env variants ignored. Report: .tools/t003-timeout-safety.json. |
| Intentional runner failure | Expected exit 1 in ignored .tools/runner-probe/; excluded from ordinary tests |
| npm ls --depth=0 | PASS, exit 0; inherited extraneous optional packages retained |
| npm ci --dry-run --ignore-scripts --prefer-offline --no-audit --no-fund | PASS, exit 0 with documented peer warnings; dry-run, not a clean reinstall |
| Browser design check | PASS: 320–1440px every 40px, representative 390/768/1024/1440, 200% zoom, single main, keyboard, focus, disabled/error/reset, reduced motion |
| Loading component | Actual component rendered in isolation with app styles; status and >=44px return link checked, screenshot reviewed. Static pages do not exercise pending transitions. |
| Source / Git review | Baseline comparisons, full added-file review, untracked source whitespace/conflict checks, tracked/staged diffs and git diff --check; no commit |

Ignored local evidence is under .tools/qa/: t004-report.json, t005-report.json,
production-report.json, and corresponding screenshots. Final visual references
are p01-production-desktop.png and p01-production-narrow.png. T001's original
rendering is recorded separately in .tools/t001-dom.html.
Windows E2E uses installed Edge; other platforms need npx playwright install
chromium. README documents the channel override. Firefox and screen-reader
testing are not claimed at P01.

## Foundation session files and dependencies

Modified existing files this session:

- package.json, package-lock.json: completed exact dependencies and test/live scripts.
- .gitignore: ignore generated next-env.d.ts; retained secret / artifact rules.
- postcss.config.mjs: named config export for lint.
- src/app/globals.css, layout.tsx, page.tsx: tokens, fonts, control preview, shared shell.
- README.md, docs/TASKS.md: runnable instructions and evidence-backed status.

Added:

- AGENTS.md (framework-generated), .env.example, docs/HANDOFF.md.
- vitest.config.ts, playwright.config.ts.
- src/components/AppHeader.tsx, Breadcrumbs.tsx.
- src/components/ui/Button.tsx, Card.tsx, Field.tsx, StatusPanel.tsx.
- src/app/loading.tsx, not-found.tsx, progress/page.tsx, icon.svg.
- src/app/fonts/outfit-latin-wght-normal.woff2, outfit-OFL.txt, geist-latin-wght-normal.woff2, geist-OFL.txt.
- src/server/ai/provider.ts, errors.ts.
- tests/setup.ts, tests/unit/test-isolation.test.ts, tests/api/provider.test.ts, tests/e2e/shell.spec.ts, tests/live/capability.ts.
- Ignored local baseline, cache, and verification artifacts under .tools/.

Retained existing .npmrc, .node-version, .nvmrc, next.config.ts, tsconfig.json,
and eslint.config.mjs because their settings were correct.
React / React DOM **19.3.1** were already declared; this session completed
their installation context. Added direct dependencies, all exact:

| Runtime | Development |
| --- | --- |
| next 16.4.2 | typescript 6.0.3 |
| lucide-react 1.59.0 | tailwindcss / @tailwindcss/postcss 4.3.3 |
| openai 7.36.0 | postcss 8.5.23 |
| zod 4.6.7 | eslint 10.13.0 / eslint-config-next 16.4.2 |
| server-only 0.0.1 | @types/node 22.20.5 / @types/react 19.3.0 / @types/react-dom 19.3.0 |
| undici 7.30.1 (capability dispatcher only) | |
| | vitest 5.0.5 / @playwright/test 1.64.1 / tsx 4.23.15 |

The earlier DeepSeek migration changed only PLAN / TASKS / HANDOFF, README,
.env.example, src/server/ai/provider.ts and errors.ts, tests/live/capability.ts,
tests/api/provider.test.ts, tests/setup.ts and tests/unit/test-isolation.test.ts;
it added tests/api/provider-sdk.test.ts. No package / lockfile change was needed then.
Ignored .tools/t003-deepseek-before/ preserves pre-migration files and the
25-file protected baseline for review. No actual env file was created.

This timeout continuation changes only `src/server/ai/provider.ts`,
`tests/live/capability.ts`, both existing provider test files, `package.json`,
`package-lock.json`, `docs/TASKS.md`, and this handoff. The package / lock adds
only the exact Undici dependency. Ignored `.tools/t003-timeout-before/`
preserves this continuation's starting files and hashes. SPEC / PLAN /
product / scenario / course content / AI architecture / model / base URL /
UI are unchanged. No T006 implementation was started.

## Known issues, blockers, and Git

- **No remaining P01 / T003 blocker.** The single real capability request and final regression / secret safety checks passed. Request ID is null because the SDK did not return one; usage and latency are recorded above.
- ESLint 10 runs successfully with the Next preset. Some bundled plugins still advertise peer ranges through ESLint 9: npm emits ERESOLVE override warnings, and recursive npm ls eslint reports invalid peer metadata. [Next's guidance](https://nextjs.org/docs/app/api-reference/config/eslint) documents ESLint 10 support and this warning. No force / legacy-peer-deps, preset removal, or unsupported downgrade was used. TypeScript 6.0.3 stays within installed typescript-eslint's supported <6.1 range.
- Installation initially stalled on registry downloads; bounded recovery reused verified existing Next/SWC tarballs and project cache. Final installs and lockfile dry-run passed. Inherited optional packages remain extraneous; no cleanup deleted previous files.
- Some intermediate dev screenshots showed a Next “1 Issue” badge. An independent diagnostic across 24 desktop/narrow navigation observations did not reproduce it; no hydration/runtime warning appeared. Historical cause is unconfirmed. Final production screenshots have no badge and production checks pass. Dev indicators were not disabled.
- Visual approval, full course learning, Tutor / Client / Feedback behavior, persistence, deployment, and full Student acceptance remain future work. P01's preview is not the finished Dashboard or Progress feature.
- At the start of the Git save-point audit, git status showed 32 untracked entries containing 129 files; tracked / staged diffs were empty. The existing history already contains REQUIREMENTS_DISCOVERY and the initial five agent files, so those are not duplicated. Formal .agents/, .codex/, .stitch/, PRODUCT, planning, and P01 implementation files are retained.

## P01 Git save point — 18 October 2026

The user authorized commits and `git push origin main` for the completed P01
only. The audit classified every previously untracked file:

- A — Formal application: src, tests, package / lock, README.
- B — Formal docs / design / skills / config: product and implementation documents; Stitch design, metadata and eight reference PNGs; complete checked-in skill distributions and references; environment-only Codex config; project toolchain settings and AGENTS.md.
- C — Secret / env: actual keys remain outside Git. `.env.example` contains only `DEEPSEEK_API_KEY=`. `.codex/config.toml` uses `env_http_headers` with `STITCH_API_KEY`, without a literal key.
- D — Cache / build: node_modules, .next, coverage, Playwright output, and compiler cache remain ignored.
- E — Temporary / generated: .tools, generated next-env.d.ts, OS / editor temporary files remain ignored. Formal reference PNGs remain eligible for Git.
- F — Uncertain items: none after audit.

The save point uses three logical commits: specification / implementation plan;
design system / development skills; and P01 foundation / static shell with
its toolchain and verification records. Existing requirements history is
preserved. Commit IDs and push outcome are reported by the save-point run;
`git log -3 --oneline` identifies the local save point. A network failure does
not authorize resetting those commits.

No business source / test files, product scope, AI architecture, provider,
model, Base URL, or design assets are changed during this packaging step.
No new live request is made. Secret checks compare all candidate files,
staged additions, and existing Git history against configured DeepSeek /
Stitch key values in memory without printing or saving the values. Only
ignore rules, the empty env template, and documentation are adjusted.

Stop at this boundary. **P01 STATUS: COMPLETE. T003 STATUS: DONE.
NEXT_TASK = T006.** T006 / P02 were not executed. Git save-point commits and
push are authorized only for the completed P01 boundary described above.
