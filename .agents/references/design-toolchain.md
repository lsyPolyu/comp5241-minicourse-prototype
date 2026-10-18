# Design toolchain setup

Verified on 2026-10-17 (Asia/Shanghai), using Codex CLI 0.162.0.
This is an installation record, not a product or architecture specification.

## Installed sources

| Capability | Upstream and revision | Installation |
| --- | --- | --- |
| Stitch Design 1.0.0 | https://github.com/google-labs-code/stitch-skills, commit `0337446dadde6f8c94210444e2aa9d546126480f` | Official Codex marketplace `stitch-skills`, plugin `stitch-design`. |
| taste-design | Same Stitch commit | Complete upstream directory in `.agents/skills/taste-design/` (2 files). |
| design-md | Same Stitch commit | Complete upstream directory in `.agents/skills/design-md/` (3 files); explicit dependency of manage-design-system. |
| Impeccable 4.6.0 | https://github.com/pbakaus/impeccable, commit `08d5b470495d242ca0470f4aeae1956c3a074f83` | Complete upstream Codex distribution in `.agents/skills/impeccable/` (62 files). |
| Impeccable engine 0.1.15 | Official npm `impeccable@4.6.0` optional dependency `@impeccable/cli-windows-x64@0.1.15` | Version cache at `%USERPROFILE%/.impeccable/bin/0.1.15/impeccable.exe`. |

The Stitch plugin lives at
`%USERPROFILE%/.codex/plugins/cache/stitch-skills/stitch-design/1.0.0/`.
Marketplace and plugin enablement are recorded in the user's
`%USERPROFILE%/.codex/config.toml`; those user-wide files are outside this repo.
The marketplace checkout is sparse and does not include stitch-loop. The
stitch-utilities and stitch-build plugin packages were not installed.

`npx impeccable@4.6.0 install -y --providers=codex --scope=project --no-hooks`
was attempted after checking the official README and CLI help. Its bundle
verification request timed out and it installed nothing. Installation then
used the README's upstream-copy approach: the complete checked-in Codex
skill was retrieved from the pinned official commit, with every file verified
against the commit's Git blob hash before copying. No SKILL.md was rewritten.
The official npm platform binary supplies the same pinned engine without
requiring another launcher download. Engine SHA-256:
`981324ea15cc3c107d46b8133b5be77f639dbcd22e671f1eb7d8c69136e9693b`.
No automatic edit hook was installed.

## MCP configuration and authentication

Repository configuration: `.codex/config.toml`.
Endpoint: `https://stitch.googleapis.com/mcp`.
The `X-Goog-Api-Key` header reads the `STITCH_API_KEY` process environment
variable through Codex's `env_http_headers`. No key value belongs in this
file, this record, PRODUCT.md, chat, source files, or Git.

Actual checks:

- Remote MCP `initialize`: HTTP 200.
- Remote MCP `tools/list`: HTTP 200, 15 tools.
- Codex app-server `mcpServerStatus/list`: Stitch discovered, all 15 tools
  returned, no toolsError; authentication reported `notLoggedIn`.
- Read-only `list_projects`: HTTP 401, missing authentication credential.
- STITCH_API_KEY was absent from Process, User, and Machine environments.

Available MCP tools:

- create_project, get_project, delete_project, list_projects
- list_screens, get_screen, generate_screen_from_text, edit_screens, generate_variants
- upload_design_md, create_design_system, create_design_system_from_design_md
- update_design_system, list_design_systems, apply_design_system

Authentication is the only remaining readiness blocker. The user must obtain
a Stitch API key using https://stitch.withgoogle.com/docs/mcp/setup/ and set
`STITCH_API_KEY` through their Windows user environment settings. Fully exit
and reopen Codex so it inherits the new environment, then continue verification
in this repository. Recheck the tool inventory and make a successful read-only
list_projects call; do not generate a design as an authentication test.

## Skill discovery and initialization

An actual Codex app-server `skills/list` forced rescan returned all of the
following with `enabled: true` and no discovery errors:

- taste-design
- design-md
- impeccable
- stitch-design:stitch::generate-design
- stitch-design:stitch::manage-design-system

Codex prefixes plugin skills with the plugin name. These last two entries
are the upstream stitch::generate-design and stitch::manage-design-system
skills, not replacements. Installed local skills are available on the next
turn; reload Codex if a selector still shows a cached list.

The original Windows Impeccable launcher successfully ran `context` against
this repository. The upstream `reference/init.md` workflow was then used to
write root PRODUCT.md with its product-schema marker, using the user's
explicitly confirmed facts and the existing SPEC, PLAN, and requirements
discovery. No new product assumptions required an interview. No landing-page
buildPath preference was selected or persisted. Live setup was skipped
because no runnable frontend exists. No project DESIGN.md was created.

## Authority and scope

- PRODUCT.md: audience, purpose, operating context, UX principles, constraints.
- Root DESIGN.md: the single future project visual authority, when authorized.
- docs/SPEC.md: functional requirements and acceptance criteria.
- docs/PLAN.md: technical architecture.
- docs/TASKS.md: implementation order and status.

Upstream example DESIGN.md files inside skill resource folders are reference
assets, not project design documents. Do not generate a second project visual
authority under `.stitch/`. Use an explicit path to the one approved document.
The user's warm, learning-focused, restrained-motion requirements override
skill defaults such as perpetual animation or marketing hero templates.

This session only sets up tools. P01/T001 remains unstarted. No application,
React components, Tailwind, Dashboard, Lesson, or Activity UI was created.
No remote Stitch project or screen was created, modified, or deleted.

## Integrity and repository checks

- Stitch Design plugin: all 23 installed files exactly match the marketplace
  source checkout; taste-design's 2 files also match exactly.
- Impeccable: all 62 files match pinned upstream Git blob hashes.
- 121 static relative Markdown links across these installed skills resolve.
- All six existing product/background Markdown documents retain their original
  SHA-256 hashes; existing tracked files were not modified.
- Credential-pattern scan of new tool files found no real key/private-key patterns.
- No commit was made; HEAD remains `5e6a4be`.
- The five untracked docs/SPEC.md, PLAN.md, TASKS.md, SCENARIO.md, and
  COURSE_CONTENT_PLAN.md already existed before toolchain setup.

Reproducible local inventory commands:

```powershell
codex plugin list --marketplace stitch-skills --json
codex mcp list
# At the beginning of a future Impeccable session, once per session:
& .\.agents\skills\impeccable\scripts\impeccable.cmd context
```

Use Codex's supported app-server skills/list and mcpServerStatus/list interfaces
for runtime discovery; a configuration file alone does not establish readiness.
