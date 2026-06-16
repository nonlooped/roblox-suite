# NPC Behavior Patterns

## State machine

A state machine is the most maintainable pattern for NPCs:

```
Idle → Patrol → Alert → Chase → Attack → Return
```

Each state:
- Decides when to transition.
- Controls the Humanoid or mover constraints.
- Manages its own path computation.

## Follow behavior

Recompute path to a moving target on a staggered interval:

```lua
local lastRecompute = 0
local RECOMPUTE_INTERVAL = 0.5
local MIN_MOVE_DIST = 5

RunService.Heartbeat:Connect(function()
    local now = time()
    if now - lastRecompute < RECOMPUTE_INTERVAL then return end

    local hrp = target:FindFirstChild("HumanoidRootPart")
    if not hrp then return end
    if (hrp.Position - lastTargetPos).Magnitude < MIN_MOVE_DIST then return end

    lastRecompute = now
    lastTargetPos = hrp.Position
    followPath(hrp.Position)
end)
```

## Spatial target detection

Instead of scanning every player each frame, use a spatial query and validate the result:

```lua
local function findTarget(rootPart, detectionRange)
    local characters = {}
    for _, player in ipairs(Players:GetPlayers()) do
        if player.Character then
            table.insert(characters, player.Character)
        end
    end
    if #characters == 0 then return nil end

    local params = OverlapParams.new()
    params.FilterDescendantsInstances = characters
    params.FilterType = Enum.RaycastFilterType.Whitelist

    local parts = workspace:GetPartBoundsInRadius(rootPart.Position, detectionRange, params)
    for _, part in ipairs(parts) do
        local character = part:FindFirstAncestorOfClass("Model")
        if not character then continue end
        local hrp = character:FindFirstChild("HumanoidRootPart")
        local humanoid = character:FindFirstChild("Humanoid")
        if hrp and humanoid and humanoid.Health > 0 then
            return character
        end
    end
    return nil
end
```

## Patrol behavior

Loop through waypoints. Recompute path between points if blocked.

## Chase behavior

Server-authoritative chase:
- Detect target on server (line of sight, distance).
- Recompute path toward server-known target position.
- Validate target reach server-side before triggering attack.

Never trust a client that says "I am here, hit me."

## Group behavior

For groups of NPCs:
- Share a target position among squad members.
- Use formation offsets so they don't stack.
- Stagger recomputation to avoid spikes.

## Death and respawn handling

Stop all pathfinding and AI updates when the NPC dies:

```lua
humanoid.Died:Connect(function()
    behavior:Destroy()
end)
```

When an NPC respawns with a new character model, create a fresh behavior instance for that model and `Destroy` the old one. Do not reuse followers across models because connections and `Humanoid` references become stale.

## Cleanup / Destroy pattern

Every behavior that connects to `RunService.Heartbeat`, `Humanoid` events, or `Path.Blocked` should expose a `Destroy` method that disconnects everything and releases references:

```lua
function Behavior:Destroy()
    if self.connection then
        self.connection:Disconnect()
        self.connection = nil
    end
    if self.follower then
        self.follower:Destroy()
        self.follower = nil
    end
    self.model = nil
    self.humanoid = nil
end
```

## Non-humanoid agents

For agents without a `Humanoid`, use `AlignPosition`/`AlignOrientation` or `LinearVelocity` to move a root part along waypoints. See [roblox-physics-and-constraints/SKILL.md](../../roblox-physics-and-constraints/SKILL.md).

## Humanoid tuning

- `Humanoid.WalkSpeed` controls movement speed.
- `Humanoid.JumpPower` / `Humanoid.JumpHeight` control jumps.
- Call `Humanoid:Move(Vector3)` for direction-based movement.
- Use `Humanoid:MoveTo(position)` for simple point-to-point movement without pathfinding.

## Common anti-patterns

- Running pathfinding on every Heartbeat.
- Moving NPCs on the client and trusting their position.
- Ignoring `Blocked` events.
- Spawning too many agents without staggering.
- Using `Humanoid:MoveTo` for long-distance navigation without pathfinding.
