# Ordered Atomic Tasks — Student Prototype

- 日期：2026-10-17；执行状态更新：**2026-10-18，T012–T015 DONE；P03 COMPLETE。**
- 依据：[SPEC.md](SPEC.md)、[PLAN.md](PLAN.md)、[SCENARIO.md](SCENARIO.md)、[COURSE_CONTENT_PLAN.md](COURSE_CONTENT_PLAN.md)。
- 本文件是唯一实现任务清单。Task ID 为 T001–T040；P01–P07 为实施阶段；CP 为检查点，不计入 atomic task 数量。
- 当前边界：P01/P02/P03 已完成，T015 DONE。用户已有真实 TEXT 验收 4/4 PASS，人工语义审核 PASS，Hidden-fact boundary PASS；四次请求无 provider error、无自动 Retry。Case 1 用时 12.213 秒，providerOutcome=success。Tutor 使用 TEXT；structured operations 保留 JSON Output → JSON.parse → Zod。共享 connection/SDK request timeout 均为 60 秒，浏览器 65 秒、harness 67 秒。Closure lint/typecheck、152/152 unit/API/component、build 与 17/17 production Edge E2E 全部 PASS；未重跑 live AI，原验收 artifact 保留且 ignored，SPEC 未改。本轮已获授权创建 P03 Git savepoint 并 push main；不实现持久化、T016 或 P04。**NEXT_TASK = T016（本轮未执行）**。证据见 [HANDOFF.md](HANDOFF.md)、[VERIFICATION.md](VERIFICATION.md)。

## 1. 执行与 Done 约定

每项为一次可聚焦完成、独立核查的增量。除工程初始化的自动生成骨架外，每项预计涉及 1–5 个主要源 / 测试文件；表述的路径均是**未来拟创建位置**，不是声称仓库已有代码。任务必要时可在实施中细分子步骤，不合并成“Build frontend / Implement AI”。

统一 DoD：本项验收成立，相关逻辑 / 错误路径按风险验证，已有相关测试不回归，typecheck / lint 通过，phase 集成时 build 通过；静态 copy / 低影响样式以浏览器走查验证，不写实现镜像测试。记录任务结果与失败，不勾选尚未验证内容。项目 `.agents/references/definition-of-done.md` 的质量 / 集成原则按本原型适用范围执行，不据通用清单增加云服务、全套监控或额外功能。

检查点核查最近 2–3 项或 phase 的增量；不要求每个小检查点另等用户批准。当前计划审核、AC-030 的用户视觉审核和发布授权分别保留。未经授权不提交 Git、合并或部署。没有 Teacher / Could 开发任务；AC-033 是最后的 Student 全通过门禁，AC-034 不在本清单内。

估计范围 S = 1–2 个主要文件，M = 3–5 个；T001 为生成式工程初始化例外。每项仍需运行对应 Verification；下方执行记录只描述已实际验证的内容。

## 2. P01 — Foundation + static UI shell（5 tasks）

### T001 — 初始化可运行的最小 Next.js 工程

- [x] **Goal：** 以已批准技术方案建立 Next App Router / TypeScript / Tailwind 最小项目，保留现有 docs 与技能文件。
- **Files / modules likely affected：** `package.json`、`package-lock.json`、TypeScript / Next / Tailwind 配置、生成的最小 `src/app/` 骨架；范围：工程生成例外，不做业务页面。
- **Dependencies：** 用户审核 PLAN 并明确授权实施；无前置 task。
- **Acceptance criteria：** 选择实施时官方仍支持、兼容 Node 22.x 的稳定发布并锁版本；strict TypeScript；`dev/build/start/lint/typecheck` 命令存在；无新增云服务依赖。
- **Verification：** `npm run dev` 浏览最小页；`npm run build`、`npm run lint`、`npm run typecheck`；检查 docs 未覆盖、secret 未进入仓库。
- **Relevant SPEC：** FR-021–FR-023；AC-001、AC-028、AC-032；OID-01、OID-04。
- **Done condition：** 工程能运行 / 构建且实际版本与命令已记录，尚无学习业务实现。
- **执行记录（2026-10-18）：** Node 22.23.3 / npm 10.9.9；Next 16.4.2、React 19.3.1、TypeScript 6.0.3 strict、Tailwind 4.3.3、ESLint 10.13.0。真实 Edge 渲染 dev 最小页成功；lint（0 warning）、typecheck、build、`npm ci --dry-run --ignore-scripts` 均 exit 0。Next 预设部分插件的 ESLint 10 peer 范围警告为官方已说明的元数据限制；未使用 force / legacy-peer-deps。既有文档与参考图保留，无业务实现。

### T002 — 建立最小测试运行入口

- [x] **Goal：** 使纯逻辑 / API tests 与浏览器 smoke 可独立执行。
- **Files / modules likely affected：** `vitest.config.ts`、`playwright.config.ts`、`tests/setup.ts`、`tests/e2e/shell.spec.ts`、`package.json`；范围 M。
- **Dependencies：** T001。
- **Acceptance criteria：** `test`、`test:e2e` 能运行；E2E 访问真实本地 dev server；普通测试不调用付费 AI。
- **Verification：** 运行测试入口与最小 shell smoke，确认失败能返回非零状态；不为占位函数写业务假测试。
- **Relevant SPEC：** FR-021、FR-023；AC-028、AC-031、AC-032；OID-01。
- **Done condition：** 后续任务有确定的测试路径，mock / live 边界清楚。
- **执行记录（2026-10-18）：** Vitest 5.0.5 / Playwright 1.64.1；`npm run test` 1/1 通过，普通测试主动清空 provider key 并阻止外部 fetch；`npm run test:e2e` 1/1 在真实 dev server + Edge 通过，无页面运行时错误。独立、Git ignored 的 intentional failure probe 实测 exit 1；lint / typecheck exit 0。配置及新增文件已逐项审阅，不含未来业务假测试。

**CP-01A（T001–T002）：** 已验证：工程与测试入口均可运行；没有提前接入被排除服务。

### T003 — 验证 DeepSeek 真实能力并封装共享 transport

