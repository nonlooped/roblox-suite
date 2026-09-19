---
name: roblox-animation
description: "Build or debug Roblox character animations, IK poses, animation-marker events, and UI or object tweens. Use for locomotion, emotes, motion blending, and timed effects."
last_reviewed: 2026-06-17
---

# roblox-animation

Choose animation tracks for authored rig motion, TweenService for property changes, and IKControl for procedural poses. Validate gameplay outcomes on the server even when a client animation triggers the visual effect.

**Key official sources:**
- https://create.roblox.com/docs/animation (overview)
- https://create.roblox.com/docs/animation/editor
- https://create.roblox.com/docs/animation/inverse-kinematics
- https://create.roblox.com/docs/animation/events
- https://create.roblox.com/docs/ui/animation (UI tweens + typewriter)
- Engine: Animator, AnimationTrack, Animation, AnimationClipProvider, IKControl, TweenService, TweenInfo, Tween, Enum.AnimationPriority, Enum.EasingStyle, etc.
- Full reference: https://create.roblox.com/docs/reference/engine

Cross-skill usage:
- Combine with roblox-user-interfaces for UI motion details and "particles in UI".
- Combine with roblox-vfx when animations should trigger emitters, beams, or trails via markers.
- Combine with roblox-core for Animator acquisition, RunService timing, and preloading via ContentProvider.
- Use roblox-networking to decide where to play/ control animations (server replication vs client-only cosmetics).

## Choose a motion system

**3D rig/character motion that needs to look authored and blendable?**  
→ Animation system (Animator + AnimationTrack). Pre-authored in Editor or from catalog, played with priority/weight/fade/speed. Drive gameplay from markers.

**Simple property changes, UI transitions, or one-off object motion?**  
→ TweenService. Use for GuiObjects (scale + AnchorPoint + UDim2), CFrame, Color3, Transparency, NumberSequence, etc.

**Need procedural interaction with environment (hand reaching, head tracking, foot placement on uneven ground)?**  
→ IKControl (procedural) + optional AnimationTracks or constraints for limits. Often combined with animation events.

**Combining systems:** Play a locomotion track on low priority while using IKControl or tweens for upper-body or UI overlays. Use markers in the track to start/stop IK or fire tweens/effects.

See references/3d-animations.md and references/ui-tweens-and-sequences.md for details.

## Rig animations and IK

Read [3d-animations.md](references/3d-animations.md) when authoring, loading, or blending rig animations, or configuring IK.

- Load tracks through `Animator`. Choose priority, weight, fade time, and speed for the action.
- Use named markers for footsteps, effects, and other timed events. Keep names stable when republishing assets.
- Decide where playback runs and check asset ownership. Validate gameplay effects on the server.
- Preload Animation assets and reuse loaded tracks. Stop tracks and disconnect their signals when the rig is removed.
- For IK, define the chain root, end effector, and target. Tune responsiveness and joint limits in Play mode.

## UI animation with TweenService

Read [ui-tweens-and-sequences.md](references/ui-tweens-and-sequences.md) for property examples, easing, chained transitions, and typewriter text.

Use scale and AnchorPoint for responsive motion, and add an aspect-ratio constraint when the design requires fixed proportions. Use CanvasGroup for whole-panel fades. Cancel conflicting tweens and disconnect completion handlers when a sequence ends or its GUI is destroyed.

For text reveal, use `TextLabel.MaxVisibleGraphemes` and account for localization and Unicode character boundaries.

## Combine motion with other systems

- **Animation markers → everything else**: Footstep marker → play sound + emit particle at foot Attachment. Attack marker → enable hitbox or IK reach + spawn muzzle flash. "AbilityStart" marker → start a Tween on a UI cooldown ring or BillboardGui.
- **Priorities + weight for layering**: Idle (low) + Walk (medium) + Action (high, weight 1.0 with fade). Use AdjustWeight and AdjustSpeed at runtime.
- **Client vs Server playback**: For a player's own character, animations played on the client replicate to the server via the Animator (subject to ownership/permissions); for NPCs and other characters, the server is the authority. Cosmetic or prediction-friendly animations can be client-only. Gameplay-affecting timing (damage windows, movement locks) should be validated server-side; do not treat client markers as authoritative proof of a hit.
- **Preload + cache tracks**: Load once per rig type, reuse the AnimationTrack objects. Use `AnimationClipProvider` for async animation loading when you need previews or streaming behavior.
- **UI + 3D harmony**: Tween a 3D part or Attachment while a BillboardGui or SurfaceGui on it also tweens (or uses ViewportFrame for embedded 3D previews with parts/meshes/cameras; note that ParticleEmitters/Beams/Trails/Lights do not render inside ViewportFrame).
- **Testing**: Different devices have different frame rates and input latency. Test easing feels on mobile + desktop. Use MicroProfiler for heavy simultaneous tweens.

## Common mistakes

- `Humanoid:LoadAnimation(anim)` (deprecated; use Animator).
- Polling `track.TimePosition` every frame instead of markers.
- Tweening raw pixel offsets instead of scale + AnchorPoint (breaks on resolution/aspect changes).
- Playing high-priority actions without fade time (jarring).
- Never preloading (first play hitch).
- Using the same low AnimationPriority for everything (idles fighting actions).
- Ignoring IK constraints (elbows/knees bending backwards, wrists at impossible angles).
- Tweening dozens of individual UI elements instead of using CanvasGroup or layouts.

## Examples and verification

Adapt [AnimationLoader.lua](scripts/AnimationLoader.lua), [TweenHelper.lua](scripts/TweenHelper.lua), or [IKSetup.lua](scripts/IKSetup.lua) when the helper fits the task.

For a changed animation, verify that it plays at the intended priority, fires its markers, and cleans up when the rig is removed. For UI motion, check the target screen sizes and cancellation path. Use [integration-and-events.md](references/integration-and-events.md) when motion drives another system.

<!-- catalog:references:start -->
## Reference index

- [3d-animations.md](references/3d-animations.md): Author or load rig animations, blend tracks, or configure IK.
- [integration-and-events.md](references/integration-and-events.md): Synchronize animation markers with gameplay, effects, audio, or UI.
- [ui-tweens-and-sequences.md](references/ui-tweens-and-sequences.md): Tween UI properties, chain transitions, or reveal text.
<!-- catalog:references:end -->
