# Changelog

## Unreleased

### Site

- Moved the documentation site from GitHub Pages (`nonlooped.github.io/roblox-suite`) to Vercel at [roblox-suite.vercel.app](https://roblox-suite.vercel.app/), with root-base URLs and updated sitemap/robots canonicals.

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
