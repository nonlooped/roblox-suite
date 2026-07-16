---
last_reviewed: 2026-07-16
---

# Rules, Policies, and Security for Game Passes

## Important Policy Changes (2026)

As of **May 30, 2026**, cross-experience game pass and developer product sales are disabled. You can no longer sell a pass or dev product from Experience A inside Experience B. Sales on an experience's own details page (EDP) remain available for passes and developer products owned by that experience.

If your game previously relied on cross-experience pass sales (common in donation/tipping games), migrate to experience-specific passes and/or the [Robux Transfers API](https://create.roblox.com/docs/en-us/production/monetization/robux-transfers). `MarketplaceService:PromptRobuxTransferAsync` must be called from the server. Only **Roblox Plus** subscribers can initiate transfers, transfer amounts must be between **10 and 500 Robux**, and the sender cannot equal the receiver. The recipient receives **90%** and the experience earns the other **10%**; Roblox takes no transfer fee. A `BindReceiptHandler` callback must process transfer receipts. Roblox permits items or perks after a successful transfer receipt. Avoiding quid-pro-quo rewards can still be a useful anti-abuse or game-design choice, but it is not a platform requirement.

## What Game Passes Can and Cannot Do

Allowed:
- Permanent access (VIP areas, servers)
- Permanent unlocks (items, classes, slots)
- Cosmetic or quality-of-life upgrades

Restricted / Policy-sensitive:
- Randomized virtual items / loot boxes (must follow Paid Random Items policy)
- Anything that could be seen as gambling without proper disclosures

Passes must comply with Roblox Community Standards.

### Paid Random Items Policy Check

Before offering any paid randomized virtual item (loot box, gacha, random crate, etc.), query `PolicyService:GetPolicyInfoForPlayerAsync(player)` and check:

- `ArePaidRandomItemsRestricted` — if true for this user, do not offer paid random items.
- `IsPaidItemTradingAllowed` — if false, do not allow paid item trading.

Respecting these flags per-player is required by Roblox policy.

## Capability Requirements

Do not apply a blanket “API Services required” rule to all `MarketplaceService` purchase APIs. Publish the experience where the relevant product or transfer API requires it, and check that API's current Engine Reference requirements. Enable **Studio Access to API Services** only for APIs that require it and only in a dedicated test experience.

## Security Rules (Critical)

1. **Prompt on client only.** Never call `PromptGamePassPurchase` from the server in response to untrusted client input.
2. **Grant on server only.** The `PromptGamePassPurchaseFinished` handler (and `PlayerAdded` re-check) are the only places that should mutate player state based on pass ownership.
3. **Always re-verify.** Even after a successful purchase event, call `UserOwnsGamePassAsync` on the next join. Do not cache the "just purchased" state forever.
4. **pcall everything.** Marketplace calls can fail due to network, throttling, or player actions.
5. **Do not trust client signals.** A RemoteEvent saying "I just bought the pass" must be ignored for granting purposes.

## Data Persistence Integration

When a player owns a pass, you typically want to:
- Apply runtime benefits (attributes, speed multipliers, access flags)
- Persist the ownership or derived perks in your DataStore profile

Recommended: Treat `UserOwnsGamePassAsync` as the source of truth on load. Use your DataStore only for additional pass-related custom data (e.g. "unlocked skin variants for this pass").

See roblox-datastores skill for proper loading/saving patterns around this.

## Right to be Forgotten (RTBF)

If you implement automated data deletion for user requests, include any keys that store pass-related custom data.

Use the Data Stores Manager or Open Cloud to inspect/delete when needed.

## Testing and Compliance

- Test the full ownership flow on a test experience.
- Verify that players who buy the pass while in one server see the benefit when they join a different server.
- Make sure "Already owns" states are shown correctly so players aren't prompted again.
- Document what the pass actually gives (in description and in-game UI) to avoid support tickets and policy issues.

## Common Violations to Avoid

- Granting benefits based only on a client Remote.
- Selling the same permanent benefit as both a game pass and a developer product (causes confusion and potential policy problems).
- Hardcoding Robux prices in UI (breaks regional pricing and optimizations).
- Using passes for temporary effects that should be developer products.

Treat these as a starting checklist, then re-check current policy, threat-model the experience, and test each purchase/receipt path. This guidance cannot guarantee security or policy compliance.