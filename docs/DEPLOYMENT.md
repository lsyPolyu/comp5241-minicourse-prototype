# P07 Vercel 发布配置

核查日期：2026-10-19（Asia/Shanghai）。本文件是配置与操作说明；**当前没有已核实的 Production URL 或 deployment ID，不能据此宣称已部署、匿名可访问或生产 AI 已通过。** 实测结果写入 [VERIFICATION.md](VERIFICATION.md)，最后一次人工验收使用 [FINAL_USER_GATE.md](FINAL_USER_GATE.md)。

P07 STATUS: **READY_FOR_FINAL_USER_GATE — deployment pending**。用户已确认 GitHub repository 成功连接本项目；Vercel 当前显示 **No Production Deployment**。

## 1. 项目身份与当前状态

本仓库的本地 `.vercel/project.json` 指向以下独立 Next.js 项目；账户中的旧 Flask 作业不能用作本项目部署。

| 项目字段 | 当前记录 |
| --- | --- |
| Name | `comp5241-minicourse-prototype` |
| Project ID | `prj_NQ6xj0ppUa4wofzzGhilQc8EPGsy` |
| Team / org ID | `team_g3BeDcP2xFVKcYHbMxC1vbvd` |
| GitHub repository / Vercel Git connection | **用户确认已成功连接；push `origin main` 预期触发 Git deployment** |
| Production URL / deployment ID / 部署时间 | **PENDING，待实际部署记录** |
| Production 环境变量、套餐、Fluid Compute 与函数配置 | **PENDING，未读取实际账户设置** |
| 匿名访问、香港函数到 DeepSeek 可达性、生产恢复 | **PENDING，未实测** |

本轮用户已授权审核有效 P07 工作、正常 commit 并 push `origin main` 后停止。Git 连接已成功，下一步预期由本次 push 触发 Vercel 部署；Git 连接和 push 成功仍不能替代 Ready deployment 记录。实际生产验收留在最终用户门禁，不执行付费 DeepSeek 请求。

## 2. 仓库配置与平台核对

| 配置 | 仓库实际值 | 发布时核查 |
| --- | --- | --- |
| Framework / root | Next.js / 仓库根目录 | 不复用 Flask 入口或静态站点配置 |
| Install / build | `npm ci` / `npm run build` | 以提交的 lockfile 安装，保留构建日志 |
| Node / npm | `package.json` 要求 Node `22.x`、npm `10.x` | 核对构建环境实际版本 |
| Functions region | `vercel.json`：`hkg1` | 核对实际生成的函数区域与 provider 可达性 |
| AI runtime / duration | 三个 AI Route Handler 均为 `nodejs` / `maxDuration = 75` 秒 | 核对账户/部署接受该时限 |
| Provider / model | 服务端固定 DeepSeek / `deepseek-flash`，无 fallback | 通过实际请求与日志关联核验 |

