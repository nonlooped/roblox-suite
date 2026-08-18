# Changelog

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

- Moved the documentation site from GitHub Pages (`nonlooped.github.io/roblox-suite`) to Vercel at [roblox-suite.vercel.app](https://roblox-suite.vercel.app/), with root-base URLs and updated sitemap/robots canonicals.
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
