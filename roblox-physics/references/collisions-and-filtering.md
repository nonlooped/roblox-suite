---
last_reviewed: 2026-06-17
---

# Collisions and Filtering

Official guide: https://create.roblox.com/docs/workspace/collisions

## Collision events

- `BasePart.Touched` — fires when another part touches.
- `BasePart.TouchEnded` — fires when contact ends.
- These fire regardless of `CanCollide`.

## Collision filtering

### Collision groups

```lua
local PhysicsService = game:GetService("PhysicsService")

PhysicsService:RegisterCollisionGroup("Players")
PhysicsService:RegisterCollisionGroup("Projectiles")

PhysicsService:CollisionGroupSetCollidable("Players", "Projectiles", false)

PhysicsService:SetPartCollisionGroup(part, "Projectiles")
```

Useful for team-specific collisions, projectile passthrough, etc.

### `NoCollisionConstraint`

Disable collisions between two specific parts without managing groups:

```lua
local noCollide = Instance.new("NoCollisionConstraint")
noCollide.Part0 = partA
noCollide.Part1 = partB
noCollide.Parent = partA
```

## `CanCollide`, `CanTouch`, `CanQuery`

| Property | Effect |
| --- | --- |
| `CanCollide` | Physical collision response |
| `CanTouch` | Fires `Touched`/`TouchEnded` events |
| `CanQuery` | Included in spatial queries (`FindPartOnRay`, `GetPartsInPart`, etc.) |

Important: these are **not** confidentiality controls. They affect physics and queries, not replication or rendering.

## Detecting collisions safely

For gameplay-critical collisions, prefer server-side checks or Shapecasts/Raycasts over `Touched` events, especially when the touching part is client-owned.

```lua
local function onTouched(otherPart)
    if otherPart:IsDescendantOf(someSafeModel) then
        return
    end
    -- validate distance, ownership, etc.
end
```
