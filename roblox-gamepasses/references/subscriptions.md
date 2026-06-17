---
last_reviewed: 2026-06-17
---

# Subscriptions

**Official source:** https://create.roblox.com/docs/en-us/production/monetization/subscriptions

Subscriptions offer users recurring benefits for a monthly fee. Unlike [passes](purchase-flow-and-granting.md), whose benefits are granted indefinitely, subscription benefits persist only while the user keeps paying. Subscriptions are managed through `MarketplaceService` and the Creator Dashboard.

## When to Use Subscriptions vs Passes vs Developer Products

- **Pass** — one-time permanent unlock (VIP, permanent item).
- **Developer Product** — repeatable/consumable (currency pack, potion, revive).
- **Subscription** — recurring monthly benefit (monthly cosmetic bundle, ongoing XP boost, VIP-tier perks that should gate while unpaid).

## Characteristics

- **Auto-renewing**, not one-time. Priced in Robux **or** local currency.
- **Single-tiered:** multiple subscriptions in the same experience can be owned simultaneously; mutually exclusive "Bronze/Silver/Gold" tiering of the *same* benefit set is **not** supported.
- **Regional Pricing** is enabled by default for Robux-priced subscriptions and cannot be turned off. Not available for local-currency subscriptions.
- Up to **50 subscriptions** per experience (active + inactive combined).
- Subscriptions are **ineligible for cross-selling** by other experiences and for affiliate fees.

## Robux vs Local Currency

|  | Robux | Local currency |
| --- | --- | --- |
| Eligibility | All creators | Requires ID- or phone-verified account |
| Platforms | All platforms | Web, App Store, Google Play |
| Countries | All Roblox-supported | Excludes Argentina, China, Colombia, India, Indonesia, Japan, Russia, Taiwan, Türkiye, UAE, Ukraine, Vietnam |
| Price | Any amount ≥ 49 Robux | One of $2.99 / $4.99 / $7.99 / $9.99 / $14.99 |
| Regional Pricing | Enabled by default | Unavailable |
| Payout | 70% of subscription value each month | 70% first month, 100% thereafter |
| Refunds | Not eligible | Eligible within the 30-day hold window |

Local-currency earnings follow a 30-day hold; Robux-priced earnings follow the standard ~5-day hold (same as passes/products).

## Product Types

When creating, choose one:
- **Durable** — permanent items that persist after acquisition (e.g. a weapon). If a bundle mixes durable + consumable, choose Durable.
- **Consumable** — temporary, re-purchasable, expires after use (e.g. a potion that grants a temporary boost).
- **Currency** — an in-experience medium of exchange.

You **cannot** change the product type after creation. The price of a Robux subscription can be changed only **once every 60 days**, and price increases require Roblox to give users ≥30 days' notice. Local-currency subscription prices cannot be changed — delete and recreate to change price.

## Creating & Activating

1. Creator Dashboard → your experience → Monetization → Subscriptions → Create Subscription.
2. Upload cover image, unique name, clear description.
3. Pick payment option (Robux ≥49, or one of the local-currency tiers).
4. Pick product type (Durable / Consumable / Currency).
5. Create.
6. To put it up for sale: ⋮ → Activate. Active subscriptions appear on the experience's Store tab.

Before first activation you must confirm a **shortened experience name** — this is permanent and cannot be changed, and it appears alongside the subscription name at purchase time. It does **not** change your experience's name on Roblox.

## Subscription States

- **Active** — available for sale; subscribers can renew at the start of the next period.
- **Inactive** — unavailable for sale.

To take off sale: ⋯ → Take Off Sale. You can either let existing subscribers renew, or cancel future renewals. If you're not removing the benefits permanently, let subscribers renew.

## Deleting

Deleting an active subscription triggers **full refunds for active subscribers** and **zero Robux for you**. Prefer: take off sale → cancel renewals → wait out the period → then delete. Deleting a local-currency subscription requires refunding all current subscribers (Robux subscriptions are not refundable). Deletion requires the last four digits of the subscription ID for confirmation.

