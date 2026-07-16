---
name: roblox-vfx
description: "Roblox ParticleEmitter, Beam, Trail, and Highlight effects with performance-aware guidance. Covers sequences, shapes, flipbooks, one-shot vs continuous emission, marker-driven bursts, lighting interaction, and fill-rate budgets. Use for any visual effect — never set Rate and Size blindly. Pairs with roblox-animation for marker-driven bursts."
last_reviewed: 2026-06-17
---

# roblox-vfx

**Main source:** https://create.roblox.com/docs/en-us/effects/particle-emitters + the Effects section of the docs and the ParticleEmitter class reference.

This skill exists because surface-level "add a ParticleEmitter and tweak Rate and Size" implementations look bad, perform terribly, or both. Real effects require understanding sequences, shapes, flipbooks, lighting interaction, and strict performance discipline.

See roblox-animation for driving emitters from markers, roblox-user-interfaces for UI-based particle illusion techniques (real ParticleEmitters do not render inside ViewportFrame), and roblox-vfx references/ for property-by-property deep dives.

## Core Creation & Parenting

- Parent ParticleEmitter to a BasePart (emission fills bounds or chosen EmissionDirection face) **or** (strongly preferred for control) to an Attachment.
- Rotate the parent or the attachment to steer emission. EmissionDirection is ignored when parented to an Attachment; rotate the Attachment itself to aim particles.
- EmissionDirection only matters when parented to a part.

## The Visual Control Stack (in rough order of impact)

1. Texture (prefer .png with alpha; grayscale + LightEmission=1 to hide dark areas).
2. Color (ColorSequence — even a single Color3 in Studio is stored as a one-keypoint ColorSequence; use it for gradients over lifetime).
3. Size (NumberSequence, often with envelope for natural variation). **Warning:** Large sizes = high GPU fill-rate cost.
4. Transparency (NumberSequence — almost always fade in or out to avoid popping. This is one of the highest-leverage properties for realism).
5. Lifetime (or NumberRange for per-particle random).
6. Rate (particles per second; hard caps ~400 desktop / 100 mobile per emitter — keep low and achieve density with other properties).

Then motion (Speed at birth, SpreadAngle, Acceleration for gravity/wind, Drag + WindAffectsDrag when global wind is enabled, VelocityInheritance, LockedToPart, TimeScale).

## Shape System (very powerful when understood)

Shape = Box / Sphere / Cylinder / Disc.
- ShapeStyle = Volume (everywhere inside) or Surface (only the skin).
- ShapeInOut = Inward / Outward / InAndOut.
- ShapePartial further modulates the shape. Cylinder: radius on the emission side. Disc: inner-radius proportion (`0` = fully closed disc, `1` = emission only on the outer rim). Sphere: hemispherical angle (`1` = full sphere, `0.5` = half-dome, `0` = point).

Sphere/Cylinder shapes do **not** display correctly when the emitter is parented to an Attachment. Only use them with a BasePart parent (the part can be tiny and invisible).

## Flipbooks (animated textures over particle life)

Prepare a grid sheet (2x2, 4x4, 8x8, Custom) with transparent spacing between frames (mip filtering is hungry).
- FlipbookLayout, FlipbookSizeX/Y.
- FlipbookFramerate (or random range, max 30).
- FlipbookMode: Loop, OneShot (explosions; ignores `FlipbookFramerate` and plays exactly once over the particle Lifetime), PingPong, Random (with crossfade — great for organic variation).
- FlipbookBlendFrames: crossfade between adjacent frames in Loop/OneShot/PingPong for smoother animation.
- FlipbookStartRandom: each particle starts at a random frame (useful when framerate is 0 for static but varied look).

**Memory warning:** Flipbooks are heavier. Reuse textures, keep resolution reasonable, limit unique animated emitters on low-memory clients (older phones will auto-disable flipbooks).

## Lighting & Rendering Controls

- LightEmission: 0 normal, 1 additive/glow (works even in dark scenes).
- LightInfluence: 0 = ignore world light, 1 = fully affected.
- Brightness: scales the light the emitter contributes when `LightInfluence` is 0. No effect when `LightInfluence` is 1.
- Orientation: FacingCamera (classic billboard), FacingCameraWorldUp, VelocityParallel, VelocityPerpendicular.
- ZOffset: render layer offset in studs (layer multiple emitters without moving them in 3D).

## Performance & Device Reality (this is what separates good from great effects)

- Fill rate (pixels covered by overlapping transparent layers) and overdraw are the main killers.
- Rate × Size × average opacity × how many overlap on screen = cost.
- Always test at both lowest and highest Studio Editor Quality Level.
- Mobile rate is capped lower.
- Use .Enabled = false to pause (existing particles continue until they die or you call :Clear()).
- Many simultaneous high-rate/large/transparent emitters will cause the engine to throttle or drop effects on low-end clients.
- Measure overdraw in Studio with **View → Stats → GPU → Fill Rate** and **Render → Overdraw**. Reduce total opaque pixel area before lowering Rate.

