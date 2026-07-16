---
last_reviewed: 2026-07-16
---

# Server Authority and Validation

## Core Principle

If it can give a player an advantage, the server must be the one that ultimately decides whether it happens.

Client can:
- Send "I want to do X"
- Predict the result for smooth visuals
- Display the outcome after server confirmation

Server must:
- Receive the intent
- Run all the important checks (distance, timing, cost, prerequisites, anti-cheat, etc.)
- Apply the change (or reject it)
- Replicate the authoritative result

## Practical Validation Checklist (per remote)

- Is the player alive / in a valid state?
- Is the action on cooldown?
- Does the player have the required resources / level / item?
- Is the target in range / line of sight?
- Is the data the client sent reasonable (numbers within bounds, instances exist and are valid)?
- Has this player been rate-limited on this action recently?

Only after all checks pass do you apply the effect and save/persist as needed.

## Common Implementation

Many teams keep a "Validator" or "ActionHandler" module on the server that all Remotes funnel through.

Example structure:
```lua
--!strict
-- `actionName` is selected by server code, never copied from a client string.
local limiter = RateLimiter.default

local function handleAction(player: Player, actionName: string, payload: any)
    local allowed = limiter:canPerform(player, actionName)
    if not allowed then return end

    local validator = Validators[actionName]
    if not validator or not validator(player, payload) then return end

    Effects[actionName](player, payload)
end
```

## Concrete Argument Sanitization

Sanitize every value the client sends before trusting it.

```lua
local function sanitizeNumber(value: unknown, min: number, max: number): number?
    if typeof(value) ~= "number" then return nil end
    if value ~= value then return nil end -- reject NaN
    return math.clamp(value, min, max)
end

local function sanitizeInstance(value: unknown, expectedClass: string, ancestor: Instance): Instance?
    if typeof(value) ~= "Instance" then return nil end
    if not value:IsA(expectedClass) then return nil end
    if not value:IsDescendantOf(ancestor) then return nil end
    return value
end

local VALID_KEYS = { Slot = true, Amount = true }
local function sanitizeDictionary(value: unknown): { [string]: unknown }
    if typeof(value) ~= "table" then return {} end
    local out = {}
    for k, v in pairs(value :: { [string]: unknown }) do
        if typeof(k) == "string" and VALID_KEYS[k] then
            out[k] = v
        end
    end
    return out
end
```

Instance references from the client can refer to any replicated Instance. Always re-validate the type, ancestry, and whether the player is permitted to interact with that specific object.

## Network Ownership

For physics objects (vehicles, projectiles, pushable crates):
- The network owner simulates the physics.
- Server can change ownership with `SetNetworkOwner`, which sets ownership for the **entire connected assembly**.
- Anchored parts are always server-owned; `SetNetworkOwner` cannot override them.
- Automatic ownership is based on character proximity and client capacity, not simply "nearest player."
- Use `Workspace.SetNetworkOwnerAuto = false` to disable automatic ownership assignment entirely when you need full manual control (e.g., competitive or tightly-controlled physics).
- Always validate important outcomes on the server regardless of who owns the physics.

## When Client Prediction is Acceptable

- Cosmetic animations
- Local camera work
- UI state
- Short-term movement prediction (with server correction)

Never predict economy, unlocks, damage application, or quest progress.

See the [exploits-and-defenses reference](exploits-and-defenses.md) for how to handle the cases where clients try to lie.