## API Surface

Subscription IDs are **strings** like `"EXP-11111111"`, not numbers.

| Method | Side | Purpose |
| --- | --- | --- |
| `MarketplaceService:GetUserSubscriptionStatusAsync(player, subscriptionId)` | Server | Returns `{IsSubscribed: boolean}` (plus internal fields). **Server-only.** |
| `MarketplaceService:PromptSubscriptionPurchase(player, subscriptionId)` | Client | Prompts the user to purchase. |
| `MarketplaceService.PromptSubscriptionPurchaseFinished` | Both | `(player, subscriptionId, didTryPurchasing)`. Fires after the prompt closes. |
| `Players.UserSubscriptionStatusChanged` | Server | `(player, subscriptionId)`. Fires on purchase, renewal, cancellation. **Server-only.** |
| `MarketplaceService:GetSubscriptionProductInfoAsync(subscriptionId)` | Server | Returns product info, including whether priced in Robux or local currency. |
| `MarketplaceService:GetUserSubscriptionPaymentHistoryAsync(player, subscriptionId)` | Server | Returns the user's payment history for the subscription. |

### Checking status (server)

```lua
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

local SUBSCRIPTION_ID = "EXP-11111111" -- Replace with your subscription ID

local function grantAward(player: Player)
    -- Grant the subscription benefit here (server-only, source of truth)
end

local function revokeAwardIfGranted(player: Player)
    -- Called for players who do NOT have the subscription.
    -- If you persist subscription state to DataStores, undo it here.
end

local function checkSubStatus(player: Player)
    local success, response = pcall(function()
        return MarketplaceService:GetUserSubscriptionStatusAsync(player, SUBSCRIPTION_ID)
    end)
    if not success then
        warn(`Error while checking subscription: {response}`)
        return
    end
    if response.IsSubscribed then
        grantAward(player)
    else
        revokeAwardIfGranted(player)
    end
end

local function onUserSubscriptionStatusChanged(player: Player, subscriptionId: string)
    if subscriptionId == SUBSCRIPTION_ID then
        checkSubStatus(player)
    end
end

Players.PlayerAdded:Connect(checkSubStatus)
Players.UserSubscriptionStatusChanged:Connect(onUserSubscriptionStatusChanged)
```

### Prompting a purchase (client)

`PromptSubscriptionPurchaseFinished` fires with `didTryPurchasing` (note: this indicates the user *attempted* to purchase, not that it succeeded). Subscription registration can take time, so re-check status ~10 seconds after the prompt closes.

```lua
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

local SUBSCRIPTION_ID = "EXP-11111111"
local purchaseButton = script.Parent.PromptPurchaseSubscription -- your button

local function playerHasSubscription()
    local success, result = pcall(function()
        return MarketplaceService:GetUserSubscriptionStatusAsync(Players.LocalPlayer, SUBSCRIPTION_ID)
    end)
    if not success then return false end
    return result.IsSubscribed
end

local function hideButtonIfPlayerHasSubscription()
    if playerHasSubscription() then
        purchaseButton.Visible = false
    end
end

local function onPromptSubscriptionPurchaseFinished(player: Player, subscriptionId: string, didTryPurchasing: boolean)
    if didTryPurchasing then
        task.delay(10, hideButtonIfPlayerHasSubscription)
    end
end

hideButtonIfPlayerHasSubscription()

purchaseButton.Activated:Connect(function()
    MarketplaceService:PromptSubscriptionPurchase(Players.LocalPlayer, SUBSCRIPTION_ID)
    hideButtonIfPlayerHasSubscription()
end)

MarketplaceService.PromptSubscriptionPurchaseFinished:Connect(onPromptSubscriptionPurchaseFinished)
```

### Secure client→server status fetch (RemoteFunction)

