# Design System: COMP5241 Mini-course Learning Platform

**Canonical visual source:** `.stitch/DESIGN.md`  
**Direction:** A — Editorial Learning Workspace, selected by the user on 17 October 2026 (Asia/Shanghai).  
**Stitch project:** `6952312963561786059`  
**Formal design system:** `assets/104807219088274562`  
**Original A reference:** `c3a97d8cf1454a7696b2bf9c653fa95e`  
**Review status:** Visual direction selected; this screen set awaits the user's final design review. This document does not authorize P01, T001, application initialization, or implementation.

The formal asset supersedes the historical exploration asset `assets/17554283518464599552`. The historical A/B/C explorations are not alternative implementation authorities. Screen identities, state fixtures, and review evidence are recorded in [SCREEN_REFERENCE.md](SCREEN_REFERENCE.md).

## 1. Product authority and visual personality

[SPEC](../docs/SPEC.md) owns functionality and acceptance. [PLAN](../docs/PLAN.md) owns architecture, page boundaries, and completion aggregation. [PRODUCT](../PRODUCT.md) provides audience and UX context. [COURSE_CONTENT_PLAN](../docs/COURSE_CONTENT_PLAN.md) supplies teaching structure. This design system defines presentation within those boundaries; it does not add features or completion rules.

The product serves university beginners, including non-CS students. Its atmosphere is editorial, warm, friendly, calm, moderately playful, polished, and content-first. Visual personality comes from approachable headings, careful spacing, and readable learning content. It does not depend on mascots, decoration, a marketing hero, or business metrics.

Lesson is primarily a Read surface. Dashboard, Course, Activity, and Progress are restrained Operate surfaces. Content and the next learning action remain more prominent than navigation or AI tooling. Keep density moderate, composition intentional, and motion minimal.

## 2. Color palette and functional roles

| Role | Descriptive color | Value | Use |
| --- | --- | --- | --- |
| Canvas | Warm paper | `#FAF8F2` | Main page background; one consistent warm neutral family. |
| Surface | Clear white | `#FFFFFF` | Editable fields and an occasional bounded work area. |
| Primary text | Charcoal ink | `#252925` | Body text, headings, essential labels. |
| Secondary text | Readable muted ink | `#5F655F` | Supporting copy, metadata, helper text, incomplete states. Do not fade essential text through opacity. |
| Structural divider | Paper edge | `#D8D9CF` | Quiet section and row separation; decorative, not the only input boundary. |
| Control boundary | Defined neutral | `#7A8078` | Input outlines and stateful control boundaries when contrast is needed. |
| Primary action | Deep teal | `#28625B` | The single main action, links, focus, and current/completed learning states. |
| Action label | White | `#FFFFFF` | Text on deep teal. |
| Quiet support | Soft apricot | `#F0E2D0` | Small, non-interactive support areas; never a competing CTA accent. |
| Strong | Teal ink / light teal | `#28625B` / `#E8F0EE` | Assessment label with a check symbol. |
| Partial | Brown amber / light amber | `#755319` / `#F6EDD9` | Assessment label with an attention symbol. |
| Missing | Muted red / light rose | `#983F36` / `#F9ECE8` | Assessment label with an outlined minus symbol. |

Use one decorative/action accent. The additional assessment colors communicate meaning and do not create a multicolor brand. In progress uses teal consistently; amber belongs to Partial assessment. Never use color as the sole state signal. No gradients, neon, glows, decorative blur, pure black, or alternating warm/cool gray systems.

## 3. Typography

Use exactly two text families:

- **Outfit, weights 500–600:** page, course, lesson, and section headings. Its modest geometric character makes the learning environment approachable without oversized display typography.
- **Geist, weights 400–600:** English lesson body, navigation, controls, labels, feedback explanations, status, and supporting copy. Its readable letterforms support sustained reading.

| Level | Size / line height | Weight |
| --- | --- | --- |
| Page heading | 32px / 1.2; up to 36px when needed | 600 |
| Course or major section | 28px / 1.3 | 500–600 |
| Section heading | 22px / 1.35 | 500–600 |
| Lesson body | 16–18px / 1.65 | 400 |
| UI and field label | 16px / 1.5 | 400–600 |
| Supporting text | At least 14px / 1.5 | 400–500 |

Keep reading measures around 60–70 characters. Headings may tighten tracking to `-0.02em`; body tracking stays normal. Long fixed titles wrap naturally. Do not use all-caps eyebrow labels as a substitute for section hierarchy. No Public Sans, Inter, serif, or monospace text family. System sans-serif is a loading fallback, not a third authored font. Icons may come from one consistent icon system and must not be exposed as unlabelled icon-font words.

## 4. Spacing, geometry, and depth

