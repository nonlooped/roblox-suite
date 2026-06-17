---
last_reviewed: 2026-06-17
---

# Purchase Flow and Server Granting

## Full Recommended Flow

### Client Side (prompting and UI state)

```lua
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

local player = Players.LocalPlayer
local PASS_ID = 1234567890  -- Replace with your pass ID

local function getProductInfoAsync()
    local success, productInfo = pcall(function()
        return MarketplaceService:GetProductInfoAsync(PASS_ID, Enum.InfoType.GamePass)
    end)
    if success then
        return productInfo
    end
    warn("Failed to get product info:", productInfo)
    return nil
end

local function updatePassButton(button)
    local success, owns = pcall(function()
        return MarketplaceService:UserOwnsGamePassAsync(player.UserId, PASS_ID)
    end)
    
    if success then
        if owns then
            button.Text = "Owned"
            button.Active = false
        else
            button.Text = "Buy Pass"
            button.Active = true
        end
    else
        button.Text = "Check Failed"
    end
end

-- Example button connection
local buyButton = script.Parent
buyButton.Activated:Connect(function()
    local success, owns = pcall(function()
        return MarketplaceService:UserOwnsGamePassAsync(player.UserId, PASS_ID)
    end)
    
    if success and not owns then
        local promptOk, promptErr = pcall(function()
            MarketplaceService:PromptGamePassPurchase(player, PASS_ID)
        end)
        if not promptOk then
            warn("Failed to prompt purchase:", promptErr)
        end
    elseif success and owns then
        -- Already owns
    else
        warn("Ownership check failed")
    end
end)

-- Optional: refresh state after purchase finished (via Remote or on re-join)
```

### Server Side (authoritative granting)

The critical part. **Important:** `PromptGamePassPurchaseFinished` fires on both the client and the server. You must grant benefits only in the server handler; the client copy is for UI updates only.

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

    -- Apply the benefit. This must be server-only.
    -- Examples:
    -- player:SetAttribute("VIP", true)
    -- YourDataManager:GrantPassPerks(player, PASS_ID)
    -- Fire a RemoteEvent to client for visual unlock (but don't trust client to apply logic)

    -- Persist if needed (cross-ref roblox-datastores skill)
end

-- Handle new purchases
MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player: Player, purchasedID: number, wasPurchased: boolean)
    if not player or typeof(purchasedID) ~= "number" then
        return
    end
    if wasPurchased and purchasedID == PASS_ID then
        print(player.Name .. " successfully purchased the pass.")

        local ok, err = pcall(function()
            grantPassBenefits(player, PASS_ID)
        end)
        if not ok then
            warn("Failed to grant pass benefits:", err)
        end
    end
end)

-- Re-grant on every join (in case of data loss, new server, etc.)
Players.PlayerAdded:Connect(function(player: Player)
    local success, ownsPass = pcall(function()
        return MarketplaceService:UserOwnsGamePassAsync(player.UserId, PASS_ID)
    end)

    if success and ownsPass then
        local ok, err = pcall(function()
            grantPassBenefits(player, PASS_ID)
        end)
        if not ok then
            warn("Failed to apply owned pass benefits for", player.Name, err)
        end
    elseif not success then
        warn("Gamepass ownership check failed for", player.Name)
        -- Optionally retry later or fall back to cached data
    end
end)

Players.PlayerRemoving:Connect(function(player: Player)
    granted[player] = nil
end)
```

## Key Rules for the Flow

- `PromptGamePassPurchase` and initial `UserOwnsGamePassAsync` checks can be on the client for UX.
- All actual granting of power/economy/items **must** happen on the server in the `PromptGamePassPurchaseFinished` event or the `PlayerAdded` re-check.
- `PromptGamePassPurchaseFinished` fires on the client too; never grant benefits from the client copy.
- Always wrap ownership and prompt calls in `pcall`.
- `UserOwnsGamePassAsync` will return true for a freshly purchased pass when the player joins a new server after the purchase.
- Do not rely solely on the purchase-finished event for players who bought the pass while offline or on another server.
- Use an idempotency guard so benefits are not granted multiple times if the event fires more than once.
- For developer products, `MarketplaceService.ProcessReceipt` can only be assigned **once** globally. The callback must return `Enum.ProductPurchaseDecision.PurchaseGranted` after successful fulfillment, or `Enum.ProductPurchaseDecision.NotProcessedYet` if fulfillment fails, because Roblox may redeliver the receipt until `PurchaseGranted` is returned.

## Handling Purchase Failures / Edge Cases

- Network issues during prompt: the `PromptGamePassPurchaseFinished` may fire with `wasPurchased = false`.
- Player cancels the prompt.
- Insufficient Robux.
- The pass is no longer for sale.

In the finished handler, only act on `wasPurchased == true`.

For UI, you can listen for the finished event on the client too (via a Remote from server) to update "Owned" state immediately without waiting for re-join.

## Integration with Data Stores

After granting in the server handler, immediately save the fact that this player owns the pass (or the specific perks) using your data persistence system.

On load (PlayerAdded), prefer the `UserOwnsGamePassAsync` result as the source of truth, then merge with any local saved state.

See roblox-datastores skill for safe profile loading patterns.

## Scripts Folder Example

A simple client helper can live in scripts/PassPurchaseHelper.lua (adapt and require from your UI modules).