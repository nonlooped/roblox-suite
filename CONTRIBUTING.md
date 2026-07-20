# Contributing

This is an agent skill set. Contributions should keep each skill self-contained and follow the existing conventions. The companion [website](https://roblox-suite.vercel.app/) is the public gateway — the repo is the source of truth the site is built from.

## Accuracy is the contract

This suite's value proposition is opinionated, source-grounded Roblox guidance whose currentness can be measured. Inaccurate or stale content is worse than no content — it trains models to emit wrong code confidently. Before contributing:

1. **Ground every claim in current official Roblox docs.** Primary sources:
   - https://create.roblox.com/docs/reference/engine (Engine API Reference — source of truth for classes/properties/methods)
   - https://create.roblox.com/docs (official guides and tutorials)
   - https://create.roblox.com/docs/cloud (Open Cloud REST API)
   - https://create.roblox.com/docs/llms.txt and https://create.roblox.com/docs/reference/engine/llms.txt (agent-facing indexes)
2. **Triple-check before writing.** If a claim is date-sensitive (policy change, deprecation, new API), verify the current state against the official doc at the time of contribution. Do not rely on memory or older versions of the docs.
3. **Cite source URLs.** Each SKILL.md and reference should list the official source URLs it was built from, so reviewers and future maintainers can re-verify.
4. **When the docs are ambiguous, say so.** Prefer "the docs don't specify this" over a confident guess. A noted gap is a fixable TODO; a fabricated claim is a bug.
5. **Correct, don't soften.** If you find something wrong, fix it. Don't add a "some say X, some say Y" hedge when the official doc is clear.

## Skill structure

Every skill follows the same layout so agents always know where to look:

```
skill-name/
├── SKILL.md        ← overview, decision trees, quick patterns, pointers to references
├── references/     ← deep technical docs for specific problems
└── scripts/        ← maturity-labeled examples to adapt and test
```

1. **SKILL.md first.** Each skill's `SKILL.md` is the entry point. Keep it focused on decision-making, quick patterns, and pointers to `references/`. Don't dump exhaustive tables in SKILL.md — put them in a reference.
2. **Deep details go in `references/`.** Use granular files for tables, edge cases, and long-form explanations. Every reference file must start with YAML frontmatter:
   ```yaml
   ---
   last_reviewed: YYYY-MM-DD
   ---
   ```
   `last_reviewed` is the date the content was last verified against official docs. Update it when you re-verify, not when you merely edit.
3. **Example code goes in `scripts/`.** Scripts must be commented and self-contained. Every script must declare `experimental`, `reviewed`, or `tested` maturity, its verification date, test coverage, and that callers must adapt it before production.

## Luau script requirements

- Every script must start with `--!strict` on the first line. No exceptions.
- Indent with **4 spaces**, never tabs.
- Use the modern `task` API (`task.wait`, `task.spawn`, `task.delay`, `task.defer`, `task.cancel`) — never the deprecated `wait`/`spawn`/`delay`.
- Use modern engine APIs. Avoid deprecated `BodyMover`s, `Humanoid:LoadAnimation`, legacy `Sound`/`SoundGroup` for new audio work (the audio graph is preferred — see roblox-audio), deprecated `Teleport`/`TeleportPartyAsync` variants (use `TeleportAsync`), etc.
- pcall every fallible engine/cloud call (DataStore, Marketplace, Http, Teleport, Policy, etc.).
- Type-annotate module exports and public functions.
- Never ship keys, secrets, or credentials in scripts. Use the Secrets Store and `HttpService:GetSecret`.

## Catalog, routing, and generated artifacts

`catalog.json` is authoritative for skill identity, risk, groups, site summaries, source verification, and script maturity. The site imports it directly. `skills.sh.json` and the hub's specialist block are generated artifacts.

- The hub routes only to specialist `SKILL.md` files; do not add every deep reference to the hub.
- Each specialist owns links to its own references through its generated reference index.
- Edit `catalog.json`, then run `node scripts/generate-catalog-artifacts.mjs`.
- Never hand-edit content between `catalog:*` markers.
- `node scripts/check-hub-refs.mjs` rejects missing skills, orphan references, broken ownership, and hub-to-deep-reference links.

## The website (`site/`)

The Astro site imports `catalog.json` and computes strict per-file verification coverage at build time. Malformed or unreadable frontmatter fails the build. Root content changes that affect metadata trigger Vercel deployment.

```sh
cd site
npm ci
npm run dev
```

Set `PUBLIC_GOATCOUNTER_CODE` in the deploy environment only after the owner chooses a GoatCounter site. When configured, the site records aggregate page views, install copies, single-skill copies, correction reports, and GitHub/skills.sh outbound clicks.

## Maintenance and freshness

Roblox moves fast. The suite's value depends on staying current.

- **`last_reviewed` discipline.** Every `SKILL.md` and reference carries a verification date. Editing does not reset it. Trust uses the oldest date and coverage across the skill. CI limits critical content to 120 days and other content to 180 days.
- **Watch for deprecations.** Roblox deprecates APIs over time (e.g. `Sound`/`SoundGroup` → audio graph; `Teleport*` variants → `TeleportAsync`; Engagement-Based Payouts → Creator Rewards, discontinued July 2025). When a deprecation lands, update the affected skill and add a "Common mistakes this skill prevents" entry if useful.
- **Watch for policy changes.** Monetization policy shifts (e.g. cross-experience sales disabled May 30, 2026; Premium Payouts replaced by Creator Rewards July 24, 2025). These are date-sensitive and must be verified at contribution time.
- **Each SKILL.md lists its official sources.** Re-check those URLs when updating.

## Pull request checklist

- [ ] Every claim verified against current official Roblox docs at contribution time.
- [ ] Source URLs listed in the affected SKILL.md / reference.
- [ ] New/edited `SKILL.md` and references carry valid `last_reviewed: YYYY-MM-DD` frontmatter.
- [ ] New/edited scripts start with `--!strict`, use 4-space indent, and use modern APIs.
- [ ] No deprecated APIs introduced (`Humanoid:LoadAnimation`, `BodyMover`, `wait`/`spawn`/`delay`, legacy `Teleport*` variants, etc.) unless explicitly documenting the legacy API for migration context.
- [ ] No secrets/keys in scripts.
- [ ] Cross-references use correct skill names and relative paths.
- [ ] `catalog.json` is updated and `node scripts/generate-catalog-artifacts.mjs` has synchronized generated files.
- [ ] No broken markdown links (CI checks this).
- [ ] `skills.sh.json` validates against the official schema (CI checks this).
- [ ] No new typos (CI runs `typos`).

## Running checks locally

Install the pinned Luau tools with Rokit, then run:

```sh
node scripts/generate-catalog-artifacts.mjs --check
cd site && npm ci && npm test
stylua --check roblox-*/scripts/*.lua
selene roblox-*/scripts/*.lua
rojo sourcemap default.project.json --output sourcemap.json
luau-lsp analyze --platform roblox --sourcemap sourcemap.json roblox-*/scripts/*.lua
```

CI additionally checks Markdown links and spelling. The skills.sh schema is vendored under `schemas/` so validation does not depend on a mutable network download.