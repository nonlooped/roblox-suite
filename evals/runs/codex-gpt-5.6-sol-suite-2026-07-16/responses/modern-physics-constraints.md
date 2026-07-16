# modern-physics-constraints

Use `AlignPosition` to pull an unanchored assembly toward a target attachment. This lets the physics solver move the assembly instead of repeatedly assigning `CFrame`.

Required layout:

```text
Workspace
├── MovingAssembly
│   └── Root
│       └── MoverAttachment
└── Target
    └── TargetAttachment
```

```lua
--!strict
-- Server Script
local movingRoot = workspace.MovingAssembly.Root :: BasePart
local target = workspace.Target :: BasePart
local moverAttachment = movingRoot.MoverAttachment :: Attachment
local targetAttachment = target.TargetAttachment :: Attachment

assert(not movingRoot.Anchored, "The moving assembly must be unanchored")
target.Anchored = true

local alignPosition = Instance.new("AlignPosition")
alignPosition.Name = "TargetFollower"
alignPosition.Mode = Enum.PositionAlignmentMode.TwoAttachment
alignPosition.Attachment0 = moverAttachment
alignPosition.Attachment1 = targetAttachment
alignPosition.ApplyAtCenterOfMass = true
alignPosition.RigidityEnabled = false
alignPosition.Responsiveness = 25
alignPosition.MaxVelocity = 60

-- Scale available force with the entire assembly's mass.
alignPosition.MaxForce = math.max(
	movingRoot.AssemblyMass * workspace.Gravity * 4,
	10_000
)

alignPosition.Parent = movingRoot

-- Appropriate for authoritative platforms, hazards, or objective objects.
movingRoot:SetNetworkOwner(nil)
```

Moving `Target` or `TargetAttachment` changes the goal automatically. Add an `AlignOrientation` if the assembly must also face a target orientation. Avoid deprecated `BodyPosition` and per-frame `CFrame` assignments.

Network ownership determines where the assembly is simulated:

- Keep gameplay-critical hazards and shared platforms server-owned with `SetNetworkOwner(nil)`.
- Give a player ownership with `SetNetworkOwner(player)` when low-latency vehicle or carried-object control matters.
- Call `SetNetworkOwnershipAuto()` to restore automatic ownership.
- Set ownership from the server on the unanchored assembly root. Connected assemblies in a mechanism should normally share an owner to avoid jitter.
- Never trust client-owned physics for damage, scoring, or checkpoints. Clients can move owned assemblies or fabricate collision behavior, so validate position, distance, speed, and timing on the server.
