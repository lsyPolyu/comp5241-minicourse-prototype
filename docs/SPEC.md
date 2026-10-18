# COMP5241 Mini-course Learning Platform 个人 Prototype Specification

- 状态：Specification 待用户审核，尚未进入 Technical Plan。
- 日期：2026 年 10 月 17 日。
- 交付节点：2026 年 10 月 19 日前完成个人 Prototype 与网站部署，供当天团队会议展示。
- 本文定义：产品要提供什么、为何提供，以及如何判断交付满足需求。

### 依据与追溯约定

| 来源 | 在本 Specification 中的作用 |
| --- | --- |
| [REQUIREMENTS_DISCOVERY.md](REQUIREMENTS_DISCOVERY.md)，下文简称 RD | 已冻结的个人 Prototype 产品范围、优先级与完成规则的主要 source of truth；本文将其转换为可验证要求。 |
| [老师正式项目要求](project_overview_中文翻译.md) | 检查方向是否符合 GenAI 学习平台、互动活动、个性化学习及最终团队整合目标，不将全部 Group Project 能力提前列为个人 Must。 |
| [10 月 17 日会议纪要](10.17会议纪要.docx) | 说明独立原型、部署展示、择优整合及亲和 UI 的协作背景；个人交付优先级按 RD 执行。 |

FR 为稳定的 Functional Requirement ID；AC 为稳定的 Acceptance Criterion ID。后续新增 ID 不重用已有编号。Must 是本轮必需交付；Should 受 Student Must 全部通过的前置条件约束；Could 不计入本轮必需验收。第 6 节记录 FR 与 RD 的对应关系，第 16 节记录 AC 与 FR、原验收条目的对应关系。

## 1. Product Overview

本产品是 **GenAI-powered Mini-course Learning Platform Prototype**。它让学生通过短 Lesson、随学随问的 AI Tutor、互动练习、AI Feedback 和表现驱动的下一步推荐，完成一次可恢复进度的学习体验。个人原型用完整 Student 流程验证产品方向，并为最终团队 App 提供可展示、可整合的探索成果。

| 层面 | 产品含义 | 本轮交付边界 |
| --- | --- | --- |
| Platform level | 承载不同主题 Mini-course 的学习平台，提供课程入口、学习层级、Tutor、活动、反馈、推荐和进度。 | 展示多个课程入口；只有一门 Demo Course 必须完整实现，其余入口可标为 Coming Soon。 |
| Demo course level | 平台中的一门 **Requirement Clarification** 课程。 | 固定 1 Course、1 Module、3 Lessons、1 AI Client Role-play Activity，目标体验约 10–15 分钟。 |

Requirement Clarification 用于证明平台能力，不代表平台只能教授需求澄清。未来主题入口的存在不承诺相应课程正文或活动已经实现，也不允许将其作为推荐目标。

## 2. Goals

1. **验证完整 Student 闭环。** 学生无需账户，即可从课程入口完成学习、练习、反馈、下一步行动和进度查看。
2. **验证初学者能够参与真实的需求澄清练习。** 学生通过提问发现模糊请求中的目标、约束和信息缺口，并自行整理八栏目需求总结。
3. **验证 GenAI 对学习过程的实际帮助。** Tutor 负责理解，AI Client 负责练习，Feedback 负责评价；三个正常路径都真实调用 AI。
4. **验证推荐具有依据且可执行。** 推荐说明刚才表现中的优势、遗漏或薄弱点，并进入已经实现的复习、重练或完成结果。
5. **验证可展示的体验质量。** 原型可部署、桌面端完整可用、响应式且经过打磨；同一浏览器可以恢复学习状态，AI 失败后可保留成果并重试。

上述目标分别通过第 16 节的闭环、学习成果、真实 AI、推荐、恢复与交付验收验证，不以新增教师管理、课程数量或复杂 AI 架构证明完成。

## 3. Non-goals

以下严格继承 RD §7，不构成本次个人 Prototype 的交付承诺：

| 类别 | 排除范围 |
| --- | --- |
| 账户与数据 | 注册、登录、Authentication、多用户账户系统、跨设备同步、云端数据库持久化。 |
| 文档与知识扩展 | PDF Upload、document ingestion、相关 RAG、跨课程搜索、长期 Memory、通用知识问答、复杂 Agent / Multi-Agent。 |
| 长期个性化 | 长期 Learner Profile、跨课程推荐、复杂推荐算法、Machine Learning recommendation system；按表现自动重排整门课程、动态生成整门新课或长期路径。轻量 Teacher 主题生成仅按第 17 节 Should 处理。 |
| 完整教师工作流 | 教师账户、学生导入、班级管理、真实学生历史数据查看、学习行为分析、完整课程编辑器。 |
| 课程扩张 | 大量 Lesson、长视频、完整 Requirements Engineering syllabus、超过 20 分钟的学习流程；将任意主题输入设为核心 Activity 的必需步骤。 |
| 产出扩张 | 以完全自由形式的长篇需求文档替代主要提交；自动生成完整 PRD、UML / Use Case Diagram、Formal SRS。 |
| AI 运维扩张 | 自动切换模型供应商、Offline AI、预生成假 AI 回答、完整 fallback engine、自动故障恢复系统。 |

RD §6 的 Could 保持可选：Optional Learn more、Optional Notes、明确标注 Example / Demo Mode 的备用演示、多案例或动态案例。这些不得影响 Student Must；Example / Demo Mode 不得冒充真实 AI 或用作正常路径通过验收的证据。本轮仅承诺一个固定案例。会议中的游戏化、排行榜建议未被确认为本次交付，不增加其优先级。