- [x] **Goal：** 验证 DeepSeek 的 server-side key / SDK / model / 网络 / JSON 能力，保留三种用途共用的 application-facing transport 与安全错误边界。
- **Files / modules likely affected：** `src/server/ai/provider.ts`、`errors.ts`、`tests/api/provider*.test.ts`、`tests/live/capability.ts`；必要相关文件为离线测试隔离、`.env.example`、README、PLAN / TASKS / HANDOFF；不新增产品 AI 功能。
- **Dependencies：** T001、T002；用户已授权 OID-02 的 DeepSeek 迁移及最小 capability。Live 仍以前置的安全 `DEEPSEEK_API_KEY`、模型权限、余额 / 网络条件为准。
- **Acceptance criteria：** 官方 OpenAI JavaScript SDK 以 `baseURL=https://api.deepseek.com` 调用 `deepseek-flash`，只从 server environment 读取 `DEEPSEEK_API_KEY`。一次极小真实模型响应同时验证 network / auth / model 和 DeepSeek JSON Output（`json_object`）→ JSON.parse → Zod runtime validation → typed result；不声称 provider 保证应用的精确 JSON Schema。缺 key、认证 / 余额 / 模型访问、限流、网络 / timeout、拒答、截断、空内容、无效 JSON / schema 均保留安全错误语义与白名单诊断。SDK 零自动 retry、无 fallback；key 不进 client / props / 日志 / Git。
- **Verification：** 离线测试覆盖成功与失败 JSON / schema、missing key、认证、余额、模型访问、限流、network / timeout、provider normalization、无重试与脱敏；真实 SDK 的 HTTP 序列化由拦截 fetch 的离线测试验证，不能替代 live。显式运行 `npm run test:ai:live`，记录 provider / base URL / model、request ID、latency、usage；缺 key 必须非零退出且不发网络请求。运行 lint、typecheck、unit/API、build；验证 `server-only` 实际阻止普通环境导入，检查 production client JS / manifests / serialized pages 无 SDK / provider / secret；核查 `.env` ignored、无公开 secret 环境变量和 active 旧 provider 配置。
- **Relevant SPEC：** FR-005、FR-007、FR-009、FR-018–FR-019；AC-005、AC-008、AC-011、AC-024–AC-026、AC-032；OID-02。
- **Done condition：** 仅当 key configured、真实 DeepSeek / deepseek-flash 调用成功、普通模型响应及 JSON Output / JSON.parse / Zod validation 全通过、错误测试 / server-only / secret safety 与以上 Verification 全部通过时才勾选 Done。缺 key 或任何 live / safety 项未验证，保持 pending / blocked；不得用 mock 通过替代，不自动切 provider / model。
- **历史记录（2026-10-18，DeepSeek 迁移）：** 离线迁移及原 42 项测试通过；当时进程缺 key，未发网络请求，保持 BLOCKED。用户随后在自己的 PowerShell 中确认 key configured，并报告真实请求在约 10,668ms 时 TIMEOUT；本轮按下列证据解除阻塞。
- **执行记录（2026-10-18，timeout 修正）：** **T003 STATUS: DONE。** 原 SDK timeout 在 `src/server/ai/provider.ts` 为 `30_000ms`；Node 22.23.3 内置 Undici 6.28.1 的 `internal/deps/undici/undici` → `buildConnector` 另有 `10_000ms` 默认连接超时，SDK `client.mjs` 将其映射为 TIMEOUT。本地 TLS 握手停滞实验在 SDK 30 秒配置下于 10,621ms 产生 `UND_ERR_CONNECT_TIMEOUT`，未访问 provider。仅 capability 使用固定依赖 `undici@7.30.1` 的独立 Agent，将 connectTimeout 和单次 SDK timeout 均设为 **60,000ms**，结束时销毁；无 global dispatcher 修改。其他操作保留原设置，零自动 retry。capability Responses 请求保持 `reasoning.effort=none`（原已关闭），最小 JSON `{"ok":true,"message":"capability-ok"}`，输出上限 128 tokens；不新增未来 Tutor / Client / Feedback reasoning 政策。
- **真实验证（仅一次）：** `npm run test:ai:live` exit 0；安全继承用户环境中已有 key，未创建 env 文件。DeepSeek / `https://api.deepseek.com` / `deepseek-flash`；**975ms**（provider 内部 969ms）；**Request ID: null**（SDK 未返回，不补发请求）；usage **127 input / 12 output / 139 total**。authentication、model access、normal response、JSON Output、JSON.parse、Zod validation 全部 PASS。安全日志见 Git ignored 的 `.tools/t003-timeout-live.log`。
- **最终回归与边界：** live 成功后 lint / typecheck / `npm run test` / build 全部 exit 0；**3 files / 44 tests**，新增覆盖 capability 60 秒预算、超过 10 / 30 秒仍等待、超时不重试及 probe 设置不影响其他操作。真实 server-only 默认导入拦截 PASS；新 production build 的 **12 client JS / 4 manifests / 20 HTML-RSC** 无 provider / secret 标记，实际配置 key 的内存比对无泄漏；源码凭证 / public secret 扫描无命中，env variants ignored。安全报告 `.tools/t003-timeout-safety.json`。SPEC / PLAN / 产品范围 / AI architecture / 模型 / Base URL / UI 均未改变；package / lock 只增加该固定 transport 依赖。未提交或推送 Git，未执行 T006。

### T004 — 建立学习界面的 tokens 与基础控件

- [x] **Goal：** 用少量可复用控件确定可读、亲和的视觉基础。
- **Files / modules likely affected：** `src/app/globals.css`、`src/components/ui/Button.tsx`、`Card.tsx`、`Field.tsx`、`StatusPanel.tsx`；范围 M。
- **Dependencies：** T001。
- **Acceptance criteria：** 暖白 / 深色正文 / 青绿色主行动一致；焦点可见，输入有 label，状态含文字；无需 shadcn/ui 或装饰图片。
- **Verification：** 浏览器检查正常 / disabled / error / focus；缩窄窗口确认基础文字与控件可读。
- **Relevant SPEC：** FR-021–FR-022；AC-029–AC-030；OID-11。
- **Done condition：** tokens 和基础控件可被各 feature 引用，静态展示经走查。
- **执行记录（2026-10-18）：** canonical tokens 与 Button / Card / Field / StatusPanel 已建立；Outfit / Geist 原始 OFL 字体 self-hosted。真实 Edge 验证正常 / disabled / error / reset / keyboard focus（2px teal）、320–1440px 九个宽度无横向溢出、reduced motion、字体已加载且无 runtime error；桌面 / 390px 截图人工检查可读。lint / strict typecheck 通过，新增源码与基线差异已审阅。页面明确为开发控件预览，无学习完成记录或 AI 结果。

### T005 — 建立学习 shell 与路由边界

- [x] **Goal：** 建立共享页头、内容区、导航和非法页面状态，不实现全部业务页。
- **Files / modules likely affected：** `src/app/layout.tsx`、`src/components/AppHeader.tsx`、`Breadcrumbs.tsx`、`src/app/not-found.tsx`、`src/app/loading.tsx`；范围 M。
- **Dependencies：** T004。
- **Acceptance criteria：** Dashboard / Progress 主导航清楚；shell 不像管理后台；loading / not-found 含可用返回路径。
- **Verification：** 本地浏览及键盘导航；运行 shell E2E 与 build。
- **Relevant SPEC：** FR-021–FR-023；AC-028–AC-030、AC-032。
- **Done condition：** 后续页面有统一容器与错误边界，不引入登录入口。
- **执行记录（2026-10-18）：** 共享 header / single main / skip link / breadcrumbs、精确匹配当前项的 Dashboard / Progress 导航、loading / 404 返回路径已建立；Progress 仅静态开发占位。5 项真实 dev server + Edge E2E 通过（导航 / 404 / 键盘 / 窄屏），320–1440px 每 40px 连续缩放及 200% zoom 无横向溢出，最终截图人工检查；返回链接至少 44px。loading 使用真实组件隔离渲染走查，当前静态路由不人为加入等待。lint / typecheck / build 通过，源码与基线差异已审阅，无课程或进度逻辑。

**CP-01B / P01 exit（T003–T005）：** shared AI 能力已验证或有明确阻塞；shell / 控件运行，key 不在浏览器。未完成 T003 不宣称 AI 已可用；无依赖的静态工作可继续，但依赖真实 AI 的验收不得通过。

**本轮结果：P01 STATUS: COMPLETE；T003 STATUS: DONE。** T001–T005 全部 Done，真实 capability、安全边界与最终 regression 已通过；到此停止。`NEXT_TASK = T006` 仅为交接位置，本轮不执行，不代表完整 Student 产品验收已完成。

## 3. P02 — Course data + navigation + progress（6 tasks）

### T006 — 定义 Course 层级和多入口 registry

- [x] **Goal：** 使页面以数据引用 Course / Module / Lesson / Activity，不把课程写死在 JSX。
- **P02 verification (2026-10-18)：** 3/3 registry tests + typecheck passed; reviewed typed public data, parent references, unique IDs and Coming Soon rejection. No hidden facts/rubric.
- **Files / modules likely affected：** `src/domain/course.ts`、`src/content/courses/registry.ts`、`requirement-clarification/course.ts`、`tests/unit/course.test.ts`；范围 M。
- **Dependencies：** T002。
- **Acceptance criteria：** Demo 恰为 1 Course / 1 Module / 3 Lesson refs / 1 Activity；另有至少两个 Coming Soon cards；只有 published Demo 能解析为学习与推荐目标。
- **Verification：** registry 验证唯一 ID、合法父子引用、固定数量及 Coming Soon 不可进入；运行对应 Vitest。
- **Relevant SPEC：** FR-001–FR-003、FR-013；AC-002–AC-004、AC-032。
- **Done condition：** typed domain 与公共 registry 可用，无隐藏 scenario / rubric 数据。

