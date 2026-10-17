# 个人 Prototype 需求发现与范围决策

- 状态：用户已确认，包含访谈结束后的范围修订。
- 确认日期：2026 年 10 月 17 日。
- 交付节点：10 月 19 日前完成个人 Prototype 和网站部署，用于当天团队会议展示与讨论。
- 文档性质：记录最终确认的需求、范围与验收标准，不保存访谈问答，不进入 Specification 或实现设计。

## 1. Prototype Goal

交付一个 **GenAI-powered Mini-course Learning Platform** 个人原型，以完整的学生学习体验验证产品方向，并为团队择优整合提供可运行、可展示、可部署的方案。

需求依据：

- [老师正式项目要求](project_overview_中文翻译.md)：最终团队产品需要提供 GenAI 驱动的学习内容、互动活动、个性化学习及教师能力；每位成员通过原型探索方向，最终协作完成集成 App。
- [10 月 17 日会议纪要](10.17会议纪要.docx)：个人独立完成原型并部署，10 月 19 日展示后择优整合；强化互动、个性化与用户体验，后续遵循团队统一规范。
- 本轮用户确认的个人 Prototype 范围与修订：个人原型优先完成 Student Must，不要求提前覆盖最终 Group Project 的全部能力。

必须始终区分两个层面：

| 层面 | 本次定位与边界 |
| --- | --- |
| Platform level | 能承载多个 Mini-course 的学习平台，展示多课程入口及完整 Student 学习流程。 |
| Demo course level | 完整实现一门 Requirement Clarification 课程，以 AI Client Role-play 验证平台能力。 |

Requirement Clarification 是本次完整 Demo Course，不是整个平台唯一能够教授的主题。平台可展示 Git、AI Coding Agent、Communication Skills 等未来课程入口。

## 2. Target User

### Platform level

平台面向不同背景和学习目标的学生；本次以 Student 为主要体验角色。Teacher 仅作为有条件的 Should，不要求完整教师用户流程。

### Demo course level

主要用户是没有系统学习过 Requirements Engineering / Requirement Analysis 的大学生初学者，包括非 CS 学生。不要求编程基础，也不假设已学过正式软件工程课程。

教学原则为 **Beginner-friendly entry + practical challenge**：

- 专业术语首次出现时，用简单语言解释。
- 核心概念配具体软件案例，不假设学生已理解 User Story、Acceptance Criteria、Scope 等术语。
- AI Tutor 支持进一步简化解释、提供例子和回答追问。
- Role-play 保留真实软件项目中的目标、约束与信息缺口，不因初学者定位而将任务过度简化。
- 课程不以培养完整 Requirements Engineer 为目标，而是帮助学生第一次完整经历需求澄清过程。

## 3. Core User Flow

### Platform level

Course Dashboard → Course → Module → Lesson → Interactive Activity → AI Feedback → Personalized Recommendation → 继续学习 / 重新练习 / 查看完成结果。

- 学生阅读 Lesson 时，可随时使用独立的轻量 AI Tutor。
- Progress 反映学习完成状态，支持查看进度与恢复学习。
- 同一浏览器关闭网站后再次打开，可继续之前的学习进度，并查看最近一次结果。

### Demo course level

阅读核心 Lesson → 按需使用 AI Tutor → AI Client 提出模糊需求 → 学生主动提问 → AI 逐步补充信息 → 学生填写结构化需求总结 → 获取 AI Feedback → 查看并执行 Personalized Recommendation。

完整体验的目标时长为 **10–15 分钟**，包含阅读、Tutor、Role-play、结构化总结、Feedback 和 Recommendation。10 月 19 日展示只需选取关键步骤，不要求现场完整播放全部学习过程。

## 4. Must

### 4.1 Platform level

#### 多课程结构与学习入口

- 展示多个 Mini-course 的结构和入口。
- 其中一门 Demo Course 完整可用，其他课程可只提供 Course Card / Coming Soon。
- 完整课程支持 Course → Module → Lesson 的学习层级。
- 清楚区分当前可学习内容与 Coming Soon 内容。

#### Responsive UI 与 polished UI/UX

- **Responsive UI 和 polished UI/UX 属于 Platform Must。**
- 桌面端必须完整可用，覆盖全部 Student Must 流程。
- UI 清晰、统一、以学习为导向，学习内容、当前任务、反馈和下一步行动容易识别。
- 布局能够响应窗口尺寸变化，保持内容可读、核心操作可用。
- 避免典型 AI template 和 enterprise SaaS dashboard 风格。
- 延续会议提出的亲和、适度可爱的视觉方向，减少模板感和未经打磨的“AI 味”。

