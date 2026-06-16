# Shapes, Flipbooks, and Advanced Particle Techniques

## Shape System Deep Dive

The Shape properties give you enormous control over where and how particles are born.

**Shape** (enum):
- Box: Simple axis-aligned box.
- Sphere: Spherical volume.
- Cylinder: Cylindrical volume.
- Disc: Flat circular disc.

**ShapeStyle**:
- Volume: Particles born anywhere inside the shape.
- Surface: Only on the outer surface of the shape.

**ShapeInOut**:
- Outward (default for many effects)
- Inward
- InAndOut (random mix)

**ShapePartial** (0-1):
- For Cylinder: multiplies the radius on the EmissionDirection side.
- For Disc: specifies the inner-radius proportion. `0` = fully closed disc, `1` = emission only on the outermost rim (larger hole as the value increases).
- For Sphere: hemispherical angle. `1` = full sphere, `0.5` = half-dome, `0` = point.

**Important parenting note**: Sphere and Cylinder shapes do **not** display correctly when the emitter is parented directly to an Attachment. Only use them with a BasePart parent (the part can be tiny and invisible).

## Flipbook Best Practices

Flipbooks turn a single texture into an animated sprite per particle.

Creation tips:
- Use power-of-two dimensions when possible.
- Leave clear transparent margins between frames (at least several pixels) because of mipmapping.
- Common layouts: 4x4 (16 frames), 8x8 (64 frames).
- For OneShot explosions, make the animation self-contained and time the framerate to the particle Lifetime.

Runtime tips:
- OneShot mode ignores `FlipbookFramerate` and plays the sheet exactly once over the particle Lifetime; time the Lifetime to the animation. Excellent for impact bursts and explosions.
- Random mode with low or zero framerate creates organic variation (different embers in a fire, slightly different spark shapes).
- Combine FlipbookStartRandom = true with framerate = 0 for "static but varied" particles (leaves, debris).
- Enable FlipbookBlendFrames to crossfade frames in Loop/OneShot/PingPong modes for smoother playback.

Memory cost is higher than static textures. Prefer reusing a small number of high-quality flipbook atlases across your experience.

Preload flipbook atlases and large effect textures with `ContentProvider:PreloadAsync` before they appear on screen to avoid pop-in on lower-end devices.

## Advanced Motion Techniques

- **Acceleration + Drag + Wind**: The classic way to make convincing smoke, leaves, or snow that reacts to global wind.
- **VelocityInheritance + LockedToPart**: Perfect for exhaust, auras, or "particles stuck to a moving character".
- **TimeScale**: Great for per-emitter slow-motion effects or speeding up a rain storm without touching every property.
- **Orientation = VelocityParallel**: Turns particles into streaks (good for fast motion, rain, lasers).

## Attachment Orientation

- When a ParticleEmitter is parented to an Attachment, `EmissionDirection` is ignored.
- Aim particles by rotating the Attachment (use `Attachment.WorldCFrame` or parent it to a part and rotate the part).
- This is the preferred way to control direction for weapon muzzles, foot dust, and directional bursts.

## One-Shot vs Continuous Emission

Continuous (Rate > 0): Good for ambient effects (campfire, rain, magic aura).

One-shot:
```lua
emitter.Rate = 0
emitter:Emit(30)  -- or a random range
```
Trigger from:
- Animation markers (best)
- Touched events
- Ability activation
- Explosion logic

You can also temporarily raise Rate for a short time and then lower it again, but Emit() is cleaner for discrete bursts.

## Combining Multiple Emitters

Most professional effects use 2-5 emitters parented to the same Attachment or Part:
- Core flame (bright, fast, high LightEmission)
- Smoke (slower, higher Lifetime, different Color/Transparency)
- Sparks (high Speed, short Lifetime, VelocityParallel orientation)
- Glow / light source (very large Size, high Transparency, additive)

Layer them with different ZOffset values when needed.

## Client-Authoritative Replication

- For one-shot bursts, fire a remote or local event to tell clients *that* the effect happened, then let each client spawn its own particles.
- This avoids replicating particle timing over the network and lets low-end clients skip or simplify effects.

## LOD and Distance Culling

- Disable emitters beyond 100–300 studs; reduce Rate at half that distance.
- Use a tagged heartbeat or spatial partition instead of per-frame distance checks for many emitters.
- Only spawn ambient weather/crowd emitters in the near-camera region.

## Cleanup for Transient Emitters

- Destroy one-shot clones after their maximum lifetime. Use `Debris:AddItem` or a `task.delay` tied to the emitter's `Lifetime.Max`.
- Set `Enabled = false` and `:Clear()` before reparenting or destroying continuous emitters.
- Reset pooled emitters to default Rate/Lifetime/Size/Transparency/Color before reuse.

## Script Example: Controlled Burst Emitter

See `scripts/EffectBurst.lua` for a clone-and-destroy helper that emits from every ParticleEmitter under a template Attachment or BasePart and schedules cleanup automatically.
