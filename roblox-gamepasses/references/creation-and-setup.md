---
last_reviewed: 2026-06-17
---

# Creation and Setup of Game Passes

**Official guide:** https://create.roblox.com/docs/en-us/production/monetization/passes

## Creating a Pass

1. Go to Creations in Creator Dashboard.
2. Select your experience (must be published).
3. Monetization → Passes → "Create a Pass".
4. Upload icon: Must be suitable for circular crop (important visual content must be inside the circle). Recommended formats: .jpg, .png, .bmp. Max 512x512.
5. Provide name and description.
6. Submit.

After creation, the pass appears in the list.

## Obtaining the Pass ID (Asset ID)

- Hover over the pass thumbnail in the list.
- Click the ⋯ menu.
- Select "Copy Asset ID".

This ID (a number like 1234567890) is what you use in all `MarketplaceService` calls:
- `GetProductInfoAsync(id, Enum.InfoType.GamePass)` (preferred; the non-async `GetProductInfo` still exists but `GetProductInfoAsync` is recommended)
- `PromptGamePassPurchase(player, id)`
- `UserOwnsGamePassAsync(userId, id)`

## Enabling Sales (External / Game Page Store)

For the pass to appear on the game's Store tab on Roblox.com:

1. In the Passes list, select the pass or go to its detail.
2. Sales tab.
3. Toggle "Item for Sale".
4. Enter Robux price (minimum 1, max 1,000,000,000).
5. Save.

The price affects your Robux earnings after Roblox fees.

## Icon Best Practices and Validation Errors

Icons are validated strictly. Common issues:
- Content outside the circular boundary gets cropped.
- Low resolution or poor contrast.
- Text or important details near edges.

Test by viewing the pass in the in-experience purchase prompt and on the web store.

## Group vs Individual Ownership

When publishing the animation or pass:
- If the experience is group-owned, select the group as the creator during publish/export for the asset.
- Same applies conceptually for passes (the experience ownership determines who can manage).

## Testing Setup

- Enable **Game Settings → Security → Enable Studio Access to API Services** only on a dedicated test place; never enable it on a live production place.
- Create a separate test experience/universe that mirrors your production one.
- Test the full flow: prompt → purchase (use small test Robux if possible, or Roblox test accounts).
- Verify `UserOwnsGamePassAsync` returns true after purchase on new servers.
- Test re-join behavior.

## Initial Script Skeleton (before full flow)

Place in ServerScriptService:

```lua
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

local PASS_ID = 1234567890  -- Replace with your pass ID
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

    -- Apply permanent benefit here
    -- e.g. player:SetAttribute("HasVIP", true)
    -- or save to DataStore via your data manager
end

-- Server grant handler
MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player: Player, passID: number, wasPurchased: boolean)
    -- This event also fires on the client; never grant benefits from the client copy.
    if not player or typeof(passID) ~= "number" then
        return
    end
    if wasPurchased and passID == PASS_ID then
        local ok, err = pcall(function()
            grantPassBenefits(player, PASS_ID)
        end)
        if not ok then
            warn("Failed to grant pass benefits:", err)
        end
    end
end)

-- Re-apply on join
Players.PlayerAdded:Connect(function(player: Player)
    local owns = false
    local ok, err = pcall(function()
        owns = MarketplaceService:UserOwnsGamePassAsync(player.UserId, PASS_ID)
    end)
    if ok and owns then
        local grantOk, grantErr = pcall(function()
            grantPassBenefits(player, PASS_ID)
        end)
        if not grantOk then
            warn("Failed to apply owned pass benefits:", grantErr)
        end
    elseif not ok then
        warn("Failed to check gamepass ownership for", player.Name, err)
    end
end)

Players.PlayerRemoving:Connect(function(player: Player)
    granted[player] = nil
end)
```

See the purchase-flow reference for the complete client prompting code and error handling.

## Common Setup Mistakes

- Using the wrong InfoType (must be GamePass, not Product).
- Forgetting that passes are experience-specific (after the 2026 change).
- Not handling the case where the player already owns it (show "Owned" UI instead of prompting again).
- Placing grant logic in a LocalScript.

Next reference: purchase-flow-and-granting.md for the full end-to-end code.