### T007 — 制作三个短 Lesson 的最终 copy 与 Tutor context

- [x] **Goal：** 按 COURSE_CONTENT_PLAN 写简明英文内容，供阅读与当前课 Tutor 共用。
- **P02 verification (2026-10-18)：** Reviewed all three lessons against the outline and first-use terms; body counts 152 / 164 / 169 words. Tutor context shares objectives/definitions/examples, uses lost-and-found only, and excludes activity answers. Registry tests 3/3 and typecheck passed; full timing remains T036.
- **Files / modules likely affected：** `src/content/courses/requirement-clarification/why-clarify.ts`、`what-to-ask.ts`、`structure-requirements.ts`、`course.ts`；范围 M。
- **Dependencies：** T006；语言与 outline 已随计划审核。
- **Acceptance criteria：** 三个既定教学重点、首次术语解释与失物招领例子齐全；每课短而完整；Tutor context 不含 Activity 答案。
- **Verification：** 人工逐课读文案、核对 outline / 术语 / 内容预算；检查 registry validation，不写逐字复制正文的测试。
- **Relevant SPEC：** FR-003、FR-005、FR-008；AC-004–AC-006、AC-010；OID-06–OID-07。
- **Done condition：** 三课可审阅且教学内容与 Tutor context 对齐；最终时长留待 T036 实测。

### T008 — 实现 Dashboard 与 Course outline

- [x] **Goal：** 学生从多个入口进入 Demo，并识别唯一 Module、三课与 Activity。
- **P02 verification (2026-10-18)：** lint/typecheck passed; real Edge E2E 8/8 (exit 0) verifies all outline links, Coming Soon restrictions, invalid IDs, keyboard entry and responsive shell. Reviewed tracked diff and new routes/components. Activity is an unavailable shell; no AI/summary implementation. The first managed-server run passed assertions but stalled in Windows teardown; the successful run reused that server.
- **Files / modules likely affected：** `src/app/page.tsx`、`src/app/courses/[courseSlug]/page.tsx`、`src/features/courses/CourseCard.tsx`、`ModuleOutline.tsx`；范围 M。
- **Dependencies：** T005、T006、T007。
- **Acceptance criteria：** 可用 / Coming Soon 易区分；Course 层级与估时清楚；Coming Soon 无假学习链接，无登录前置。
- **Verification：** 浏览器从 Dashboard 进入三个 Lesson 和 Activity 链接；非法 slug 返回 not-found；键盘可操作。
- **Relevant SPEC：** FR-001–FR-003、FR-021–FR-022；AC-002–AC-004、AC-028–AC-030。
- **Done condition：** 两个入口页面有真实课程数据，所有可学习目标 ID 合法。

**CP-02A（T006–T008）：** 固定层级、短课 copy 与入口均正确；无额外课程正文或场景答案泄露。

### T009 — 实现 Lesson reader 与前后导航

- [x] **Goal：** 按 URL 读取当前课正文，并在既定三课间切换。
- **P02 verification (2026-10-18)：** typecheck + 2/2 real Edge reader tests passed; three real lessons, previous/next/activity links, Course/Module breadcrumbs, and readable 1440/768/390px layout verified. Reviewed reader/navigation diff. No completion event is emitted by reading/navigation; state integration follows in T011.
- **Files / modules likely affected：** `src/app/courses/[courseSlug]/lessons/[lessonId]/page.tsx`、`src/features/lessons/LessonReader.tsx`、`LessonNavigation.tsx`；范围 M。
- **Dependencies：** T005、T007、T008。
- **Acceptance criteria：** 标题 / objective / 概念 / 例子可读；能回 Course、前后切课、进入 Activity；阅读 / 切换不自动完成。
- **Verification：** 浏览器读完三课并切换，检查非法 lesson ID；窄屏阅读走查。
- **Relevant SPEC：** FR-002–FR-004、FR-021；AC-003–AC-004、AC-018、AC-028–AC-029。
- **Done condition：** 正文和导航有真实内容，进度事件接入留给 T011。

### T010 — 实现完成规则与 attempt 的纯状态模型

- [x] **Goal：** 把显式 Lesson 完成、有效 Feedback 才完成 Activity、四项全完成等不变量集中在 reducer / selectors。
- **P02 verification (2026-10-18)：** 15/15 pure learning/progress tests + typecheck passed; lint passed before a type-only discriminated-union correction. Reviewed reducer/selectors and tests: idempotent explicit completion, 0/25/50/75/100%, missing units, grade independence, invalid/mismatched results, request identity, retry snapshots and preserved earned results. Activity assessment fixtures exist only in unit tests; no Activity UI/API flow or persistence is connected.
- **Files / modules likely affected：** `src/domain/learning.ts`、`learningReducer.ts`、`progress.ts`、`tests/unit/learning.test.ts`；范围 M。
- **Dependencies：** T006。
- **Acceptance criteria：** Complete Lesson 幂等；progress 用四单位聚合；评价与完成分开；attempt / submission / request 标识阻止迟到响应和重练假完成。
- **Verification：** Vitest 覆盖打开不完成、重复点击、缺任一项、弱评价仍可完成、强评价缺课不完成、新 attempt 未完成但旧 earned completion 保留。
- **Relevant SPEC：** FR-004、FR-014–FR-016、FR-020；AC-017–AC-021、AC-027；OID-08。
- **Done condition：** 核心规则可脱离 React / provider / browser storage 重复验证。

### T011 — 接入 Learning Context、显式完成与 Progress page

- [x] **Goal：** 让阅读页面完成动作和进度视图共享一份状态，并保留 current lesson。
- **P02 verification (2026-10-18)：** Root reducer/Context, explicit button, shared Dashboard/Course/Module/Progress state and first-incomplete continue target implemented. RTL 2/2; final lint/typecheck, 64/64 unit/API/component tests, build, 14/14 Edge E2E all exit 0. Production browser smoke covers 18 observations at 1440/768/390px with keyboard completion, readable Completed labels, no horizontal overflow/runtime or console errors/API requests. Current lesson has a separate return link. Only session state; no storage/API flow.
- **Files / modules likely affected：** `src/state/LearningProvider.tsx`、`src/app/layout.tsx`、`src/features/lessons/CompleteLessonButton.tsx`、`src/features/progress/ProgressSummary.tsx`、`src/app/progress/page.tsx`；范围 M。
- **Dependencies：** T009、T010。
- **Acceptance criteria：** 点击只完成对应课；Course / Module / Lesson 与 Activity 显示一致；currentLesson 可继续；Tutor 使用与导航不影响完成。
- **Verification：** 浏览器逐课点击 / 不点击对照；RTL 测关键按钮事件；对应 unit tests、build。
- **Relevant SPEC：** FR-004、FR-015–FR-017；AC-017–AC-023。此时仅会话状态，跨关闭验收尚未完成。
- **Done condition：** 单会话进度正确且 UI 一致，没有散落存储调用。

**CP-02B / P02 exit（T009–T011）：** 静态 Student 学习可走通，显式完成和四项聚合准确；Activity 仍显示未完成，持久化未冒称交付。

**P02 STATUS: COMPLETE（2026-10-18）。** T006–T011 全部 Done；三课全完成为 75%，Activity 未完成且 Course 未完成。最终回归、生产模式浏览器检查与局部视觉修正均通过。**NEXT_TASK = T012**，保持 pending；未进入 P03，未运行 AI live 测试，未 commit / push。

## 4. P03 — AI Tutor（4 tasks）

