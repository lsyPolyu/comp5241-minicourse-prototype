# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Authority and Sources

This record captures confirmed product context for design tools. It does not
introduce requirements or authorize implementation.

| Document | Authority |
| --- | --- |
| [docs/SPEC.md](docs/SPEC.md) | Functional requirements and acceptance criteria; product requirement source of truth. |
| [docs/PLAN.md](docs/PLAN.md) | Technical architecture and implementation decisions. |
| [docs/TASKS.md](docs/TASKS.md) | Implementation order and task status. |
| PRODUCT.md | Audience, purpose, operating context, UX principles, and product constraints. |
| DESIGN.md | The single future project visual language and design system; not created during toolchain setup. |

The confirmed audience and scope come from
[docs/REQUIREMENTS_DISCOVERY.md](docs/REQUIREMENTS_DISCOVERY.md), SPEC, PLAN,
and the user's explicit design-toolchain setup brief. If this summary and a
source document diverge, consult the relevant source instead of expanding scope.

## Stack

The technical baseline proposed in PLAN is Next.js App Router, React, strict
TypeScript, Tailwind CSS, Lucide React, npm, Node.js 22.x, and Vercel. It uses
server-side OpenAI calls and browser localStorage for progress. This records
the existing plan, not a new stack decision or evidence of installed app code.

## Users

Primary users are university beginners, including non-CS students, who have
not systematically studied requirements engineering. They need to understand
short concepts, ask useful clarification questions, and organize what they
learn into actionable requirements. Programming knowledge is not required.

A lightweight Teacher demo is a conditional Should, available for consideration
only after all Student Must acceptance criteria pass. Teacher administration
is outside this personal prototype's scope.

## Product Purpose

The GenAI-powered Mini-course Learning Platform gives students a short,
interactive learning experience: lessons, an optional AI Tutor, practical
role-play, student-authored structured work, AI Feedback, and a clear next
learning action. The personal prototype demonstrates a complete, recoverable
Student journey for team review and possible integration.

## Positioning

The platform can present multiple mini-course topics. The complete demo is
Requirement Clarification: 1 Course, 1 Module, 3 Lessons, and 1 fixed AI Client
Role-play Activity. Other course entries may be clearly marked Coming Soon.
The demo topic does not limit the platform to requirements engineering.

Tutor, Client, and Feedback have distinct jobs: explain the lesson, support
practice through gradual disclosure, and evaluate the student's actual work.
They are not a general-purpose chat interface.

## Operating Context

The target full experience is approximately 10–15 minutes, without a countdown
or time-based completion gate. The intended individual prototype review is
19 October 2026; the complete experience has not yet been implemented or timed.

The journey is Dashboard → Course → Module → Lesson → optional Tutor → Activity
→ eight-field Requirement Summary → Feedback → Recommendation → Progress or
Course Complete. Students use a desktop browser for the complete flow; narrower
windows must retain readable content and usable controls.

There is no account requirement. Progress resumes in the same browser and
origin after refresh or reopening. Local recovery is not cross-device sync.

## Capabilities and Constraints

- Normal Tutor, Client, and Feedback paths must use real AI. Failures preserve
  work and offer Retry; fabricated responses cannot stand in for successful AI.
- Students explicitly complete each lesson. Activity completion requires valid
  Feedback. Tutor usage, a fixed question count, and a passing score are not
  completion requirements. SPEC owns the exact completion rules.
- Students write their own summary using Target User, User Goal, Core
  Requirements, Constraints, Must / Should / Could, User Flow, Acceptance
  Criteria, and Out of Scope. AI must not fill in the activity answer for them.
- Recommendations explain the relevant performance evidence and lead to
  implemented review, retry, or completion actions.
- [docs/SCENARIO.md](docs/SCENARIO.md) defines the fixed Campus Club Event
  Sign-up client case. Its hidden facts and evaluation reference are developer
  material, not public lesson content or material to upload for visual design.
- [docs/COURSE_CONTENT_PLAN.md](docs/COURSE_CONTENT_PLAN.md) defines the three
  short lessons and separate campus lost-and-found teaching examples.
- No login, database persistence, PDF ingestion, RAG, multi-agent product,
  provider failover, full teacher workflow, or course expansion is authorized
  by this context record. SPEC remains authoritative for all exclusions.

## Brand Commitments

The confirmed direction is learning-focused, warm, friendly, moderately playful,
polished, beginner-friendly, content-first, and clear in hierarchy. Visual
interest should lower beginner anxiety and support the learning task.

Avoid enterprise SaaS dashboard conventions, generic AI startup presentation,
excessive gradients, giant marketing heroes, a ChatGPT clone appearance,
cards nested inside cards, random sparkle or robot AI icons, and unnecessary
animation. These user constraints take precedence over a skill's default taste,
motion intensity, hero template, or example layout.

Use simple English for student-facing UI, teaching content, and AI output as
specified in PLAN and COURSE_CONTENT_PLAN. Voice should be friendly, concrete,
and encouraging without inventing success, scores, or completion.

Specific colors, fonts, tokens, components, and page compositions remain
undecided. Preserve a single project DESIGN.md when that work is authorized;
skill resource examples are not project design authorities.

## Evidence on Hand

The repository contains requirements discovery, SPEC, PLAN, TASKS, the fixed
scenario, and a course content outline. They are planning evidence, not proof
of a working application, a completed learning session, or a live deployment.
No validated user outcomes, testimonials, engagement metrics, or completed
frontend are available to claim in designs.

## Product Principles

1. Make learning content and the current task the main focus; show the student's
   state and next action clearly.
2. Offer a beginner-friendly entry while preserving a practical clarification
   challenge; explain terms and use concrete examples.
3. Keep explanation, practice, and evaluation recognizable and distinct.
4. Preserve learner effort through waiting, failure, retries, and recovery;
   represent completion truthfully.
5. Keep recommendations actionable and the scope small enough to demonstrate
   the complete Student journey.

## Accessibility & Inclusion

Do not assume CS or programming knowledge. Keep text, forms, and core actions
readable and usable as the window narrows. Distinguish waiting, failure,
completion, and Coming Soon states clearly. No additional certification or
accessibility conformance claim has been established by the product brief.