## 4. Personas

| Persona | 背景与需要 | 本轮支持 |
| --- | --- | --- |
| Primary：Student beginner | 大学生初学者，包括非 CS 学生；未系统学习 Requirements Engineering / Requirement Analysis，不要求编程基础。需要理解概念、知道如何提问，并将访谈整理成可执行需求。 | 完整 Student Must。首次出现的专业术语需有简单解释，概念配具体软件例子；Tutor 可进一步简化，Activity 保留真实项目挑战。 |
| Secondary：Teacher | 希望把主题、受众和教学目标转换为可预览的 Mini-course，判断 AI 是否能帮助备课。 | 仅第 17 节有前置条件的轻量 Should；不承诺教师管理系统或真实学生数据。 |

## 5. Core User Journey

**Dashboard → Course → Module → Lesson → AI Tutor（按需）→ Interactive Activity → Structured Requirement Summary → AI Feedback → Personalized Recommendation → Progress / Course Complete。**

| 步骤 | 学生动作 | 可观察结果 |
| --- | --- | --- |
| 1. Dashboard | 浏览多个课程入口，选择可用的 Requirement Clarification。 | 可区分可学习课程与 Coming Soon，不需要注册或登录。 |
| 2. Course / Module | 查看课程、唯一主要 Module 与 3 个短 Lesson，进入学习。 | 能识别课程结构、当前内容和学习进度。 |
| 3. Lesson | 阅读概念和例子，按需向 Tutor 请求解释、简化或追问。 | Tutor 围绕当前 Lesson 回答；只有点击 Complete Lesson 才记录该 Lesson 完成。Tutor 使用不是完成门槛。 |
| 4. Interactive Activity | 阅读 AI Client 的模糊请求，主动询问用户、目标、需求、约束和范围。 | AI 根据问题逐步补充固定案例信息，已有对话可供整理需求。 |
| 5. Structured Requirement Summary | 根据访谈自行填写并提交固定八栏目总结。 | 保留学生成果，进入 Feedback 请求；提交本身不表示 Activity 已完成。 |
| 6. AI Feedback | 阅读对提问过程和总结的评价。 | 成功获得各维度等级及三类反馈内容后，Activity 才完成；失败保留成果并允许 Retry。 |
| 7. Personalized Recommendation | 查看表现依据和理由，执行建议。 | 进入对应已实现 Lesson、Retry Activity，或在满足完成条件后查看 Course Complete、最终总结或重新练习。 |
| 8. Progress / 恢复 | 查看已完成内容，之后刷新或关闭并重新打开同一浏览器。 | 状态与实际完成动作一致，恢复当前 Lesson 及最近一次学习结果。 |

这是演示用主路径，不增设必须用过 Tutor、必须提问固定次数或必须得分达标等隐藏完成门槛。10 月 19 日展示可以选取关键步骤，不要求现场播放完整 10–15 分钟体验。

## 6. Functional Requirements

下表中，FR-001 至 FR-023 均为 Student Must；FR-024 仅为 Teacher Should。表内引用的后文规则属于对应 FR 的验收定义。

