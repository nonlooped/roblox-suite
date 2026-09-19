# Source drift review — 2026-09-19

Reviewed the 29 Creator Docs commits since 2026-08-18 against the suite's covered topics, including the reports in [issue #45](https://github.com/nonlooped/roblox-suite/issues/45). Current source snapshot: [e622b54ba7f82f38dbbe7182bae6049627dfb9a5](https://github.com/Roblox/creator-docs/tree/e622b54ba7f82f38dbbe7182bae6049627dfb9a5).

This is a change-focused review, not a new whole-suite verification. Older `last_reviewed` dates remain where only affected sections were checked. New focused references and fully reviewed files carry the current date. No Studio backend integration tests were run, and no script was promoted to tested maturity.

| Area | Finding and disposition | Official source |
| --- | --- | --- |
| Studio MCP | Use explicit `studio_id`, current tool names, and `datamodel_type`; removed assumptions about a shared active instance. | [MCP](https://create.roblox.com/docs/studio/mcp) |
| Physics | Collision group configuration belongs to `WorldRoot`; existing `PhysicsService` methods forward to Workspace. Updated examples and catalog. | [WorldRoot](https://create.roblox.com/docs/reference/engine/classes/WorldRoot), [PhysicsService](https://create.roblox.com/docs/reference/engine/classes/PhysicsService) |
| Audio | Removed individual effect toggles absent from the current reference; retain global and emitter/listener acoustic switches. Corrected audibility method names and a Volume typo. | [AudioEmitter](https://create.roblox.com/docs/reference/engine/classes/AudioEmitter), [AudioListener](https://create.roblox.com/docs/reference/engine/classes/AudioListener), [SoundService](https://create.roblox.com/docs/reference/engine/classes/SoundService) |
| DataStore serialization | Open Cloud represents existing non-finite numbers as tagged objects; finite new values remain the recommendation. | [Open Cloud data stores](https://create.roblox.com/docs/cloud/guides/data-stores#non-finite-numbers) |
| DataStore operations | Stagger recurring requests, preserve per-key order, reconcile ambiguous writes, and check session ownership in the profile update rather than a separate lock key. | [Best practices](https://create.roblox.com/docs/cloud-services/data-stores/best-practices), [Player data](https://create.roblox.com/docs/cloud-services/data-stores/player-data-purchasing) |
| Teleport | Clarified value-only transfer, GUI references, reserved access codes, and arrival verification. Legacy method deprecation messages remain despite changes to Deprecated tags; keep TeleportAsync guidance. | [TeleportOptions](https://create.roblox.com/docs/reference/engine/classes/TeleportOptions), [TeleportService](https://create.roblox.com/docs/reference/engine/classes/TeleportService) |
| UI | Added gradient type, scale, and tiling; fixed the transparency sequence type. Existing TweenService guidance remains appropriate despite API tag churn. | [UIGradient](https://create.roblox.com/docs/reference/engine/classes/UIGradient) |
| Animation | Documented fixed animation callback ordering and replay considerations. Rig-link and terminology edits do not require rewriting existing Animator/IK examples. | [RunService](https://create.roblox.com/docs/reference/engine/classes/RunService), [Animation](https://create.roblox.com/docs/animation) |
| Testing | Added the beta Network Simulator workflow and its staged Apply and nonzero default behavior. | [Network Simulator](https://create.roblox.com/docs/studio/network-simulator) |
| Open Cloud | Added OAuth category, implemented-scope, and demo requirements. | [OAuth registration](https://create.roblox.com/docs/cloud/auth/oauth2-registration) |
| Other source changes | Reviewed API metadata, internal/security-restricted members, avatar/asset authoring, publishing, and promotional changes for overlap. These do not justify adding every new API to the suite. Pathfinding CreatePath's added summary does not change existing guidance. | [Creator Docs history](https://github.com/Roblox/creator-docs/commits/main/) |

## Review limitations

Under [REVIEW_POLICY.md](../REVIEW_POLICY.md), the critical DataStore, Open Cloud, and teleport guidance corrections in this release are explicitly experimental pending a second human reviewer. They are source-backed documentation corrections, not claims of platform integration coverage. Their affected reference files carry the same notice.

## Verification

- Clean npm install, content/catalog/routing validation, Astro type checking, static build, and generated-route checks.
- npm audit reports zero known vulnerabilities at review time.
- StyLua formatting, Selene linting, Rojo regression-fixture build and sourcemap generation, and luau-lsp analysis against refreshed vendored definitions.
- Script behavior remains covered only to the existing maturity level; executing Studio regression fixtures and backend integration requires Roblox Studio.
