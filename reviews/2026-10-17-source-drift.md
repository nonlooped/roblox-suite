# Source drift review — 2026-10-17

Reviewed the 20 Creator Docs commits listed in [issue #54](https://github.com/nonlooped/roblox-suite/issues/54) (from [6991e0e7](https://github.com/Roblox/creator-docs/commit/6991e0e7ed63ed42cad6878515f98af1db85c35f) through [fc8b6033](https://github.com/Roblox/creator-docs/commit/fc8b6033) and the rest of the list). Most changed files are art, avatar, and media content that no suite skill cites; those were skipped after checking the suite's source list. The review covers files the suite cites: DataStores, monetization, teleport, webhooks, and the engine classes listed below.

This is a change-focused review, not a whole-suite re-verification. Verification dates are updated only where the affected claims were checked against the changed source. No Studio backend integration tests were run, and no script was promoted to tested maturity.

| Area | Finding and disposition | Official source |
| --- | --- | --- |
| DataStore limits and error codes | Request budgets, per-key throughput (25 MB read, 4 MB write per minute), storage formula, queue size of 30, and error codes 101–107, 301–305, 403, and 511–512 match. The `RemoveVersionAsync` throttle and deprecation match. Dates updated. | [Error codes & limits](https://create.roblox.com/docs/cloud-services/data-stores/error-codes-and-limits) |
| DataStore best practices | The rewritten "Shard hot keys" guidance limits sharding to per-key read throttling and notes that writes across copies are not atomic. The suite already says to shard only when throughput requires it and to keep atomic values in one key, so no change was needed. Dates updated. | [Best practices](https://create.roblox.com/docs/cloud-services/data-stores/best-practices) |
| Monetization policy | Cross-experience pass and developer product sales ended May 30, 2026. `rules-policies-and-security.md` already states this. Dates updated. | [Passes](https://create.roblox.com/docs/en-us/production/monetization/passes), [Developer products](https://create.roblox.com/docs/en-us/production/monetization/developer-products) |
| Teleport | Value-only teleport data, GUI external-reference clearing, and the deprecated legacy methods match the suite's existing teleport guidance. The experimental notice stays. Dates updated. | [TeleportOptions](https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportOptions), [TeleportService](https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportService) |
| Webhook refunds | The **Transaction Refunded** trigger covers developer products, passes, private servers, and paid access, and does not include subscriptions. Developer-product benefits must be revoked in your own data. The suite did not describe this. Added to the Open Cloud webhook section, labeled experimental. The subscription event list was already correct. | [Webhook notifications](https://create.roblox.com/docs/en-us/cloud/webhooks/webhook-notifications) |
| Networking (`HttpService`) | The WebStreamClient concurrent-client limit changed from six to four. The suite does not mention WebStreamClient, so no change was needed. | [HttpService](https://create.roblox.com/docs/en-us/reference/engine/classes/HttpService) |
| Physics | Collision-group guidance on `WorldRoot` remains correct. `BasePart:BindToCollisionSummaries()` is new and not covered; added as a candidate for a future release, not added now. | [BasePart](https://create.roblox.com/docs/en-us/reference/engine/classes/BasePart), [WorldRoot](https://create.roblox.com/docs/en-us/reference/engine/classes/WorldRoot) |
| Other engine classes | `Instance`, `RunService`, `TweenService`, `Workspace` (`ExperimentalSolverIsEnabled` removed), `Players`, `Player` (`Idled` timing note), `AudioEmitter`/`AudioListener` (type annotations), `GuiObject` (Deprecated tags), `MarketplaceService:OpenShop` (new), and `TestService`. The suite does not cite the changed members, so no guidance change. | Creator Docs engine references |

## Not covered

- Webhook **Early Harm Detection** (experiments) is new. The suite does not describe the experiment webhook events, so nothing needed correction.
- Open Cloud OpenAPI and `datastores-api/v1.json` changes were not checked in full. The suite cites Open Cloud endpoints generally, not these specific schema details.
- Metrics, analytics, alerts, SLIM streaming, and collisions guides changed in these commits. None are cited by the suite's guidance, so they were not reviewed.

## Review limitations

Under [REVIEW_POLICY.md](../REVIEW_POLICY.md), the critical webhook refund note is experimental pending a second human reviewer. Critical DataStore and teleport verification dates were updated because the affected claims were checked, but this does not replace the second-reviewer requirement for any behavior change.

The repo's freshness rule (CI fails above 120 days for critical skills) was not found in the scripts I inspected. Verification here was limited to the sections listed above.

## Verification

- `npm test` in `site/`: content validation, Astro type checking, static build, and built-site smoke check.
- `npm audit --omit=dev`: 0 vulnerabilities after the sharp override.
- `generate-catalog-artifacts.mjs --check` and `check-hub-refs.mjs` on a clean LF checkout.
- Not run locally: StyLua, Selene, Rojo, and luau-lsp (no Luau files changed), and the typos and lychee CI jobs.