### T012 — 定义当前 Lesson Tutor 服务契约

- [x] **Goal：** 将 Tutor 限定为当前课解释、举例、简化与相关追问。
- **P03 verification (2026-10-18)：** Service/context tests pass, including per-lesson allowlist, F01–F10 exclusion and history/injection boundaries. T015 user-authorized correction migrates Tutor to `requestTextResponse` and bounded plain-text output; PLAN §6.2 now reflects that implementation, without changing this task's product requirements. SDK/client and safe errors remain shared with structured operations.
- **Files / modules likely affected：** `src/domain/tutor.ts`、`src/server/ai/tutor.ts`、`src/server/ai/tutorPrompt.ts`、`tests/api/tutor-service.test.ts`；范围 M。
- **Dependencies：** T003、T007。
- **Acceptance criteria：** 由合法 lessonId 服务端读取 context；历史是数据，不能替换 system；输出有非空 answer；不接触 hidden scenario / rubric。
- **Verification：** 服务测试检查 context allowlist、合法 / 非法 lesson、输出验证与共享 transport 调用；不在单测中扣费。
- **Relevant SPEC：** FR-005、FR-018–FR-019；AC-005–AC-006、AC-024、AC-032。
- **Done condition：** Tutor 独立用途契约存在，不复制 SDK / error 实现。

### T013 — 暴露 Tutor Route Handler 与共享浏览器 API client

- [x] **Goal：** 将 Tutor 服务接入同源 API，统一成功 / 失败 envelope。
- **P03 verification (2026-10-18)：** Initial 23/23 route/browser-client tests, lint, typecheck and production build passed. Tested safe envelopes, invalid IDs/input/JSON/body size and timeout/unavailable/auth/balance/rate/refusal/malformed output without auto retry. The initial 45s browser timeout was superseded by the shared 60s transport / 65s browser policy; closure verifies that final policy. Real server-only import rejection and the final 44-artifact production client/serialized provider/key marker scan PASS.
- **Files / modules likely affected：** `src/app/api/ai/tutor/route.ts`、`src/lib/api/client.ts`、`src/lib/api/contracts.ts`、`tests/api/tutor-route.test.ts`；范围 M。
- **Dependencies：** T012。
- **Acceptance criteria：** 只接受合法输入与允许 ID；provider error / timeout / invalid output 返回标准友好错误；SDK / key 不在 client bundle。
- **Verification：** API 测试正常、invalid input、timeout、refusal 与 invalid output；检查构建边界和响应无技术栈信息。
- **Relevant SPEC：** FR-005、FR-018–FR-019；AC-005、AC-024、AC-032。
- **Done condition：** 浏览器可用固定契约调用 Tutor，失败不伪装成功。

**CP-03A（T012–T013）：** 当前课上下文和 server-side key 边界成立，错误 envelope 可供 UI 使用。

### T014 — 实现 Tutor panel 的问答与失败 Retry

- [x] **Goal：** 学生在 Lesson 内提问并继续追问，失败保留问题和对话。
- **P03 verification (2026-10-18)：** 7/7 session/RTL tests and 7/7 focused real Edge E2E passed; lint/typecheck/diff checks passed. Verified desktop/390px controlled answers, loading, preserved questions/history/drafts, exact explicit Retry without duplicate turns, cross-route in-flight replies and independent Complete Lesson. P02 progress remains 0 until explicit completion and still reaches 75% for three lessons. E2E intercepts Tutor requests, incurring no AI cost. Review includes the root session provider, reader replacement and updated P02 placeholder assertions/navigation waits.
- **Files / modules likely affected：** `src/features/tutor/TutorPanel.tsx`、`useTutor.ts`、`src/components/chat/MessageList.tsx`、`Composer.tsx`、Lesson page；范围 M。
- **Dependencies：** T009、T011、T013。
- **Acceptance criteria：** 分课保存会话；等待有提示且不重复发送；Retry 用原 snapshot，不重复 user turn；Tutor 与 Complete Lesson / Client 职责可辨。
- **Verification：** RTL / 浏览器失败注入，检查输入、相关对话和进度不变；成功后显示回复，窄屏可展开。
- **Relevant SPEC：** FR-005、FR-018–FR-019、FR-021；AC-005–AC-006、AC-024、AC-028–AC-029。
- **Done condition：** Tutor 完整单会话交互可用，失败路径可重试且不丢工作。

### T015 — 验证真实 Tutor 教学行为

- [x] **Goal：** 证明解释 / 举例 / 简化 / 追问都在当前 Lesson 内，越界能引回教学内容。
- **P03 verification status (2026-10-18)：** DONE。用户真实 DeepSeek / deepseek-flash TEXT 验收：explain、example、simplify-follow-up、boundary 四例均 PASS；Requests 4/4、provider errors NONE、automatic retries NONE、AUTOMATED_CHECKS PASS、T015_CANDIDATE PASS。用户已确认 human semantic review PASS：初学者友好、Lesson 2 相关、真实对话连贯、无编造课程事实、无 F01–F10 泄露或 Activity 代写/完成；Case 4 拒绝角色切换、隐藏信息及代填八栏，并引回学习。Case 1 duration=12213ms、providerOutcome=success，表明成功请求已超过原 10 秒连接上限。Shared connection/request60s、browser65s、harness67s 保持；Tutor TEXT 与 structured JSON Output + JSON.parse + Zod 均保留。最终 lint/typecheck、152/152 unit/API/component、build、17/17 production Edge E2E PASS。原 artifact 的 T015=PENDING 是脚本固定的人审门禁输出；本次 DONE 另据已完成的用户人工审核记录，未修改 artifact，未重跑任何 live AI。详见 VERIFICATION。
- **Files / modules likely affected：** `tests/live/tutor.ts`、`tests/live/cases/tutor.ts`、`docs/VERIFICATION.md`；范围 M。
- **Dependencies：** T014。
- **Acceptance criteria：** 三种教学请求及一次相关追问真实 AI 正常；越界 / 代写请求不变成通用助手；不改变 Lesson 完成状态。
- **Verification：** 显式 live 命令 + 浏览器真实问答，记录请求标识、当前课与人工语义结论；错误另由确定性测试核对。
- **Relevant SPEC：** FR-004–FR-005、FR-018–FR-019；AC-005–AC-006、AC-024、AC-032。
- **Done condition：** 有真实调用及内容相关性的证据，不用 mock 截图替代。

**CP-03B / P03 exit（T014–T015）：** Tutor 的正常 / 等待 / 失败 / Retry 全部可检查，教学职责独立。

**P03 STATUS: COMPLETE（2026-10-18）。** T012–T015 DONE；真实 TEXT 语义验收 4/4 PASS、Human semantic review PASS、Hidden-fact boundary PASS。Final regression：lint、typecheck、152/152 unit/API/component、build、17/17 production Edge E2E 均 PASS；server-only 与 44-artifact client scan PASS。无自动 Retry；保留 shared 60s transport 与 structured JSON foundation。真实验收 artifact/SPEC 未改，临时 E2E 输出 ignored。**NEXT_TASK = T016**，本轮未执行；Student 全流程、部署与后续阶段仍未完成。

## 5. P04 — AI Client Role-play（6 tasks）

### T016 — 将固定案例拆成公共介绍与 server-only facts

- [ ] **Goal：** 实现 SCENARIO 唯一事实源和开发用 rubric 数据，杜绝全案例被页面序列化。
- **Files / modules likely affected：** `src/content/activities/client-interview.ts`、`src/server/scenarios/club-signup.ts`、`src/server/scenarios/schema.ts`、`tests/unit/scenario.test.ts`；范围 M。
- **Dependencies：** T006；SCENARIO 已随计划审核。
- **Acceptance criteria：** F01–F10、优先级、案例验收与边界一致；公共介绍仅开场可见内容；private entry 为 server-only，无公共 re-export。
- **Verification：** schema / ID / rubric 引用测试；检查 public DTO 和 client bundle / responses 无未披露值与答案。
- **Relevant SPEC：** FR-006–FR-007、FR-009；AC-007–AC-009、AC-011；OID-05。
- **Done condition：** Client 和 Feedback 将读取同一个版本化事实源。