Use the spacing rhythm **4, 8, 12, 16, 24, 32, 48, 64px**. Keep related labels and controls close, and leave 32–48px between major sections. Desktop page gutters are approximately 40–64px, reducing to 20–24px in narrow windows. Main content is bounded at approximately 1200px; the welcome area stays compact.

Containers have gently rounded **12px** corners. Inputs and buttons use **8px**. Compact status labels may use **4px**. Avoid pill-shaped buttons and unnecessary badges. Learning rows generally have no enclosing card.

Most content is flat on the page. Use whitespace and 1px dividers before introducing a surface. A bounded Tutor, current-learning area, or recommendation may use one light surface. Do not enclose a card within another card or add border and shadow to every section. Decorative elevation is unnecessary; at most use a soft, offset button shadow for interaction feedback.

## 5. Navigation and button hierarchy

The compact header contains **Mini-course**, **COMP5241**, and the global destinations **Dashboard** and **Progress**. Dashboard is current only on Dashboard; Progress is current only on Progress. Neither global destination is falsely selected on Course, Lesson, or Activity. Contextual breadcrumbs and previous/next lesson links provide local orientation.

Do not introduce accounts, sign in/out, profile avatars, help menus, search, settings, notifications, teacher switches, syllabus links, social links, or a generic marketing footer. A design-fixture annotation is not a new product feature.

Each screen state has one dominant filled action. Secondary actions use readable text links or restrained outlines. Relevant primary labels are Continue Learning, Complete Lesson, Submit Summary for Feedback, Review Lesson, Retry Activity, and View final summary. Send question and Ask remain secondary when a learning action is primary.

Controls need at least 44px target dimensions. Provide a visible 2px teal focus ring with an offset. Never hide a primary action until hover. At narrow widths, actions and supporting notes stack instead of being squeezed into a shared row. Do not use a play symbol that misleadingly implies video lessons.

## 6. Course presentation

Dashboard has one available course, **Requirement Clarification**, with supporting scope **3 short lessons · 1 interactive AI Client activity**. The three future entries contain only their exact title and Coming Soon state: **Git Basics**, **Working with AI Coding Agents**, **Communication Skills**. They have no course description or learning action.

Course presents one Module, **Clarification Basics**, as an open outline of three lessons and one activity. Use these exact titles throughout:

1. Lesson 1 — **What is Requirement Clarification?**
2. Lesson 2 — **What Should You Ask?**
3. Lesson 3 — **From Conversation to Structured Requirements**
4. Activity — **AI Client Requirement Clarification**

Use dividers and plain-language states rather than a lesson-card grid. Do not add instructors, reviews, ratings, prerequisites, certificates, durations, countdowns, future-course content, or extra modules.

## 7. Completion progress

Progress means completed learning units, not assessment quality. Show **lessons x/3** and **activity complete/incomplete** separately. A compact auxiliary indicator may use four equal units: three lessons plus one activity. Two completed lessons and an incomplete activity produce **50% completion**, not a performance score.

A lesson completes only through its explicit Complete Lesson action. An activity completes only after submission and successfully received valid feedback. Course completion requires all three lessons and the activity. Neither Strong assessment nor Tutor use substitutes for a lesson-completion action. Partial or Missing feedback does not revoke an earned completion.

Do not partially fill an incomplete lesson segment according to reading, time, or performance. Use text and check/open-circle symbols. Exclude analytics charts, progress rings, weekly metrics, scores, grades, XP, streaks, and remaining time.

## 8. Lesson and AI Tutor

The Lesson 2 reference is **What Should You Ask?**. Its primary content is the objective, a short explanation of users/goals/needs/constraints/scope, a campus lost-and-found example, and a reminder to follow up on unclear answers. Do not use the Activity's hidden scenario facts as lesson examples.

On desktop, the reading column occupies roughly 70% of the workspace, with a quiet Tutor aside around 30%. Avoid a third navigation column. **Ask AI Tutor** is optional support, subordinate to the lesson. Give its question field a real label, one plain placeholder, and a secondary Ask action. No prompt-chip wall, attachments, model selector, chat-history sidebar, robot, or sparkle.

Complete Lesson is the main action; previous/next lesson links do not automatically complete anything. When space narrows, place Tutor after the reading content in an inline expandable section. A Tutor failure preserves the question and conversation and offers inline Retry.

## 9. Client interview and structured summary

Activity is a learning workspace, not a full-screen messenger. Keep **Ask the client** and **Write your own requirement summary** clearly distinct. The visible sequence is **Client Interview → Structured Summary → AI Feedback → Recommendation**, all within the existing Activity route.

Desktop interview and summary lanes are approximately 40% / 60%. Keep the client identity as a simple role label. Only the public opening is suitable for the initial visual reference. Do not send hidden scenario facts or evaluation reference answers to a design service. No invented client replies, timestamps, online counts, answer suggestions, or AI summary writer.