| ID | 能力 | 可验证的产品要求 | 来源 |
| --- | --- | --- | --- |
| FR-001 | Course Dashboard | 展示多个 Mini-course 入口，包含完整可用的 Demo Course；其他课程可为 Coming Soon，状态清楚且不使学生误认为可完成学习。 | RD §1、§4.1 多课程结构 |
| FR-002 | Course / Module / Lesson | 提供 Course → Module → Lesson 层级；完整课程严格保持 1 Course、1 主要 Module、3 Lessons、1 核心 Activity。 | RD §4.1、§4.2 课程体量 |
| FR-003 | 初学者课程内容 | 提供第 7 节规定的三个教学重点、术语解释与软件例子；完整学习内容与活动按约 10–15 分钟目标组织。 | RD §2、§3、§4.2 |
| FR-004 | Lesson completion | 只有学生明确点击对应 Lesson 的 Complete Lesson，才记录该 Lesson 完成；阅读、导航、Tutor 回复或 Activity 表现不能代替该动作。 | RD §4.1 完成规则 |
| FR-005 | AI Tutor | 在阅读 Lesson 时提供独立轻量 Tutor；正常路径真实调用 AI，基于当前 Lesson 解释概念、举例、简化并回答相关追问。 | RD §4.1 Tutor、§4.3 |
| FR-006 | 固定 Scenario | 提供一个预先设计、可重复使用的 AI Client 案例，具备第 8 节的全部事实与评价依据，不要求学生先输入任意主题。 | RD §4.2 固定 Scenario |
| FR-007 | AI Client Role-play | 正常路径真实调用 AI 扮演 Client / Product Manager，先提出模糊请求，再按学生问题逐步披露相关信息，遵守固定案例事实。 | RD §4.2、§4.3 |
| FR-008 | Structured Requirement Summary | 允许学生根据访谈自行填写并提交第 9 节固定八栏目总结，不以单个无结构长文本或 AI 代写成果替代。 | RD §4.2 学习成果 |
| FR-009 | Feedback 评价依据 | 正常路径真实调用 AI，结合固定案例、学生实际提问对话与提交总结，同时评价提问质量和总结质量。 | RD §4.2 Feedback、§4.3 |
| FR-010 | Feedback 等级 | 按第 10 节对提问过程及八类总结维度给出 Strong / Partial / Missing；不设计总数值分数、及格线或由此增加完成门槛。 | RD §4.2 Feedback、§4.1 完成规则；本轮明确不设计总分 |
| FR-011 | 可行动 Feedback | 明确提供 What you did well、What to improve、Recommended next action，并以实际表现说明优势、遗漏和建议。 | RD §4.2 Feedback |
| FR-012 | Personalized Recommendation | 严格按第 11 节三种已确认结果，根据最近 Activity 表现提出建议并解释原因；评价与完成状态分别处理。 | RD §4.1 推荐 |
| FR-013 | 推荐目标可执行 | 学生可以点击建议进入对应已实现 Lesson、重新练习或查看最终总结；任何推荐都不得指向 Coming Soon。 | RD §4.1 推荐、§9.9 |
| FR-014 | Activity completion | 仅当结构化总结已提交且成功收到 AI Feedback，才记录该 Activity 完成；等待或失败不能提前完成。 | RD §4.1 完成规则 |
| FR-015 | Course completion | 仅当 3 个 Lesson 与核心 Activity 全部完成，才记录 Course 完成；不增加表现等级或总分条件。 | RD §4.1 完成规则 |
| FR-016 | Progress | 支持查看 Course / Module / Lesson 的学习进度和 Activity 完成状态；进度必须与实际完成内容及第 12 节规则一致。 | RD §3、§4.1 Progress |
| FR-017 | 本地状态恢复 | 按第 13 节，在同一浏览器刷新、关闭并重新打开后恢复进度、当前 Lesson、最近一次 Activity 完成状态、Feedback 和 Recommendation。 | RD §4.1 本地持久化、§9.13 |
| FR-018 | AI failure handling | Tutor、Role-play、Feedback 失败均保留已有输入、相关对话、总结及学习状态，显示友好错误提示且不暴露技术错误栈。 | RD §4.3 |
| FR-019 | 请求 Retry | 三种 AI 失败均提供 Retry；使用保留内容重试对应失败请求，不要求学生重新输入已有内容，不将失败当作成功。 | RD §4.3 |
| FR-020 | Retry Activity | 提供重新练习核心 Activity 的可用路径，供有遗漏或希望再练的学生使用；仍使用同一个固定案例和八栏目提交、Feedback 流程。 | RD §4.1 推荐、§9.6、§9.9 |
| FR-021 | Responsive learning UI | 桌面端覆盖全部 Student Must；窗口尺寸变化时保持学习内容可读、核心操作可用，符合第 15 节。 | RD §4.1 UI、§9.2 |
| FR-022 | Polished learning UX | 当前内容、任务、反馈与下一步行动易识别；体验清晰、统一、亲和、适度活泼，避免企业 SaaS dashboard 和通用 AI 模板感。 | RD §4.1 UI；会议 §1、§4 |
| FR-023 | 部署与访问 | 网站可运行，于 2026 年 10 月 19 日前完成部署；通过链接即可体验完整 Student Must，无需注册或登录。 | RD §4.1 可运行部署、§9.1 |
| FR-024 | Teacher Demo（Should） | 仅在全部 Student Must 验收通过后，才可实现 Topic / Audience / Difficulty / Learning Goal → AI Generate Mini-course → Preview 的轻量流程。 | RD §5、§9 Should 边界 |

## 7. Demo Course Specification

### 7.1 定位与固定体量

课程为 **Requirement Clarification**，面向需求工程初学者。学习目标是让学生第一次完整经历“模糊请求 → 有目的的提问 → 清晰、可执行的需求总结”，不培养完整 Requirements Engineer。

课程固定为 1 Course、1 主要 Module、3 短 Lessons、1 AI Client Role-play Activity。三个 Lesson 标题可在后续定稿，数量与教学重点保持不变。

| Lesson | 暂定标题 | 必须覆盖的教学重点 | 与活动的关系 |
| --- | --- | --- | --- |
| Lesson 1 | What is Requirement Clarification? | 用简单解释与软件例子说明模糊需求为什么需要澄清，区分表面请求与需要确认的真实目标。 | 帮助学生理解提问的目的，识别未经确认的假设。 |
| Lesson 2 | What Should You Ask? | 围绕用户、目标、核心需求、约束与范围主动提问，识别尚未获得的信息。 | 支持 AI Client 访谈中的问题选择与追问。 |
| Lesson 3 | From Conversation to Structured Requirements | 将对话整理为八栏目需求，表达优先级、流程、可验证验收条件及范围外事项。 | 支持学生自己完成结构化总结，而非复制 Client 回答。 |

### 7.2 体验与成果边界

完整体验约 10–15 分钟，包含阅读、按需 Tutor、Role-play、结构化整理、Feedback 和 Recommendation。此为内容与活动的组织目标，不设置倒计时、超时失败或强迫个人在该时间内完成。验收以完整试学记录检查内容体量，不把每位学生的实际用时当作完成条件。

课程首次出现 User Story、Acceptance Criteria、Scope 等专业术语时需简单解释，不假设学生已有软件工程基础。活动仍保留目标、约束、优先级及隐藏信息等实践挑战；最终成果固定为第 9 节八栏目总结。课程正文、最终标题及具体案例故事尚未定稿，本节不代写完整教学内容。

## 8. AI Client Scenario Requirements

### 8.1 案例内容契约