### T017 — 实现披露 policy 与固定事实 renderer

- [ ] **Goal：** 验证 AI 选择并稳定输出所问事实，不允许编造或一次倾倒全答案。
- **Files / modules likely affected：** `src/domain/client.ts`、`src/server/scenarios/disclosure.ts`、`renderClientReply.ts`、`tests/unit/disclosure.test.ts`；范围 M。
- **Dependencies：** T016。
- **Acceptance criteria：** 合法相关 group 每次最多两组；重复 / 相反假设不改变事实；通用要答案、未知事项和代写转 clarify / unknown / redirect；questionEvidence 必须来自当前问题。
- **Verification：** 固定输入测 broad / specific / compound / repeat / unknown、非法 fact IDs、证据引用；断言输出仅含允许 group，20 / 两周等值不被修改。
- **Relevant SPEC：** FR-006–FR-007；AC-008–AC-009、AC-025、AC-027。
- **Done condition：** 事实 / 分阶段边界可确定性验证，不依赖自由文本事实生成。

### T018 — 实现真实 AI 开场与提问语义选择服务

- [ ] **Goal：** 让模型生成受限开场、理解学生问题并选择披露主题。
- **Files / modules likely affected：** `src/server/ai/client.ts`、`clientPrompt.ts`、`clientSchemas.ts`、`tests/api/client-service.test.ts`；范围 M。
- **Dependencies：** T003、T017。
- **Acceptance criteria：** 开场 prompt 无 hidden values；turn prompt 只有主题目录 / 已披露对话，不含未披露值；正常 turn 真实模型选择，服务再调用 gate / renderer；无写死成功 fallback。
- **Verification：** provider mock 检查传入上下文与正常 / invalid 输出处理；live 调用留到 T021，确认三种用途仍共用 provider。
- **Relevant SPEC：** FR-006–FR-007、FR-018–FR-019；AC-007–AC-009、AC-025、AC-032。
- **Done condition：** 服务返回最小可见 reply 与已披露 fact IDs，不能返回 private scenario 全文。

**CP-04A（T016–T018）：** 唯一事实源、披露 policy 与真实 AI 决策路径接合；无完整答案下发浏览器。

### T019 — 暴露 Client Route Handler

- [ ] **Goal：** 浏览器可以在同一案例 / attempt 内请求开场和逐条回复。
- **Files / modules likely affected：** `src/app/api/ai/client/route.ts`、`tests/api/client-route.test.ts`；范围 S。
- **Dependencies：** T013、T018。
- **Acceptance criteria：** 验证 mode / scenario / transcript / question；拒绝 browser 注入 system role 或非法 fact IDs；错误沿用统一 envelope，不返回假回复。
- **Verification：** API 测合法 opening / turn、非法 payload、provider failure，检查响应无 hidden values / rubric。
- **Relevant SPEC：** FR-007、FR-018–FR-019；AC-008–AC-009、AC-025、AC-032。
- **Done condition：** 无状态 Client API 可供 UI 使用，失败保持客户端已有状态。

### T020 — 实现 Activity 的 Client 对话 workspace

- [ ] **Goal：** 学生可开始、提问、看到逐步披露的信息，并进入自己整理的阶段。
- **Files / modules likely affected：** `src/app/courses/[courseSlug]/activity/page.tsx`、`src/features/activity/ActivityWorkspace.tsx`、`ClientPanel.tsx`、`useClient.ts`、`tests/e2e/client.spec.ts`；范围 M。
- **Dependencies：** T011、T014、T019。
- **Acceptance criteria：** 模糊开场来自 API；使用共享 chat 控件；等待防重复发送，失败保留 question / transcript / state，Retry 不重复插入问题；任何提问次数都可去整理。
- **Verification：** 浏览器正常提问与失败 Retry，路由返回不丢当前会话；此时尚无总结时清楚呈现后续待实现阶段，不伪造完成。
- **Relevant SPEC：** FR-007–FR-008、FR-018–FR-019、FR-021；AC-008–AC-010、AC-025、AC-028–AC-029。
- **Done condition：** 访谈路径可操作，phase / attempt 与共享 learning state 正确关联。

### T021 — 验证真实 Client 披露与一致性

- [ ] **Goal：** 用多种问法证明 AI 语义选择、开场和重用案例符合契约。
- **Files / modules likely affected：** `tests/live/client.ts`、`tests/live/cases/client.ts`、`docs/VERIFICATION.md`；范围 M。
- **Dependencies：** T020。
- **Acceptance criteria：** 覆盖用户 / 目标 / 约束、代词追问、不同语言、复合问题、错误人数假设、全答案请求与第二轮开场；输出事实无矛盾，不要求逐字相同。
- **Verification：** 显式 live + 浏览器实测 SCENARIO §11，记录 model / request IDs / 已披露 IDs / 人工结论；错选事实不得以 renderer 正确掩盖。
- **Relevant SPEC：** FR-006–FR-007、FR-020；AC-007–AC-009、AC-025、AC-027、AC-032。
- **Done condition：** 固定案例的真实 AI 路径有证据，已知语义问题已修正或明确列为未通过。

**CP-04B / P04 exit（T019–T021）：** Client 可真实访谈与失败重试；核心事实稳定、隐藏信息按所问披露。

## 6. P05 — Structured Summary + AI Feedback + mapping contract（7 tasks）

### T022 — 实现固定八栏总结表单

- [ ] **Goal：** 学生自行把访谈整理为 SPEC 指定字段，不由 AI 代写。
- **Files / modules likely affected：** `src/domain/summary.ts`、`src/features/activity/SummaryForm.tsx`、`SummaryField.tsx`、`tests/unit/summary.test.tsx`；范围 M。
- **Dependencies：** T007、T020。
- **Acceptance criteria：** 八键 / 八标签齐全；允许空字符串 / 无字数门槛；有字段提示但不预填案例答案；可回看已有 Client 对话。
- **Verification：** RTL 检查可填写、空栏仍能提交 schema；浏览器长文本与窄屏表单可读。
- **Relevant SPEC：** FR-008、FR-021；AC-010、AC-028–AC-029。
- **Done condition：** 八栏数据完整传入上层，无自动答案或无结构替代提交。

### T023 — 固化提交快照与 Feedback 请求生命周期

- [ ] **Goal：** 请求使用同一份 summary / transcript，失败可原样重试。
- **Files / modules likely affected：** `src/domain/submission.ts`、`src/features/activity/useSubmission.ts`、`ActivityWorkspace.tsx`、`tests/unit/submission.test.ts`；范围 M。
- **Dependencies：** T010、T022。
- **Acceptance criteria：** 每次提交有 attempt / submission / request ID；等待防重发；失败保留输入 / 对话 / 总结 / 旧结果；提交不提前完成 Activity。
- **Verification：** 单测等待、失败、重试、迟到响应；API 未实现前仅测试 controller contract，不生成产品假 Feedback。
- **Relevant SPEC：** FR-008、FR-014、FR-018–FR-019；AC-010、AC-019、AC-026。
- **Done condition：** 本次提交与成功状态提交的关联明确，Retry 不读取后来改动内容。

**CP-05A（T022–T023）：** 八栏自行填写与不可变提交存在；空 / 不完整成果可评价，失败不丢工作。

### T024 — 定义九项 Feedback schema 与证据验证

