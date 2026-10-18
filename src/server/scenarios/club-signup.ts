import "server-only";
import { clientInterviewIntroduction } from "@/content/activities/client-interview";
import { scenarioSchema } from "./schema";

// Frozen reference: docs/SCENARIO.md. Only clientWording is interview reply text;
// Chinese guidance and rubric entries are private developer/evaluation material.
export const clubSignupScenario = scenarioSchema.parse({
  scenarioId: clientInterviewIntroduction.scenarioId,
  version: clientInterviewIntroduction.version,
  background: "Maya 是大学桌游社的学生活动组织者。社团每周举办小型体验活动，新成员也可以参加。她现在通过群消息和私信收报名，之后手动整理表格；有时漏掉私信，有时学生以为发过消息就有名额。她希望先为一个即将举行的活动试用简单网站，不追求建立完整社团管理系统。",
  facts: {
    F01: {
      topic: "users",
      clientWording: "The main users are students at our university, including people who have never joined the club. Most will use their phones. I also need to see who has registered.",
      elicitedBy: "谁会使用？新成员也能报名吗？组织者需要什么？",
      disclosureConstraint: "问用户时不连带给出全部功能和约束。",
    },
    F02: {
      topic: "goal",
      clientWording: "Private messages are easy to miss, and students sometimes think they have a place when they do not. I want one reliable list and a clear answer for each student about whether they have a place.",
      elicitedBy: "为什么要做？现在出什么问题？成功是什么样？",
      disclosureConstraint: "核心目标为可靠报名与明确确认，不替换为增长、社交或 AI 推荐。",
    },
    F03: {
      topic: "event",
      clientWording: "For the pilot, we only need one upcoming board-game session. Students should see its title, date, time and room before signing up.",
      elicitedBy: "哪类活动？首版支持多少场？学生先看什么？",
      disclosureConstraint: "单场 pilot 是固定范围，不生成多活动日历。",
    },
    F04: {
      topic: "signup",
      clientWording: "A student enters their name and university email to request a place. This session has 20 places.",
      elicitedBy: "报名填什么？有多少人？什么信息必需？",
      disclosureConstraint: "用户未问报名细节 / 人数时不主动列出字段或名额。",
    },
    F05: {
      topic: "rules",
      clientWording: "Each email can hold only one place for this session. A repeated sign-up must not use another place. When all 20 places are taken, the site should say the session is full instead of accepting another registration.",
      elicitedBy: "重复 / 满额怎么办？有例外吗？怎样确认规则？",
      disclosureConstraint: "与 F04 保持相同名额；满额不自动加 waitlist。",
    },
    F06: {
      topic: "confirmation",
      clientWording: "The student should immediately see whether their registration is confirmed or the session is full. An on-screen message is enough for this pilot; we do not need email notifications.",
      elicitedBy: "学生怎么知道成功？是否发邮件？下一步看到什么？",
      disclosureConstraint: "不虚构邮件、二维码或短信。",
    },
    F07: {
      topic: "organizer",
      clientWording: "I need a simple organizer view with the confirmed students’ names and emails and the number of confirmed places. The student page should not show other students’ personal details.",
      elicitedBy: "组织者怎么看？需要什么名单？哪些信息公开？",
      disclosureConstraint: "不自动引出账户、角色权限系统或 analytics。",
    },
    F08: {
      topic: "constraints",
      clientWording: "We want to try it in two weeks. It must work in a phone browser, and we cannot use paid services or extra integrations for this pilot.",
      elicitedBy: "时间、设备、预算、限制是什么？",
      disclosureConstraint: "两周是案例客户产品期限，不是本学习平台交付期限。",
    },
    F09: {
      topic: "priorities",
      clientWording: "The event details, sign-up rules, clear confirmation and organizer list are essential. A CSV download of the list would be useful if time allows. A decorative event poster would be a nice extra.",
      elicitedBy: "哪些最重要？时间不够砍什么？Should / Could 是什么？",
      disclosureConstraint: "CSV 为 Should，poster 为 Could，不变成 essential。",
    },
    F10: {
      topic: "scope",
      clientWording: "We are not taking payments, creating student accounts or a waiting list, sending email notifications, or building a native mobile app. Multiple events and calendar integrations can wait until after the pilot.",
      elicitedBy: "这次不做什么？付款 / 登录 / 候补要做吗？哪些留以后？",
      disclosureConstraint: "未列出的新需求回答尚未决定，不能肯定是隐藏 Must。",
    },
  },
  priorities: {
    must: [{
      factIds: ["F03", "F04", "F05", "F06", "F07", "F09"],
      description: "单场详情；姓名 / 本校邮箱报名；20 名额上限与同邮箱去重；立即 confirmed / full；组织者确认名单 / 数量；学生页不展示他人个人信息。",
      reason: "直接支撑可靠记录和清晰确认，避免首版重现现有问题。",
    }],
    should: [{
      factIds: ["F09"],
      description: "组织者将名单下载为 CSV。",
      reason: "有助于现场点名，但没有下载仍能通过页面查看名单。",
    }],
    could: [{
      factIds: ["F09"],
      description: "活动装饰海报。",
      reason: "视觉加分，不解决报名可靠性；时间不足可去掉。",
    }],
  },
  acceptanceCriteria: {
    "SC-AC-01": { factIds: ["F03"], description: "打开 pilot 活动页面时，可以看到活动名称、日期、时间和房间。" },
    "SC-AC-02": { factIds: ["F04", "F05", "F06", "F07"], description: "有空位且邮箱尚未报名时，学生提交姓名 / 本校邮箱后看到 confirmed，组织者名单增加该记录和一个名额。" },
    "SC-AC-03": { factIds: ["F04", "F05"], description: "已有 19 个确认名额时，下一位有效且不重复的报名可以成为第 20 位；20 位确认后再报名显示 full，不出现第 21 位。无需学生讨论并发算法。" },
    "SC-AC-04": { factIds: ["F05"], description: "同一邮箱再次提交时，不产生第二条确认名额；学生可理解自己已经报名。" },
    "SC-AC-05": { factIds: ["F06"], description: "学生提交后立即看到 confirmed / full 的明确结果，不依赖邮件到达。" },
    "SC-AC-06": { factIds: ["F07"], description: "Maya 可查看确认姓名 / 邮箱与数量；学生页看不到其他报名者个人信息。" },
    "SC-AC-07": { factIds: ["F08"], description: "核心阅读 / 填写 / 提交 / 结果在手机浏览器可以操作。" },
  },
  referenceUserFlow: {
    factIds: ["F03", "F04", "F05", "F06", "F07"],
    description: "学生打开单场详情 → 了解时间 / 地点 → 输入姓名和本校邮箱 → 提交报名 → 系统检查是否已报名 / 是否满额 → 显示明确结果 → Maya 在组织者视图查看已确认名单与人数。",
  },
  outOfScope: {
    factIds: ["F10"],
    description: "支付、学生账户 / 登录、候补队列、邮件 / 短信通知、原生手机 App、多活动平台、日历或其他外部集成。没有 AI 课程推荐、学习分析或复杂权限管理的案例需求。",
  },
  rubric: {
    questioning: {
      factIds: ["F01", "F02", "F03", "F04", "F05", "F06", "F07", "F08", "F09", "F10"],
      strong: "有目的地澄清用户、真实问题、报名 / 确认规则、约束、优先级与范围；对关键模糊处追问。问题可以合并，不要求次数或话术。",
      partialOrMissing: "只问外观、不澄清实际问题为明显 gap；已覆盖核心而少量非核心细节欠追问为 Partial。无相关问题为 Missing。",
    },
    targetUser: {
      factIds: ["F01"],
      strong: "本校学生、初次参与者 / 手机背景；识别 Maya 的名单需要。F01。",
      partialOrMissing: "只说“所有人”含糊；把主用户写成校方管理员不准确。",
    },
    userGoal: {
      factIds: ["F02"],
      strong: "统一可靠记录、明确是否占位，解决私信遗漏 / 误确认。F02。",
      partialOrMissing: "只写“做漂亮网站”未抓住目标；把用户增长当既定目标。",
    },
    coreRequirements: {
      factIds: ["F03", "F04", "F05", "F06", "F07"],
      strong: "单场详情、姓名邮箱、名额 / 去重、立即确认、组织者名单且学生页保护他人信息。F03–F07。",
      partialOrMissing: "缺关键确认 / 名额为核心 gap；引入支付是无依据需求。",
    },
    constraints: {
      factIds: ["F08"],
      strong: "两周、手机浏览器、无付费服务 / 外部集成。F08。",
      partialOrMissing: "只说“简单”不具体；错误写成原生 App 必做。",
    },
    priorities: {
      factIds: ["F09"],
      strong: "核心可靠报名为 Must；CSV 为 Should；海报为 Could，并能说明取舍。F09。",
      partialOrMissing: "划分方向对但少一个可选项可为 minorOmission；海报必做、名额可不做为 summaryGap。",
    },
    userFlow: {
      factIds: ["F03", "F04", "F05", "F06", "F07"],
      strong: "从详情到填写、提交、名额 / 重复检查、结果，组织者查看名单；顺序清楚。F03–F07。",
      partialOrMissing: "只有功能列表没有流程为 Partial；没有可辨认步骤为 Missing。",
    },
    acceptanceCriteria: {
      factIds: ["F03", "F04", "F05", "F06", "F07", "F08"],
      strong: "至少覆盖正常报名与满额 / 重复等关键可观察结果，能够据此判定功能成立；不要求全部 SC-AC 编号。",
      partialOrMissing: "仅“容易使用”不可验证；正常路径正确但缺一个边界是有依据的遗漏。",
    },
    outOfScope: {
      factIds: ["F10"],
      strong: "能明确主要边界，尤其不做支付、学生账户、候补、邮件和原生 App / 多活动集成。F10。",
      partialOrMissing: "少量表达不全为 Partial；把账户 / 支付列为首版核心为 summaryGap。",
    },
  },
});
