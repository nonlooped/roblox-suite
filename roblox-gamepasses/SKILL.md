---
name: roblox-gamepasses
description: "Implement Roblox game passes, developer products, subscriptions, and Robux transfers. Use for purchase prompts, server-side fulfillment, ownership checks, recurring benefits, and monetization policy."
last_reviewed: 2026-07-16
---

# roblox-gamepasses

**Primary official source:** https://create.roblox.com/docs/en-us/production/monetization/passes (plus developer-products.md for contrast, and the MarketplaceService class reference).

Grant benefits on the server after verifying the purchase or ownership. Keep purchase prompts and shop display on the client.

Use [roblox-datastores](../roblox-datastores/SKILL.md) to record an idempotent one-time grant, not to mirror pass ownership. Read [roblox-networking](../roblox-networking/SKILL.md) when purchases interact with Remotes.

## Game passes and developer products

- **Game Pass**: One-time purchase for access in that experience, subject to revocation (for example, after a refund). A free trial can grant temporary access without ownership.
- **Developer Product**: Repeatable / consumable (currency packs, potions, revives, temporary boosts). Can be bought many times. Requires ProcessReceipt callback on the server for fulfillment.
- As of **May 30, 2026**, cross-experience game pass and developer product sales are disabled. Design experience-specific passes or use the [Robux Transfers API](https://create.roblox.com/docs/en-us/production/monetization/robux-transfers) for donation-style flows. `MarketplaceService:PromptRobuxTransferAsync` must be called from the server. Only **Roblox Plus** subscribers can initiate transfers, transfer amounts must be between **10 and 500 Robux**, and the sender cannot equal the receiver. The recipient receives **90%** and the experience earns the other **10%**; Roblox takes no transfer fee. A `BindReceiptHandler` callback must process transfer receipts. Roblox permits an experience to grant items or perks after a successful receipt; choosing not to attach rewards is an opinionated anti-abuse/design recommendation, not a platform rule.
- Your server is responsible for delivering the benefit; Roblox handles the purchase and reports access and ownership.
- Passes can be used for randomized virtual items only if you follow the Paid Random Items policy.

## Creation and asset ID

1. Creator Dashboard → your published experience → Monetization → Passes → Create a Pass.
2. Upload circular-friendly icon (≤512×512, jpg/png/bmp; important content must survive circular crop).
3. Name + description.
4. After creation: hover the pass → ⋯ → Copy Asset ID. This number is the passID you use in all scripts.

For external sales on the game page Store tab: go to the pass → Sales → enable "Item for Sale" and set Robux price (1 to 1B).

## Prompt purchases and grant benefits

> Free-trial guidance and the updated helper are experimental pending a second human review and Studio integration tests. Roblox documents availability for enabled passes starting December 2, 2026.

- Prompt from the client; keep all grants and access checks for gameplay on the server.
- Use `GetPassOwnershipAsync(player, passId).Owned` for paid ownership and for the shop's **Owned** label. A trial user must still be able to buy the pass.
- Use `UserOwnsGamePassAsync` as a temporary access check at the point of use. It returns `true` for owners and active trials; do not cache it for the session or persist it.
- Treat `PromptGamePassPurchaseFinished` with a `true` result as a cue to recheck, not proof of purchase. See [purchase flow and granting](references/purchase-flow-and-granting.md) for the server pattern and rollout details.

**GetProductInfoAsync for dynamic UI (price, name, description, IsForSale):**
Use `MarketplaceService:GetProductInfoAsync(id, Enum.InfoType.GamePass)`. Do this on the client for display, but never grant based on the result. The non-async counterpart `GetProductInfo` still exists, but `GetProductInfoAsync` is preferred.

## Capability requirements

Game passes and developer products require a published experience. Enable **Studio Access to API Services** only when a specific API used by a dedicated test experience requires it; do not treat that Studio setting as a blanket prerequisite for every `MarketplaceService` purchase API. Verify each API's current requirements in its Engine Reference entry.

## Product recommendations

- `MarketplaceService:RankProductsAsync(arrayOfIdentifiers)`: pass a table of up to 50 `{InfoType = Enum.InfoType.GamePass, Id = ...}`. Returns a personalized ranking for the current user as `{ProductIdentifier, ProductInfo}` items. Use sparingly; call once at join.
- `MarketplaceService:RecommendTopProductsAsync({Enum.InfoType.GamePass, Enum.InfoType.Product})`: returns up to 50 recommended products the user is likely to engage with. Results usually exclude already-owned items, but verify in your UI. Use sparingly; call once at join.

Use these results in a "Recommended for you" section of your shop. Measure whether they improve conversion in your experience.

## Promotions (buy robux page bonus pool)

You can opt passes into the promotion pool so that users buying Robux packages may receive the pass for free (contextually relevant to their history).

Requirements (from the passes doc):
- Unique pass recommended.
- If on sale, price between 50 and 800 Robux.
- Must have thumbnail.
- Must comply with Community Standards.
- Cannot be a paid random item.

Opt-in via the pass's Promotions tab in the dashboard.

## Analytics and iteration

In Creator Dashboard → experience → Monetization → Passes → Analytics tab you get:
- Top passes by sales and net Robux.
- Time-series graphs.
- Attribution for passes acquired via Buy Robux promotions and subsequent joins.

Use this data to decide pricing, which perks are compelling, and when to run promotions.

## Security, data, and policy constraints

- Wrap Marketplace calls in `pcall`. If verification fails, deny access or defer a grant until you can recheck. Never substitute saved state for live entitlement.
- Save a grant record only for a deliberate one-time award, after a server-side `Owned` check. Apply the record and award atomically so repeated events or rejoins cannot duplicate the reward.
- For RTBF / right-to-be-forgotten, include pass-related keys in your deletion patterns (see roblox-datastores skill).
- Never hardcode Robux prices in UI that the player sees: use `GetProductInfoAsync` so regional pricing and optimizations work.
- Test purchases only on dedicated test experiences.
- For paid random items (loot boxes / gacha passes), use `PolicyService` first: check `PolicyService:GetPolicyInfoForPlayerAsync(player).ArePaidRandomItemsRestricted` and `IsPaidItemTradingAllowed` before offering randomized paid content.
- For developer products, `MarketplaceService.ProcessReceipt` can only be assigned **once** globally; assign it once in a single server script. The callback must return `Enum.ProductPurchaseDecision.PurchaseGranted` after successful fulfillment, or `Enum.ProductPurchaseDecision.NotProcessedYet` if fulfillment fails, because Roblox may redeliver the receipt until `PurchaseGranted` is returned.
- Donation / tipping games using `PromptRobuxTransferAsync` are high-risk for abuse; implement rate limits, alt-account detection, moderation pipelines, and avoid granting in-experience advantages in exchange for transfers.

## Subscriptions (recurring benefits)

Subscriptions offer users recurring benefits for a monthly fee, auto-renewing in Robux or local currency. Unlike a pass purchase, subscription benefits persist only while the user keeps paying. Up to 50 per experience; single-tiered (no mutually exclusive Bronze/Silver/Gold); regional pricing enabled by default for Robux-priced subs.

**API surface** (subscription IDs are **strings** like `"EXP-11111111"`):
- `MarketplaceService:GetUserSubscriptionStatusAsync(player, subscriptionId)`: **server-only**, returns `{IsSubscribed: boolean}`.
- `MarketplaceService:PromptSubscriptionPurchase(player, subscriptionId)`: client prompt.
- `MarketplaceService.PromptSubscriptionPurchaseFinished(player, subscriptionId, didTryPurchasing)`: note `didTryPurchasing` is an *attempt* signal, not success; re-check status after a delay.
- `Players.UserSubscriptionStatusChanged(player, subscriptionId)`: **server-only**, fires on purchase/renewal/cancellation.
- `MarketplaceService:GetSubscriptionProductInfoAsync(subscriptionId)` and `GetUserSubscriptionPaymentHistoryAsync(player, subscriptionId)`.

**Security (same posture as passes):** prompt on client, check status and grant/revoke on server only, pcall everything, re-check on every join (subscriptions lapse), respect `PolicyService:IsEligibleToPurchaseSubscription` per player, persist nothing sensitive on the client.

**Payouts:** Robux-priced subs pay 70% each month. Local-currency subs pay 70% first month, 100% thereafter, with a 30-day hold. Robux subs are not refundable; local-currency subs are refundable within the hold window.

See [references/subscriptions.md](references/subscriptions.md) for the complete flow, client/server code, migration from passes, and gotchas.

## Creator Rewards (replaces Premium Payouts)

As of **July 24, 2025**, Engagement-Based Payouts (formerly "Premium Payouts") and the Creator Affiliate program were **discontinued and replaced by Creator Rewards**. There is no longer a per-Premium-play-minute payout to integrate against.

Creator Rewards is a platform program with two payment types. It requires no in-experience integration:
- **Daily Engagement Rewards**: 5 Robux per day per Active Spender who spends 10+ minutes in your experience, provided it's one of the first three experiences they visit that day.
- **Audience Expansion Rewards**: 35% revenue share on a new/reactivated user's first $100 of qualifying purchases in their first 60 days, attributed via Share Links, direct experience links, or experience-name search.

Official source: https://create.roblox.com/docs/en-us/creator-rewards

## When to use game passes vs other monetization

- One-time permanent unlock or access → Game Pass.
- Repeatable purchase (currency, consumables, temporary power) → Developer Product (with proper ProcessReceipt).
- Recurring monthly benefit → Subscription (see references/subscriptions.md; `MarketplaceService:GetUserSubscriptionStatusAsync` etc.).

See the developer-products doc for the repeatable flow.

## Scripts

- `scripts/PassPurchaseHelper.lua`: a client-side helper for game pass button state, price display, and prompting.


<!-- catalog:references:start -->
## Reference index

- [creation-and-setup.md](references/creation-and-setup.md): Create a pass, find its asset ID, or configure sales and test access.
- [policyservice.md](references/policyservice.md): Gate a feature using per-player monetization or content restrictions.
- [purchase-flow-and-granting.md](references/purchase-flow-and-granting.md): Implement pass purchase prompts, ownership checks, and server grants.
- [rules-policies-and-security.md](references/rules-policies-and-security.md): Review monetization restrictions, paid random items, or purchase security.
- [subscriptions.md](references/subscriptions.md): Create recurring benefits or handle subscription status and renewals.
<!-- catalog:references:end -->