- [ ] **Goal：** 稳定表达 questioning + 八维度等级、优势 / 改进和推荐所需问题代码。
- **Files / modules likely affected：** `src/domain/feedback.ts`、`src/server/ai/validateFeedback.ts`、`tests/unit/feedback.test.ts`；范围 M。
- **Dependencies：** T016、T023。
- **Acceptance criteria：** 八维度为固定对象且另有 questioning；等级仅 Strong / Partial / Missing，无总分；证据引用 / fact IDs 可核验，absence 不虚构原文，gap 与等级一致。
- **Verification：** 测缺键、非法 enum、空 explanation、假 quote / turn / fact、Missing 无证据、Strong 带 gap；全缺漏也可形成有效评价。
- **Relevant SPEC：** FR-009–FR-011、FR-014；AC-011–AC-013、AC-019、AC-026。
- **Done condition：** 无效 AI 结构不能进入成功结果；schema 与 TS 类型同源。

### T025 — 实现真实 Feedback service 与 Route Handler

- [ ] **Goal：** 服务端结合固定案例、实际对话与总结真实生成并验证 assessment。
- **Files / modules likely affected：** `src/server/ai/feedback.ts`、`feedbackPrompt.ts`、`src/app/api/ai/feedback/route.ts`、`tests/api/feedback-route.test.ts`；范围 M。
- **Dependencies：** T003、T019、T024。
- **Acceptance criteria：** 同一版本 rubric / scenario；分别评价提问和总结；错误 / refusal / incomplete 不返回 success；API 返回 validated assessment，不让模型写任意下一步 URL。
- **Verification：** API 测输入、provider 失败、invalid output、假证据与成功；记录真实 eval 由 T028 执行。
- **Relevant SPEC：** FR-009–FR-011、FR-014、FR-018–FR-019；AC-011–AC-013、AC-019、AC-026、AC-032。
- **Done condition：** 真实生成入口与验证接合，没有复制 provider / secret / error 逻辑。

### T026 — 实现 Feedback 到 Recommendation 的纯映射

- [ ] **Goal：** 在呈现 Feedback 前统一其 Recommended next action，防止后续推荐卡片分叉。
- **Files / modules likely affected：** `src/domain/recommendation.ts`、`buildLearningResult.ts`、`tests/unit/recommendation.test.ts`；范围 M。
- **Dependencies：** T010、T024、T025。
- **Acceptance criteria：** major → 对应 Lesson、minor omission → Retry、全 Strong 且 Course 完成 → Complete；全 Strong 缺课只返回 completionPending；多弱项固定排序，目标只来自 published registry。
- **Verification：** table tests 覆盖三结果、L1/L2/L3、tie-break、缺课反例、弱评价仍完成、Coming Soon 拒绝、最后一课完成后重算；无分数阈值。
- **Relevant SPEC：** FR-010–FR-016、FR-020；AC-013–AC-017、AC-020–AC-021、AC-027；OID-10。
- **Done condition：** 一个纯函数提供可解释 action，后续两处 UI 共用同一结果。

**CP-05B（T024–T026）：** 有效评价契约与三分支 / 缺课前置状态确定；总分和任意链接均不存在。

### T027 — 呈现 Feedback 并原子提交成功结果

- [ ] **Goal：** 展示九项等级、三类反馈并仅在有效反馈后完成本次 Activity。
- **Files / modules likely affected：** `src/features/feedback/FeedbackPanel.tsx`、`DimensionFeedback.tsx`、`src/state/LearningProvider.tsx`、`src/features/activity/useSubmission.ts`、`tests/unit/result-commit.test.ts`；范围 M。
- **Dependencies：** T023、T025、T026。
- **Acceptance criteria：** 有 questioning 和八维度、依据、优势 / 改进 / 统一 next action；一次 event 写 feedback / recommendation / 完成标志；pending / invalid / failure 不完成、不覆盖旧结果。
- **Verification：** 浏览器提交到反馈，unit 测同一次成功事务、弱结果完成与迟到丢弃；failure Retry 成功才完成。
- **Relevant SPEC：** FR-009–FR-019；AC-011–AC-021、AC-026。
- **Done condition：** 学生可看到完整有效评价，Activity 与 Course 按实际状态变化。

### T028 — 验证真实 Feedback 的教学与证据质量

- [ ] **Goal：** 证明评价基于学生实际表现，而非复制 scenario 标准答案。
- **Files / modules likely affected：** `tests/live/feedback.ts`、`tests/live/cases/feedback.ts`、`docs/VERIFICATION.md`；范围 M。
- **Dependencies：** T021、T027。
- **Acceptance criteria：** 包含明显缺漏、轻微遗漏、完整良好，以及“总结准确但没问过”的输入；提问与总结分别评价；next action 与规则一致，空总结可得到 Missing。
- **Verification：** 显式 live + 人工将引文 / absence / 等级与输入逐项核对；浏览器一次真实提交，记录请求标识、结果、问题及修正。
- **Relevant SPEC：** FR-009–FR-014；AC-011–AC-019、AC-026、AC-032。
- **Done condition：** 有真实、语义合理的 Feedback 证据；mock / schema 合法不能单独通过此项。

**CP-05C / P05 exit（T027–T028）：** 八栏 → 真实 Feedback → 统一 action → 正确完成记录可工作；未通过语义验证时不称 AI Feedback 已验收。

## 7. P06 — Recommendation UI + persistence（4 tasks）

### T029 — 接通推荐行动与完成视图

- [ ] **Goal：** 学生能按表现理由进入对应课、重练或查看最终总结。
- **Files / modules likely affected：** `src/features/recommendation/RecommendationCard.tsx`、`src/features/progress/CourseCompleteView.tsx`、`src/features/feedback/FeedbackPanel.tsx`、Course page、Progress page；范围 M。
- **Dependencies：** T011、T026、T027。
- **Acceptance criteria：** 三结果均有真实目标 / 具体理由；缺课时列出现有继续入口而不显示 Complete；已完成但弱结果仍可 review；最终总结是最近成功提交的学生成果。
- **Verification：** 浏览器点击 L1/L2/L3、Retry、查看总结；对照 Feedback next action；检查 Coming Soon 无推荐入口。
- **Relevant SPEC：** FR-011–FR-017、FR-020；AC-013–AC-017、AC-021–AC-023、AC-027。
- **Done condition：** action 契约已呈现为可执行学习动作，完成视图受真实 selector 控制。

### T030 — 实现 LearningRepository 与 localStorage adapter

- [ ] **Goal：** 集中保存版本化学习快照，隔离业务规则与浏览器存储。
- **Files / modules likely affected：** `src/persistence/LearningRepository.ts`、`snapshot.ts`、`localStorageRepository.ts`、`tests/unit/persistence.test.ts`；范围 M。
- **Dependencies：** T010、T027。
- **Acceptance criteria：** 单一版本键、一个完整快照保存五类必要状态；无重复百分比 / 秘密 / hidden scenario；校验无效版本 / ID / 内容，读写错误不删除旧数据。
- **Verification：** 使用内存 storage 测 save/load、corrupt JSON、unknown version、quota / disabled、结果成对保存；搜索确认只有 adapter 调用 localStorage。
- **Relevant SPEC：** FR-016–FR-019；AC-021–AC-023、AC-026；OID-03。
- **Done condition：** repository 可替换，失败返回明确状态，不散落浏览器 API。

**CP-06A（T029–T030）：** 推荐链接均可执行；快照含恢复契约，不把已完成与当前新练习混为一项。

### T031 — 接入 hydration 与保存时机

