# P07 最终用户验收

日期：2026-10-19（Asia/Shanghai）。本表合并 Production Tutor / Client / Feedback、真实初学者试学、AC-030 视觉审核和生产恢复。**所有未填写字段保持 PENDING；本文件不是已通过的验收记录。** 部署准备与访问保护处理见 [DEPLOYMENT.md](DEPLOYMENT.md)，AC 逐条证据见 [VERIFICATION.md](VERIFICATION.md)。

当前 P07 为 **READY_FOR_FINAL_USER_GATE — deployment pending**。GitHub repository 已连接 Vercel，用户报告当前 **No Production Deployment**；本次 release commit 的 push 预期触发 Git deployment，不代表以下生产与人工验收已通过。

## 1. 开始前只核对一次

- 当前独立项目为 `comp5241-minicourse-prototype`，不是旧 Flask 作业。
- 开始前需确认实际 Ready deployment ID 与稳定 Production origin；**当前 PENDING，尚无已核实 URL**。
- 开始前需确认 Production 环境已配置服务端 `DEEPSEEK_API_KEY` 且已应用至部署；**当前远端配置 PENDING**。缺失时用户直接在 **Vercel Project Settings → Environment Variables** 设置并重新部署；可选 `DEEPSEEK_MODEL` 只允许 `deepseek-flash`。不需要把 key 发给 Codex，也不使用 `NEXT_PUBLIC_`。
- 用全新、未登录 Vercel 的普通持久浏览器 profile 打开 Production origin；不使用 bypass cookie/header/token。能进入真实课程和 Activity，无登录前置要求。
- 选择下面 A 或 B，**这次真实生产 smoke 合计最多约五次请求**。Codex 不主动运行付费测试；不另跑开发期 Tutor / Client / Feedback 全套 live acceptance，不在失败后自动 Retry 或重跑。

## 2. 方案 A：把计时试学与真实生产验收合成一轮

由真实初学者亲自阅读、操作、提问并填写总结；旁观者只记录，不代写答案。开始前记录背景与开始时间，在同一 Production origin 按以下顺序完成。

| 步骤 | 实际操作与观察 | 本轮 AI 请求 |
| --- | --- | --- |
| Dashboard → Course / Module | 辨认可学习课程、Coming Soon、三课及一个 Activity | 0 |
| 三个 Lessons | 阅读正文、术语和例子，学生自行逐课点 Complete Lesson；确认阅读或 Tutor 不自动完成 | 0 |
| Tutor | 在某一当前课问概念解释/例子，再基于实际回答追问或请求简化；保留显示的两轮回答 | 2 |
| Client | Start interview 得到模糊开场；学生根据学习内容提出一个真实相关问题，观察对应信息披露 | 2（开场 + 一问） |
| 八栏总结 | 学生根据真实对话自行填写八栏，可诚实留空或写未确认；不使用参考答案、预填 fixture 或自动代写 | 0 |
| Feedback | 只提交一次，核对九项评价、依据、优势/改进与推荐是否对应这次对话/总结 | 1 |
| 推荐 → Progress / 完成结果 | 执行实际推荐，确认目标可用；三课显式完成且有效 Feedback 后应为 100%，弱评价仍可推荐复习 | 0 |
| 刷新 → 关闭浏览器 → 重开 | 按 §5 对比五类状态；恢复过程不得重新发 AI 请求 | 0 |

以上是五次请求的最小完整操作路径，**不能保证一次 Client 提问足以完成真实初学者学习**。如果参与者需要更多访谈、解释或补交才能形成完整试学，记录真实需要与卡点，保留 T036 PENDING；不能要求参与者假装理解、复制答案或把缺失体验标为 PASS。此轮不自动增加预算或补跑另一付费流程。

10–15 分钟是课程体量目标，不是倒计时或通过条件。按实际用时填写，区分阅读/思考/输入和 AI 网络等待；超出目标时记录原因，再判断是否需要压缩文案。自动化耗时、熟悉代码者的自测和阅读报告都不能冒充初学者试学。

## 3. 方案 B：一次生产 harness，加人工审核与真实试学记录

若优先获得可重复的生产 smoke 及持久化证据，由用户在仓库使用 Node 22 / npm 10 运行一次：

```powershell
npm run test:production -- --url https://YOUR-VERIFIED-PRODUCTION-HOST
```

将占位 host 替换为实际稳定 HTTPS origin，仅填 `https://host`。Windows 默认使用 Edge；缺浏览器时先解决安装问题，不重复消耗已发出的 AI 请求。脚本使用远端 key，本地不需要 key。它最多运行 2 Tutor + 2 Client + 1 Feedback，第一次失败即停止，无自动 Retry，并保存唯一 `test-results/live/production-<timestamp>-<id>/` 目录。保留 `report.json` / `report.txt` 和截图，不修改脚本固定的人工 PENDING 字段。

人工逐项审核 §4，再填写 §6 的真实初学者试学记录。若已有可复查、符合范围的真实计时试学，可同时提交其记录；**如果没有，T036 仍待真实参与者完成**。harness 自行导航、显式完成课程并构造基于可见 Client 回答的不完整总结，只证明生产 smoke；其秒数、截图或对这些输出的阅读不等于真实试学。不得为了让两项都显示通过而自动再跑一轮付费访谈。

