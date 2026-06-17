---
last_reviewed: 2026-06-17
---

# Rules, Policies, and Security for Game Passes

## Important Policy Changes (2026)

As of **May 30, 2026**, cross-experience game pass and developer product sales are disabled. You can no longer sell a pass or dev product from Experience A inside Experience B. Sales on an experience's own details page (EDP) remain available for passes and developer products owned by that experience.

If your game previously relied on cross-experience pass sales (common in donation/tipping games), migrate to experience-specific passes and/or the [Robux Transfers API](https://create.roblox.com/docs/en-us/production/monetization/robux-transfers). `MarketplaceService:PromptRobuxTransferAsync` must be called from the server. Only **Roblox Plus** subscribers can initiate transfers, amounts are clamped to **10–500 Robux** per transaction, the sender cannot equal the receiver, Roblox takes a **10% platform fee**, and the recipient receives **90%**. A `BindReceiptHandler` callback must process transfer receipts; donations are high-risk for abuse and should include anti-abuse checks (rate limits, alt detection, moderation, no quid-pro-quo rewards).

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

All `MarketplaceService` purchase APIs (`PromptGamePassPurchase`, `PromptPurchase`, developer-product `ProcessReceipt`, `PromptRobuxTransferAsync`, personalization calls, etc.) require **API Services** to be enabled for the place. In Studio this is controlled by **Game Settings → Security → Enable Studio Access to API Services** for local testing; live published places rely on the experience's deployed settings. Game passes, developer products, and transfers also require the experience to be published.

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

Follow these and the implementation will be both secure and policy-compliant.