必须预先准备一个固定案例，并使下列内容彼此一致，作为 Client 行为与 Feedback 评价的统一依据。本节只定义案例必须包含什么，不选择最终故事；考试复习软件仍只是 RD 中的示例。

| 必需内容 | 要达到的明确程度 |
| --- | --- |
| Client background | Client 的角色、业务背景及为何提出请求。 |
| Initial vague request | 学生开场可见的模糊请求，保留值得澄清的信息缺口。 |
| Target users | 实际服务对象及必要的用户背景，便于判断学生是否识别正确。 |
| Real goal | 希望解决的真实问题与目标，不能仅列功能名称。 |
| Core requirements | 支撑目标的关键需求，以及判断总结完整性的依据。 |
| Constraints | 影响需求或交付范围的约束。 |
| Hidden information | 不在开场完整展示的事实，以及哪些相关问题可以引出这些信息。 |
| Must / Should / Could | 案例内需求优先级及其理由，与平台功能优先级区分。 |
| Acceptance criteria | 可验证需求是否满足的条件，作为反馈参照。 |
| Out of scope | 明确排除的事项及范围边界。 |

### 8.2 AI Client 行为

1. 开场以 Client / Product Manager 身份提出 Initial vague request，不能一次展示全部隐藏事实、完整答案或评价参照。
2. 学生主动提问后，针对问题逐步披露相关事实；询问约束时补充相关约束，询问用户时说明相关用户信息，不因一个笼统问题自动倾倒所有隐藏信息。
3. 后续回答与固定案例及已经披露的事实保持一致，不擅自更换用户、目标、优先级或范围，使学生能够基于稳定信息整理总结。
4. 学生可以继续追问；Client 不代替学生完成八栏目总结。Tutor 的讲解职责与 Client 的扮演职责保持可辨认。
5. 同一个案例可重新练习；措辞无需逐字相同，但核心事实、隐藏信息边界与评价依据一致。

## 9. Structured Submission

主要提交固定为以下八栏目，由学生依据刚才的访谈自行整理。每一栏目必须可识别、可填写并随提交一同用于 Feedback，不能以无结构长文本替换。

| 栏目 | 学生需要表达的内容 | 对应评价关注点 |
| --- | --- | --- |
| Target User | 软件服务谁，其关键背景是什么。 | 用户识别是否准确。 |
| User Goal | 用户要解决的问题与希望达到的结果。 | 目标是否明确。 |
| Core Requirements | 支撑目标的主要需求。 | 关键需求是否完整、符合已澄清事实。 |
| Constraints | 影响方案与范围的限制。 | 是否识别相关约束。 |
| Must / Should / Could | 对案例需求做优先级划分。 | 优先级是否合理。 |
| User Flow | 用户如何完成核心任务。 | 流程是否清楚、连贯。 |
| Acceptance Criteria | 用什么可观察条件判断需求实现。 | 条件是否可以验证。 |
| Out of Scope | 本次明确不包含什么。 | 是否正确表达范围边界。 |

本节不增加固定字数、固定提问次数或评分门槛。内容遗漏由 Feedback 的 Partial / Missing 反映。Optional Notes 仍仅为 Could，不替代任何固定栏目。提交后等待 Feedback 的过程不改变既定完成规则。

## 10. AI Feedback Requirements

### 10.1 评价输入与维度

Feedback 必须结合固定案例事实、学生实际 Role-play 提问对话及本次八栏目总结，覆盖两个评价对象：

- **Student's questioning process：** 问题是否有目的地澄清用户、目标、需求、约束与范围，是否对模糊回答进行必要追问，是否仍有关键问题没有提出。
- **Structured summary：** 分别检查 Target User、User Goal、Core Requirements、Constraints、Must / Should / Could、User Flow、Acceptance Criteria、Out of Scope，评价重点见第 9 节。

提问过程与总结需分别有可辨认的评价，不能仅因最终总结写得完整就认定提问充分，也不能只评价对话而忽略学生提交成果。评价说明应引用或概括实际问题、总结内容或遗漏事实；不得把学生未问、未写的内容当作已完成，也不得为填补案例空白编造要求。

### 10.2 等级含义

各评价维度采用以下三个可理解的等级，不设计总数值分数或加权总分：

| 等级 | 可观察含义 |
| --- | --- |
| Strong | 该维度的关键内容准确、清晰，关键点已覆盖，未见影响该维度的实质遗漏。 |
| Partial | 已有相关提问或总结，但存在不完整、含糊或不准确之处，需要具体改进。 |
| Missing | 缺乏该维度的相关提问或有效总结，关键内容未被识别。 |

固定案例的具体关键事实和评价参照在后续内容定稿中落实；本轮不指定模型、Prompt、计算公式或数值阈值。

### 10.3 必需反馈内容

| 内容 | 输出要求 |
| --- | --- |
| What you did well | 指出学生实际做对的内容并给出依据；没有足够证据时如实说明，不虚构优势。 |
| What to improve | 指出遗漏、含糊或错误，以及可以如何改进，避免只有泛泛鼓励。 |
| Recommended next action | 提供第 11 节允许的下一步行动及表现依据，与 Personalized Recommendation 一致。 |

上述三类内容及维度等级均是可展示、可阅读的反馈结果。反馈成功必须得到满足本节要求的结果；错误、空结果或未形成有效评价的响应不能仅因请求结束就算成功。

## 11. Personalized Recommendation Rules