2026-10-19 官方文档核对：Vercel 支持 Node 22；`hkg1` 对应香港；Fluid Compute 下 Hobby 最大函数时长为 300 秒，因此文档层面可容纳本项目 75 秒配置。**实际套餐、Fluid 状态、区域、最终函数时限及 DeepSeek 网络可达性仍待账户和生产证据确认。** 依据：[Node 版本](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)、[函数时限](https://vercel.com/docs/functions/configuring-functions/duration)、[区域](https://vercel.com/docs/regions)。

应用 provider 请求预算为 60 秒，浏览器等待 65 秒，验收 harness 等待 67 秒；75 秒平台时限为请求处理留出余量。这些是技术预算，不是学习计时限制。保持动态 Next.js Route Handler，不使用静态导出，也不将 provider 调用移至浏览器。

## 3. 只在 Vercel 设置生产密钥

打开 **Vercel → 当前 Project → Settings → Environment Variables**，由用户直接录入：

| 变量名 | 是否必需 | 设置要求 |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | 是 | 服务端 Secret；至少选择 Production 环境 |
| `DEEPSEEK_MODEL` | 否 | 可不设置；设置时必须为 `deepseek-flash` |

不得使用 `NEXT_PUBLIC_` 前缀。不要在聊天中发送 key，也不要把它写入源代码、文档、截图或测试输出。宿主环境没有 key 不妨碍远端生产验收；生产 harness 使用远端应用，不需要把生产 key 下载到本地。Preview 如需 AI 应独立选择其变量环境，不默认将 Production key 扩散至所有环境。

环境变量变更只影响新部署；保存后发布或重新部署本仓库当前候选版。不要以旧 deployment 已存在为由假定新变量生效。[Vercel 环境变量文档](https://vercel.com/docs/environment-variables)

## 4. 发布与匿名访问

1. 核对项目身份，将有效 P07 修改以 `feat: prepare P07 release and production QA` 正常提交并 push `origin main`，预期触发已连接项目的 Vercel Git deployment。本轮完成 push/status/log 核查后停止。后续从实际部署记录核对来源 revision 与该 release commit 一致，记录 Ready 状态、deployment ID、构建结果和时间；不再使用 P06 baseline `e886678` 冒充本次 P07 来源。本地 regression 不能替代生产验收。
2. 从项目 Domains / Production deployment 记录获取**稳定的 Production origin**，不要根据项目名猜测 URL。后续所有验收使用同一 `https://host`。
3. 用没有 Vercel 登录 cookie、访问绕过 cookie、共享访问 token 或 bypass header 的全新浏览器 profile 打开稳定 Production URL，检查 Dashboard、三课、Activity 和 Progress。仅首页 HTTP 200 不能证明 AC-001。
4. 保留访问保护的实际范围。官方 Standard Protection 可保护 deployment/Preview URL，同时让 Production domain 公开；不必为匿名 Production 访问关闭全部保护。以本项目实际配置和无登录实测为准。[Deployment Protection 文档](https://vercel.com/docs/deployment-protection)
5. 若稳定 Production domain 仍要求登录，记录访问结果，并由用户在本项目 Settings → Deployment Protection 核对 Production domain 的保护范围后重新验证。此前自动关闭 SSO / protection 的操作曾被自动审批拒绝；不能用另一条命令、token 或 header 绕过该拒绝，也不能把绕过后的访问算作匿名通过。

匿名可访问验证与持久化验证可以共用一个干净的**普通持久 profile**；不要用关闭即清空数据的无痕会话证明关闭恢复。Preview、deployment URL、Production alias、不同协议或域名是不同 origin，localStorage 不会自动迁移。

## 5. 生产验收与证据

使用 [FINAL_USER_GATE.md](FINAL_USER_GATE.md) 选择一次人工计时主流程，或一次有五次请求上限的生产 smoke；不要同时重复运行两个付费流程。生产命令为：

```powershell
npm run test:production -- --url https://YOUR-VERIFIED-PRODUCTION-HOST
```

将占位 host 替换为已核实的 origin，不附加路径、query、hash、凭证或访问绕过参数。脚本最多发送 2 Tutor + 2 Client（开场及问题）+ 1 Feedback 共五次真实请求，第一次失败即停止，没有自动 Retry。脚本不构建/启动本地服务、不读取本地 `.env`、不直接调用 provider。输出唯一目录 `test-results/live/production-<timestamp>-<id>/` 下的 JSON/TXT、截图和持久 profile；不要删除该目录后重跑以隐藏失败。

`npm run test:production -- --offline` 仅验证纯请求 guard，零网络/零 AI 请求；其 `OFFLINE_PREFLIGHT_PASS_PRODUCTION_UNTESTED` 不是生产验收。自动报告固定保留人工语义、视觉和真实初学者计时 PENDING。

从实际 deployment record 记录 deployment ID；`x-vercel-id` 不是 deployment ID。按 API 顶层 `requestId` 对照 Vercel `ai_route` 日志，再用 `providerRequestId` 对照 `ai_request` 的 provider/model/outcome。provider ID 不可用时写 `unavailable`，保留相同时间/操作的可查日志；仅有本地固定模型常量不能证明远端实际版本。保留安全 ID、耗时、结果和日志位置即可，不导出 Secret、授权头或原始 provider payload。

| 最终需补充字段 | 当前结果 |
| --- | --- |
| Deployment ID、source revision / 候选版标识、Ready 时间 | PENDING |
| 稳定 Production origin、匿名访问时间/浏览器/结果 | PENDING |
| 实际 Node / region / duration / Fluid 设置 | PENDING |
| 三个真实 AI 路径及 app/provider IDs、关联日志 | PENDING |
| 同 origin 刷新与真实关闭/重开五类状态 | PENDING |
| 人工语义审核、初学者计时、AC-030 视觉审核 | PENDING |

## 6. 预算与回退

公开匿名 API 没有数据库或全局硬限流承诺。现有输入/输出上限、发送中禁重复、无自动重试只能限制单次操作；验收五次上限也不是全站费用上限。用户应在 provider 账户核对余额/可用预算提醒，在 Vercel 核对当前套餐可用的费用与访问控制；不为此增加 Auth、Database 或其他排除能力。

若首次发布失败，保留失败部署和日志，修正后另建部署；不得指向旧 Flask 项目冒充回退。若已有本项目已核实的良好 Production deployment，可在 Vercel deployment 记录中将 Production alias 回退至该版本，记录新旧 deployment IDs，并复核相同 origin 的恢复；当前尚无已确认的回退目标。回退不清空用户 localStorage，不降低 snapshot 校验，也不承诺旧部署已采用后加的环境变量。

普通 E2E 输出必须隔离在 `test-results/e2e` 或其他安全子目录，保留 launcher 的危险 output-dir guard。P06 丢失的 25 份旧 live 文件未恢复；历史结论及事件记录见 [VERIFICATION.md](VERIFICATION.md)，不得将新报告伪称为原始恢复文件。
