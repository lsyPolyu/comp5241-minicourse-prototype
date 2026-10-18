# Course Content Plan — Requirement Clarification

- 状态：Technical Planning outline，待用户审核；没有实现课程页面或编写长篇教材。
- 追溯：SPEC §7、§9，FR-002–FR-005、FR-008；AC-003–AC-006、AC-010。
- 固定层级：Course `requirement-clarification` → Module `clarification-basics` → 3 Lessons + Activity `client-interview`。
- UI / 教学 / AI 输出：简明英文；本文为中文规划说明。术语首次出现用简单英文解释，无 i18n。

## 1. 内容原则与来源

每课一个主要学习目标、少量概念、一段具体软件例子和一个连接 Activity 的提示；目标约 140–180 个英文正文词。词数是编辑预算，不是学生完成门槛。以短标题、短句、概念 / 例子块组织，不扩展为完整需求工程课程。

课程正文作为版本化静态 TypeScript 数据，在 `src/content/courses/requirement-clarification/` 的三个独立 Lesson 文件中维护，由 registry 引用。内容需与 Tutor 的 objective / terms / examples / allowedTopics 一起评审；不动态生成 Lesson，不加 CMS、PDF 或 RAG。

教学例子统一使用**校园失物招领工具**，避免提前透露 Activity 的“社团报名”隐藏事实。Lesson 可以教提问维度与八栏组织，但不展示当前 Activity 的标准八栏答案或自动代填。学生无需会编程。

## 2. Lesson 1 — What is Requirement Clarification?

- **ID：** `why-clarify`；标题保留 SPEC 暂定标题作为本轮最终建议。
- **Learning objective：** 能说明为什么模糊的软件请求不足以直接开发，并区分表面功能请求、真实问题与尚未确认的假设。
- **Key concepts：** requirement 是软件需要支持的事情；clarification 是把模糊或缺失信息问清；user goal 是人想达到的结果，不等于某个界面功能。
- **Content outline：** 从一句模糊请求入手 → 指出至少两个不清楚点 → 用一个“为什么”问题发现目标 → 对比澄清前后的一句话需求。
- **Example：** “We need a better lost-and-found app.” → “Who loses things, and what is difficult now?” → 学生难以找到失物是否已上交，目标是尽快找到正确领取地点；不能直接假设需要地图 / AI 图片识别。
- **Approximate reading time：** 1–1.25 分钟。
- **Connection to Activity：** 面对 Maya 的开场，先理解问题和用户目标，避免立即提出“做一个漂亮网站”的方案。
- **AI Tutor context requirements：** 包含 requirement / clarification / goal 的简单定义、失物招领例子、请求与目标的对比；允许解释、简化与相关追问；不知道 Activity hidden facts，不能替学生写结论。

## 3. Lesson 2 — What Should You Ask?

- **ID：** `what-to-ask`。
- **Learning objective：** 能围绕用户、目标、核心需求、约束与范围提出有目的的问题，并对不完整答案追问。
- **Key concepts：** target user；goal；core requirement；constraint（例如时间、设备）；scope / out of scope；开放问题与具体追问。术语用一行日常语言解释。
- **Content outline：** 五个提问方向各一个短示例 → 示范一次从“方便一点”到具体问题的追问 → 提醒不必按固定题单逐项照念。
- **Example：** 失物招领客户说“越简单越好”。学生追问“Who needs to update the item’s location?”、“Will students mainly use phones?”、“What can wait until later?”，而非只问喜欢什么颜色。
- **Approximate reading time：** 1–1.25 分钟。
- **Connection to Activity：** 学生自行选择下一问，发现报名过程中的信息缺口；没有必须提问次数，也没有“问完清单才能提交”的门槛。
- **AI Tutor context requirements：** 当前课五个方向、问题意图和一个追问示例；可帮助理解“为什么问约束”，但不泄露客户答案、不替学生完成整段访谈。可给跨主题示例，不能扮演 Maya。

