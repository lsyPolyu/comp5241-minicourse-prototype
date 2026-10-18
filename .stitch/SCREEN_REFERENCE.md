# Stitch screen references and bounded design review

- Project: **COMP5241 Mini-course Learning Platform**
- Project ID: `6952312963561786059`
- Project URL: https://stitch.withgoogle.com/projects/6952312963561786059
- Formal system: `assets/104807219088274562`
- Visual authority: [DESIGN.md](DESIGN.md). This file records evidence and unresolved capture differences; it is not another design system.
- Date: **17 October 2026, Asia/Shanghai**
- Status: **Awaiting user design review. P01/T001 and implementation remain unauthorized.**

## Final core screens

These are the final outputs of the single audit-fix pass, not the earlier intermediate screens.

| Surface | Final screen ID | Local visual reference |
| --- | --- | --- |
| Dashboard | `d77802b6505448cab9de10046b7c0fe4` | [Dashboard](references/dashboard.png) |
| Course | `7fcd2a42b9854149a38f3b8ea8093ec0` | [Course](references/course.png) |
| Lesson 2 | `9ba54be62b8f4aee9e3258f0d0aa3913` | [Lesson](references/lesson.png) |
| Activity: interview and summary | `cfa84b98c30147f58762ff2e2f5185a2` | [Activity](references/activity.png) |
| Progress | `3fa261b90506469eaa61accffc9a29f4` | [Progress](references/progress.png) |

## Activity result states

These are three mutually exclusive visual states of the existing Activity page, not three new routes.

| State | Final screen ID | Local visual reference |
| --- | --- | --- |
| Review Lesson | `a5b0787d894048f299e5e8afd54f14d3` | [Review Lesson](references/feedback_review.png) |
| Retry Activity | `e6d23910d94e4d45bee5d582e0c9db63` | [Retry Activity](references/feedback_retry.png) |
| Course Complete | `a22b640bbd2844788112bf3ca3879cd8` | [Course Complete](references/feedback_complete.png) |

Every final screen was retrieved successfully by its full Stitch screen resource name. All eight generation records refer to the same formal asset. PNGs are visual design references, not application assets. Generated reference HTML was inspected in the operating-system temporary directory and was not added to the repository.

## Fixture truth

| Reference | Illustrated state |
| --- | --- |
| Dashboard / Course / Progress | Lesson 1 and 2 complete; Lesson 3 incomplete/in progress; Activity incomplete. Completion is 2/4 = 50%. Dashboard uses lesson/activity text rather than a misleading lesson-only percentage. |
| Lesson 2 | A separate earlier moment: Lesson 2 in progress, with an explicit Complete Lesson action and optional Tutor. No aggregate progress is asserted. |
| Activity workspace | Public example opening only; empty question input and exactly eight empty summary fields. No lesson-completion count is asserted. |
| Review Lesson result | Valid feedback received; Activity complete; Lesson 1 and 2 complete, Lesson 3 incomplete. Questioning/summary gaps lead to implemented Lesson 2. Course is not complete. |
| Retry Activity result | All three lessons and Activity complete. Eight Strong dimensions and a minor Partial Out of Scope omission lead to practice again. Weakness does not revoke completion. |
| Course Complete result | All three lessons and Activity complete, with nine Strong dimensions. View final summary refers to the student's submitted work, not AI-authored answers. |

The captions identify these as design previews. Feedback copy is explicitly not a real AI result. Hidden case facts and evaluation reference answers were not included in the design prompts or repository screenshots.

## Impeccable review method and limits

Impeccable context ran once against `.stitch/DESIGN.md`. Its audit and craft-floor references guided a design-reference review: visual inspection of all eight screenshots, inspection of all eight exported HTML references, one mechanical detector run, one targeted Stitch edit pass, then a final read-only review.

The detector command was:

```powershell
.agents/skills/impeccable/scripts/impeccable.cmd detect --json <temporary-reference-directory>
```

It returned exit code **2** and **19 warnings**: eight flat-type-hierarchy warnings, six cream-palette warnings, and five overused-font warnings. These are not 19 verified product defects:

- Warm paper and Geist are deliberate choices within the user-selected A direction. The brief and Outfit/Geist roles take precedence over generic pattern warnings.
- The flat-hierarchy warnings report headings as 16px. The exported heading classes and rendered screenshots show clear size steps; this is a static-detector limitation with dynamic style resolution.
- Actual issues below were established from screenshots and exported content, not accepted mechanically from the detector.

This was not an implemented-application audit. No live browser, mobile/touch, keyboard, screen-reader, real AI, persistence, or interaction acceptance test ran. Python Playwright was unavailable; no browser framework or app dependencies were installed. The detector was not rerun after the bounded fix pass.

