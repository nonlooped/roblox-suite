# Changelog

## 1.10.0 — 2026-09-19

### Website

- Rebuilt the site around what a reader is trying to build rather than around the project's own method. The home page now opens the catalog by goal and drops the prose that explained the citation process.
- Replaced the grouped catalog list with a searchable, filterable index of skill tiles. It still renders on the server, so the full catalog is present without JavaScript.
- Removed the standalone `/evidence/` source list and folded each skill's sources into a disclosure on its own page, beside the claims they support. `/evidence/` now redirects to the catalog.
- Removed the home page's API-correction section and the timed carousel that presented it, along with the `CorrectionPanel` component and the `corrections.ts` data that only it used.
- Restricted section backgrounds to cobalt or yellow. Off-white is now a panel fill only — skill tiles, unpressed keys, the search field, the sources disclosure — so it no longer drenches whole sections.
- Renamed the risk badges to plain language, added a copy button to every install command, and gave the hero tower a pointer lean.
- Dropped the Motion dependency with the carousel. Total built client JavaScript is down from 364 KB to 240 KB.

### Skills and documentation

- Shortened all skill descriptions and removed repeated routing and implementation prose.
- Added task cues to reference indexes, generated from each reference's `read_when` field.
- Edited documentation, catalog summaries, website copy, and the social preview using writing-for-agents and unslop. Source verification dates and saved evaluation outputs are unchanged.

## 1.9.0 — 2026-09-19

### Corrected and added

- Updated Studio MCP to explicit `studio_id` targeting, current tool names, and explicit Edit/Client/Server execution contexts.
- Migrated collision-group examples from deprecated `PhysicsService` methods to per-world `WorldRoot` methods.
- Removed withdrawn per-instance audio effect toggles, corrected `GetAudibilityFor` and `AudioPlayer.Volume`, and clarified Mandarin TTS voices.
- Corrected Open Cloud non-finite-number serialization, teleport value-type and GUI-reference rules, and the distinction between teleport initiation and confirmed arrival.
- Updated DataStore scheduling and session-locking guidance, and limited the generic testing retry example to retry-safe reads.
- Added Studio Network Simulator guidance, current UIGradient controls, fixed simulation animation callbacks, and OAuth app review requirements.
- Recorded the source-drift review in [the September review report](reviews/2026-09-19-source-drift.md). Critical guidance corrections are explicitly experimental pending second human review under the repository review policy. Existing script maturity labels remain unchanged.

### Dependencies and verification

- Updated site packages, including Astro 7.3.3, React 19.3.0, Motion 13.4.0, Lucide React 1.47.0, and the fast-uri security update; refreshed the lockfile and install-script approvals. The private site package now matches the suite's 1.9.0 release version.
- Updated the pinned toolchain to luau-lsp 1.69.0 and Rojo 7.7.0, refreshed vendored Roblox API definitions and checksum, and updated typos to 1.50.2.
- Expanded source monitoring to cover all engine reference files and relevant guide directories, including APIs whose class names lack the old keyword patterns.

## 1.8.0 — 2026-08-18

### Corrected

- Re-verified TeleportService against official Creator Docs (commits 6dcd99db, 2aa3d59b): legacy `Teleport`/`TeleportPartyAsync`/`TeleportToPlaceInstance`/`TeleportToPrivateServer`/`TeleportToSpawnByName` now documented as deprecated with `TeleportAsync` server-only guidance and `RemoteEvent` migration path.
- Documented `OrderedDataStore:BatchGetAsync` (commit 23280f5c): batch reads return `Dictionary<string, {value}>`, count as N `OrderedRead` requests (experience + server budgets), and share `OrderedReadExperienceThrottled`/`GameServerThrottled` handling.
- Expanded audio graph verification (commit 23280f5c): `AudioEmitter`/`AudioListener` per-instance `OcclusionEnabled`/`DiffractionEnabled`/`ReverbEnabled` (`SimulationMode`), `DistanceAttenuationMode` + `DistanceAttenuationBounds` (`[4, 10000]`), angle/distance attenuation and `GetAudibility`, plus `AudioPlayer` mixer-time scheduling (`Play`/`Stop` `atTime`, `Cancel`) and `AudioDeviceInput` access lists.
- Corrected `TeleportInitFailed` and physics `collisions-and-filtering` references and clarified `CoverSources` verification.

