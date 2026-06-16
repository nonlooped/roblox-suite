# Performance and Scaling

## Throttle pathfinding

Avoid recomputing every frame. Use:
- Time interval (e.g., every 0.5–1 s).
- Distance threshold (only recompute if target moved > N studs).
- Event-driven recomputation (on `path.Blocked`).

## Reduce waypoint count

Set `WaypointSpacing = math.huge` to eliminate intermediate waypoints when straight-line movement is acceptable.

## Batch agents

Distribute recomputation across frames using a time budget so a large population cannot stall the frame:

```lua
local RunService = game:GetService("RunService")
local agents = {}
local index = 1
local BUDGET_MS = 2

RunService.Heartbeat:Connect(function()
    if #agents == 0 then return end
    local start = os.clock()
    local processed = 0
    repeat
        local agent = agents[index]
        agent:think()
        index = (index % #agents) + 1
        processed += 1
    until processed >= #agents or (os.clock() - start) * 1000 >= BUDGET_MS
end)
```

## Use local patrol paths

For large worlds, split the map into regions. NPCs pick patrol paths within their current region unless chasing a target.

## Avoid pathfinding when unnecessary

If the target is close and visible, move directly. Use raycasts for simple line-of-sight checks.

## Cache paths

If many agents share the same destination, compute once and share waypoints.

## Spatial queries for target detection

Use `workspace:GetPartBoundsInRadius` with an `OverlapParams` whitelist of player characters instead of iterating every player each frame. Validate hits with `FindFirstChild("HumanoidRootPart")` and `Humanoid.Health` checks.

## MicroProfiler

Tag AI work with `debug.profilebegin`/`debug.profileend`:

```lua
debug.profilebegin("NPC Think")
-- pathfinding and state logic
debug.profileend()
```

## Limits to keep in mind

- Max path distance: 3,000 studs.
- Max nodes: ~20,000.
- Each `ComputeAsync` is a solver call; treat it as a budgeted operation.