#### 独立的轻量 AI Tutor

- AI Tutor 与 Interactive Activity 分别服务“理解”和“练习”，两者均为 Must。
- 学生阅读 Lesson 时，可以针对当前知识点随时提问。
- 第一版围绕当前 Lesson 内容解释概念、举例、换一种更简单的方式说明，并回答相关追问。
- 不做通用聊天助手，不依赖跨课程搜索、长期 Memory 或 RAG。

#### Personalized Recommendation

推荐流程固定为：

**Activity Result / AI Feedback → 识别优势或薄弱点 → 推荐下一步行动并解释原因。**

- 推荐必须依据刚刚的学生表现，不随机推荐。
- 明确指出优势、遗漏或薄弱点，并说明推荐理由。
- 推荐目标必须是当前 Prototype 已实现、能够进入的内容或操作。
- 学生可以点击推荐进入对应 Lesson、重新练习或查看最终总结。
- **不允许推荐到 Coming Soon 课程。**

推荐结果分支固定如下：

| 学习表现 | 推荐结果 |
| --- | --- |
| 有明显薄弱项 | 推荐对应的已实现 Lesson，并说明原因。 |
| 整体掌握但仍有遗漏 | 推荐重新完成核心 Activity，并说明需要改进的内容。 |
| 表现良好 | 在满足 Course complete 条件后呈现 Course Complete，允许查看最终总结或重新练习。 |

表现评价不替代完成规则；不能因 Activity 表现良好而将尚未完成的 Lesson 自动标记为完成。

#### Progress 与本地持久化

完成规则已冻结：

| 对象 | 完成条件 |
| --- | --- |
| Lesson | 学生主动点击 **Complete Lesson**。 |
| Activity | 学生提交结构化需求总结，并成功获得 AI Feedback。 |
| Course | **3 个 Lesson 和核心 Activity 全部完成**。 |

完成状态按上述动作计算，不增加总分或及格线作为额外完成门槛。AI Feedback 失败时，Activity 不应提前标记为完成。

同一浏览器需要持久保存：

- Course / Module / Lesson 的已完成进度。
- 当前正在学习的 Lesson。
- 最近一次 Interactive Activity 的完成状态。
- 最近一次 AI Feedback。
- 最近一次 Personalized Recommendation。

刷新页面、关闭浏览器并重新打开后，能够恢复最近学习状态；Progress 页面与实际完成内容一致。使用浏览器本地持久化即可，不要求云端账户或数据库。localStorage 是用户接受的可选实现方式，不将其冻结为必须采用的技术。

#### 可运行、可部署与后续整合

- 原型能够运行，并在 10 月 19 日前部署为可访问的网站。
- Student 不注册、不登录即可体验完整 Must 流程。
- 特色功能应便于团队后续整合，并遵循团队后续确认的统一技术栈、字段命名和 UI 规范。
- 本文不指定技术栈、框架、部署平台或具体模块架构。

### 4.2 Demo course level

#### 冻结的课程体量

- **1 个完整 Demo Course：Requirement Clarification。**
- **1 个主要 Module。**
- **3 个短 Lesson。**
- **1 个核心 AI Client Role-play Activity。**

Lesson 暂定名称与教学重点：

| Lesson | 暂定名称 | 教学重点 |
| --- | --- | --- |
| 1 | What is Requirement Clarification? | 理解模糊需求为何需要澄清。 |
| 2 | What Should You Ask? | 学会围绕用户、目标、需求、约束和范围主动提问。 |
| 3 | From Conversation to Structured Requirements | 将访谈信息整理成清晰、可执行的结构化需求。 |

标题为暂定名称，课程体量已冻结。课程保持短而完整，不扩展为完整 Requirements Engineering 知识体系。

#### 学习目标与结构化成果

学生能够把模糊的软件需求，通过有目的的提问逐步澄清为更清晰、可执行的需求。

最终提交采用以下八个预定义栏目，不以纯自由文本作为主要提交形式：

1. Target User
2. User Goal
3. Core Requirements
4. Constraints
5. Must / Should / Could
6. User Flow
7. Acceptance Criteria
8. Out of Scope

学生根据刚刚的访谈自行整理这些内容，使学习目标、练习产出与反馈维度直接对应。

