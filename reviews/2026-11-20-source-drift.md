# Source drift review - 2026-11-20

[Issue #77](https://github.com/nonlooped/roblox-suite/issues/77) listed six commits through `5a56d0d361d709aa785585b738354134ae47b4ae`, already inside the [November 16 review](2026-11-16-source-drift.md). Rechecked that overlap for gaps: v1.13.0 already covered the MCP, Script Sync, DataStore deletion, and Studio teleport changes. This review adds the missed Studio CLI `--background` flag and the corrected nesting for experience notifications.

Checked [the nine subsequent Creator Docs commits](https://github.com/Roblox/creator-docs/compare/5a56d0d361d709aa785585b738354134ae47b4ae...2f1abb9e08fd42cba37cb0d69f5b303cc1432ee1) through November 19 against current suite guidance. This is a review of changes, not a full re-verification of every skill.

| Area | Disposition and official source |
| --- | --- |
| Passes | [Free trials](https://create.roblox.com/docs/en-us/production/monetization/passes#free-trials) can produce a successful prompt event and temporary access. Replaced contradictory grant and persistence examples and changed the UI helper to check paid ownership. Trial rollout is scheduled for December 2, 2026. Critical guidance and helper remain experimental. |
| Teleports | [TeleportOptions](https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportOptions) documents `ForcePublicServer`, and [MarketplaceService](https://create.roblox.com/docs/en-us/reference/engine/classes/MarketplaceService#PromptVIPServerPurchase) adds the VIP purchase prompt. Guidance only; no changes to reserved allocation. |
| Data stores | [Error codes and limits](https://create.roblox.com/docs/en-us/cloud-services/data-stores/error-codes-and-limits) now lists the 400-level JSON nesting limit. No retry policy change. |
| Studio | Added [Team Test collaborator logs](https://create.roblox.com/docs/en-us/studio/testing-modes#collaborator-logs) and the new [TestService](https://create.roblox.com/docs/en-us/reference/engine/classes/TestService) entry points without making existing fixtures depend on their rollout. The regression runner now reports failures without relying on the legacy TestService logger. |
| Presentation | Split [native UI particles](https://create.roblox.com/docs/en-us/ui/2D-particle-emitters) from world emitters; kept the scripted fallback. Added pointers to AudioFDNReverb and the R6-to-R15 migration guide. The 3D emitter guide rewrite did not require changing the suite's burst helper. |
| Open Cloud | Corrected [experience notification](https://create.roblox.com/docs/en-us/cloud/guides/experience-notifications#include-launch-and-analytics-data) nesting. Compared operation changes in the OpenAPI snapshot; the named OAuth scopes for Luau execution and place-instance operations are first-party only. [Targeted experiments](https://create.roblox.com/docs/en-us/production/experiments#per-session-evaluation) started after November 17 keep assignments after eligibility changes. |
| No suite implementation change | Advertising, analytics, paid-access demo mode, and other API additions outside the suite's workflows do not require new examples. Remaining engine updates include new editor, avatar, chat, and rendering APIs and editorial changes. The suite has no example relying on the removed Workspace destroy-replication setting. |

## Validation

Catalog and site checks, Luau formatting/lint/analysis, the Rojo fixture build, and spelling passed. A standalone Luau mock confirmed that trial users can still buy, a successful trial prompt does not show Owned, a verified purchase does, and invalid or failed lookups do not count as ownership. No Studio or live experience tests were run.

## Limits

Dates were not reset for unrelated claims in partially reviewed files. The review does not verify behavior in a live Roblox experience. Trial start, expiry, paid conversion, and the public-teleport path need integration checks before production use. Critical changes are experimental pending a second human review.