| Audit dimension | Design-reference assessment | Evidence / limit |
| --- | --- | --- |
| Accessibility | 2/4, provisional | Real labels, status words and symbols are present; some small supporting text, low-contrast placeholders and field boundaries remain. No conformance claim. |
| Performance | N/A | No application, bundle, runtime or real AI requests exist to measure. |
| Theming | 2/4, provisional | Two text families and one formal asset are shared; some exported neutral colors and control shapes still differ. |
| Responsive design | 2/4, provisional | Reference source contains column/row reflow; narrow viewport, touch and continuous-resize behavior were not exercised. |
| Reference integrity | 3/4, provisional | Scope and content are substantially aligned; Course completion-row labels regressed and some visual details remain. This is not an implementation-integrity score. |

No `/20` application health score is assigned to an unimplemented product.

## Generation drift and the one correction pass

| Finding | Severity | Final outcome |
| --- | --- | --- |
| Formal-system application to the original A reintroduced future-course descriptions, faculty claims and Public Sans. | P1 content truth | Final Dashboard removes unsupported course descriptions/metadata and uses Outfit + Geist. Coming Soon rows now contain only title and state. |
| Course generation added Help, Sign out, footer destinations and incorrectly selected Progress navigation. | P1 scope | Removed. Final headers expose only Dashboard and Progress; neither is selected on Course/Lesson/Activity. |
| Activity's submit action, completion note and Back to course were compressed into one row. | P2 layout | Corrected: full submit label has its own row, note below, quiet return link separately. |
| Feedback used a generic boxed Summary Analysis wrapper, decorative colored rails and an assessment-count label. | P2 hierarchy | Rails, count and generic enclosing surface removed; explanatory sections are open. Review state still retains an unnecessary Summary analysis heading. |
| Feedback semantic labels and button treatment varied. | P2 consistency | Review/Retry assessment colors now follow the formal semantic scheme; all preserve label + symbol. Some completion pills and other color/shape details remain. |
| Muted text, placeholders and outlines did not consistently meet the declared contrast and size targets. | P1 before release | Partially improved. Canonical tokens are defined, but final capture source still contains small text and faint placeholder/boundary styles. See remaining risks. |
| Course lost the explicit Completed labels/checks on Lesson 1 and 2 during the last edit. | P2 progress clarity | Newly observed in final review; left documented because the single correction pass is exhausted. Overall 2/3 and 50% progress remains visible. |

Positive findings: Dashboard stays editorial rather than SaaS; Lesson content remains visually dominant over Tutor; Activity clearly separates asking from student-authored work; all eight summary fields remain empty and have no required-field gates; all three feedback states contain Questioning Process plus the eight exact dimensions; Progress has truthful completion units and no business metrics or gamification.

## Remaining design risks and capture differences

1. **Course per-row completion clarity:** restore visible Completed + check for Lessons 1 and 2 in a future authorized design pass or implementation. Counts alone should not replace individual row states.
2. **Token precision:** Course still uses amber In progress and a square-looking `rounded-DEFAULT` primary action; Progress also retains amber In progress. Activity and some result captures retain `#FBF9F5`, `#1D2120`, `#5D6664`, and other legacy neutrals rather than the exact canonical roles. These are capture deviations, not permission to introduce another token family.
3. **Small text and contrast:** some `text-xs` supporting labels remain; Activity uses faint `border-line` / `placeholder-ink-subtle` styles, and the Lesson placeholder retains text-opacity styling. Apply the minimum 14px and contrast/control-boundary rules from DESIGN.md. Token calculations support the intended palette: ink/paper **13.90:1**, secondary/paper **5.63:1**, white/primary **7.03:1**; these calculations do not certify every captured element.
4. **Long-form workflow:** the eight-field Activity is long, and a longer real interview may exceed the initial two-lane composition. Verify reading/form position, composer access, long feedback, long titles, browser keyboard and narrow reflow after implementation is separately authorized.
5. **States represented by rules rather than additional screens:** loading, AI failure + Retry, restored state, and narrow Tutor expansion are specified in DESIGN.md but have no separate runtime prototype. Final summary links have no newly designed modal/drawer.
6. **Remote tooling:** update_design_system returned invalid-argument errors. The formal asset was created through the native creation tool, applied to A via apply_design_system, and explicitly reused for every new/final screen. The old exploration asset remains historical. Detailed two-font rules and canonical tokens live in DESIGN.md; do not infer that native theme-enum fields alone capture every rule.

No second audit/polish cycle, mobile screen, print design, interactive prototype, new page, or frontend implementation was started. User review is the next step.

