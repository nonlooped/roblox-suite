# Review policy

Every change must pass required CI and preserve the source-grounded correctness contract.

## Risk tiers

- **Critical:** networking, DataStores, monetization, Open Cloud, teleportation, and security-sensitive hub guidance.
- **Medium:** core, physics, NPCs, testing, Rojo, and Studio MCP.
- **Lower:** UI, animation, VFX, and audio presentation patterns.

The authoritative tier is the `risk` field in `catalog.json`.

## Evidence by tier

| Requirement | Critical | Medium | Lower |
| --- | --- | --- | --- |
| Current official source | Required | Required | Required |
| Verification date | Required | Required | Required |
| Static analysis for code | Required | Required | Required |
| Focused behavioral regression | Required for behavior changes | When behavior changes | When behavior changes |
| Second human reviewer | Required before release | Recommended | Optional |
| Ambiguity/limitation note | Required when applicable | Required when applicable | Required when applicable |

A maintainer may not self-approve a critical behavior or policy change. If a second reviewer is unavailable, the change remains unreleased or is explicitly labeled experimental.

## Freshness

CI fails when the oldest guidance-file verification exceeds 120 days for critical skills or 180 days for other skills. Editing prose does not reset verification; update `last_reviewed` only after checking every affected claim against its listed sources.

## Script maturity

- `experimental`: not behaviorally covered; adapt and test.
- `reviewed`: design reviewed and focused fixtures exist, but platform integration may remain.
- `tested`: automated behavior and relevant Roblox integration are visible and repeatable.

A script may move up a tier only when its header and `catalog.json` agree.
