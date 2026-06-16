# Mover Constraints

Official guide: https://create.roblox.com/docs/physics/mover-constraints

Mover constraints apply force, velocity, torque, or alignment to assemblies. They are the modern replacement for deprecated `BodyMover` objects.

## Migration table

| Deprecated | Modern | Notes |
| --- | --- | --- |
| `BodyPosition` | `AlignPosition` | Two modes: `Magnitude` and `PerAxis` |
| `BodyGyro` | `AlignOrientation` | `LookAtPosition` replaces some look-at logic |
| `BodyVelocity` | `LinearVelocity` | Vector/line/plane modes |
| `BodyAngularVelocity` | `AngularVelocity` | `RelativeTo` for reference frames |
| `BodyForce` / `BodyThrust` | `VectorForce` | Apply constant force relative to world/attachment |
| `RocketPropulsion` | `LineForce` + `AlignOrientation` | Follow + face target |

## `AlignPosition`

Moves `Attachment0` toward `Attachment1` or a world `Position`.

Key properties:
- `Mode` — `TwoAttachment` or `OneAttachment`.
- `RigidityEnabled` — if `true`, solver does whatever it takes; if `false`, use `MaxForce`, `MaxVelocity`, `Responsiveness`.
- `ForceLimitMode` — `Magnitude` (scalar `MaxForce`) or `PerAxis` (vector `MaxAxesForce`).
- `ApplyAtCenterOfMass` — apply at CoM instead of attachment point.
- `ReactionForceEnabled` — apply equal/opposite force to Attachment1.

## `AlignOrientation`

Aligns `Attachment0` orientation with `Attachment1` or a goal orientation.

Key properties:
- `AlignType` — `PrimaryAxisParallel`, `PrimaryAxisPerpendicular`, or `AllAxes`.
- `RigidityEnabled`, `MaxTorque`, `MaxAngularVelocity`, `Responsiveness`.
- `LookAtPosition` — separate `Vector3` that points Attachment0's primary axis at a world position (use with `OneAttachment` mode and a target orientation).

## `LinearVelocity`

Maintains constant linear velocity on an assembly.

- `VelocityConstraintMode`:
  - `Vector` — 3D velocity vector.
  - `Line` — velocity along attachment axis.
  - `Plane` — velocity within a plane.
- `RelativeTo` — world, Attachment0, Attachment1.
- `ForceLimitMode` / `MaxForce` / `MaxAxesForce`.

**Warning:** this applies force to *maintain* velocity. For one-time velocity, use `ApplyImpulse` or set `AssemblyLinearVelocity`.

## `AngularVelocity`

Maintains constant angular velocity.

- `AngularVelocity` vector in rad/s (relative to `RelativeTo`).
- `MaxTorque`.
- `RelativeTo`.

## `VectorForce`

Applies constant force.

- `Force` vector.
- `RelativeTo` — world or attachment frame.
- Apply at attachment point or CoM depending on setup.

## `Torque`

Applies constant torque about the assembly's center of mass.

- `Torque` vector.
- `RelativeTo`.

## `LineForce`

Applies force along the line connecting two attachments.

- `InverseSquareLaw` — falloff with distance (like gravity/magnetism).
- `Magnitude`.
- `ApplyAtCenterOfMass`.

## `AnimationConstraint`

Drives attachments by a target CFrame offset. Useful for animation-driven physics.

- `IsKinematic` — kinematic or force-based.
- `MaxForce` / `MaxTorque`.

## Choosing a mover

| Goal | Constraint |
| --- | --- |
| Move to position | `AlignPosition` |
| Face direction / look at target | `AlignOrientation` |
| Hover / follow | `AlignPosition` + `AlignOrientation` |
| Constant speed car | `LinearVelocity` or `VectorForce` |
| Spin propeller | `AngularVelocity` |
| Thruster / rocket | `VectorForce` |
| Magnet / gravity | `LineForce` |
| Guided missile | `LineForce` + `AlignOrientation` |

## Luau example: hover platform

```lua
local alignPos = script.Parent:WaitForChild("AlignPosition")
local alignOrn = script.Parent:WaitForChild("AlignOrientation")

alignPos.RigidityEnabled = false
alignPos.MaxForce = 100000
alignPos.MaxVelocity = 50
alignPos.Responsiveness = 50
alignPos.Position = Vector3.new(0, 10, 0)

alignOrn.RigidityEnabled = false
alignOrn.MaxTorque = 100000
alignOrn.MaxAngularVelocity = 5
alignOrn.Responsiveness = 50
```
