# Contributing

Roblox Suite contains agent skills and example code. The [website](https://roblox.nonlooped.xyz/) builds its catalog from this repository.

## Verify technical claims

Check new or changed API and policy claims against current primary sources:

- [Engine API Reference](https://create.roblox.com/docs/reference/engine) for classes, properties, and methods.
- [Creator Hub](https://create.roblox.com/docs) for guides and policies.
- [Open Cloud](https://create.roblox.com/docs/cloud) for REST APIs.
- [Documentation index](https://create.roblox.com/docs/llms.txt) and [engine index](https://create.roblox.com/docs/reference/engine/llms.txt) for agent navigation.
- [Rojo documentation](https://rojo.space/docs/v7/) and [releases](https://github.com/rojo-rbx/rojo/releases) for Rojo behavior.

Include source URLs in the affected skill or reference. State any ambiguity the source leaves unresolved, and distinguish platform requirements from design recommendations.

Every `SKILL.md` and reference records `last_reviewed`. Change this date only after verifying the affected guidance against its sources. An editorial edit does not renew verification. Review requirements and freshness limits are in [REVIEW_POLICY.md](REVIEW_POLICY.md).

## Write for the reader

Use Matt Pocock's [writing-for-agents](https://github.com/mattpocock/skills/blob/main/skills/productivity/writing-for-agents/SKILL.md) for agent instructions and Lauren Tan's [unslop](https://github.com/poteto/noodle/blob/main/.agents/skills/unslop/SKILL.md) for prose.

Keep the skill description focused on the tasks that should trigger it. Put shared decisions and constraints in `SKILL.md`; put branch-specific detail in references. Remove repeated instructions and explain what completes a workflow, such as a successful build or a reproduced failure that the fix resolves.

For public copy, name the behavior or API instead of promising correctness, security, or performance. Use plain language and sentence-case headings. Keep technical caveats, source links, and measured limits. Preserve published evaluation outputs verbatim.

## Skill structure

- `SKILL.md` contains routing, decisions, constraints, and links to detailed guidance.
- `references/` contains topic-specific procedures, tables, and examples.
- `scripts/` contains self-contained examples with comments explaining their use and limitations.

Each reference starts with YAML frontmatter:

```yaml
---
read_when: "Diagnose throttling or plan request budgets"
last_reviewed: YYYY-MM-DD
---
```

Write `read_when` as a nonempty, JSON-quoted string without a final period. The catalog generator uses it in the skill's reference index. Describe the task that needs the file; keep the technical detail in the body.

## Luau examples

- Start every script with `--!strict`. Use four spaces for indentation.
- Use `task` APIs and current engine APIs. Mention deprecated APIs only when explaining migration.
- Wrap fallible engine and cloud calls in `pcall`, and handle their failure states.
- Type-annotate module exports and public functions.
- Keep credentials out of scripts. Use Secrets Store and `HttpService:GetSecret`.
- Declare the script's maturity (`experimental`, `reviewed`, or `tested`), verification date, test coverage, and need for adaptation before production use. Keep the header and catalog consistent.

## Catalog and generated files

`catalog.json` owns skill identity, risk, groups, site summaries, source verification, and script maturity. The site imports it directly. After editing the catalog or reference routing cues, run:

```sh
node scripts/generate-catalog-artifacts.mjs
node scripts/check-hub-refs.mjs
```

Edit the source fields rather than text inside `catalog:*` markers. The generator writes `skills.sh.json`, the hub's specialist list, and each skill's reference index. The hub links to specialist entry points; each specialist owns its detailed reference links.

## Website

To work on the Astro site:

```sh
cd site
npm ci
npm run dev
```

Catalog edits affect the site on its next build. For analytics configuration and collected events, read [PRIVACY.md](PRIVACY.md).

## Validate a change

For documentation, catalog, or site changes:

```sh
node scripts/generate-catalog-artifacts.mjs --check
node scripts/check-hub-refs.mjs
cd site && npm ci && npm test
```

For Luau changes, install the pinned tools with Rokit and run the Luau checks in [validate.yml](.github/workflows/validate.yml). Run relevant regression fixtures as described in [tests/README.md](tests/README.md). CI also checks Markdown links and spelling and uses the vendored schema under `schemas/`.

Before submitting, confirm that source citations support changed claims, verification dates reflect actual source checks, generated files are synchronized, and checks relevant to the change pass. Report any missing Studio integration tests in the pull request. Critical changes need the review specified in [REVIEW_POLICY.md](REVIEW_POLICY.md).
