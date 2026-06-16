# Units and Physical Properties

Official guide: https://create.roblox.com/docs/physics/units

## Primary units

| Unit | Roblox | Metric |
| --- | --- | --- |
| Time | 1 second | 1 second |
| Length | 1 stud | 28 cm |
| Mass | 1 RMU | 21.952 kg |

## Derived units

| Quantity | Metric | Roblox |
| --- | --- | --- |
| Water density | 1 g/cm³ | 1 RMU/stud³ |
| Air density (sea level) | 0.00129 g/cm³ | 0.00129 RMU/stud³ |
| Spring stiffness | 1 N/m | 0.0456 RMU/s² |
| Spring damping | 1 N·s/m | 0.0456 RMU/s |
| Velocity | 1 m/s | 3.57 studs/s |
| Force | 1 N | 0.163 Rowtons (RMU·stud/s²) |
| Torque | 1 N·m | 0.581 Rowton·studs (RMU·stud²/s²) |

## Gravity presets

| Preset | Roblox | Metric |
| --- | --- | --- |
| Classic (default) | 196.2 studs/s² | 54.936 m/s² |
| Realistic | 35 studs/s² | 9.8 m/s² |
| Action | 75 studs/s² | 21 m/s² |

## Physical property limits

| Property | Min | Max |
| --- | --- | --- |
| Density | 0.0001 | 100 RMU/stud³ |
| Friction | 0.0 | 2.0 |
| FrictionWeight | 0.0 | 100 |
| Elasticity | 0.0 | 1.0 |
| ElasticityWeight | 0.0 | 100 |

## Consistency

Use standard Roblox units throughout an experience. Custom interpretations (e.g., 1 stud = 1 foot) require recalibrating all physics constants and can break compatibility with default character controllers.

## Custom physical properties

```lua
local props = PhysicalProperties.new(
    0.7,  -- density
    0.3,  -- friction
    0.5,  -- elasticity
    1.0,  -- frictionWeight
    1.0   -- elasticityWeight
)
part.CustomPhysicalProperties = props
```

Set `CustomPhysicalProperties = nil` to revert to material defaults.