- [ ] **Goal：** 刷新 / 同源重开后恢复正确状态，避免空初值覆盖记录。
- **Files / modules likely affected：** `src/state/useLearningPersistence.ts`、`LearningProvider.tsx`、`src/features/progress/RestoreStatus.tsx`、`tests/unit/hydration.test.ts`；范围 M。
- **Dependencies：** T029、T030。
- **Acceptance criteria：** load → validate → hydrate → enable save；current lesson 与最近有效结果恢复，进度 / 推荐重算；unfinished 请求不恢复成成功且不自动重发。
- **Verification：** 测 hydration 前禁 save、无数据、旧结果 + unfinished attempt、失败数据不清空；浏览器刷新并继续当前课。
- **Relevant SPEC：** FR-015–FR-019；AC-017、AC-020–AC-023、AC-026。
- **Done condition：** 正常存储条件下五类状态恢复，异常时如实说明未保存而不伪造结果。

### T032 — 完成 Retry Activity 与旧成果保留的整合

- [ ] **Goal：** 重练同一案例时，新旧结果、完成记录和失败重试互不混淆。
- **Files / modules likely affected：** `src/features/activity/useAttempt.ts`、`ActivityWorkspace.tsx`、`src/domain/learningReducer.ts`、`tests/unit/attempt-lifecycle.test.ts`；范围 M。
- **Dependencies：** T020、T023、T027、T029、T031。
- **Acceptance criteria：** 新 attempt 清本次对话 / 草稿，不删 earned completion / latest successful result；本次错误保留工作；迟到旧请求不写新 attempt；UI 标明上次结果与本次未完成。
- **Verification：** 成功一次 → Retry Activity → 新对话 / 总结 → Feedback 失败 → 请求 Retry 成功；中途刷新只恢复必要 metadata 与旧结果，不伪造本次成功。
- **Relevant SPEC：** FR-006、FR-008、FR-014–FR-020；AC-019–AC-023、AC-025–AC-027。
- **Done condition：** 重练生命周期与本地恢复一致，无历史列表或额外门槛。

**CP-06B / P06 exit（T031–T032）：** 完整 Student 功能闭环已接合，恢复 / 重练 / AI 失败的关键不变量成立，仍需 P07 系统验收。

## 8. P07 — Browser testing + polish + deployment（8 tasks）

### T033 — 自动化关键 Student 闭环与推荐反例

- [ ] **Goal：** 在浏览器验证页面 → API → 状态 → UI 的完整行为。
- **Files / modules likely affected：** `tests/e2e/student-flow.spec.ts`、`recommendation.spec.ts`、`fixtures/ai.ts`；范围 M。
- **Dependencies：** T029、T032。
- **Acceptance criteria：** Dashboard → 三课 / Tutor → Client → 八栏 → Feedback → action → Progress；覆盖三推荐结果、强表现缺课、弱表现已完成；假数据仅属于测试拦截。
- **Verification：** Playwright 在 Chromium 运行；检查完成前后状态和实际目标，不能仅断言页面含某文字；live 证据由 T015 / T021 / T028 / T039 补齐。
- **Relevant SPEC：** FR-001–FR-023；AC-002–AC-003、AC-010、AC-013–AC-021、AC-027–AC-028、AC-031–AC-032。
- **Done condition：** 主路径与关键反例稳定通过，测试 fixtures 没有产品访问入口。

### T034 — 自动化三种失败 Retry 与真实关闭恢复

- [ ] **Goal：** 用浏览器证明失败保留成果与同一浏览器重新打开恢复。
- **Files / modules likely affected：** `tests/e2e/ai-failures.spec.ts`、`persistence.spec.ts`、`fixtures/browser-profile.ts`；范围 M。
- **Dependencies：** T031–T033。
- **Acceptance criteria：** Tutor / Client / Feedback 各自失败后原内容仍在且可 Retry；旧 Feedback / Recommendation 不丢；刷新与关闭后用同一持久 profile 重开、同一 origin 恢复五类状态。
- **Verification：** 运行 error / timeout / invalid output 代表路径与旧成功 + 新失败场景；关闭 profile 前后的实际状态对照；不用导入 storageState 替代浏览器落盘验证。
- **Relevant SPEC：** FR-014–FR-020；AC-019–AC-027。
- **Done condition：** 请求 Retry、Retry Activity、刷新与关闭恢复有不同且正确的证据。

**CP-07A（T033–T034）：** 主流程与最易丢数据的路径已自动验证，真实 AI 证据另保留。

### T035 — 响应式与键盘交互走查并修正

- [ ] **Goal：** 解决阅读、Chat、八栏与反馈在不同窗口下的实际交互问题。
- **Files / modules likely affected：** `tests/e2e/responsive.spec.ts` 与最多四个实际有问题的 UI / CSS 文件（按走查确定）；范围 M。
- **Dependencies：** T033、T034。
- **Acceptance criteria：** 代表宽度与连续缩放下核心内容可读、按钮不遮挡；长消息 / 长总结可读；键盘可完成主要动作，状态非仅颜色；Firefox 主流程 smoke 可用。
- **Verification：** 约 1,440 / 1,024 / 768 / 390px + 连续缩放，检查 focus、手机键盘 / 滚动、loading / error / empty / complete；记录截图与实际修正。
- **Relevant SPEC：** FR-021–FR-022；AC-028–AC-030。
- **Done condition：** 无阻断性错位、截断、不可操作项；视觉审核证据在 T038 收口。

### T036 — 完整初学者试学与文案压缩

- [ ] **Goal：** 验证真实课程约 10–15 分钟体量与术语可理解性。
- **Files / modules likely affected：** 三个 Lesson 内容文件、`docs/COURSE_CONTENT_PLAN.md`、`docs/VERIFICATION.md`；范围 M。
- **Dependencies：** T015、T021、T028、T035。
- **Acceptance criteria：** 完整包含阅读、按需 Tutor、真实访谈、八栏总结、真实 Feedback / recommendation；记录实际时长和卡点；必要时压缩重复 copy，不删固定范围或自动代写。
- **Verification：** 至少一次完整计时试学，记录参与者背景、步骤用时、网络等待与理解问题；无真实试学者时明确标记仅自测，不能编造用户验证。
- **Relevant SPEC：** FR-003、FR-005–FR-013、FR-022；AC-004、AC-030–AC-032。
- **Done condition：** 有完整体验记录；若明显超量则先修正并复核，不能把目标时长变成学生通过门槛。

### T037 — 准备具体 Vercel 配置与发布说明

- [ ] **Goal：** 在发布前形成可审查的项目、环境变量、运行时与回退配置。
- **Files / modules likely affected：** `.env.example`、`package.json`、`docs/DEPLOYMENT.md`，必要的 route runtime / duration 配置；范围 M。
- **Dependencies：** T003、T025、T031。
- **Acceptance criteria：** Node 版本与 provider 可达区域 / 时限核实；示例无真实 secret；生产 / Preview key 仅 server-side；记录无登录生产 URL、稳定 origin、预算提醒、匿名 API 残余风险和回退方式。
- **Verification：** 对照实施当天官方平台文档 / 实际账户确认支持，不假设 tier 功能；生产模式 build/start；检查无静态导出 / client key / provider fallback。
- **Relevant SPEC：** FR-018–FR-019、FR-023；AC-001、AC-024–AC-026、AC-032；OID-02、OID-04。
- **Done condition：** 发布材料具体可审核；此任务准备配置，不等于已授权实际部署。

**CP-07B（T035–T037）：** 响应式、课程体量和发布配置有证据；未解决缺口如实列出。

### T038 — 完成本地 release candidate 检查与用户视觉审核

- [ ] **Goal：** 在部署前核对 Student 范围与主流程质量，形成可发布版本。
- **Files / modules likely affected：** `docs/VERIFICATION.md`、`docs/TASKS.md`；范围 S，发现缺陷回到对应任务修正。
- **Dependencies：** T015、T021、T028、T033–T037。
- **Acceptance criteria：** lint / typecheck / unit/API / build / E2E 均通过；用户已审核 AC-030 视觉方向；未有被排除服务、假 AI 正常路径或 Teacher 提前实现。部署 AC 保持 pending。
- **Verification：** 顺序执行项目既定检查，记录命令 / build 与结果；review Student AC 覆盖，不因本地通过勾选 AC-001。
- **Relevant SPEC：** FR-001–FR-023；AC-002–AC-032，特别 AC-030、AC-032。
- **Done condition：** 本地候选版可审查、无未解决 Must 缺陷，且发布前状态诚实。