推荐基于刚刚的 Activity Result / AI Feedback，识别优势、遗漏或明显薄弱点，给出可执行目标并解释原因，不随机选择课程。

| 已确认的表现分支 | 推荐结果 | 可执行行为与限制 |
| --- | --- | --- |
| 有明显薄弱项 | Corresponding implemented Lesson | 指出薄弱点与关联知识，进入 Lesson 1、2 或 3 中对应的已实现内容。 |
| 整体掌握但仍有遗漏 | Retry Activity | 说明需要改进的遗漏，进入同一核心 Activity 重新练习并获得新反馈。 |
| 表现良好，并满足 Course complete 条件 | Course Complete | 呈现完成结果，允许查看最终总结或重新练习。 |

明显薄弱项必须关联教学内容：对澄清目的与真实目标的理解关联 Lesson 1；主动提问和发现信息缺口关联 Lesson 2；组织八栏目成果、表达优先级、流程、验收条件与范围关联 Lesson 3。推荐应说明为何选择该 Lesson，而非仅展示课程名称。多项薄弱点的具体选择方式属于后续推荐实现细则，不增加新结果分支。

**评价不替代完成规则：**

- 表现良好但仍有未点击 Complete Lesson 的 Lesson 时，不得提前记录或呈现已完成的 Course Complete；应如实显示未完成项，仍可通过现有课程入口继续学习。这是完成前置条件的处理，不是第四种表现推荐分支。
- 即使评价存在 Partial / Missing，只要 3 个 Lesson 与 Activity 已按第 12 节完成，Course 完成状态也应成立；推荐仍可引导复习或重练。完成状态不等于能力认证。
- 不得以获得某一等级、总分、使用 Tutor 或完成推荐动作作为额外 Course 完成条件。
- 所有建议目标都必须已实现并可进入，不能推荐 Coming Soon、未实现课程或额外活动。

## 12. Progress Rules

完成状态严格采用以下规则，不做基于时长、滚动、回答质量或评分的推断：

| 对象 | 完成条件 | 不得视为完成的情况 |
| --- | --- | --- |
| Lesson | 学生明确点击该 Lesson 的 **Complete Lesson**。 | 仅打开、阅读、离开页面、使用 Tutor 或取得好评。 |
| Activity | **结构化总结已提交 AND AI Feedback 成功收到。** | 仅完成对话、仅填写或提交总结、Feedback 等待中、失败或无有效结果。 |
| Course | **全部 3 个 Lesson 完成 AND 核心 Activity 完成。** | 缺任一 Lesson 或 Activity；不得另设及格线。 |

Progress 必须显示与实际完成内容一致的 Course / Module / Lesson 进度及 Activity 状态。Module 的具体汇总展示方式、是否显示百分比及权重尚未决定，不得据此改动以上完成条件。

刷新、导航或 AI 失败不得凭空增加完成记录或清除既有学习成果。进入重新练习不能冒充新一次 Activity 已完成，新练习仍要提交总结并成功获得 Feedback；失败时需保留已有学习状态和已获得结果。本轮不要求多次练习的历史列表或跨设备记录。

## 13. Persistence Requirements

持久化的用户可见契约是在**同一浏览器、同一可访问网站**中刷新、关闭网站或浏览器后重新打开，能够继续此前学习。只要求浏览器本地恢复，不依赖账户、云数据库或同步服务。

| 必须恢复的内容 | 恢复后的可观察结果 |
| --- | --- |
| Course / Module / Lesson 已完成进度 | 显示的完成状态与关闭前真实完成动作一致；Progress 与课程内状态一致。 |
| 当前正在学习的 Lesson | 可继续原来正在学习的 Lesson，不必重新寻找进度。 |
| 最近一次 Interactive Activity 的完成状态 | 成功获得 Feedback 才显示完成；等待或失败不被恢复成成功。 |
| 最近一次 AI Feedback | 可再次查看最近已有反馈及其维度等级、优势与改进建议。 |
| 最近一次 Personalized Recommendation | 可再次查看推荐内容、理由并执行相应已实现目标。 |

未产生反馈或推荐时，应体现尚无结果，不补造学习记录。AI 失败时保留已有最近结果，不以失败结果覆盖为成功。

当前输入、Role-play 对话与结构化总结在请求失败后必须保留，见第 14 节；RD 未将未完成草稿、完整对话历史的跨关闭恢复列为独立持久化 Must，本文不追加该承诺。不要求跨浏览器、跨设备或用户主动清除浏览器本地数据后的恢复。

本节不指定具体存储技术、数据结构、存储键或代码实现。

## 14. Error States

必须区分可重试的 AI 失败与学习成果丢失，三种 AI 路径均遵循下表。

| 错误状态 | 必须保留 | 可见提示与 Retry | 完成状态约束 |
| --- | --- | --- | --- |
| AI Tutor request failure | 当前问题、已有 Tutor 对话、当前 Lesson 及已有学习状态；已有活动成果不受影响。 | 友好说明暂时无法回答，提供 Retry，用原问题和上下文继续。 | Tutor 成败不改变 Lesson、Activity 或 Course 完成状态。 |
| Role-play AI failure | 学生当前输入、已经完成的 Client 对话、已有结构化总结及学习状态。 | 友好说明本次 Client 回复失败，提供 Retry，继续同一案例与原对话，不要求从开场重来。 | 不伪造 Client 回复，不丢弃已获得进度。 |
| Feedback generation failure | 已提交八栏目总结、完整已有 Role-play 对话、当前输入、已有进度及最近已有 Feedback / Recommendation。 | 友好说明本次评价失败，提供 Retry，使用同一份提交与对话再次生成反馈，不要求重新访谈或填写。 | 当前请求不触发 Activity 完成；不据失败生成完成结果或新推荐。 |

