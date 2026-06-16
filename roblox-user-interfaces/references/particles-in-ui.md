# Particles and Effects Inside UI ("Particles in the UI")

Direct `ParticleEmitter` instances live in the 3D world (parented to BasePart or Attachment) and do not render inside ScreenGui hierarchies. This file covers the practical techniques used in real high-quality Roblox experiences to achieve particle-like, VFX, or animated visual effects *within* 2D UI.

## Technique 1: Scripted 2D Particle Pools (most common for HUD/rewards)

Create a small pool of ImageLabel (or Frame with UIGradient/UIStroke) instances, usually inside a CanvasGroup or dedicated "Effects" Frame.

On demand (button click, reward, hit marker, level up, etc.):
- Take a pooled instance.
- Set its Image, initial Position (scale), Size, Transparency, Rotation, Color.
- Tween several properties over a short lifetime (Position in a direction or with gravity simulation, Size, Transparency to 1, Rotation).
- On tween Completed or after a lifetime, reset and return to pool.

**Advantages:** Full control, cheap, easy to integrate with UI layouts and tweens from the animation skill.
**Performance notes:** 
- Cap the maximum concurrent particles (e.g. 30-80 depending on device).
- Recycle instead of Destroy/Instance.new every time.
- Use small, low-resolution textures with alpha.
- Test at lowest graphics quality — transparent overdraw adds up fast.

Many community assets exist (Emitter2D style), but a simple hand-rolled pool inside a ModuleScript is more maintainable and customizable.

## Technique 2: ViewportFrame + 3D Content (best for "3D in UI")

1. Place a ViewportFrame inside your ScreenGui (or a panel).
2. Give it a CurrentCamera.
3. Parent a small "effect world" model directly to the ViewportFrame (there is no separate `.World` property) containing parts, meshes, and optionally a small rigged model playing an AnimationTrack or driven by IKControl.
4. Tween the ViewportFrame's own Size/Position/GroupTransparency (via a parent CanvasGroup) for entrance/exit.
5. Or tween things *inside* the viewport (camera CFrame for a sweeping reveal, part positions, rig poses).

**Important:** Real `ParticleEmitter`, `Beam`, `Trail`, and `Light` objects do **not** render inside `ViewportFrame`. Use the viewport's built-in `Ambient`, `LightColor`, and `LightDirection` properties for lighting, or fake particle effects with scripted ImageLabels/CanvasGroup techniques from this reference.

This is the technique behind many polished item inspection screens and ability previews.

**Gotchas:**
- ViewportFrames have a non-trivial cost. Don't have 5 of them active and visible at once on mobile.
- Lighting inside the viewport is independent — match or deliberately contrast with the main scene.
- Size the internal content appropriately so it doesn't require extreme camera distances.

## Technique 3: CanvasGroup + Group Effects + UIStroke / Gradient Animation

- Wrap a panel or icon in a CanvasGroup.
- Rapidly tween GroupTransparency + GroupColor3 for "flash", "dissolve", or "pop" group effects.
- Animate a UIStroke's Thickness/Color/Transparency in a loop (or via a short tween sequence) for energy/shimmer borders.
- Combine with a UIGradient whose offset or color keys are tweened for moving highlight or charging effects.

These are generally cheaper than dozens of individual ImageLabel particles and look very polished for UI chrome, but CanvasGroup allocates a render target proportional to its on-screen size, so large or stacked CanvasGroups are not free.

## Technique 4: Text + MaxVisibleGraphemes + Supporting Particles

The typewriter effect (detailed in the animation skill's ui-tweens reference) can be augmented with tiny per-character "dust" or "spark" ImageLabels that are created, tweened outward/upward with slight random variation, and then cleaned up.

This gives a very high-production "magical text" or "holographic" feel without heavy cost.

## Integration with the Rest of the Toolset

- Drive UI particle bursts from AnimationTrack markers (see roblox-animation skill). A "FootStep" or "AbilityCast" marker can call a function that spawns the appropriate 2D reward burst or ViewportFrame effect.
- Combine with roblox-vfx best practices (flipbooks, proper transparency sequences, low rate + clever size, WindAffectsDrag where relevant) when driving effects from animation markers. Remember that real ParticleEmitters/Beams/Trails do not render inside ViewportFrame.
- Respect the performance guidance in the fundamentals skill (fill rate, overdraw, mobile caps).

## Concrete Starter Pattern (2D pool)

See `scripts/UIParticlePool.lua` for a basic example module. Typical API:
- `pool:emit(config)` where config contains texture, count, lifetime, velocity range, size range, color, etc.
- Internally grabs from pool, tweens, schedules return.

Always profile. The difference between "a few tasteful particles" and "it looks like a particle bomb went off" is the difference between smooth 60 fps on phone and a slideshow.

These techniques, used judiciously and synchronized via the animation and UI systems, are what make interfaces feel like a living part of the experience rather than static menus.
