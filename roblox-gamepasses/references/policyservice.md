---
last_reviewed: 2026-06-17
---

# PolicyService Reference

**Official source:** https://create.roblox.com/docs/en-us/reference/engine/classes/PolicyService

`PolicyService` queries per-player policy compliance based on geolocation, age group, and platform. Use it to gate monetization, content sharing, ads, commerce, and region-specific behavior **per player**, not globally — the same experience can have players in different policy regimes at once.

`PolicyService` is a service (`game:GetService("PolicyService")`). It is `NotCreatable`, `NotReplicated`, and tagged as a Service. Its async methods **yield** and **must** be wrapped in `pcall`. They are **thread-unsafe** and require the `Basic` capability.

## Methods

### `GetPolicyInfoForPlayerAsync(player: Player): Dictionary`

Returns a dictionary of policy flags for the player. **Yields**; wrap in `pcall`. Server-callable; on the client, only callable for `Players.LocalPlayer`.

The returned dictionary contains these fields:

| Field | Type | Gates |
| --- | --- | --- |
| `AreAdsAllowed` | boolean | Immersive ads. If false, do not show immersive ads to this player. |
| `ArePaidRandomItemsRestricted` | boolean | Paid random items (loot boxes, gacha). If true, the player **cannot** interact with paid random item generators, whether via in-experience currency bought with Robux or Robux directly. |
| `IsContentSharingAllowed` | boolean | UGC sharing (screen captures, video, image feeds). If false, disable features that let the user share content others can see. |
| `IsEligibleToPurchaseCommerceProduct` | boolean | Real-world [commerce products](https://create.roblox.com/docs/en-us/production/monetization/commerce-products). If false, the player cannot purchase commerce products in-experience. |
| `IsEligibleToPurchaseSubscription` | boolean | Subscriptions (see [subscriptions.md](subscriptions.md)). If false, do not offer a subscription purchase to this player. |
| `IsPaidItemTradingAllowed` | boolean | Trading virtual items purchased with in-experience currency or Robux. If false, disable paid-item trading for this player. |
| `IsPhotoToAvatarAllowed` | boolean | `AvatarCreationService:PromptSelectAvatarGenerationImageAsync()`. If false, the Photo-to-Avatar API is unavailable to this player. |
| `IsSubjectToChinaPolicies` | boolean | If true, enforce China compliance changes (see the [Roblox China program post](https://devforum.roblox.com/t/new-programs-available-roblox-china-licensed-to-operate/1023361)). |
| `IsEndlessContentLoadAllowed` | boolean | Features where content loads automatically and endlessly as the user scrolls (a feed). If false, require manual load/pagination instead. |
| `IsEndlessContentAutoplayAllowed` | boolean | Media content (video or audio) that auto-plays endlessly without user initiation. If false, require explicit play actions. |
| `AllowedExternalLinkReferences` | array | **Legacy.** Always returns an empty array. Do not rely on it. |

### `CanViewBrandProjectAsync(player: Player, brandProjectId: string): boolean`

Determines whether a player may see a specific brand project's assets. Requires a brand project ID provided by Roblox (request one via the [brand project form](https://docs.google.com/forms/d/e/1FAIpQLSfGTRQwATB2wUg0P4HUSTtyXrhptFahJifo1ew84SyqtfSBfg/viewform)). **Yields**; wrap in `pcall`. **Server-only** — calling from the client errors. Pattern: query on the server, then `RemoteEvent:FireClient(player, assetToShow)` with either the branded asset or a default fallback.

## Error Handling

Like any async call, wrap in `pcall`. Documented error messages:

| Message | Reason |
| --- | --- |
| `Instance was not a player` | `player` parameter is not a `Player`. |
| `Players not found` | Internal error — the `Players` service is missing. |
| `This method cannot be called on the client for a non-local player` | Client-side call for a non-local `Player`. |
| `GetPolicyInfoForPlayerAsync is called too many times` | More than ~100 concurrent calls before an HTTP response returns. Throttle. |

## Patterns

### Gate paid random items (loot boxes)

```lua
local PolicyService = game:GetService("PolicyService")
local Players = game:GetService("Players")

local player = Players.LocalPlayer

local success, result = pcall(function()
    return PolicyService:GetPolicyInfoForPlayerAsync(player)
end)

if not success then
    warn("PolicyService error: " .. tostring(result))
elseif result.ArePaidRandomItemsRestricted then
    warn("Player cannot interact with paid random item generators")
    -- Hide/disable the gacha UI for this player
end
```

### Gate subscription offers (server-side, per join)

```lua
-- Server
local PolicyService = game:GetService("PolicyService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local showSubsRemote = ReplicatedStorage:WaitForChild("ShowSubscriptionOffers") -- RemoteEvent

Players.PlayerAdded:Connect(function(player: Player)
    local ok, info = pcall(function()
        return PolicyService:GetPolicyInfoForPlayerAsync(player)
    end)
    if not ok then
        warn("PolicyService failed for " .. player.Name .. ": " .. tostring(info))
        showSubsRemote:FireClient(player, false)
        return
    end
    showSubsRemote:FireClient(player, info.IsEligibleToPurchaseSubscription == true)
end)
```

### Gate brand projects (server queries, client renders)

```lua
-- Server
local PolicyService = game:GetService("PolicyService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local brandedAsset = ReplicatedStorage:WaitForChild("BrandedAsset")
local defaultAsset = Instance.new("Part")
local RemoteEvent = ReplicatedStorage:WaitForChild("RemoteEvent")

Players.PlayerAdded:Connect(function(player: Player)
    local success, canView = pcall(function()
        return PolicyService:CanViewBrandProjectAsync(player, "BRP-0123456789")
    end)
    if success and canView then
        RemoteEvent:FireClient(player, brandedAsset)
    else
        RemoteEvent:FireClient(player, defaultAsset)
    end
end)
```

```lua
-- Client
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RemoteEvent = ReplicatedStorage:WaitForChild("RemoteEvent")

RemoteEvent.OnClientEvent:Connect(function(partToLoad)
    local clonedPart = partToLoad:Clone()
    clonedPart.Parent = workspace
end)
```

## Rules and Gotchas

- **Every call yields and must be pcall'd.** A thrown error here is not a player kick — handle it and degrade gracefully (usually: hide the gated feature).
- **Throttle.** More than ~100 in-flight `GetPolicyInfoForPlayerAsync` calls before HTTP responses return will error. Cache the result per-player for the session; you rarely need to re-query mid-session unless a player's region/platform could change (rare).
- **Call from the correct side.** `GetPolicyInfoForPlayerAsync` is server-safe and client-safe *for the local player only*; `CanViewBrandProjectAsync` is **server-only** and errors on the client.
- **Don't gate globally.** Two players in the same server can have different flags. Gate per-player, not with a single experience-wide boolean.
- **Combine with `LocalizationService:GetCountryRegionForPlayerAsync`** when you need the actual country/region code (a string) for finer-grained logic — `PolicyService` tells you the *restrictions*, `LocalizationService` tells you the *where*.
- **Don't trust the client for grant decisions.** If the client reads policy flags and the server grants based on a client Remote saying "ads are allowed for me," that's exploitable. Re-query on the server for any decision that affects economy or access.
- **`AllowedExternalLinkReferences` is legacy and always empty.** Do not build logic on it.
- **China (`IsSubjectToChinaPolicies`)** requires experience-specific compliance changes — see the Roblox China program documentation before relying on this flag.

## When to Use What

| Need | Method | Side |
| --- | --- | --- |
| "Can this player see paid random items / trade paid items / share content / see ads / buy subscriptions / buy commerce products?" | `GetPolicyInfoForPlayerAsync` | Server (or client for LocalPlayer) |
| "Can this player see this brand's assets?" | `CanViewBrandProjectAsync` | Server only |
| "What country/region is this player in?" | `LocalizationService:GetCountryRegionForPlayerAsync` | Either |

## Sources

- https://create.roblox.com/docs/en-us/reference/engine/classes/PolicyService
- https://create.roblox.com/docs/en-us/production/monetization/virtual-items (Paid Random Items policy)
- https://create.roblox.com/docs/en-us/production/monetization/subscriptions (`IsEligibleToPurchaseSubscription`)
- https://create.roblox.com/docs/en-us/production/monetization/commerce-products (`IsEligibleToPurchaseCommerceProduct`)
- https://devforum.roblox.com/t/new-programs-available-roblox-china-licensed-to-operate/1023361 (China policies)