三类错误都应说明出了什么问题、成果仍保留、可以重试；不直接展示技术错误栈。具体文案后续定稿，不强制采用 RD 示例原文。正常请求等待时应让学生能识别正在等待，不能显示已成功的反馈或完成状态。

**Retry 与 Retry Activity 的区别：** Retry 重试失败的 AI 请求，保留当前工作；Retry Activity 是在已有反馈或完成结果后重新练习。两者都不能通过失败或启动动作提前完成 Activity。本轮不增加自动供应商切换、离线回答或自动故障恢复要求。

## 15. UI / UX Requirements

本节规定体验结果，不决定视觉组件、配色、版式或组件库。

| 要求 | 审核时的可观察依据 |
| --- | --- |
| Learning-focused / clear | 在 Dashboard、Lesson、Activity、Feedback 和 Progress 中，学生能够识别当前内容或任务、自己的状态及下一步操作；学习内容是主要关注对象。 |
| Beginner-friendly | 术语有简单解释，必要处有软件例子；Tutor 与 Client 的用途可辨认，学生知道何处理解知识、何处练习。 |
| Responsive | 桌面端完整完成 Student Must；窗口变窄后正文与表单仍可读，输入、提交、Retry、完成和推荐操作可见、可用，关键内容不被遮挡或截断。 |
| Polished / consistent | 页面之间的文字、状态表达及交互一致；等待、失败、已完成与 Coming Soon 不混淆；不存在阻碍主流程的错位、重叠或无法操作的控件。 |
| Friendly / moderately playful | 表达亲和、适度活泼，降低初学者压力；视觉趣味不遮挡教学内容、不分散核心任务。 |
| 避免模板感 | 人工走查应能看到围绕短课程、澄清练习和反馈组织的内容与行动；整体符合学习平台定位，避免企业运营仪表盘式信息堆积或未经编辑的通用 AI 页面。 |

验收通过完整学习流程走查及窗口缩放检查，结合用户对视觉方向的审核；不以某个具体组件或模板的采用作为通过依据。本轮不规定断点数值、特定设备型号或未经确认的性能指标。

## 16. Acceptance Criteria

AC-001 至 AC-032 为 Student Must 及范围边界验收；AC-033 是 Teacher 开始实现前的门禁检查；AC-034 仅在实现 Should 后验收，不影响 Student Must。以下检查描述产品可观察行为，不指定测试框架或执行命令。

### 16.1 Student Must 与范围边界