## 4. Lesson 3 — From Conversation to Structured Requirements

- **ID：** `structure-requirements`。
- **Learning objective：** 能将对话中确认的信息自行整理成八栏，区分需求优先级，写出可观察的验收条件和范围边界。
- **Key concepts：** Must / Should / Could 是必要性顺序；user flow 是完成任务的步骤；acceptance criterion 是判断需求实现的可观察条件；User Story 是描述“谁希望做什么、为什么”的简短句式，本轮不要求额外 User Story 提交。
- **Content outline：** 八栏各一行说明 → 用少量失物招领信息示范如何从对话提取 → 对比模糊与可验证条件 → 提醒总结只写已确认信息，空白由反馈指出。
- **Example：** “Make it easy to find an item”太模糊；“When a student searches for an item category, matching items show the collection location”可以检查。示例步骤为选择类别 → 查看物品 → 找到领取地点；可选装饰不应占用核心流程优先级。
- **Approximate reading time：** 1.25–1.5 分钟。
- **Connection to Activity：** 八栏表单有同样的标签和简短提示，学生据采访自行填写；不自动带入案例答案，不用无结构长文本替代。
- **AI Tutor context requirements：** 八字段意义、优先级的简单区别、可验证条件示例、User Story 释义；可解释写法，不能读取本次 summary draft 并完整代写。建议学生回看自己的 Client 对话。

固定八个标签：Target User、User Goal、Core Requirements、Constraints、Must / Should / Could、User Flow、Acceptance Criteria、Out of Scope。提示是“Write what you learned from the client”，不预填正确答案。每栏键存在但可留空，允许学生凭不完整理解提交后得到 Missing / Partial 反馈。

## 5. Demo Course 时间预算

| 环节 | 目标时间 | 编排方式 |
| --- | --- | --- |
| 入口 / Course 结构 | 0.25–0.5 分钟 | 简洁简介与唯一 Module，快速识别三课 + 一活动。 |
| 三个 Lesson 与显式完成操作 | 3.25–4 分钟 | 短正文、术语解释、具体例子；Complete Lesson 由学生点击。 |
| 按需 Tutor | 0–0.75 分钟 | 可选一次简短解释 / 追问，Tutor 不是完成门槛。 |
| AI Client 访谈 | 3.5–4.5 分钟 | 有目的的复合问题可披露两组相关信息，通常少量来回即可覆盖核心；不强制次数。 |
| 八栏总结 | 2.5–3.5 分钟 | 用简短句或条目，不要求长文或固定字数。 |
| Feedback / 下一步 / Progress | 0.75–1.25 分钟 | 九项等级清楚排列，突出当前建议。 |
| **整轮** | **约 10.25–14.5 分钟** | 包含正常 AI 等待的目标预算，仍需实际试学验证。 |

时间是内容组织目标，不是倒计时、限制学生追问或过时失败。AI 网络延迟、初学者阅读与打字速度可能延长体验；T036 必须记录实际完整用时。如果超出，先删重复说明、缩短示例、优化提示，不删 Lesson / 栏目、不代写学生成果、不改变完成规则。

## 6. 内容验收与实现交接

T007 完成最终短正文时核对：三个教学重点都覆盖；所有首次出现术语有简单解释；例子不是 Activity 标准答案；内容和 Tutor context 相符；共 3 Lessons、不生成第四课；末尾行动清楚但不自动完成。

T015 使用真实 Tutor 请求解释 / 举例 / 简化与追问，验证围绕当前 Lesson；T036 走完包括真实 Client、八栏总结、真实 Feedback 的完整体验，并记录用时；用户在 AC-030 对视觉与可理解性作最终审核。

本轮不增加 Optional Learn more、Notes、多案例、长视频或动态课程。未来主题通过 registry 加数据，但这些内容不计入本次学习时长，也不能成为推荐目标。