Summary contains exactly eight blank, labelled multiline fields:

- Target User
- User Goal
- Core Requirements
- Constraints
- Must / Should / Could
- User Flow
- Acceptance Criteria
- Out of Scope

Labels stay above fields; brief helpers explain the field without supplying an answer. Preserve all eight fields in narrow document flow. Do not add required markers, minimum lengths, fixed question-count gates, extra Notes, or a single unstructured substitute. Empty fields may be submitted for feedback. Keep Submit Summary for Feedback clear and uncramped, with the completion explanation on its own line when needed.

## 10. Chat and form states

Tutor explains; Client role-plays; Feedback evaluates. Their roles must remain identifiable. Use bounded, labelled turns and readable paragraphs. Avoid excessive speech bubbles, avatars, or AI branding. The client composer and summary must remain reachable without fixed footers obscuring content.

Editable fields use white surfaces, defined neutral strokes, 8px corners, visible focus, and adjacent helpers. Errors sit beside the affected input or request. Do not require students to retype preserved work after failure.

Waiting preserves the existing content, identifies the request in progress, and prevents duplicate sends. Waiting and failure never display invented AI results or grant completion. Use layout-matched placeholders or a short status rather than decorative animation. Retry repeats the failed request with its saved work; Retry Activity starts another practice attempt and is a separate learning action.

## 11. Feedback and recommendations

Feedback has **Questioning Process plus eight summary dimensions**, each with a Strong / Partial / Missing text label, simple symbol, and concise explanation tied to actual work. An assessment label is not a completion state. Use ruled rows and readable wrapping, not grade cards, gauges, charts, or totals.

Always distinguish **What you did well**, **What to improve**, and **Recommended next action**. Recommendation has a clear heading, a reason, and one instructional action, without an advertising banner. Do not use colored left rails or uppercase kicker labels to create importance.

The three existing outcomes are:

- **Review Lesson:** a significant weakness leads to the corresponding implemented lesson with an explanation.
- **Retry Activity:** overall understanding with a minor omission leads to practice of the same activity.
- **Course Complete:** good performance may present this result only when all three lessons and the activity are actually complete; allow viewing the student's final submitted summary or practising again.

Never recommend Coming Soon content, create arbitrary URLs, add a passing threshold, or substitute AI-authored work for the student's summary. Activity result states retain access to the interview and submitted summary within the same page.

## 12. Responsive behavior

Desktop is the design reference. Preserve source order so the layout can naturally collapse. Stack Lesson reading before Tutor at about 1024px or sooner when the reading measure suffers. Stack Activity interview before summary when two usable lanes no longer fit. Below 768px all major multi-column sections are single-column.

Allow the four-stage Activity sequence, breadcrumbs, long titles, status rows, and actions to wrap. Do not rely on horizontal scrolling, fixed super-wide grids, unwrappable text, tiny labels, or hover-only controls. Feedback rows become dimension → status → explanation in narrow windows, rather than a squeezed table. Global navigation remains available as it reflows.

No mobile screens were commissioned in this design session. Static breakpoints are design evidence, not proof of live touch, keyboard, or browser behavior; implementation must verify continuous resizing and real content.

## 13. Accessibility and motion

Target text contrast of at least 4.5:1 for body, placeholders, and supporting text; at least 3:1 for large text and meaningful control boundaries. Use words and symbols alongside color. Retain visible labels, meaningful headings, logical focus order, usable target sizes, and a focus indication that is not obscured.

Associate labels and helpers with fields. Use semantic navigation, main content, headings, links, buttons, and form controls in implementation. Announce request status and errors without repeatedly interrupting reading. No keyboard traps or disabled-looking available links.

Motion is limited to brief, optional focus/press transitions; respect reduced motion while preserving state cues. No perpetual pulses, shimmer decoration, typewriter effects, floats, confetti, or animated charts. This document does not claim WCAG conformance or completed runtime testing.

## 14. Fixture truth and anti-patterns

Every illustrated learning or feedback state is labelled **Design preview / Example state**. Example feedback is explicitly not a real AI result. Screen fixtures depict different moments in the journey and are not a synchronized application session. Production must obtain real AI results and derive completion from the existing rules.

Never introduce an enterprise dashboard, generic AI startup look, ChatGPT clone, giant hero, neon gradient, random sparkle, robot illustration, decorative chart, gamification, excessive pills, nested cards, or three equal feature-card columns. Never invent faculty development claims, semesters, remaining time, learner counts, ratings, instructor information, certificates, course descriptions, or extra product features.

If a Stitch capture conflicts with these rules, the rule and the product authorities take precedence. Record remaining capture deviations in the review reference; do not silently treat them as approved implementation choices. Only one audit → targeted-fix → final-review pass is authorized for this session, followed by user review.
