---
last_reviewed: 2026-09-19
---

# Collisions and Filtering

Official sources:
- https://create.roblox.com/docs/workspace/collisions
- https://create.roblox.com/docs/reference/engine/classes/WorldRoot
- https://create.roblox.com/docs/reference/engine/classes/PhysicsService
- https://create.roblox.com/docs/reference/engine/classes/BasePart

## Collision events

- `BasePart.Touched` — fires when another part touches.
- `BasePart.TouchEnded` — fires when contact ends.
- These can fire regardless of `CanCollide`, but both parts must have `CanTouch` enabled.

## Collision filtering

### Collision groups

Collision group configuration belongs to each `WorldRoot` (`Workspace` or a `WorldModel`). The current API reference deprecates `PhysicsService` in favor of these methods; existing service calls forward to `Workspace`. Configure the world containing the parts.

```lua
local world = workspace

for _, name in { "Players", "Projectiles" } do
    if not world:IsCollisionGroupRegistered(name) then
        world:RegisterCollisionGroup(name)
    end
end

world:CollisionGroupSetCollidable("Players", "Projectiles", false)

part.CollisionGroup = "Projectiles"
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
| `CanQuery` | Included in spatial queries (`Raycast`, `GetPartsInPart`, etc.; disabling `CanQuery` takes effect when `CanCollide` is false) |

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