`GetUserSubscriptionStatusAsync` is server-only. To let the client query status, expose a `RemoteFunction`:

```lua
-- Server
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MarketplaceService = game:GetService("MarketplaceService")

local getSubscriptionStatusRemote = Instance.new("RemoteFunction")
getSubscriptionStatusRemote.Name = "GetSubscriptionStatus"
getSubscriptionStatusRemote.Parent = ReplicatedStorage

getSubscriptionStatusRemote.OnServerInvoke = function(player: Player, subscriptionId: string)
    assert(typeof(subscriptionId) == "string")
    return MarketplaceService:GetUserSubscriptionStatusAsync(player, subscriptionId)
end
```

```lua
-- Client
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local getSubscriptionStatusRemote = ReplicatedStorage:WaitForChild("GetSubscriptionStatus")

local function playerHasSubscription(subscriptionId: string)
    local success, result = pcall(function()
        return getSubscriptionStatusRemote:InvokeServer(subscriptionId)
    end)
    if not success then return false end
    return result.IsSubscribed
end
```

## Replacing a Pass with a Subscription

When migrating, existing pass holders must keep the benefit they paid for; take the pass off sale so new users buy the subscription. Subscription benefits can be revoked (pass benefits cannot), so if you previously persisted pass benefits to a DataStore you must "undo" them when the subscription lapses. Listen for both `PromptGamePassPurchaseFinished` (legacy) and `UserSubscriptionStatusChanged` (new).

## Security Rules (critical)

- **Prompt on client, check status on server.** `GetUserSubscriptionStatusAsync` is server-only by design.
- **Grant/revoke on server only**, in `UserSubscriptionStatusChanged` and the `PlayerAdded` re-check.
- **Always pcall** `GetUserSubscriptionStatusAsync`, `PromptSubscriptionPurchase`, and the remote fetch.
- **Re-check on every join.** Don't trust a cached "subscribed" state forever; subscriptions lapse.
- **Persist nothing sensitive on the client.** Use your DataStore profile (see roblox-datastores) for any subscription-derived state.
- **Respect region/platform eligibility.** Only offer subscriptions in supported regions and platforms — `PolicyService:IsEligibleToPurchaseSubscription` tells you whether the player can buy (see roblox-gamepasses PolicyService reference).
- **Idempotency guard** your grant/revoke so duplicate `UserSubscriptionStatusChanged` events don't double-apply.

## Analytics

Creator Dashboard → Monetization → Subscriptions → Analytics tab tracks:
- **Subscriptions** (total active), **Estimated revenue** (net of fees).
- **Subscriber breakdown**: New / Renewed / Resurrected (previously canceled).
- **Cancellations** (not the same as refunds — canceled = won't renew but paid in full for the cycle).
- **Subscriptions by platform** and **Platform earnings**.

Real-time subscription events (cancelled, purchased, refunded, renewed) are also available via **Open Cloud webhooks** (see roblox-open-cloud skill).

## Gotchas

- `PromptSubscriptionPurchaseFinished`'s `didTryPurchasing` is **not** a success signal — re-check status after a delay.
- Subscription registration can lag; a 10-second delay before re-checking is the documented pattern.
- Local-currency refunds within the hold window cancel the payout; outside the window they deduct from your Robux balance (and from the group owner's balance if the group can't cover it).
- Changing a Robux subscription's price is rate-limited to once per 60 days; local-currency prices are immutable.
- Shortened experience name is permanent — set it carefully.
- Subscriptions don't support cross-experience selling or affiliate fees.

## Sources

- https://create.roblox.com/docs/en-us/production/monetization/subscriptions
- https://create.roblox.com/docs/en-us/reference/engine/classes/MarketplaceService (subscription methods)
- https://create.roblox.com/docs/en-us/reference/engine/classes/Players (`UserSubscriptionStatusChanged`)
- https://create.roblox.com/docs/en-us/cloud/webhooks/webhook-notifications (subscription webhook events)