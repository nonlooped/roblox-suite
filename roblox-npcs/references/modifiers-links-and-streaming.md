---
last_reviewed: 2026-06-17
---

# Modifiers, Links, and Streaming

Official guide: https://create.roblox.com/docs/en-us/characters/pathfinding

## PathfindingModifier

A `PathfindingModifier` is an instance placed on an anchored, non-colliding part to influence path cost or traversability.

Properties:
- `Label` — string key referenced in `CreatePath` `Costs`.
- `PassThrough` — if `true`, the volume is ignored by the navmesh and treated as traversable empty space. The pathfinder can route straight through it; your NPC code is responsible for actually opening the door, climbing, etc.

### Region modifier example

To mark a dangerous zone that NPCs should avoid:

1. Create an anchored part covering the region.
2. Set `CanCollide = false`.
3. Add a `PathfindingModifier` with `Label = "DangerZone"`.
4. In `CreatePath`:

```lua
Costs = {
    DangerZone = math.huge,
}
```

### Pass-through example

To let a zombie path through a closed door it cannot actually open:

1. Create an anchored part covering the door.
2. Set `CanCollide = false`.
3. Add a `PathfindingModifier` with `PassThrough = true`.

The path will route through the door; your NPC code can then play an animation or sound.

## PathfindingLink

Links connect two `Attachment`s and allow traversal that the navmesh would not normally support.

Setup:
1. Create `Attachment0` and `Attachment1` on different parts.
2. Create a `PathfindingLink` in workspace.
3. Set `Attachment0`, `Attachment1`, and `Label`.
4. Optionally set `IsBidirectional`.

```lua
local link = Instance.new("PathfindingLink")
link.Attachment0 = attachmentA
link.Attachment1 = attachmentB
link.Label = "UseBoat"
link.IsBidirectional = true
link.Parent = workspace
```

In your pathfinder:

```lua
Costs = {
    Water = 20,
    UseBoat = 2,
}
```

When the waypoint label is `"UseBoat"`, trigger your custom action, then continue along the path:

```lua
local function onUseBoat(agent, waypoint)
    local boat = findBoatNear(waypoint.Position)
    seatAgent(agent, boat)
    moveBoat(boat, waypoint.Position)
    unseatAgent(agent)
end

-- In your path follower:
if waypoint.Label == "UseBoat" then
    onUseBoat(agent, waypoint)
end
```

## Streaming compatibility

Server-side pathfinding is unaffected by streaming.

Client-side pathfinding:
- Compute paths to persistent models when possible.
- Listen for `workspace.PersistentLoaded`.
- Recompute paths if streamed obstacles block the way.

```lua
workspace.PersistentLoaded:Connect(function(persistentModel)
    if persistentModel.Name == "ImportantDestination" then
        -- safe to reference now
    end
end)
```

## Limitations recap

- Max direct distance: 3,000 studs.
- Max nodes: ~20,000.
- Vertical waypoint range: ±65,536 studs.
- Parameter incompatibility causes failures.