| ID | 前提、操作与可验证结果 | 对应 FR | RD §9 原 Student Must 条目 |
| --- | --- | --- | --- |
| AC-001 | 在 2026 年 10 月 19 日前完成部署；以未登录的浏览器通过部署链接进入，可运行并体验完整 Student 流程，无注册或登录前置要求。 | FR-023 | 1 |
| AC-002 | 浏览 Dashboard，可看到多个 Mini-course 入口；完整 Demo Course 可进入，其他 Coming Soon 状态可辨认，不被呈现为已可完整学习。 | FR-001 | 3 |
| AC-003 | 进入完整 Demo Course，可识别 Course → Module → Lesson 层级，确认为 1 Course、1 主要 Module、3 Lessons、1 核心 AI Client Role-play Activity。 | FR-002 | 4 |
| AC-004 | 走查 3 个 Lesson，分别覆盖第 7 节教学重点、术语解释与软件例子；完整试学包含 Tutor、访谈、总结和反馈，记录并审核其体量是否符合约 10–15 分钟目标，不设置限时通过条件。 | FR-003 | 4；另追溯 RD §2–3 |
| AC-005 | 在 Lesson 中分别请求概念解释、例子和更简单的说明，正常路径真实调用 AI，回答与当前 Lesson 知识点相关。 | FR-005 | 5 |
| AC-006 | 对 Tutor 回答进行相关追问，可获得结合当前教学上下文的回答；使用 Tutor 不会替代 Complete Lesson 或切换成 Client Activity。 | FR-005、FR-004 | 5、10 |
| AC-007 | 审核固定 Scenario，可找到第 8.1 节全部十类内容；Client 与 Feedback 使用一致事实依据，案例不要求学生先输入任意主题。 | FR-006 | 6；另追溯 RD §4.2 |
| AC-008 | 开始 Activity，真实 AI 以 Client 身份给出模糊请求，开场未直接展示全部 Hidden information 或八栏目标准答案。 | FR-007 | 6 |
| AC-009 | 分别询问用户、目标、约束等问题，Client 逐步披露对应信息且不矛盾；重新练习同一案例时核心事实与评价参照保持一致。 | FR-006、FR-007 | 6 |
| AC-010 | 学生可自行填写并提交 Target User、User Goal、Core Requirements、Constraints、Must / Should / Could、User Flow、Acceptance Criteria、Out of Scope 八栏目，Feedback 可使用这些内容。 | FR-008 | 7 |
| AC-011 | 以提问存在遗漏、总结存在不准确内容的练习取得真实 AI Feedback，能分别看到提问过程及总结的具体评价，内容对应实际对话、提交与案例参照。 | FR-009 | 8 |
| AC-012 | 查看 Feedback，提问过程及八类总结维度均有 Strong / Partial / Missing 等级与依据；没有总数值分数或及格线。 | FR-010 | 8 |
| AC-013 | Feedback 明确提供 What you did well、What to improve、Recommended next action；说明具体表现与改进，下一步行动和展示的 Recommendation 一致。 | FR-011、FR-012 | 8、9 |
| AC-014 | 对存在明显薄弱项的表现，推荐说明薄弱点与原因，点击后进入对应已实现 Lesson；不同教学薄弱点按第 11 节关联内容。 | FR-012、FR-013 | 9 |
| AC-015 | 对整体掌握但仍有遗漏的表现，推荐说明遗漏并提供可进入的 Retry Activity，不指向 Coming Soon 或未实现内容。 | FR-012、FR-013、FR-020 | 9 |
| AC-016 | 对表现良好且 3 Lessons 与 Activity 均完成的学生，呈现 Course Complete，能够查看最终总结或重新练习；所有推荐目标可用。 | FR-012、FR-013、FR-015、FR-020 | 9 |
| AC-017 | 构造两类状态：表现良好但缺某 Lesson 完成动作时，Course 仍未完成且未完成项可辨认；全部完成但 Feedback 较弱时，Course 完成仍成立且可推荐复习。 | FR-004、FR-012、FR-015、FR-016 | 9、10、12 |
| AC-018 | 打开、阅读 Lesson 或使用 Tutor 后，Lesson 不自动完成；明确点击该 Lesson 的 Complete Lesson 后，只记录对应 Lesson 完成，Progress 同步反映。 | FR-004、FR-016 | 10 |
| AC-019 | 提交总结但 Feedback 等待或失败时，本次 Activity 未完成；同一提交成功收到符合第 10 节要求的 Feedback 后，Activity 才完成。 | FR-014、FR-009、FR-010、FR-011 | 11 |
| AC-020 | 分别检查缺任一 Lesson、缺 Activity、全部四项完成的状态；只有最后一种记录 Course 完成，且不额外要求总分、等级或完成推荐。 | FR-015 | 12 |
| AC-021 | 完成部分 Lesson 及 Activity 后查看课程与 Progress；Course / Module / Lesson 与 Activity 进度均与实际记录一致，不因页面切换增加完成项。 | FR-016 | 12、13 |
| AC-022 | 在有部分学习进度和最近 Feedback / Recommendation 的情况下刷新页面；第 13 节五类状态恢复，当前 Lesson 可继续、推荐仍可执行。 | FR-017 | 13 |
| AC-023 | 关闭并重新打开同一浏览器、访问同一网站；第 13 节五类状态仍恢复，Progress 与关闭前真实完成内容一致。未取得反馈的活动不被恢复为成功。 | FR-017、FR-016 | 13 |
| AC-024 | 使 Tutor 请求失败，检查当前问题、已有对话和学习状态仍在，提示友好且无技术错误栈；Retry 使用原问题及上下文继续，无需重填。 | FR-018、FR-019、FR-005 | 14 |
| AC-025 | 在已有 Role-play 对话及总结内容时使 Client 请求失败；输入、对话、总结和学习状态保留，Retry 可继续同一案例，不强制重新开始访谈。 | FR-018、FR-019、FR-007 | 14 |
| AC-026 | 使 Feedback 生成失败；已提交八栏总结、已有对话和学习状态保留，Activity 不提前完成；Retry 用原内容请求反馈，成功后按规则完成。若已有最近结果，失败不使其丢失。 | FR-018、FR-019、FR-014 | 11、14 |
| AC-027 | 从 Retry Activity 或完成结果的重练入口进入同一固定案例，可重新提问、提交八栏目并获取新 Feedback / Recommendation；启动或失败不冒充新练习已完成。 | FR-020、FR-006、FR-008、FR-014 | 6、9 |
| AC-028 | 在桌面端完成从 Dashboard 到 Lesson / Tutor、Activity、总结、Feedback、推荐、Progress / 完成结果的全部操作，无核心步骤不可用。 | FR-021 | 2、15 |
| AC-029 | 逐步缩窄及恢复浏览器窗口，正文和八栏目仍可读；输入、提交、Complete Lesson、Retry、推荐目标仍可操作，关键内容无遮挡或截断。 | FR-021 | 2 |
| AC-030 | 按第 15 节走查所有主流程页面，当前任务、状态与下一步可辨认，文本与交互一致，无阻断性的重叠错位；用户审核其学习导向、亲和与适度活泼的视觉方向。 | FR-022 | 2 |
| AC-031 | 以新学生完成一次完整主路径：Dashboard → Course → Module → 3 Lessons（按需 Tutor）→ Client 对话 → 八栏目提交 → Feedback → 执行推荐 → Progress / 完成结果，并确认完成条件与推荐分支一致。 | FR-001–FR-023 | 15 |
| AC-032 | 对照第 3 节审核验收范围：Student 流程不依赖已排除能力；正常 Tutor、Role-play、Feedback 使用真实 AI，可选 Example / Demo Mode 不作为其通过证据；Teacher / Could 未完成不阻塞 Student Must。 | FR-005、FR-007、FR-009、FR-023；§3、§17 | RD §4.3、§6–7、§9 验收边界 |

### 16.2 Teacher Should