方案 A 已提供足够真实证据时，不再运行方案 B；方案 B 已发出五次请求时，也不把方案 A 当作无成本重做。任何缺证项保持 PENDING，待用户安排真实后续记录。

## 4. 一次审核三条真实 AI 路径和视觉

| 审核项 | PASS 的具体依据 | 结论 / 问题 / 证据位置 |
| --- | --- | --- |
| Production Tutor | 解释/例子与当前课相关、适合初学者；追问使用实际前文；未泄露 Activity 隐藏事实、代写八栏或自动完成 Lesson | PENDING |
| Production Client | 真实模糊开场未一次公布答案；相关问题逐步得到一致信息；仍为同一固定案例 | PENDING |
| Production Feedback | 根据真实提问和提交分别评价；questioning + 八维度都有 Strong / Partial / Missing 及依据；无总分/及格线，无杜撰引文或访谈信用 | PENDING |
| Feedback / Recommendation | 优势、改进、下一步一致；实际推荐目标可用；完成状态遵循三课 + 有效 Feedback，不以等级为门槛 | PENDING |
| AC-030 视觉方向 | 用户确认学习导向、亲和、适度活泼；主页面当前任务/状态/下一步清晰，文本与交互一致，无阻断重叠错位 | PENDING |
| 桌面 / 窄窗口 | Dashboard、Course、Lesson/Tutor、Activity、八栏、Feedback、Recommendation、Progress 可读可操作；记录实际设备/尺寸 | PENDING |

## 5. 同一生产 origin 的刷新与真实关闭恢复

成功反馈后记录下面五类状态；刷新页面，再真正关闭该浏览器进程，使用**同一普通持久 profile** 重开相同 Production origin，对照记录。不要复制/导入 storageState、预置 localStorage、切到另一个域名，或用无痕会话关闭后的清空行为代替持久化验收。

| 五类状态 | 关闭前真实值 | 刷新后 | 同 profile 进程关闭/重开后 |
| --- | --- | --- | --- |
| 三个 Lesson 的显式完成记录 | PENDING | PENDING | PENDING |
| 当前 Lesson / Return to this lesson 目标 | PENDING | PENDING | PENDING |
| Activity earned completion | PENDING | PENDING | PENDING |
| 最近有效 Feedback / 提交的八栏总结 | PENDING | PENDING | PENDING |
| 最近 Recommendation / 可执行目标 | PENDING | PENDING | PENDING |

未成功取得 Feedback 的本次练习不能被恢复为成功。新练习可以保留旧成功成果，但要能辨认本次未完成；当前未完成对话/草稿不属于关闭恢复承诺。刷新与重开不应新增 provider 请求。

## 6. 用户一次回填模板

只填写实际事实；未执行写 PENDING，不包含 key、token、授权头或环境变量值。可提供报告相对路径和安全请求 ID，无需粘贴整份敏感网络日志。

```text
验收日期/时区：
采用方案：A / B
Production origin：
Vercel deployment ID（来自 deployment record，不是 x-vercel-id）：
部署来源 revision / 候选版标识：
部署 Ready 时间、实际 Node/区域/时限/Fluid 设置：
匿名访问：浏览器/版本/profile；是否无 Vercel 登录及无 bypass；结果：
证据目录 / 报告路径：

真实参与者背景：需求分析/编程/英语阅读经验；是否此前做过本课程：
开始/结束时间：
Dashboard/Course/三课阅读与完成用时：
Tutor 用时 / 其中 AI 等待：
Client 访谈用时 / 其中 AI 等待：
八栏自行填写用时：
Feedback/执行推荐/Progress 用时 / 其中 AI 等待：
总实际用时 / 总 AI 等待：
是否完整试学；不理解术语、卡点、需要额外访谈、文案压缩建议：

Tutor 解释/例子/追问语义审核：PASS / FAIL / PENDING；原因：
Client 模糊开场/渐进披露/事实一致：PASS / FAIL / PENDING；原因：
Feedback 九项等级/提问与总结独立/真实依据/推荐一致：PASS / FAIL / PENDING；原因：
AC-030 用户视觉审核：PASS / FAIL / PENDING；实际页面/尺寸/问题：
Production 五类状态：刷新 PASS/FAIL/PENDING；同 profile 关闭重开 PASS/FAIL/PENDING：
实际请求数（最多本轮五次，无自动 Retry）：
Tutor 1、Tutor 2、Client 开场、Client 问题、Feedback 的顶层 app requestId / 耗时：
Vercel ai_route → ai_request 对应 provider IDs / provider/model/outcome / 日志位置：
provider ID 不可用之处及可复查的关联记录：
尚未解决的 Must 问题：
```

只有部署/匿名操作、真实生产三路径、生产恢复、真实完整试学、AC-030 人工审核及 AC-001–AC-032 全部有通过证据，才可以将 P07 和 Student Must 标为 COMPLETE。任一项缺证时如实保留用户门禁；AC-033 仅是全部 Student AC 通过后的 Teacher 开始条件，不授权本轮实现 Teacher。
