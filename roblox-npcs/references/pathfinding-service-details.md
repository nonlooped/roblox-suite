# Pathfinding Service Details

Official guide: https://create.roblox.com/docs/en-us/characters/pathfinding

## Creating a path

```lua
local PathfindingService = game:GetService("PathfindingService")

local path = PathfindingService:CreatePath({
    AgentRadius = 2,
    AgentHeight = 5,
    AgentCanJump = true,
    AgentCanClimb = false,
    WaypointSpacing = 4,
    Costs = {
        Water = 20,
        CrackedLava = 100,
        DangerZone = math.huge,
    }
})
path.CalculationSecondsTimeout = 1
```

## Computing the path

Set a solver timeout after creating the path, then wrap `ComputeAsync` in `pcall`:

```lua
path.CalculationSecondsTimeout = 1

local rootPart = character:WaitForChild("HumanoidRootPart")
local ok, err = pcall(function()
    path:ComputeAsync(rootPart.Position, endPos)
end)

if not ok or path.Status ~= Enum.PathStatus.Success then
    warn("Path computation failed:", err or path.Status)
    return nil
end

local waypoints = path:GetWaypoints()
```

## PathWaypoint structure

```lua
for i, waypoint in ipairs(waypoints) do
    print(i, waypoint.Position, waypoint.Action, waypoint.Label)
end
```

- `Position` — `Vector3` target.
- `Action` — `Enum.PathWaypointAction`.
- `Label` — custom string from modifiers/links.

## Blocked paths

Connect to `path.Blocked` and only recompute if the blocked waypoint is ahead. Disconnect the old connection before recomputing to avoid duplicate listeners:

```lua
local blockedConnection

local function followPath(targetPosition)
    -- compute path, get waypoints, currentWaypointIndex ...

    if blockedConnection then
        blockedConnection:Disconnect()
        blockedConnection = nil
    end

    blockedConnection = path.Blocked:Connect(function(blockedIndex)
        if blockedIndex >= currentWaypointIndex then
            blockedConnection:Disconnect()
            blockedConnection = nil
            followPath(targetPosition)
        end
    end)
end
```

## MoveTo timeout and cancellation

`Humanoid:MoveTo` has an implicit timeout. Set your own explicit timeout, cancel it when `MoveToFinished` fires, and retry or fail after repeated misses:

```lua
local moveToTimeoutThread

local function moveToWaypoint(waypoint)
    humanoid:MoveTo(waypoint.Position)

    if moveToTimeoutThread then
        task.cancel(moveToTimeoutThread)
    end
    moveToTimeoutThread = task.delay(6, function()
        -- retry or report failure
        moveToWaypoint(waypoint)
    end)
end

humanoid.MoveToFinished:Connect(function(reached)
    if moveToTimeoutThread then
        task.cancel(moveToTimeoutThread)
        moveToTimeoutThread = nil
    end
    if reached then
        -- advance to next waypoint
    end
end)
```

## Climbing

Set `AgentCanClimb = true` in `CreatePath` to allow routes over `TrussPart` surfaces. Climb waypoints have `Action == Enum.PathWaypointAction.Climb` and `Label == "Climb"`. The Humanoid performs the climb automatically when it reaches the truss.

## Material costs

Keys are strings matching `Enum.Material` names:

```lua
Costs = {
    Water = 20,
    CrackedLava = 100,
    Slate = 20,
}
```

Use `math.huge` to forbid traversal entirely.

## Common statuses

- `Enum.PathStatus.Success` — path found.
- `Enum.PathStatus.NoPath` — no valid path with given parameters.
- `Enum.PathStatus.ClosestNoPath` — partial path returned to nearest reachable point.

## Debugging

Enable in Studio Visualization Options:
- **Navigation mesh**
- **Pathfinding modifiers**
- **Pathfinding links**

These show traversable areas, modifier labels, and link connections.
