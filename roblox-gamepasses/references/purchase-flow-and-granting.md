---
read_when: "Implement pass purchase prompts, ownership checks, and server grants"
last_reviewed: 2026-11-20
---

# Purchase flow and server granting

> Experimental pending a second human review and Studio integration tests. Roblox documents free trials for enabled passes starting December 2, 2026. New passes have trials off by default.

Sources: [Passes and free trials](https://create.roblox.com/docs/en-us/production/monetization/passes#free-trials), [MarketplaceService](https://create.roblox.com/docs/en-us/reference/engine/classes/MarketplaceService).

## Decide whether you need access or ownership

| Decision | Server check |
| --- | --- |
| Can the player use a VIP area, tool, or ability now? | `UserOwnsGamePassAsync(player.UserId, passId)` is true for an owner or an active trial. Recheck on use, including after respawn. |
| Can this player get a permanent one-time purchase bonus? | `GetPassOwnershipAsync(player, passId)` must succeed and return `Owned == true`. |

`GetPassOwnershipAsync` also returns `Active` for current access, plus `StartTime` and `EndTime` during a trial. On the client it can only query the local player. Use `Owned` in the shop so trial players can still buy. Prompt with `PromptGamePassPurchase(player, passId)`; never grant from client UI or a Remote claiming a purchase succeeded.

## Verify before granting

`PromptGamePassPurchaseFinished` can report success when a trial starts. Use the server event only as a cue to recheck, and check on join to catch purchases made elsewhere. A trial lasts for one game session and does not fire an expiry event. Check access where the benefit is used; do not save the pass flag or any trial-derived perk in a DataStore. Call the engine again on subsequent checks rather than keeping your own positive cache. The engine itself may take time to reflect an external purchase in the current session.

```lua
local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")
local PASS_ID = 1234567890

local function checkPermanentGrant(player: Player)
    local ok, ownership = pcall(function()
        return MarketplaceService:GetPassOwnershipAsync(player, PASS_ID)
    end)
    if not ok then
        warn("Pass ownership check failed:", ownership)
        return
    end
    if player.Parent ~= Players or type(ownership) ~= "table" or ownership.Owned ~= true then
        return
    end

    -- If you offer a one-time purchase bonus, apply it here. Commit the
    -- award and its deduplication marker in the same atomic profile write.
end

Players.PlayerAdded:Connect(checkPermanentGrant)
MarketplaceService.PromptGamePassPurchaseFinished:Connect(function(player, passId, success)
    if passId == PASS_ID and success then
        checkPermanentGrant(player)
    end
end)
```

Failure to verify is not a grant. Retry later rather than trusting a client signal or a prior entitlement. For developer products use `ProcessReceipt`, not this pattern.

## Test on a dedicated experience

Test trial start, access while active, expiry with no lingering benefit, purchase during a trial, and repeat delivery/rejoin without duplicate bonuses. Studio playtest trials last one hour; verify the relevant live paths in a published test experience before relying on them.
