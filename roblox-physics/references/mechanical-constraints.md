# Mechanical Constraints

Official guide: https://create.roblox.com/docs/physics/mechanical-constraints

## Creating constraints

Most mechanical constraints require two `Attachment` instances (or `Bone` instances). The constraint's behavior depends on attachment orientation:
- **Axis** (yellow arrow) defines primary rotation/translation axes.
- **SecondaryAxis** defines secondary orientation.

You can create constraints via:
1. Studio **Constraint Picker** in the Model tab.
2. Explorer → insert constraint → link `Attachment0`/`Attachment1` (or `Part0`/`Part1` for Weld/NoCollision).

## Constraint reference

### `WeldConstraint`

- Connects `Part0` and `Part1` rigidly.
- Maintains relative position and orientation.
- Deactivates if parts are anchored into different assemblies.
- No attachments needed.

### `RigidConstraint`

- Attachment-based rigid connection.
- Supports `Bone`s for skinned mesh applications.
- Same relative transform behavior as WeldConstraint.

### `HingeConstraint`

- Rotates around one shared axis.
- **Motor** mode: target `AngularVelocity` with acceleration/torque limits.
- **Servo** mode: target `TargetAngle` with speed/torque limits.
- `LimitsEnabled` + `LowerAngle`/`UpperAngle`/`Restitution` for swing doors, levers, etc.

**Tip:** make sure both attachments' `Axis` properties point the same direction.

### `PrismaticConstraint`

- Slides along one axis, no rotation.
- Motor/servo modes for elevators, pistons, drawers.
- Use `LimitsEnabled` to define slide range.

### `CylindricalConstraint`

- Combines prismatic slide + hinge rotation.
- Separate linear and angular actuator controls.
- Useful for landing gear, hydraulic arms, screw mechanisms.

### `SpringConstraint`

- Applies force based on displacement and relative velocity.
- `FreeLength` is the rest length.
- `Stiffness` and `Damping` tune oscillation.
- Optional `MinLength`/`MaxLength`.
- Units: stiffness ≈ 0.0456 RMU/s² per N/m; damping ≈ 0.0456 RMU/s per N·s/m.

### `TorsionSpringConstraint`

- Applies torque based on angular displacement and velocity.
- Useful for torsion bars, rotational return springs.

### `BallSocketConstraint`

- Same position, free rotation on all axes.
- Optional cone/limit constraints.

### `UniversalConstraint`

- Keeps two axes perpendicular.
- Common in drive shafts and robotics.

### `RopeConstraint`

- Prevents attachments from separating beyond `Length`.
- `WinchEnabled` allows motorized length change.

### `RodConstraint`

- Maintains fixed separation distance.
- Optional tilt limits.

### `PlaneConstraint`

- Constrains motion to a plane defined by attachment orientation.

### `NoCollisionConstraint`

- Disables collisions between `Part0` and `Part1`.
- Both parts still collide with the rest of the world.

## Actuator types

Most powered constraints support:
- **None** — passive constraint, no force applied.
- **Motor** — continuous motion toward a velocity.
- **Servo** — moves to and holds a target position/angle.

Tuning parameters:
- `MaxForce` / `MaxTorque` — caps applied force.
- `MotorMaxAcceleration` / `MotorMaxForce` — motor responsiveness.
- `Responsiveness` — servo stiffness.
- `Restitution` — bounciness at limits.

## Constraint visualization

Enable in Studio:
- **Show Welds** (`Alt`+`W` / `⌥`+`W`)
- **Show Constraint Details** (`Alt`+`D` / `⌥`+`D`)
- **Assemblies** / **Mechanisms** in Visualization Options

Use these to debug orientation, root parts, and ownership.

## Luau example: powered hinge door

```lua
local hinge = script.Parent:WaitForChild("HingeConstraint")

-- Open 90 degrees
hinge.ActuatorType = Enum.ActuatorType.Servo
hinge.ServoMaxTorque = 5000
hinge.AngularSpeed = 2
hinge.TargetAngle = 90

-- Close
hinge.TargetAngle = 0
```

## Luau example: spring-damper suspension

```lua
local spring = script.Parent:WaitForChild("SpringConstraint")
spring.Stiffness = 5000
spring.Damping = 500
spring.FreeLength = 3
```