### T039 — 发布并匿名复测生产 Student 流程

- [ ] **Goal：** 在后续得到明确发布授权后，将候选版部署成真实无登录网站。
- **Files / modules likely affected：** `docs/DEPLOYMENT.md`、`docs/VERIFICATION.md`；另有外部 Vercel 项目配置，范围 S。
- **Dependencies：** T037、T038；后续用户授权涵盖发布（可包含在实施授权中，不重复索取），及可用账户 / 安全配置的 key。
- **Acceptance criteria：** 2026-10-19 会议前可访问稳定生产链接，无访问保护登录前置；正常 Tutor / Client / Feedback 都真实可用；同 origin 刷新与关闭重开恢复；记录 deployment ID。
- **Verification：** 新匿名浏览器从链接走完整 Student 流程，再用同一持久 profile 核查恢复；检查网站 → provider 真实 request IDs、核心推荐与 Progress，不只看首页 HTTP 200。
- **Relevant SPEC：** FR-005–FR-023；AC-001、AC-005–AC-006、AC-008–AC-009、AC-011–AC-013、AC-022–AC-023、AC-028–AC-032。
- **Done condition：** 实际部署与生产验收证据可复查；失败如实记录，不能用 localhost 代替。

### T040 — 收口 AC-001–AC-032 与 Teacher 门禁

- [ ] **Goal：** 将功能、真实 AI、恢复、UI、部署证据逐条对应 SPEC，明确个人 Student Prototype 是否完成。
- **Files / modules likely affected：** `docs/VERIFICATION.md`、`docs/TASKS.md`、`docs/DEPLOYMENT.md`；范围 M。
- **Dependencies：** T038、T039；此前所有 Must 任务有有效结果。
- **Acceptance criteria：** AC-001–AC-032 每条有方法、结果与证据；没有用 mock 代替真实 AI / 生产验收；只有全部通过才能标记 AC-033 gate 可开启，Teacher 实现仍不在本任务范围。
- **Verification：** 逐条审核下方 coverage index 与实际证据、production URL / build / 日期，检查 unresolved Must 为零；确认 Teacher / Could 未做不阻塞 Student 完成。
- **Relevant SPEC：** FR-001–FR-023；AC-001–AC-032、AC-033（仅门禁）。
- **Done condition：** 交付状态可审计，完整 Student Must 满足才称完成；任何未过项保持未完成。

**CP-07C / Student release exit（T038–T040）：** 生产网站、真实 AI、视觉审核与全部 Student AC 证据齐备。此时才可单独讨论 Teacher Should，不能自动执行它。

## 9. AC coverage index

此表为验证安排，**不是逐条通过记录**；P01/P02 已有对应阶段证据，完整 Student AC 仍需后续阶段收口，不能据局部验收勾选完整 AC。

| SPEC AC | 主要实现 / 验证 Task | 通过所需证据 |
| --- | --- | --- |
| AC-001 | T001、T037–T040 | 期限内生产部署、匿名可访问、完整 Student 正常运行。 |
| AC-002 | T006、T008、T033 | 多入口与 Coming Soon 区分。 |
| AC-003 | T006–T009、T033 | 1/1/3/1 层级与导航。 |
| AC-004 | T007、T009、T036 | 三课教学重点、术语、例子与完整试学体量记录。 |
| AC-005 | T012–T015、T039 | 真实当前课解释 / 例子 / 简化。 |
| AC-006 | T010–T015 | 真实追问 + 不代替显式 Lesson 完成。 |
| AC-007 | T016、T021 | 案例全部规定事实与统一评价来源。 |
| AC-008 | T017–T021、T039 | 真实 AI 模糊开场，无全部 hidden values。 |
| AC-009 | T017–T021 | 真实问题逐步披露、一致性、复用案例。 |
| AC-010 | T022–T023、T033 | 固定八栏自行填写与提交。 |
| AC-011 | T024–T028、T039 | 真实评价同时基于提问、总结与案例。 |
| AC-012 | T024、T027–T028 | questioning + 八维度等级、依据、无总分。 |
| AC-013 | T026–T029、T033 | 优势 / 改进 / next action 与卡片一致。 |
| AC-014 | T026、T029、T033 | major weakness → 对应已实现 Lesson 与理由。 |
| AC-015 | T026、T029、T032–T033 | minor omission → 可进入 Retry Activity。 |
| AC-016 | T026–T029、T032–T033 | 良好且四项完成 → Complete / 总结 / 重练。 |
| AC-017 | T010–T011、T026、T033 | 强表现缺课不完成，弱表现四项齐仍完成。 |
| AC-018 | T009–T011、T033 | 只有显式 Complete Lesson 才记录。 |
| AC-019 | T010、T023–T027、T034 | pending / failure 不完成，有效 Feedback 才完成。 |
| AC-020 | T010–T011、T027、T033 | 仅四项全完成，无等级 / 推荐动作门槛。 |
| AC-021 | T010–T011、T029–T034 | Course / Module / Lesson / Activity 记录一致。 |
| AC-022 | T030–T031、T034、T039 | 同 origin 刷新恢复五类状态。 |
| AC-023 | T030–T031、T034、T039 | 同浏览器持久 profile 关闭重开恢复，不造成功。 |
| AC-024 | T013–T015、T034 | Tutor 失败保留问题 / 对话 / 状态并原样 Retry。 |
| AC-025 | T019–T021、T032、T034 | Client 失败保留输入 / 对话 / 草稿并继续。 |
| AC-026 | T023–T028、T030–T034 | Feedback 失败保留提交和旧结果，Retry 成功才完成。 |
| AC-027 | T017、T021、T029、T032–T034 | 同案例重练新 attempt，不假完成 / 不丢旧成果。 |
| AC-028 | T008–T014、T020、T027、T029、T033、T039 | 桌面完整 Student 操作无阻断。 |
| AC-029 | T004、T009、T014、T020、T022、T035 | 代表尺寸 + 连续缩放可读、核心操作可用。 |
| AC-030 | T004–T005、T035–T036、T038 | 学习导向、状态统一、用户视觉审核。 |
| AC-031 | T033、T036、T039–T040 | 新学生完整闭环与生产实测。 |
| AC-032 | T003、T015、T021、T028、T037–T040 | 无排除能力依赖；三路径真实 AI；无 Teacher / Could 强制。 |

FR-001–FR-023 已通过上述 AC 与每项 Relevant SPEC 追溯覆盖。FR-024 / AC-034 不安排实现；T040 仅验证 AC-033 的前置条件。

## 10. 实施交接记录

以下为 **2026-10-17 规划阶段归档记录**；当前执行状态以上方阶段记录及 [HANDOFF.md](HANDOFF.md) 为准。

本轮新增四份规划文档；没有初始化工程、安装依赖、编写业务代码、运行产品测试、调用付费 AI 或部署。起始未跟踪 `docs/SPEC.md` 保持原样。TASKS 的所有勾选框均应为空。

规划检查结果：40 个 task ID 连续有序，所有目标 / 文件 / 依赖 / 验收 / 验证 / SPEC 追溯 / Done 字段齐全，依赖均在前项，AC-001–AC-032 覆盖索引完整；本地 Markdown 链接和表格结构通过检查。这不是产品运行测试。

下一步：用户审核 PLAN 的技术栈、模型 / 预算、英文方案、固定案例与 Client 受控表达取舍，明确授权 implementation 后，从 T001 开始。实际 key / 模型权限与 Vercel 环境仍需落实；不要在 task 记录中粘贴 secrets。
