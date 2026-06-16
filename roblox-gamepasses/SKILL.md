---
name: roblox-gamepasses
description: >
  Complete, rule-accurate, production implementation guide for Roblox game passes
  (one-time Robux purchases that grant permanent per-experience privileges) and
  the surrounding monetization ecosystem via MarketplaceService. Covers pass
  creation workflow and icon guidelines, asset ID retrieval, inside-experience
  selling (GetProductInfoAsync with InfoType.GamePass, PromptGamePassPurchase,
  UserOwnsGamePassAsync, PromptGamePassPurchaseFinished), server-authoritative
  granting on PlayerAdded and purchase completion, distinction from developer
  products (repeatable/consumable), policy (cross-experience sales disabled as of
  May 30 2026, randomized items, community standards), personalization
  (RankProductsAsync, RecommendTopProductsAsync), promotions via Buy Robux page,
  analytics, regional pricing, and integration with persistent data
  (re-verification, perks application, RTBF). Includes full code patterns,
  gotchas, security (never grant on client signal alone), and checklists.
---

# roblox-gamepasses

**Primary official source:** https://create.roblox.com/docs/en-us/production/monetization/passes (plus developer-products.md for contrast, and the MarketplaceService class reference).

This skill focuses on getting game passes right the first time — correct ownership checking, server-only fulfillment, proper error handling, and modern personalization features that most older tutorials ignore.

See roblox-datastores for how to store "player owns this pass" state or associated perks, and roblox-networking for the Remote validation layer around purchase prompts.

## Game Pass vs Developer Product (rules that matter)

- **Game Pass**: One-time purchase. Permanent privilege for that specific experience (VIP access, permanent item, extra slot, cosmetic unlock, etc.). Roblox tracks ownership per user per experience.
- **Developer Product**: Repeatable / consumable (currency packs, potions, revives, temporary boosts). Can be bought many times. Requires ProcessReceipt callback on the server for fulfillment.
- As of **May 30, 2026**, cross-experience game pass and developer product sales are disabled. Design experience-specific passes or use the [Robux Transfers API](https://create.roblox.com/docs/en-us/production/monetization/robux-transfers) for donation-style flows. `MarketplaceService:PromptRobuxTransferAsync` must be called from the server. Only **Roblox Plus** subscribers can initiate transfers, amounts are clamped to **10–500 Robux** per transaction, the sender cannot equal the receiver, Roblox takes a **10% platform fee**, and the recipient receives **90%**. A `BindReceiptHandler` callback must process transfer receipts; donations are high-risk for abuse and should include anti-abuse checks (rate limits, alt detection, moderation, no quid-pro-quo rewards).
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

All `MarketplaceService` purchase APIs (`PromptGamePassPurchase`, `PromptPurchase`, developer-product `ProcessReceipt`, `PromptRobuxTransferAsync`, etc.) require **API Services** to be enabled for the place (Home tab → Game Settings → Security → Enable Studio Access to API Services for Studio testing; live places use the deployed configuration). Game passes and developer products also require the experience to be published.

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

## When to Use Game Passes vs Other Monetization

- One-time permanent unlock or access → Game Pass.
- Repeatable purchase (currency, consumables, temporary power) → Developer Product (with proper ProcessReceipt).
- Subscriptions / Premium benefits → separate systems.

See the developer-products doc for the repeatable flow.

## Scripts

- `scripts/PassPurchaseHelper.lua` — a client-side helper for game pass button state, price display, and prompting.

This skill + roblox-datastores + roblox-networking gives you a complete, secure, modern game pass implementation that follows current rules and best practices.