| ID | 验证条件与结果 | 对应 FR | 来源 |
| --- | --- | --- | --- |
| AC-033 | 若要开始 Teacher Demo 实现，先有 AC-001 至 AC-032 全部通过的结果；尚有 Student Must 未通过时，不进入 Teacher 实现，且不因 Teacher 延迟部署。 | FR-024 | RD §5、§9 Should 边界 |
| AC-034 | 若已实现 Teacher Should，从 Teacher Dashboard 输入 Topic、Audience、Difficulty、Learning Goal，经 AI Generate Mini-course 后能 Preview generated course；不要求账户、学生管理、课程编辑或发布。 | FR-024 | RD §5 |

### 16.3 原验收标准覆盖索引

| RD §9 Student Must 原编号 | 本文对应 AC |
| --- | --- |
| 1 运行与部署 | AC-001 |
| 2 UI/UX | AC-028、AC-029、AC-030 |
| 3 平台结构 | AC-002 |
| 4 课程体量 | AC-003、AC-004 |
| 5 AI Tutor | AC-005、AC-006 |
| 6 Role-play | AC-007、AC-008、AC-009、AC-027 |
| 7 结构化提交 | AC-010 |
| 8 AI Feedback | AC-011、AC-012、AC-013 |
| 9 推荐 | AC-013、AC-014、AC-015、AC-016、AC-017、AC-027 |
| 10 Lesson 完成 | AC-006、AC-017、AC-018 |
| 11 Activity 完成 | AC-019、AC-026 |
| 12 Course 完成 | AC-017、AC-020、AC-021 |
| 13 状态恢复 | AC-021、AC-022、AC-023 |
| 14 AI 失败与重试 | AC-024、AC-025、AC-026 |
| 15 完整闭环 | AC-028、AC-031 |

## 17. Should

仅在**全部 Student Must 验收通过后**，才能开始轻量 Teacher Demo 实现；不得延迟 Student Prototype 的完成或部署。该优先级沿用 RD，不受会议中一般性的 Must / Should 原型建议改变。

允许流程为：

**Teacher Dashboard → 输入 Topic / Audience / Difficulty / Learning Goal → AI Generate Mini-course → Preview generated course。**

生成内容用于预览，不据此扩充 Student Must 的固定 Demo Course，也不承诺教师账户、学生导入、真实学生历史数据、完整课程编辑、发布或管理工作流。Teacher Demo 未完成不影响 Student Must 验收，验收仅按 AC-033、AC-034。

## 18. Open Implementation Decisions

以下为后续 Plan 阶段需要落实的技术、内容制作或整合决定，本文不选择方案。它们不能重新打开已冻结的产品范围。

| ID | 后续待决定事项 | 已冻结的边界 |
| --- | --- | --- |
| OID-01 | Technical stack、框架、语言、库与组件库；相应项目结构、开发命令和测试工具。 | 本轮不初始化工程、不增加 dependency；选型服务 Student Must。 |
| OID-02 | AI provider / model、调用方式或 SDK、可用调用条件与预算。 | Tutor、Role-play、Feedback 的正常路径真实调用 AI；不承诺自动供应商切换。 |
| OID-03 | 浏览器本地持久化实现、状态组织与恢复方式。 | 保持第 13 节恢复契约，不强制具体存储技术，不扩成云同步。 |
| OID-04 | Deployment platform 与部署配置。 | 2026 年 10 月 19 日前完成可通过链接访问的无登录 Student 原型。 |
| OID-05 | 最终固定 Scenario 故事、隐藏事实、问题披露参照及具体评价依据。 | 一个预先设计的固定案例，满足第 8 节；不在本轮选定考试复习软件或写完整故事。 |
| OID-06 | Final course copy：Lesson 最终标题、正文、术语解释、例子及教学内容编排。 | 保持 3 Lessons、已确认教学重点、八栏目成果和约 10–15 分钟目标。 |
| OID-07 | Language strategy：界面、教学内容、AI 对话与反馈使用的语言。 | 保持初学者可理解和术语意义一致；本轮不擅自选语言或增加多语言功能承诺。 |
| OID-08 | Module 进度的汇总呈现方式、百分比或其他展示细则。 | 与真实完成内容一致，不改变 Lesson、Activity、Course 完成条件。 |
| OID-09 | 团队统一技术栈、字段命名、UI 规范的实际内容与后续整合约定。 | 遵循团队后续确认的规范，不在本轮自行冻结接口或模块架构。 |
| OID-10 | AI 上下文与输出约束的实现，以及把具体 Feedback 证据映射到已确认推荐结果的实现细则。 | 仅使用第 11 节三种结果，解释表现依据，不引入数值总分、随机推荐或未实现目标。 |
| OID-11 | 最终界面文案、视觉表达与响应式布局细节。 | 满足第 15 节体验要求；本轮不设计具体组件、配色或断点。 |

### 范围一致性核对

未发现 RD 内部存在需要用户裁决的冲突。以下是已有边界的对应关系：

- 表现评价与学习完成记录承担不同作用；第 11–12 节同时保留二者规则，没有加入及格线。
- Could 中明确标注的 Example / Demo Mode 与正常真实 AI 路径区分；不能用假 AI 代替 Must 验收。
- 最终 Group Project 的教师等能力及会议中的建议，不自动成为此次个人 Must；Teacher 仍受 Student 全部通过的门禁约束。

本文不修改 RD，不形成 Technical Plan、实现任务清单或业务代码。下一步是用户审核本 Specification；任何实际发现的需求冲突都应先由用户裁决，不能通过技术选型自行改写。