## Replication & Client-Authoritative Emission

- ParticleEmitter state replicates, but individual particles do not. A server-owned emitter will spawn the same particles on every client automatically.
- For one-shot bursts, prefer **client-authoritative emission**: the server signals an event, each affected client spawns the burst locally. This avoids network replication of per-burst timing and respects each client's quality settings.
- Use `RemoteEvent:FireClient` or a local signal so clients own transient visuals; keep gameplay logic authoritative on the server.

## LOD & Distance Culling

- Stop or reduce expensive emitters when the camera is far away. Common thresholds: disable at 100–300 studs, reduce Rate by half at half-distance.
- Use `workspace.CurrentCamera` distance checks or zone systems. Avoid per-frame `Magnitude` checks for many emitters; instead use a tagged culling heartbeat or spatial partition.
- For ambient weather/large crowds, spawn emitters only in the near-camera region rather than globally.

## Preloading Textures

- Call `ContentProvider:PreloadAsync({texture})` for flipbook atlases and prominent effect textures before they are needed (e.g., during loading screens or before a combat sequence). This prevents mid-burst pop-in on lower-end devices.

## Patterns

- Continuous ambient (fire, smoke, rain): Rate + Lifetime + Size tuned so density looks right at normal camera distances.
- One-shot bursts (explosion, impact, muzzle flash): Set Rate low or 0, then call emitter:Emit(num) from an animation marker or event.
- Attached effects (foot dust, weapon trail, aura): Parent emitter or its attachment to the moving part/bone. Use LockedToPart or VelocityInheritance as appropriate.
- Wind-reactive: Enable global wind in the environment, set Drag > 0 and WindAffectsDrag = true on the emitter.
- Combined with animation: Marker "FootStep" → find foot Attachment → Emit or play a short one-shot emitter.

See the references/ folder (particle-emitter-properties.md, shapes-flipbooks-and-advanced.md) for the exhaustive property reference, visual examples, optimization checklists, and concrete code for common effects (integration covered in SKILL and cross-skill notes).

## Related Effects (often used alongside particles)

- Beam: textured ribbon between two Attachments (lasers, energy, ropes). Key properties: `Texture`, `TextureMode`/`TextureLength`/`TextureSpeed`, `Color`, `Transparency` (NumberSequence along the beam), `Width0`/`Width1`, `CurveSize0`/`CurveSize1`, `FaceCamera`, `LightEmission`, `LightInfluence`, `ZOffset`.
- Trail: ribbon left behind two Attachments as their parent part moves (sword trails, projectile paths, after-images). Key properties: `Color`, `Transparency`, `Texture`, `TextureMode`, `TextureLength`, `MinLength`, `MaxLength`, `WidthScale`, `LightEmission`, `LightInfluence`, `FaceCamera`, `Lifetime`.
- Highlight: cheap, effective outlines (selection, targeting, "powered up"). Has both an outline and a solid interior fill (`FillColor`/`FillTransparency`, `OutlineColor`/`OutlineTransparency`). `DepthMode` controls whether the highlight is visible through walls (`AlwaysOnTop`) or only when not occluded (`Occluded`). There is a client-side cap of 255 simultaneous `Highlight` instances (disabled instances still count toward the cap).
- PointLight / SpotLight / SurfaceLight + Atmosphere + PostProcessing for overall mood that makes particles read correctly.

Use these together with the roblox-animation skill's marker system and the roblox-user-interfaces skill's ViewportFrame embedding to create cohesive, high-production visual language.

## Cleanup for Transient Emitters

- Always destroy cloned one-shot emitters after their maximum lifetime (`Debris:AddItem` or `task.delay`). Do not leave disabled emitter instances accumulating in the workspace.
- For attached continuous emitters, set `Enabled = false` and `:Clear()` before reparenting or destroying to avoid orphaned particles.
- When pooling emitters, reset Rate, Lifetime, Size, and Transparency to known defaults before reuse so stale state does not leak into the next burst.

## Scripts

- `scripts/EffectBurst.lua` — clone-and-destroy helper for one-shot particle bursts. Clones every ParticleEmitter under a template Attachment/BasePart, emits a burst locally, and schedules cleanup after the maximum lifetime. Safe for continuous emitters because the original emitters are never mutated.

<!-- catalog:references:start -->
## Reference index

- [particle-emitter-properties.md](references/particle-emitter-properties.md)
- [shapes-flipbooks-and-advanced.md](references/shapes-flipbooks-and-advanced.md)
<!-- catalog:references:end -->
