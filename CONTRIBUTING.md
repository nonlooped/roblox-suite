# Contributing

This is an agent skill set. Contributions should keep each skill self-contained and follow the existing conventions.

## Accuracy is the contract

This suite's entire value proposition is "actually current, production-grade Roblox guidance." Inaccurate or stale content is worse than no content — it trains models to emit wrong code confidently. Before contributing:

1. **Ground every claim in current official Roblox docs.** The primary sources are:
   - https://create.roblox.com/docs/reference/engine (Engine API Reference — the source of truth for classes/properties/methods).
   - https://create.roblox.com/docs (official guides and tutorials).
   - https://create.roblox.com/docs/cloud (Open Cloud REST API).
   - https://create.roblox.com/docs/llms.txt and https://create.roblox.com/docs/reference/engine/llms.txt (agent-facing indexes).
2. **Triple-check before writing.** If a claim is date-sensitive (a policy change, a deprecation, a new API), verify the current state against the official doc at the time of contribution. Do not rely on memory or older versions of the docs.
3. **Cite source URLs.** Each SKILL.md and reference should list the official source URLs it was built from, so reviewers and future maintainers can re-verify.
4. **When the docs are ambiguous, say so.** Prefer "the docs don't specify this" over a confident guess. A noted gap is a fixable TODO; a fabricated claim is a bug.
5. **Correct, don't soften.** If you find something wrong, fix it. Don't add a "some say X, some say Y" hedge when the official doc is clear.

## Skill structure

Every skill follows the same layout so agents always know where to look:

```
skill-name/
├── SKILL.md        ← overview, decision trees, quick patterns, pointers to references
├── references/     ← deep technical docs for specific problems
└── scripts/        ← reusable, commented Luau you can copy or adapt
```

1. **SKILL.md first.** Each skill's `SKILL.md` is the entry point. Keep it focused on decision-making, quick patterns, and pointers to `references/`. Don't dump exhaustive tables in SKILL.md — put them in a reference.
2. **Deep details go in `references/`.** Use granular files for tables, edge cases, and long-form explanations. Every reference file must start with YAML frontmatter:
   ```yaml
   ---
   last_reviewed: YYYY-MM-DD
   ---
   ```
   `last_reviewed` is the date the content was last verified against official docs. Update it when you re-verify, not when you merely edit.
3. **Reusable code goes in `scripts/`.** Scripts must be commented, self-contained ModuleScripts, and safe to copy/adapt.

## Luau script requirements

- Every script must start with `--!strict` on the first line. No exceptions.
- Indent with **4 spaces**, never tabs. (No project-wide formatter is enforced yet, but keep the existing style consistent.)
- Use the modern `task` API (`task.wait`, `task.spawn`, `task.delay`, `task.defer`, `task.cancel`) — never the deprecated `wait`/`spawn`/`delay`.
- Use modern engine APIs. Avoid deprecated `BodyMover`s, `Humanoid:LoadAnimation`, legacy `Sound`/`SoundGroup` for new audio work (the audio graph is preferred — see roblox-audio), deprecated `Teleport`/`TeleportPartyAsync` variants (use `TeleportAsync`), etc.
- pcall every fallible engine/cloud call (DataStore, Marketplace, Http, Teleport, Policy, etc.).
- Type-annotate module exports and public functions.
- Never ship keys, secrets, or credentials in scripts. Use the Secrets Store and `HttpService:GetSecret`.

## Cross-linking

- Use relative markdown links so agents can follow the chain (`../roblox-datastores/SKILL.md`, `references/foo.md`).
- Use correct skill names and paths. The hub (`roblox/SKILL.md`) lists every skill; update it when adding a skill.
- Update `skills.sh.json` when adding a skill so the directory grouping stays correct.
- Update the root `README.md` skill table when adding a skill.

## skills.sh manifest (`skills.sh.json`)

The manifest at repo root drives how skills are grouped on the [skills.sh](https://skills.sh) directory. The `groupings` field is load-bearing — it renders as categories on the skill's directory page. When adding a skill:

1. Add the skill name to the appropriate `groupings[].skills` array (create a new grouping only if no existing one fits).
2. Keep `notGrouped: "bottom"` (skills not in any grouping sort to the bottom of the page).
3. The manifest validates against `https://skills.sh/schemas/skills.sh.schema.json` in CI.

## Maintenance and freshness

Roblox moves fast. The suite's value depends on staying current.

- **`last_reviewed` discipline.** Every reference carries a `last_reviewed` date. A quarterly sweep should re-verify each reference against its cited official docs and bump the date. A reference older than ~6 months is a candidate for review.
- **Watch for deprecations.** Roblox deprecates APIs over time (e.g. `Sound`/`SoundGroup` → audio graph; `Teleport*` variants → `TeleportAsync`; Engagement-Based Payouts → Creator Rewards, discontinued July 2025). When a deprecation lands, update the affected skill and add a "Common mistakes this skill prevents" entry if useful.
- **Watch for policy changes.** Monetization policy shifts (e.g. cross-experience sales disabled May 30, 2026; Premium Payouts replaced by Creator Rewards July 24, 2025). These are date-sensitive and must be verified at contribution time.
- **Each SKILL.md lists its official sources.** Re-check those URLs when updating.

## Pull request checklist

- [ ] Every claim verified against current official Roblox docs at contribution time.
- [ ] Source URLs listed in the affected SKILL.md / reference.
- [ ] New/edited references carry `last_reviewed: YYYY-MM-DD` frontmatter.
- [ ] New/edited scripts start with `--!strict`, use 4-space indent, and use modern APIs.
- [ ] No deprecated APIs introduced (`Humanoid:LoadAnimation`, `BodyMover`, `wait`/`spawn`/`delay`, legacy `Teleport*` variants, etc.) unless explicitly documenting the legacy API for migration context.
- [ ] No secrets/keys in scripts.
- [ ] Cross-references use correct skill names and relative paths.
- [ ] If adding a skill: hub `roblox/SKILL.md`, `skills.sh.json`, and `README.md` all updated.
- [ ] No broken markdown links (CI checks this).
- [ ] `skills.sh.json` validates against the official schema (CI checks this).
- [ ] No new typos (CI runs `typos`).

## Running checks locally

- **Links:** `lychee --exclude 'rbxassetid://.*' --exclude 'mailto:.*' '**/*.md'` (or rely on CI).
- **Manifest:** `ajv validate -s https://skills.sh/schemas/skills.sh.schema.json -d skills.sh.json --strict=false --spec=draft2020`.
- **Spelling:** `typos` (install via your package manager or `cargo install typos-cli`).
- **Luau syntax/types:** `luau-lsp analyze --platform roblox <file>` for ad-hoc checks (not yet wired into CI).