### Dependencies

- Bumped `astro` 7.1.6 → 7.2.0, `lucide-react` 1.28.0 → 1.31.0, `motion` 12.43.0 → 13.0.0 (with `framer-motion` 13.1.0) and other site packages; upgraded `crate-ci/typos` and GitHub Actions.

### CI

- Switched site deployment to Vercel GitHub integration with directory-index serving, pinned Vercel CLI with token via env, tightened `source-monitor` file filtering, and consolidated smoke/validate workflows.

### Maintainer

- Marked local `.opencode/` caches as internal (gitignored) and removed the tracked release skill from the product tree.

## 1.7.1 — 2026-07-20

### Corrected

- Re-verified DataStore limits against official docs: experience request bases are `300 + concurrentUsers × N` (not 250/10/100), storage is `500 MB + 1 MB × lifetime users` measured on compressed latest-version size, and Open Cloud v2 Data Store traffic shares the experience request budget with game servers. Legacy Open Cloud v1 keeps separate fixed limits after July 29, 2026.

### Site

- Moved the documentation site to [roblox.nonlooped.xyz](https://roblox.nonlooped.xyz/), with root-base URLs and updated sitemap/robots canonicals.
- Added Google Search Console verification for the Vercel host and serve a single `sitemap.xml` for indexing.

### Dependencies

- Upgraded Astro to clear Dependabot alerts and TypeScript to 6.0.3.

## 1.7.0 — 2026-07-19

### Site

- Rebuilt the documentation site with React islands, a new visual system, and clearer install and evidence flows.
- Added interactive hero, install picker, correction panel, and tool logo strip components.
- Mapped each catalog cover claim to source citations via `cover_sources` and surfaced those links on skill pages.
- Simplified site validation scripts around the catalog and built-route checks; removed nested accidental font copies.

### Content

- Added per-cover source indexes for every skill in the authoritative catalog.
- Softened debugging skill copy that named a specific unit-test framework.

### Maintainer

- Expanded gitignore for local AI caches and scratch artifacts.
- Added a tracked release skill for cutting versions consistently.

## 1.6.4 — 2026-07-16

### CI

- Allowlisted the opaque Google site-verification token in spelling checks.

## 1.6.3 — 2026-07-16

### CI

- Allowlisted the Roblox-specific terms “LOD” and “unparented” in the spelling checker.

## 1.6.2 — 2026-07-16

### CI

- Excluded vendored Roblox API identifiers from spelling checks and replaced a partial-word deprecation regex that the spelling checker correctly rejected.

## 1.6.1 — 2026-07-16

### CI

- Excluded the project's live GitHub Pages URLs from the external Markdown link check; generated-route and post-deployment smoke tests validate those URLs without racing the deployment job.

## 1.6.0 — 2026-07-16

### Corrected

- Fixed Robux transfer economics and separated platform rules from design recommendations.
- Marked `RemoveVersionAsync` deprecated and removed it from current workflows.
- Removed the blanket claim that all Marketplace purchase APIs require Studio API Services.
- Corrected `TeleportInitFailed` callback guidance and additional deprecated Luau examples found by static analysis.

### Safer examples

- Enforced RateLimiter minimum intervals and lifecycle cleanup.
- Added explicit DataStore write outcomes and removed default ambiguous-write replay.
- Made reserved-server allocation atomic and separated teleport initiation from arrival.
- Made Open Cloud retries method-, idempotency-, and rate-limit-header-aware.
- Added maturity headers and focused high-risk regression fixtures.

### Verification and community

- Added pinned Luau formatting, lint, analysis, site checks, strict frontmatter/catalog validation, generated-route smoke tests, and source monitoring.
- Added the authoritative catalog, per-file freshness coverage, evidence page, correction flow, policies, roadmap, and evaluation harness.

This release establishes the first repository-wide correctness, verification, and evaluation baseline. Owner-controlled branch protection and repository settings remain separate from versioned files.
