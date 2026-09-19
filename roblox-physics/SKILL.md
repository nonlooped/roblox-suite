---
name: roblox-physics
description: "Build or debug Roblox vehicles, mechanisms, and moving objects. Use for assemblies, mechanical or mover constraints, network ownership, collision filtering, and simulation performance."
last_reviewed: 2026-06-17
---

# roblox-physics

**Official sources:**
- https://create.roblox.com/docs/physics
- https://create.roblox.com/docs/physics/assemblies
- https://create.roblox.com/docs/physics/mechanical-constraints
- https://create.roblox.com/docs/physics/mover-constraints
- https://create.roblox.com/docs/physics/network-ownership
- https://create.roblox.com/docs/physics/sleep-system
- https://create.roblox.com/docs/physics/adaptive-timestepping
- https://create.roblox.com/docs/physics/units
- https://create.roblox.com/docs/workspace/collisions

Use mechanical constraints to connect parts and mover constraints to apply forces or velocity targets. For older code, use the BodyMover migration table below.

## Core concepts

### Assemblies

An **assembly** is one or more parts connected by rigid welds or movable joints, simulated as a single rigid body.

Key `BasePart` properties (same for any part in the assembly):
- `AssemblyLinearVelocity` / `AssemblyAngularVelocity`: prefer constraints or `ApplyImpulse` over direct assignment for realistic motion.
- `AssemblyCenterOfMass`: force here produces pure linear acceleration.
- `AssemblyMass`: sum of all part masses; infinite if any part is anchored.
- `AssemblyRootPart`: automatically chosen root for replication and network ownership.

Root-part priority: anchored > non-massless > higher `RootPriority` > size/name heuristics.

### Anchoring

- Anchoring one part in an assembly makes it the root; the rest are implicitly anchored.
- Anchoring multiple parts in the same assembly **splits** it.
- To anchor an entire assembly, only anchor the root part.

### Collision filtering

Use collision groups (`Workspace:RegisterCollisionGroup` (inherited from `WorldRoot`), `BasePart.CollisionGroup`) or `NoCollisionConstraint` for part-to-part filtering. `CanCollide`, `CanTouch`, and `CanQuery` control different behaviors; see [references/collisions-and-filtering.md](references/collisions-and-filtering.md).

## Mechanical constraints

All mechanical constraints connect one or two `Attachment`s (or `Bone`s), except `WeldConstraint` and `NoCollisionConstraint` which use `Part0`/`Part1`.

| Constraint | Use case |
| --- | --- |
| `WeldConstraint` | Rigidly lock two parts together, same relative transform |
| `RigidConstraint` | Same as WeldConstraint but attachment-based, supports bones |
| `HingeConstraint` | Doors, levers, rotating parts; motor/servo optional |
| `PrismaticConstraint` | Sliding doors, elevators, pistons |
| `CylindricalConstraint` | Slides + rotates, like hydraulic rams or landing gear |
| `SpringConstraint` | Springs, shocks, suspension |
| `TorsionSpringConstraint` | Rotational springs |
| `BallSocketConstraint` | Shoulders, ball joints |
| `UniversalConstraint` | Drive shafts, constant-velocity joints |
| `RopeConstraint` | Cables, winches, maximum length |
| `RodConstraint` | Fixed separation distance |
| `PlaneConstraint` | Constrain motion to a plane |
| `NoCollisionConstraint` | Disable collisions between two specific parts |

See [references/mechanical-constraints.md](references/mechanical-constraints.md) for creation, orientation, motor/servo tuning, and limits.

## Mover constraints

Modern replacements for deprecated `BodyMover`s:

| Legacy | Modern | Use case |
| --- | --- | --- |
| `BodyPosition` | `AlignPosition` | Move attachment to a position or another attachment |
| `BodyGyro` | `AlignOrientation` | Align orientation; `LookAtPosition` for tracking |
| `BodyVelocity` | `LinearVelocity` | Maintain constant velocity along vector/line/plane |
| `BodyAngularVelocity` | `AngularVelocity` | Maintain constant angular velocity |
| `BodyForce`/`BodyThrust` | `VectorForce` | Apply constant force |
| `RocketPropulsion` | `LineForce` + `AlignOrientation` | Follow + face target |
| - | `Torque` | Apply constant torque |
| - | `LineForce` | Force along line between two attachments |
| - | `AnimationConstraint` | Constraint driven by animation/transform |

See [references/mover-constraints.md](references/mover-constraints.md) for force modes (`Magnitude` vs `PerAxis`), relativity frames, rigidity, and reaction forces.

## Network ownership

- The server owns anchored parts.
- Unanchored parts near a player character are automatically owned by that client.
- Set ownership explicitly with `BasePart:SetNetworkOwner(player)` (server only). Reset with `SetNetworkOwnershipAuto()`.
- Assign vehicle/driver ownership carefully: the first seated player may own the whole assembly otherwise.

**Security:** clients can exploit owned parts (teleport, fake collisions). Validate gameplay-critical events server-side. See [references/network-ownership.md](references/network-ownership.md).

## Sleep system

Assemblies stop simulating when still to save performance. They wake on collisions, property changes, impulses, or gravity/wind changes.

- If a slow mechanism falls asleep, increase motion or use actuated joints (motor/servo constraints) which get stricter sleep thresholds.
- Visualize sleep states with **Awake parts** in Studio's Visualization Options.

## Physics stepping method

Workspace.PhysicsSteppingMethod:
- **Fixed** (default, 240 Hz): best general choice; use for racing, destruction, tanks, or when most parts already solve at 240 Hz.
- **Adaptive**: assigns assemblies to 60/120/240 Hz islands for up to ~2.5× performance in suitable experiences.

Use the MicroProfiler to check island distribution.

## Units quick reference

| Roblox | Metric |
| --- | --- |
| 1 stud | 28 cm |
| 1 RMU | 21.952 kg |
| 196.2 studs/s² | default "Classic" gravity |
| 35 studs/s² | "Realistic" gravity (≈ 9.8 m/s²) |

See [references/units-and-physical-properties.md](references/units-and-physical-properties.md).

## Common mistakes

- Using deprecated `BodyMover`s instead of modern constraints.
- Setting `CFrame` every frame instead of using forces/constraints.
- Anchoring every part in an assembly (splits it and hurts performance).
- Ignoring network ownership on vehicles and then wondering why input lags.
- Trusting `Touched` events from client-owned parts for damage/authority.
- Letting actuated joints fall asleep prematurely.

## Scripts

- `scripts/VehicleController.lua`: chassis setup with `HingeConstraint` steering and motor drive, with client ownership and server validation.
- `scripts/DoorHinge.lua`: motorized/servo door with limits and state machine.
- `scripts/PlatformMover.lua`: `AlignPosition` + `AlignOrientation` platform with configurable waypoints.
- `scripts/Suspension.lua`: spring-damper suspension using `SpringConstraint`.

## How to proceed

1. Decide if the object is a rigid mechanism (mechanical constraint) or force-driven (mover constraint).
2. Plan assemblies, root parts, and anchoring strategy.
3. Set network ownership for multiplayer responsiveness.
4. Tune forces/velocities using units and physical properties.
5. Profile with MicroProfiler and watch sleep/ownership visualizations.

<!-- catalog:references:start -->
## Reference index

- [collisions-and-filtering.md](references/collisions-and-filtering.md): Configure collision groups, touch events, or spatial query filters.
- [mechanical-constraints.md](references/mechanical-constraints.md): Connect parts with hinges, springs, ropes, or other mechanical constraints.
- [mover-constraints.md](references/mover-constraints.md): Apply forces or velocity targets, or migrate BodyMover code.
- [network-ownership.md](references/network-ownership.md): Assign physics simulation to the server or a player and debug ownership.
- [units-and-physical-properties.md](references/units-and-physical-properties.md): Tune mass, density, friction, force, or simulation stepping.
<!-- catalog:references:end -->
