# modern-physics-constraints

`AlignPosition` is the modern replacement for position-seeking `BodyPosition` behavior. It applies solver forces to the entire connected assembly.

```lua
-- ServerScriptService/MoveAssembly.server.lua
local assemblyRoot = workspace.Crate.PrimaryPart
assert(assemblyRoot, "Crate needs a PrimaryPart")

assemblyRoot.Anchored = false

local attachment = Instance.new("Attachment")
attachment.Name = "MoveAttachment"
attachment.Parent = assemblyRoot

local alignPosition = Instance.new("AlignPosition")
alignPosition.Name = "TargetMover"
alignPosition.Mode = Enum.PositionAlignmentMode.OneAttachment
alignPosition.Attachment0 = attachment
alignPosition.ApplyAtCenterOfMass = true
alignPosition.RigidityEnabled = false
alignPosition.MaxForce = 50_000
alignPosition.MaxVelocity = 30
alignPosition.Responsiveness = 15
alignPosition.Position = Vector3.new(100, 10, 25)
alignPosition.Parent = assemblyRoot

-- Update this whenever the destination moves.
local function setTarget(position: Vector3)
	alignPosition.Position = position
end

setTarget(workspace.Target.Position)
```

Use `AlignOrientation` alongside it if the assembly must also face a direction. Use `LinearVelocity` when the goal is a maintained velocity rather than arrival at a position, `VectorForce` when controlling force directly, and `BasePart:ApplyImpulse()` for a one-time launch. [Mover constraints](https://create.roblox.com/docs/physics/mover-constraints) describe these modern replacements, while [AlignPosition](https://create.roblox.com/docs/physics/constraints/align-position) documents its force, velocity, and responsiveness controls.

Network ownership applies to the whole unanchored assembly:

```lua
-- Force server ownership for an authoritative gameplay object.
assemblyRoot:SetNetworkOwner(nil)

-- Or restore Roblox's automatic ownership selection later.
assemblyRoot:SetNetworkOwnershipAuto()
```

Server ownership is appropriate for competitive, damaging, or otherwise security-sensitive objects, but can look less responsive to clients. Client ownership is smoother for player-controlled vehicles and similar mechanisms, but the owning client can manipulate the simulated position, velocity, collisions, and touch events. Assign ownership only from the server, generally to the controlling player, and validate important outcomes server-side. [Roblox network ownership guidance](https://create.roblox.com/docs/physics/network-ownership)