#### 固定 AI Client Scenario

提供 **1 个高质量、预先设计的固定案例**，事先明确：

- Client background 与 Initial vague request。
- Target users、Real goals、Core requirements。
- Constraints 与 Hidden information。
- Must / Should / Could items。
- Acceptance criteria 与 Out-of-scope items。

AI 扮演 Client / Product Manager：先给出模糊需求，再根据学生提出的问题逐步透露相关信息，不在开场一次性提供全部答案。

固定案例用于保证 Role-play 可重复体验与测试、Demo 稳定，并为判断学生是否遗漏关键问题提供统一依据。

“帮助大学生规划考试复习的软件”仅是访谈中举出的案例示例，尚未被确认为最终案例。

#### AI Feedback

- 同时评价学生的**提问质量**和**最终结构化需求总结**。
- 对各维度给出清晰等级，采用 **Strong / Partial / Missing** 等容易理解的表达。
- 第一版**不要求总数值分数**。
- 检查用户是否准确、目标是否明确、需求是否完整、约束是否识别、优先级是否合理、流程是否清楚、验收条件是否可验证，以及范围外事项是否正确。
- 明确提供 **What you did well**、**What to improve**、**Recommended next action**。
- 评价依据来自固定案例、学生实际对话与提交成果，并为下一步推荐提供依据。

### 4.3 真实 AI 与失败处理

#### Real AI path

正常情况下，以下三项必须真实调用 AI 服务：

- AI Tutor。
- AI Client Role-play。
- AI Feedback。

#### Error handling + Retry + Preserve user state

AI 调用失败时必须：

- 保留学生当前输入和已有学习状态。
- 显示清晰、友好的错误提示，不直接暴露技术错误栈。
- 提供 Retry，重试不要求重新填写已有内容。
- Role-play 或 Feedback 失败时，已经完成的对话和结构化需求总结不能丢失。

错误文案可采用类似表达：“AI service is temporarily unavailable. Your work has been saved. Please try again.” 具体文案不作为固定实现要求。

## 5. Should

### 有前置条件的轻量 Teacher Demo

**只有全部 Student Must acceptance criteria 已经通过后，才允许实现 Teacher Demo。Teacher Demo 不得阻塞 Student Prototype 的完成与部署。**

允许的轻量范围：

Teacher Dashboard 入口 → 输入 Topic / Audience / Difficulty / Learning Goal → AI Generate Mini-course → Preview generated course。

不要求完整教师账户、学生管理或课程编辑流程。

## 6. Could

以下不属于本次必须交付或验收的能力，不得影响 Student Must：

- 面向有经验学生的 Optional Learn more 内容。
- 结构化需求总结中的 Optional Notes 自由文本框。
- 明确标注 **Example / Demo Mode** 的备用演示模式；不得冒充正常的真实 AI 路径。
- 多案例或动态生成案例：保留为 Could / 后续扩展候选，本次仅承诺一个固定案例。

## 7. Explicitly Out of Scope

### Platform level

- 用户注册、登录、Authentication、多用户账户系统。
- 跨设备同步、云端数据库持久化。
- **PDF Upload、document ingestion，以及相关 RAG 流程。**
- 跨课程搜索、长期 Memory、通用知识问答、复杂 Agent。
- 长期 Learner Profile、跨课程推荐、复杂推荐算法、Machine Learning recommendation system。
- 根据学习表现自动重排整个课程，或动态生成整门新课程、长期学习路径。Teacher 的可选主题生成与预览另按 Should 范围处理。

### Teacher level

- 完整教师账户系统。
- 学生导入、班级管理。
- Teacher 查看真实学生历史数据、学习行为分析。
- 完整课程编辑器。

### Demo course level

- 大量 Lesson、长视频课程、完整 Requirements Engineering syllabus、超过 20 分钟的学习流程。
- 将用户任意主题输入作为本次核心 Activity 的必需流程。
- 完全自由形式的长篇需求文档、自动生成完整 PRD、UML / Use Case Diagram、Formal SRS。

### AI 运维与容错

- 自动切换其他模型供应商。
- Offline AI、预生成假 AI 回答。
- 完整 fallback engine、自动故障恢复系统。

上述复杂账户、教师管理、数据和扩展能力留给最终 Group Project 阶段再评估，不构成此次个人 Prototype 的交付承诺。

## 8. Key Demo Features

