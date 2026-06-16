# Particle Emitter Properties Reference

**Main source:** https://create.roblox.com/docs/en-us/effects/particle-emitters

This reference expands on every significant property with usage notes, interactions, and examples.

## Emission Control

- **Enabled**: Master switch. Setting false stops new particles but existing ones continue. Use :Clear() to instantly remove active particles.
- **Rate**: Particles per second (capped ~400 on desktop, ~100 on mobile per emitter). Lower rate + clever lifetime/size is usually better than high rate.
- **Speed**: Initial velocity range (studs per second). Negative values emit backward. Does not affect already spawned particles.
- **SpreadAngle**: Vector2 (X, Y) deviation in degrees from EmissionDirection.
- **Lifetime**: Seconds or NumberRange (random per particle). Hard capped internally at 20 seconds.
- **EmissionDirection**: Only relevant when parented to a BasePart (which face emits from). When parented to an Attachment, rotate the Attachment to aim emission; EmissionDirection is ignored.

## Visual Appearance

- **Texture**: The image each particle uses. PNG with transparency is ideal. For grayscale textures, set LightEmission = 1 to make dark areas invisible.
- **Color**: ColorSequence. Even a constant Color3 in Studio is stored as a one-keypoint ColorSequence. Keypoints define the gradient over particle lifetime.
- **Size**: NumberSequence. Use envelopes (the pink lines in the sequence editor) for per-particle random variation.
- **Transparency**: NumberSequence is extremely important. Almost always fade particles toward the end of life (and sometimes at birth) to prevent popping.
- **Squash**: NumberSequence for non-uniform scaling (positive = tall & skinny, negative = wide & flat). Useful for stylized effects.
- **Orientation**: 
  - FacingCamera (default billboard quad)
  - FacingCameraWorldUp (billboard but locked to world Y)
  - VelocityParallel / VelocityPerpendicular (aligns with movement — great for streaks and sparks)
- **LightEmission**: 0 = normal alpha blend, 1 = additive (glowing effect even in darkness).
- **LightInfluence**: 0 = completely unaffected by world lighting, 1 = fully lit by environment.
- **Brightness**: Scales the light the emitter contributes when `LightInfluence` is 0. No effect when `LightInfluence` is 1.
- **ZOffset**: Moves the render layer forward/back in studs without changing 3D position. Useful for layering multiple emitters.

## Shape System

- **Shape**: Box, Sphere, Cylinder, Disc.
- **ShapeStyle**: Volume (emit inside the volume) or Surface (emit on the boundary).
- **ShapeInOut**: Inward, Outward, or InAndOut.
- **ShapePartial**: Modifies the shape. Cylinder: multiplies the radius on the emission-direction side. Disc: inner-radius proportion (`0` = fully closed disc, `1` = emission only on the outermost rim; larger hole as the value increases). Sphere: hemispherical angle (`1` = full sphere, `0.5` = half-dome, `0` = point).

**Important parenting note**: Sphere and Cylinder shapes do **not** display correctly when the emitter is parented only to an Attachment. Only use them with a BasePart parent (the part can be tiny and invisible).

## Motion Over Lifetime

- **Acceleration**: Constant velocity change per second (Vector3). Primary way to simulate gravity (0, -9.81 or lower, 0).
- **Drag**: How quickly particles lose speed (half-life style). Higher = quicker slowdown.
- **WindAffectsDrag**: When true and global wind is enabled in the experience, particles are pushed by the wind vector (requires Drag > 0).
- **VelocityInheritance**: 0-1 factor of how much of the parent's current velocity is given to new particles.
- **LockedToPart**: Particles stay attached to the emitter's current world position as it moves (like a trail of smoke from a moving object).
- **TimeScale**: 0-1 speed multiplier for this emitter's particle effect (useful for per-effect slow-motion or speed-up without changing all other numbers).
- **Rotation** and **RotSpeed**: Initial angle and angular velocity (degrees or ranges). Negative = counter-clockwise.

## Flipbook Animation (Texture Sheets)

For animated particles (fire loops, explosions, magic bursts):

- Prepare a texture atlas with consistent grid (2x2, 4x4, 8x8, or Custom via FlipbookSizeX/Y). Leave margin between frames.
- **FlipbookLayout**
- **FlipbookFramerate** (or NumberRange for variation, max 30 fps)
- **FlipbookMode**: Loop, OneShot (plays the sheet exactly once over the particle Lifetime and ignores `FlipbookFramerate`), PingPong, Random (with blending).
- **FlipbookStartRandom**: Start each particle at a random frame instead of frame 0.
- **FlipbookBlendFrames**: Crossfade between adjacent frames for smoother Loop/OneShot/PingPong playback.

Flipbooks cost more memory. Reuse the same atlas across multiple emitters when possible.

## Other Notable Properties

- **LockedToPart** + **VelocityInheritance** combinations are powerful for attached weapon effects or vehicle exhaust.
- **Clear()** method: Instantly removes all currently active particles from this emitter.
- **Emit(numParticles)**: Forces a burst of particles regardless of Rate (very useful for one-shot effects triggered by code or animation markers).

## Replication & Client Authoritative Emission

- Continuous emitters replicate their state, and each client simulates its own particles locally. The server does not send individual particles.
- For one-shot bursts, prefer client-authoritative emission: the server signals that an effect happened, and each client spawns the burst locally. This avoids network chatter and respects per-client quality settings.
- Use `RemoteEvent:FireClient` or local event systems; keep gameplay logic authoritative on the server.

## LOD & Distance Culling

- Disable or reduce emitters when the camera is far away. Typical cutoffs: 100–300 studs for disable, half Rate at half distance.
- Use `workspace.CurrentCamera` distance checks, tag-based heartbeat systems, or spatial partitions. Avoid per-frame `Magnitude` for many emitters.
- Preload textures with `ContentProvider:PreloadAsync` for flipbook atlases and prominent effect textures before they are needed (loading screens, before combat).

## Overdraw & Fill-Rate Measurement

- The main GPU cost of particles is fill rate: how many transparent pixels overlap on screen.
- In Studio, use **View → Stats → GPU → Fill Rate** and **Render → Overdraw** to visualize cost. Optimize Size and Transparency before Rate.

## Cleanup for Transient Emitters

- Destroy one-shot clones after their maximum lifetime via `Debris:AddItem` or `task.delay`. Do not let disabled emitters accumulate.
- For continuous emitters, set `Enabled = false` and call `:Clear()` before reparenting or destroying.
- When pooling, reset Rate, Lifetime, Size, Transparency, and Color to default values before reuse.

## Property Interaction Notes

Many properties only affect particles at the moment they are emitted. Changing Acceleration after particles exist will affect them, but changing Speed will not.

Transparency and Size sequences are evaluated over the particle's individual lifetime (0 to 1 normalized).

For best results, combine a low-to-medium Rate with a good Transparency fade, Size growth or shrink, and Color shift.

See the performance reference for how these choices impact GPU cost.
