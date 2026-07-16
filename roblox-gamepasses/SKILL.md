---
name: roblox-gamepasses
description: "Rule-accurate Roblox monetization — game passes, developer products (ProcessReceipt), and subscriptions (GetUserSubscriptionStatusAsync, PromptSubscriptionPurchase). Covers the selling flow, server-authoritative granting on PlayerAdded and purchase completion, PolicyService gating (ArePaidRandomItemsRestricted, IsEligibleToPurchaseSubscription, China policies), personalization, and integration with persistent data. Use for any purchase, perk, or recurring benefit."
last_reviewed: 2026-07-16
---

# roblox-gamepasses

**Primary official source:** https://create.roblox.com/docs/en-us/production/monetization/passes (plus developer-products.md for contrast, and the MarketplaceService class reference).

This skill focuses on getting game passes right the first time — correct ownership checking, server-only fulfillment, proper error handling, and modern personalization features that most older tutorials ignore.

See roblox-datastores for how to store "player owns this pass" state or associated perks, and roblox-networking for the Remote validation layer around purchase prompts.

## Game Pass vs Developer Product (rules that matter)

- **Game Pass**: One-time purchase. Permanent privilege for that specific experience (VIP access, permanent item, extra slot, cosmetic unlock, etc.). Roblox tracks ownership per user per experience.
- **Developer Product**: Repeatable / consumable (currency packs, potions, revives, temporary boosts). Can be bought many times. Requires ProcessReceipt callback on the server for fulfillment.
- As of **May 30, 2026**, cross-experience game pass and developer product sales are disabled. Design experience-specific passes or use the [Robux Transfers API](https://create.roblox.com/docs/en-us/production/monetization/robux-transfers) for donation-style flows. `MarketplaceService:PromptRobuxTransferAsync` must be called from the server. Only **Roblox Plus** subscribers can initiate transfers, transfer amounts must be between **10 and 500 Robux**, and the sender cannot equal the receiver. The recipient receives **90%** and the experience earns the other **10%**; Roblox takes no transfer fee. A `BindReceiptHandler` callback must process transfer receipts. Roblox permits an experience to grant items or perks after a successful receipt; choosing not to attach rewards is an opinionated anti-abuse/design recommendation, not a platform rule.
- You (the creator) are 100% responsible for actually delivering the benefit. Roblox only handles the transaction and the UserOwnsGamePassAsync query.
- Passes can be used for randomized virtual items only if you follow the Paid Random Items policy.

## Creation & Asset ID

1. Creator Dashboard → your published experience → Monetization → Passes → Create a Pass.
2. Upload circular-friendly icon (≤512×512, jpg/png/bmp; important content must survive circular crop).
3. Name + description.
4. After creation: hover the pass → ⋯ → Copy Asset ID. This number is the passID you use in all scripts.

For external sales on the game page Store tab: go to the pass → Sales → enable "Item for Sale" and set Robux price (1 to 1B).

## The Authoritative Purchase + Grant Flow (Inside Experience)

**Client side (LocalScript or UI module — only for prompting and optimistic display):**
- Call MarketplaceService:UserOwnsGamePassAsync (pcall) to decide "Buy" vs "Owned" button state.
- If not owned, call MarketplaceService:PromptGamePassPurchase(player, passID).

**Server side (Script in ServerScriptService — the only place that grants benefits):**
```lua
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

local PASS_ID = 1234567890
local granted = {} -- idempotency guard: granted[player][passID]

local function grantPassBenefits(player: Player, passID: number)
    if not player or not player:IsDescendantOf(Players) then
        return
    end
    local playerGranted = granted[player]
    if not playerGranted then
        playerGranted = {}
        granted[player] = playerGranted
    end
    if playerGranted[passID] then
        return
    end
    playerGranted[passID] = true

    -- Apply the actual privilege (attributes, table entry, DataStore flag, Remote to client for visuals, etc.)
    -- This is the source of truth.
end

MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player: Player, purchasedPassID: number, wasPurchased: boolean)
    -- This event also fires on the client; never grant benefits from the client copy.
    if not player or typeof(purchasedPassID) ~= "number" then
        return
    end
    if wasPurchased and purchasedPassID == PASS_ID then
        local ok, err = pcall(function()
            grantPassBenefits(player, PASS_ID)
        end)
        if not ok then
            warn("Failed to grant pass benefits:", err)
        end
    end
end)

Players.PlayerAdded:Connect(function(player: Player)
    local success, owns = pcall(function()
        return MarketplaceService:UserOwnsGamePassAsync(player.UserId, PASS_ID)
    end)
    if success and owns then
        local ok, err = pcall(function()
            grantPassBenefits(player, PASS_ID)
        end)
        if not ok then
            warn("Failed to apply owned pass benefits:", err)
        end
    elseif not success then
        warn("UserOwnsGamePassAsync failed for", player.Name)
    end
end)

Players.PlayerRemoving:Connect(function(player: Player)
    granted[player] = nil
end)
```

**GetProductInfoAsync for dynamic UI (price, name, description, IsForSale):**
Use `MarketplaceService:GetProductInfoAsync(id, Enum.InfoType.GamePass)`. Do this on the client for display, but never grant based on the result. The non-async counterpart `GetProductInfo` still exists, but `GetProductInfoAsync` is preferred.

## Capability Requirements

Game passes and developer products require a published experience. Enable **Studio Access to API Services** only when a specific API used by a dedicated test experience requires it; do not treat that Studio setting as a blanket prerequisite for every `MarketplaceService` purchase API. Verify each API's current requirements in its Engine Reference entry.

## Personalization & Recommendations (use these)

- `MarketplaceService:RankProductsAsync(arrayOfIdentifiers)` — pass a table of up to 50 `{InfoType = Enum.InfoType.GamePass, Id = ...}`. Returns a personalized ranking for the current user as `{ProductIdentifier, ProductInfo}` items. Use sparingly; call once at join.
- `MarketplaceService:RecommendTopProductsAsync({Enum.InfoType.GamePass, Enum.InfoType.Product})` — returns up to 50 recommended products the user is likely to engage with. Results usually exclude already-owned items, but verify in your UI. Use sparingly; call once at join.

Surface these in "Recommended for you" or "Top picks" sections of your in-experience shop. This measurably improves conversion.

## Promotions (Buy Robux page bonus pool)

You can opt passes into the promotion pool so that users buying Robux packages may receive the pass for free (contextually relevant to their history).

Requirements (from the passes doc):
- Unique pass recommended.
- If on sale, price between 50 and 800 Robux.
- Must have thumbnail.
- Must comply with Community Standards.
- Cannot be a paid random item.

Opt-in via the pass's Promotions tab in the dashboard.

## Analytics & Iteration

In Creator Dashboard → experience → Monetization → Passes → Analytics tab you get:
- Top passes by sales and net Robux.
- Time-series graphs.
- Attribution for passes acquired via Buy Robux promotions and subsequent joins.

Use this data to decide pricing, which perks are compelling, and when to run promotions.

## Security, Data, and Policy Gotchas (non-negotiable)

- Prompt only from client. Grant and record only on the server in the PromptGamePassPurchaseFinished handler or on PlayerAdded re-check.
- Always pcall `UserOwnsGamePassAsync` and `Prompt...` calls.
- Re-check ownership on every relevant join/session start before granting powerful or economy-affecting perks.
- Store your own record of ownership + associated state in DataStores if you need history or custom metadata (Roblox does not expose full per-user pass purchase history via the Engine API).
- For RTBF / right-to-be-forgotten, include pass-related keys in your deletion patterns (see roblox-datastores skill).
- Never hardcode Robux prices in UI that the player sees — use `GetProductInfoAsync` so regional pricing and optimizations work.
- Test purchases only on dedicated test experiences.
- For paid random items (loot boxes / gacha passes), use `PolicyService` first: check `PolicyService:GetPolicyInfoForPlayerAsync(player).ArePaidRandomItemsRestricted` and `IsPaidItemTradingAllowed` before offering randomized paid content.
- For developer products, `MarketplaceService.ProcessReceipt` can only be assigned **once** globally; assign it once in a single server script. The callback must return `Enum.ProductPurchaseDecision.PurchaseGranted` after successful fulfillment, or `Enum.ProductPurchaseDecision.NotProcessedYet` if fulfillment fails, because Roblox may redeliver the receipt until `PurchaseGranted` is returned.
- Donation / tipping games using `PromptRobuxTransferAsync` are high-risk for abuse; implement rate limits, alt-account detection, moderation pipelines, and avoid granting in-experience advantages in exchange for transfers.

## Subscriptions (recurring benefits)

Subscriptions offer users recurring benefits for a monthly fee, auto-renewing in Robux or local currency. Unlike passes (permanent), subscription benefits persist only while the user keeps paying. Up to 50 per experience; single-tiered (no mutually exclusive Bronze/Silver/Gold); regional pricing enabled by default for Robux-priced subs.

**API surface** (subscription IDs are **strings** like `"EXP-11111111"`):
- `MarketplaceService:GetUserSubscriptionStatusAsync(player, subscriptionId)` — **server-only**, returns `{IsSubscribed: boolean}`.
- `MarketplaceService:PromptSubscriptionPurchase(player, subscriptionId)` — client prompt.
- `MarketplaceService.PromptSubscriptionPurchaseFinished(player, subscriptionId, didTryPurchasing)` — note `didTryPurchasing` is an *attempt* signal, not success; re-check status after a delay.
- `Players.UserSubscriptionStatusChanged(player, subscriptionId)` — **server-only**, fires on purchase/renewal/cancellation.
- `MarketplaceService:GetSubscriptionProductInfoAsync(subscriptionId)` and `GetUserSubscriptionPaymentHistoryAsync(player, subscriptionId)`.

**Security (same posture as passes):** prompt on client, check status and grant/revoke on server only, pcall everything, re-check on every join (subscriptions lapse), respect `PolicyService:IsEligibleToPurchaseSubscription` per player, persist nothing sensitive on the client.

**Payouts:** Robux-priced subs pay 70% each month. Local-currency subs pay 70% first month, 100% thereafter, with a 30-day hold. Robux subs are not refundable; local-currency subs are refundable within the hold window.

See [references/subscriptions.md](references/subscriptions.md) for the complete flow, client/server code, migration from passes, and gotchas.

## Creator Rewards (replaces Premium Payouts)

As of **July 24, 2025**, Engagement-Based Payouts (formerly "Premium Payouts") and the Creator Affiliate program were **discontinued and replaced by Creator Rewards**. There is no longer a per-Premium-play-minute payout to integrate against.

Creator Rewards pays creators in two ways (no in-experience integration required — it's a platform-side program, but you should know it exists):
- **Daily Engagement Rewards** — 5 Robux per day per Active Spender who spends 10+ minutes in your experience, provided it's one of the first three experiences they visit that day.
- **Audience Expansion Rewards** — 35% revenue share on a new/reactivated user's first $100 of qualifying purchases in their first 60 days, attributed via Share Links, direct experience links, or experience-name search.

Official source: https://create.roblox.com/docs/en-us/creator-rewards

## When to Use Game Passes vs Other Monetization

- One-time permanent unlock or access → Game Pass.
- Repeatable purchase (currency, consumables, temporary power) → Developer Product (with proper ProcessReceipt).
- Recurring monthly benefit → Subscription (see references/subscriptions.md; `MarketplaceService:GetUserSubscriptionStatusAsync` etc.).

See the developer-products doc for the repeatable flow.

## Scripts

- `scripts/PassPurchaseHelper.lua` — a client-side helper for game pass button state, price display, and prompting.

This skill + roblox-datastores + roblox-networking gives you a complete, secure, modern game pass implementation that follows current rules and best practices.

<!-- catalog:references:start -->
## Reference index

- [creation-and-setup.md](references/creation-and-setup.md)
- [policyservice.md](references/policyservice.md)
- [purchase-flow-and-granting.md](references/purchase-flow-and-granting.md)
- [rules-policies-and-security.md](references/rules-policies-and-security.md)
- [subscriptions.md](references/subscriptions.md)
<!-- catalog:references:end -->