10 月 19 日重点展示以下三个亮点：

1. **完整学习平台中的 Student 闭环。** 从多课程入口进入完整 Demo Course，阅读 Lesson、向 Tutor 提问、完成练习、获得反馈并看到学习进度。
2. **逐步揭示信息的 AI Client Role-play。** 展示学生如何通过提问，将模糊请求转化为八个栏目的结构化需求。
3. **表现驱动的 Feedback 与下一步行动。** 展示具体等级、优势与遗漏、有理由的推荐，以及可进入的复习、重练或完成结果；结合本地恢复证明学习记录能够保留。

## 9. Acceptance Criteria

### Student Must 验收

1. **运行与部署：** 网站可运行，10 月 19 日前完成部署，可通过链接访问，Student 无需注册或登录即可体验。
2. **UI/UX：** 桌面端完整支持全部 Student 流程；响应式布局保持内容可读、核心操作可用；视觉清晰、统一、学习导向，避免典型 AI template / enterprise SaaS dashboard 风格。
3. **平台结构：** 展示多个 Mini-course 入口；完整可用课程与 Coming Soon 状态区分清楚。
4. **课程体量：** 完整 Demo Course 包含 1 个主要 Module、3 个短 Lesson 和 1 个核心 AI Client Role-play Activity，完整学习目标时长约 10–15 分钟。
5. **AI Tutor：** 学生可在阅读 Lesson 时真实调用 AI，获得当前内容的解释、例子、简化说明和相关追问回答。
6. **Role-play：** 固定案例可重复体验；AI 先提出模糊需求，再根据学生问题逐步补充信息。
7. **结构化提交：** 学生能够提交八个栏目组成的需求总结。
8. **AI Feedback：** 使用真实 AI，结合访谈与总结进行评价；各维度有 Strong / Partial / Missing 等清晰等级，并提供 What you did well、What to improve、Recommended next action；不要求总分。
9. **推荐：** 推荐有学生表现依据及解释；明显薄弱项进入对应 Lesson，整体掌握但有遗漏时可重新完成 Activity，表现良好且满足完成条件时呈现 Course Complete 并支持查看最终总结或重新练习。所有目标均真实可用，不指向 Coming Soon。
10. **Lesson 完成：** 只有学生主动点击 Complete Lesson，才记录对应 Lesson 完成。
11. **Activity 完成：** 只有提交结构化总结并成功获得 AI Feedback，才记录 Activity 完成。
12. **Course 完成：** 只有 3 个 Lesson 和 Activity 全部完成，才记录 Course 完成；不额外要求总分或及格线。
13. **状态恢复：** 刷新、关闭并重新打开同一浏览器后，进度、当前 Lesson、最近一次活动完成状态、Feedback 和 Recommendation 仍可恢复，Progress 与实际完成内容一致。
14. **AI 失败与重试：** 失败时保留输入、学习状态、已有对话及总结；提示友好且无技术错误栈；Retry 可以使用已有内容继续，不要求重新填写。
15. **完整闭环：** 学生可以从 Dashboard 进入课程，完成学习与活动，查看反馈，执行推荐，并查看进度或完成结果。

### Should / Could 的验收边界

- Teacher Demo 只能在上述所有 Student Must 验收通过后开始实现，不得延迟 Student Prototype 完成或部署。
- Teacher Demo 未完成，不影响 Student Must 验收。
- Could 功能未完成，不影响本次 Prototype 验收。

## 10. Remaining Uncertainties

### 尚未冻结的产品与内容细节

- 固定 AI Client Scenario 的最终故事、隐藏事实和具体评价依据；访谈中的考试复习软件仅为示例。
- Lesson 的具体正文、最终标题及界面 / 教学内容语言。
- Module 层级的进度汇总展示细则；不得改变已冻结的 Lesson、Activity 和 Course 完成规则。
- 游戏化、排行榜等会议建议尚未被确认为本次功能优先级，不计入已承诺交付。

### 后续需要落实的实现与协作事项

以下属于待决定或核实的实现事项，**不是本轮擅自指定的用户需求**：

- 技术栈、框架、AI provider / model、调用条件与预算、部署平台。
- 浏览器本地持久化的具体实现方式。
- 团队统一技术栈、字段命名和 UI 规范的实际内容与整合约定。

PDF Upload、课程体量、核心完成规则、是否要求总分、推荐结果分支和 Teacher Demo 的前置条件均已决策，不再列为未决范围。
