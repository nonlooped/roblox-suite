---
name: roblox-npcs
description: "Build or debug Roblox NPC navigation and behavior. Use for PathfindingService, modifiers and links, blocked paths, patrol or chase logic, streaming, and scaling NPC counts."
last_reviewed: 2026-06-17
---

# roblox-npcs

**Official sources:**
- https://create.roblox.com/docs/en-us/characters/pathfinding
- https://create.roblox.com/docs/en-us/workspace/streaming
- Engine classes: `PathfindingService`, `Path`, `PathWaypoint`, `PathfindingModifier`, `PathfindingLink`, `Humanoid`

Use PathfindingService for navigation on Roblox's navigation mesh. Build patrol, chase, and other behavior around its computed paths.

## PathfindingService basics

Create a path:

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
        DangerZone = math.huge,
    }
})
path.CalculationSecondsTimeout = 1
```

Compute and follow:

```lua
local humanoid = character:WaitForChild("Humanoid")
local rootPart = character:WaitForChild("HumanoidRootPart")

local success, err = pcall(function()
    path:ComputeAsync(rootPart.Position, endPos)
end)

if success and path.Status == Enum.PathStatus.Success then
    local waypoints = path:GetWaypoints()
    -- follow waypoints with Humanoid:Move()
end
```

## Agent parameters

| Parameter | Default | Purpose |
| --- | --- | --- |
| `AgentRadius` | 2 studs | Minimum clearance from obstacles |
| `AgentHeight` | 5 studs | Vertical clearance |
| `AgentCanJump` | true | Allows jump waypoints |
| `AgentCanClimb` | false | Allows climbing truss parts |
| `WaypointSpacing` | 4 studs | Distance between intermediate waypoints |
| `Costs` | nil | Material/region/link traversal cost |

`Path.CalculationSecondsTimeout` limits how long the solver may run per `ComputeAsync` call. Set it after `CreatePath` and before computing.

## PathWaypoint actions

Each waypoint has a `Position` and an `Action`:
- `Enum.PathWaypointAction.Walk`: normal movement.
- `Enum.PathWaypointAction.Jump`: trigger jump.
- Custom labels like `"Climb"` or `"UseBoat"` from PathfindingModifiers/Links.

## Pathfinding modifiers

`PathfindingModifier` instances on anchored, non-colliding parts let you influence path cost:
- `Label`: key used in `Costs` table.
- `PassThrough`: if `true`, the volume is ignored by the navmesh and treated as traversable empty space (e.g., zombies "hearing" through doors).

Example:

```lua
local path = PathfindingService:CreatePath({
    Costs = {
        Water = 20,
        DangerZone = math.huge,
        UseBoat = 2,
    }
})
```

## Pathfinding links

`PathfindingLink` connects two `Attachment`s with a custom label and cost, allowing paths across normally untraversable gaps.

Use for:
- Boats across water
- Teleporters
- Ladders
- One-way jumps

Your movement code checks the waypoint label and runs the custom traversal logic.

## Movement patterns

### Follow

Continuously recompute a path to a moving target. Throttle recomputation (e.g., every 0.5–1 s) and only recompute if the target moved far enough.

### Patrol

Cycle through a list of fixed points. Recompute when blocked.

### Chase

Like follow, but validate line-of-sight and distance server-side. Don't trust client-reported positions for authoritative AI.

### State machine

Common NPC states: Idle, Patrol, Chase, Attack, Return. Each state handles its own path computation and Humanoid control.

## Streaming compatibility

- Server-side scripts have full world state and can compute paths to any part.
- Client-side scripts may fail if the destination has streamed out. Use `workspace.PersistentLoaded` and persistent models for client path destinations.
- Recompute paths when dynamic/streamed obstacles block the way.

## Limitations

- Direct line-of-sight distance ≤ 3,000 studs.
- Computation node budget ≈ 20,000 nodes.
- Waypoint Y coordinate must be between -65,536 and +65,536 studs.
- Incompatible parameters (e.g., `AgentCanJump = false` to a jump-only destination) will fail.

## Performance at scale

- Recompute paths on a staggered schedule, not every frame.
- Share target positions across similar NPCs when possible.
- Use `WaypointSpacing = math.huge` to reduce intermediate waypoints for long straight runs.
- Consider simplifying agent geometry or using fewer active agents.
- For very large worlds, split into regions or use local patrol paths.

## Common mistakes

- Computing paths every frame.
- Ignoring blocked-path events and letting NPCs walk into walls.
- Trusting client position for authoritative AI.
- Forgetting `pcall` around `ComputeAsync`.
- Using material names incorrectly in `Costs` (must match `Enum.Material` names as strings).

## Scripts

- `scripts/NPCPathFollower.lua`: Humanoid-based path follower with blocked-path recompute, custom-label support, and connection cleanup.
- `scripts/PatrolBehavior.lua`: state-driven patrol/chase behavior with spatial detection and throttled recomputation.
- `scripts/PathfindingUtility.lua`: helpers for throttled recomputation and waypoint formatting.

## Best practices

- Set `Path.CalculationSecondsTimeout` after `CreatePath` to cap solver time.
- Always set an explicit `Humanoid:MoveTo` timeout and cancel it when the waypoint is reached or the follower is stopped.
- Detect targets with spatial queries such as `workspace:GetPartBoundsInRadius` instead of scanning every player each frame.
- Stop path followers and clean up `Heartbeat` connections when the `Humanoid` dies or the NPC is destroyed.
- For respawning NPCs, create a new behavior instance for the new character model and `Destroy` the old one.
- Use `PathfindingLink` labels to trigger custom traversal logic (boats, teleporters, ladders). The follower invokes a registered handler; if none exists, the waypoint falls back to normal movement.
- To enable climbing, set `AgentCanClimb = true` and provide `TrussPart` surfaces. Climb waypoints have the `Label` `"Climb"`.
- `PathfindingModifier` parts must be `Anchored = true` and `CanCollide = false`.

## How to proceed

1. Define the agent's size and movement abilities.
2. Build the world with modifiers/links for special regions.
3. Implement a path-follower that handles waypoints, jumps, and blocked events.
4. Layer a state machine for complex behaviors.
5. Run on the server for authoritative AI; use client only for visual prediction.
6. Profile with MicroProfiler and stagger recomputation for many agents.

<!-- catalog:references:start -->
## Reference index

- [modifiers-links-and-streaming.md](references/modifiers-links-and-streaming.md): Route NPCs through special regions or handle streamed geometry.
- [npc-behavior-patterns.md](references/npc-behavior-patterns.md): Implement patrol, chase, combat, or state transitions.
- [pathfinding-service-details.md](references/pathfinding-service-details.md): Configure agents, compute paths, or handle blocked waypoints.
- [performance-and-scaling.md](references/performance-and-scaling.md): Reduce pathfinding and simulation cost as NPC counts grow.
<!-- catalog:references:end -->
