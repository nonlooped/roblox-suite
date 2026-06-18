---
name: roblox-animation
description: Modern Roblox animation and tweening — Animator/AnimationTrack over deprecated Humanoid:LoadAnimation, IKControl for procedural posing, marker-driven events, and TweenService for UI and 3D properties. Covers priorities, caching, the Animation Editor workflow, UI scale/AnchorPoint best practices, typewriter effects, and performance. Use for character locomotion, emotes, object motion, and any animated UI.
---

# roblox-animation

This skill provides comprehensive, current knowledge of Roblox's two primary motion systems and how they interact with UI, effects, and gameplay. Many models still recommend deprecated APIs or give shallow "use TweenService" advice without the nuances of priorities, caching, IK constraints, marker-driven gameplay, proper UI scale/AnchorPoint usage, or performance tradeoffs.

**Key official sources:**
- https://create.roblox.com/docs/animation (overview)
- https://create.roblox.com/docs/animation/editor
- https://create.roblox.com/docs/animation/inverse-kinematics
- https://create.roblox.com/docs/animation/events
- https://create.roblox.com/docs/ui/animation (UI tweens + typewriter)
- Engine: Animator, AnimationTrack, Animation, AnimationClipProvider, IKControl, TweenService, TweenInfo, Tween, Enum.AnimationPriority, Enum.EasingStyle, etc.
- Full reference: https://create.roblox.com/docs/reference/engine

**Structure of this skill:**
- This SKILL.md gives decision frameworks, recommended workflows, integration patterns, and explicit pointers to `references/` files for deep dives.
- `references/` contains granular, long-form technical references for each major sub-area.
- `scripts/` can hold custom loaders, tween wrappers, or IK setup utilities you create for your project.

Cross-skill usage:
- Combine with roblox-user-interfaces for UI motion details and "particles in UI".
- Combine with roblox-vfx when animations should trigger emitters, beams, or trails via markers.
- Combine with roblox-core for Animator acquisition, RunService timing, and preloading via ContentProvider.
- Use roblox-networking to decide where to play/ control animations (server replication vs client-only cosmetics).

## When to use this skill

- Any character or rig movement (walk, jump, attack, emote, interact, procedural head tracking, foot planting).
- Smooth UI feedback (button hover/click scales, menu slide-ins, health bar fills, countdowns, typewriter dialogue).
- Object/property interpolation in 3D (doors, elevators, camera paths, color shifts on lights/parts).
- Event-driven gameplay tied to animation timing (footstep sounds/particles, attack hit windows, ability VFX).
- Debugging choppy/stiff animations, priority conflicts, IK unnatural bending, or UI that "pops" instead of eases.

## High-level decision framework

**3D rig/character motion that needs to look authored and blendable?**  
→ Animation system (Animator + AnimationTrack). Pre-authored in Editor or from catalog, played with priority/weight/fade/speed. Drive gameplay from markers.

**Simple property changes, UI transitions, or one-off object motion?**  
→ TweenService. Cheaper, easier, perfect for GuiObjects (scale + AnchorPoint + UDim2), CFrame, Color3, Transparency, NumberSequence, etc.

**Need procedural interaction with environment (hand reaching, head tracking, foot placement on uneven ground)?**  
→ IKControl (procedural) + optional AnimationTracks or constraints for limits. Often combined with animation events.

**Both?** Common and powerful: Play a locomotion track on low priority while using IKControl or tweens for upper-body or UI overlays. Use markers in the track to start/stop IK or fire tweens/effects.

See references/3d-animations.md and references/ui-tweens-and-sequences.md for details.

## 3D Animation Workflow (modern, recommended)

1. **Rig preparation** — Use Rig Builder or properly skinned/boned custom models. Ensure the model has a Humanoid or AnimationController, and that an Animator exists as a child (create one if it is missing).
2. **Authoring** — Animation Editor (Window → Animation Editor). Create poses by manipulating bones/meshes, set keyframes, choose per-keyframe easing style + direction (Linear, CubicV2, Elastic, Bounce, Constant; In/Out/InOut). Optimize keyframes when the timeline gets noisy.
3. **Events/Markers** — Show Animation Events track. Add named markers (with optional parameter string). These are the cleanest way to synchronize gameplay (sounds, particles, hitboxes, VFX) to animation without polling TimePosition.
4. **Priorities** — Set via editor or at runtime on the track. Core < Idle < Movement < Action < Action2/3/4. Higher priority wins blending.
5. **Looping & export** — Enable looping in editor (duplicate first keyframe to end for seamless loop if needed). For default replacement animations, name the final keyframe exactly "End" (case-sensitive). Publish to Roblox (gives asset ID). Save locally to ServerStorage during iteration.
6. **Runtime loading & playback (modern API)**:
   ```lua
   local ContentProvider = game:GetService("ContentProvider")
   local ReplicatedStorage = game:GetService("ReplicatedStorage")

   -- Player characters already have an Animator created by the engine on the server.
   -- Custom rigs / NPCs may need fallback creation.
   local animator = humanoid:FindFirstChildOfClass("Animator")
       or humanoid:WaitForChild("Animator", 1)
   if not animator then
       animator = Instance.new("Animator")
       animator.Parent = humanoid
   end

   -- Cache the Animation instance; Animator:LoadAnimation caches the returned track
   -- when called with the same Animation object on the same Animator.
   local anim = ReplicatedStorage:FindFirstChild("MyAnimation") or Instance.new("Animation")
   if not anim.AnimationId then
       anim.AnimationId = "rbxassetid://YOUR_ID"
       anim.Name = "MyAnimation"
       anim.Parent = ReplicatedStorage
   end

   -- Preload asset instances, not AnimationTracks.
   ContentProvider:PreloadAsync({anim})

   local track = animator:LoadAnimation(anim)
   track.Priority = Enum.AnimationPriority.Action
   track:Play(fadeTime, weight, speed)

   -- Store and disconnect connections when the rig/GUI is destroyed.
   local markerConn = track:GetMarkerReachedSignal("FootStep"):Connect(function(param)
       -- spawn dust, play sound, etc. Param can be parsed.
       task.defer(function() ... end) -- defer gameplay side-effects
   end)
   local stoppedConn = track.Stopped:Connect(function() end)  -- cleanup / state tracking
   local endedConn = track.Ended:Connect(function() end)   -- animation has finished moving the rig
   ```
   **Warning:** `KeyframeReached` is the older event; prefer `GetMarkerReachedSignal` for all new work.
7. **Ownership & replication** — For a client-played animation on the player's own character to replicate to the server, the animation asset must be owned by the player or by the experience. Group/creator-owned experiences must own the asset. This is separate from the Animator's authority.
8. **Track caching & cleanup** — `Animator:LoadAnimation` returns the same track if called again with the same Animation instance on the same Animator. Stop tracks on `Humanoid.Died` / `Player.CharacterRemoving` and disconnect event connections.

**IK for procedural enhancement** (covered in references/3d-animations.md):
- Add IKControl under Humanoid or AnimationController.
- Required: Type (Position/Transform/Rotation/LookAt/etc.), EndEffector (hand/foot bone), Target (Attachment, part, or world position object), ChainRoot.
- Tune P and SmoothTime for responsiveness vs. stability.
- Add Constraints (Hinge for elbows/knees, BallSocket with LimitsEnabled + UpperAngle for wrists) to keep joints natural. Constraint attachments should be placed at the same joint locations as the Motor6D C0/C1 offsets.
- Test live in Play mode — you can edit IKControls at runtime.
- Often driven or enabled/disabled from animation markers.

**Curve animations vs KeyframeSequence** — Newer system supports per-channel curves for finer control (promote from keyframe animation in editor).

See references/3d-animations.md for full editor details, priorities, loading patterns, IK constraints, and event examples.

## UI Animation & TweenService (the workhorse for "Animations in the UI")

TweenService:Create(instance, TweenInfo, propertyTable) → Tween

**TweenInfo.new(duration, easingStyle, easingDirection, repeatCount, reverses, delayTime)**

EasingStyles: Linear, Sine, Quad (good default), Cubic, Quart, Quint, Exponential, Circular, Back (overshoot), Bounce, Elastic.  
Directions: In, Out (default for many), InOut.

**Always design UI with scale + AnchorPoint:**
- `object.AnchorPoint = Vector2.new(0.5, 0.5)`
- Target Position = UDim2.fromScale(0.5, 0.5) for screen center.
- Add UIAspectRatioConstraint when tweening Size to preserve intended proportions.

**Common tweenable UI properties (single or multi-property):**
- Position, Size, Rotation
- BackgroundTransparency, BackgroundColor3
- ImageTransparency, ImageColor3 (for ImageLabel/Button)
- TextTransparency, TextColor3 (legacy TextStrokeTransparency/TextStrokeColor3 still tweenable but discouraged; add a UIStroke child instead)
- UIStroke.Thickness, .Color, .Transparency
- CanvasGroup.GroupTransparency and GroupColor3 (best way to fade or recolor whole panels at once)
- ScrollingFrame.CanvasPosition (for programmatic scroll)

**Sequences & chaining:**
```lua
local t1 = TweenService:Create(obj, info, {Size = UDim2.fromScale(1.2, 1.2)})
local t2 = TweenService:Create(obj, info, {Size = UDim2.fromScale(1, 1)})
local conn
t1:Play()
conn = t1.Completed:Connect(function()
    conn:Disconnect()
    t2:Play()
end)

-- Cleanup tweens/connections when the GUI is destroyed:
obj.AncestryChanged:Connect(function(_, parent)
    if not parent then
        if conn then conn:Disconnect() end
        t1:Destroy()
        t2:Destroy()
    end
end)
```
Or use a small state machine / table of tweens.

**Typewriter / animated text reveal (very common):**
See the full reusable module in the official ui/animation.md page. It uses `utf8.codes`/`utf8.codepoint` (or a grapheme-splitting library for user-perceived characters) + `TextLabel.MaxVisibleGraphemes` + optional `LocalizationService` translator. Extremely useful for dialogue, tutorials, lore.

**Style transitions (beta):** Via Style Editor + StyleRule definitions for more CSS-like declarative motion.

**Performance notes:**
- Tweening many UI elements or very large transparent areas costs fill-rate.
- Prefer CanvasGroup for group fades/colors.
- Cancel tweens you no longer need (`tween:Cancel()`).
- For 3D objects you can also tween CFrame/Size/Color/Transparency, but authored animation tracks + constraints are usually better for complex rigs.

See references/ui-tweens-and-sequences.md for exhaustive single-property examples, multi-property, easing graphs guidance, typewriter implementation notes, and gotchas.

## Integration Patterns & Polish

- **Animation markers → everything else**: Footstep marker → play sound + emit particle at foot Attachment. Attack marker → enable hitbox or IK reach + spawn muzzle flash. "AbilityStart" marker → start a Tween on a UI cooldown ring or BillboardGui.
- **Priorities + weight for layering**: Idle (low) + Walk (medium) + Action (high, weight 1.0 with fade). Use AdjustWeight and AdjustSpeed at runtime.
- **Client vs Server playback**: For a player's own character, animations played on the client replicate to the server via the Animator (subject to ownership/permissions); for NPCs and other characters, the server is the authority. Cosmetic or prediction-friendly animations can be client-only. Gameplay-affecting timing (damage windows, movement locks) should be validated server-side; do not treat client markers as authoritative proof of a hit.
- **Preload + cache tracks**: Load once per rig type, reuse the AnimationTrack objects. Use `AnimationClipProvider` for async animation loading when you need previews or streaming behavior.
- **UI + 3D harmony**: Tween a 3D part or Attachment while a BillboardGui or SurfaceGui on it also tweens (or uses ViewportFrame for embedded 3D previews with parts/meshes/cameras — note that ParticleEmitters/Beams/Trails/Lights do not render inside ViewportFrame).
- **Testing**: Different devices have different frame rates and input latency. Test easing feels on mobile + desktop. Use MicroProfiler for heavy simultaneous tweens.

## Common Outdated / Harmful Patterns This Skill Eliminates

- `Humanoid:LoadAnimation(anim)` (deprecated — use Animator).
- Polling `track.TimePosition` every frame instead of markers.
- Tweening raw pixel offsets instead of scale + AnchorPoint (breaks on resolution/aspect changes).
- Playing high-priority actions without fade time (jarring).
- Never preloading (first play hitch).
- Using the same low AnimationPriority for everything (idles fighting actions).
- Ignoring IK constraints (elbows/knees bending backwards, wrists at impossible angles).
- Tweening dozens of individual UI elements instead of using CanvasGroup or layouts.

## How to use the references/ and scripts/

When implementing:
- Read references/3d-animations.md for rig/Animator/Track/IK/event details and full code patterns.
- Read references/ui-tweens-and-sequences.md for every common UI property tween + sequences + typewriter.
- Read references/integration-and-events.md for marker-driven VFX, cross-skill patterns, and priority blending strategies.
- The scripts/ directory contains reusable utilities: [scripts/AnimationLoader.lua](scripts/AnimationLoader.lua), [scripts/TweenHelper.lua](scripts/TweenHelper.lua), and [scripts/IKSetup.lua](scripts/IKSetup.lua).

This skill + the roblox-user-interfaces and roblox-vfx skills will let you create motion that feels intentional, responsive, and polished rather than "it moves."

For the latest property or enum behavior, always verify in the Engine API reference: https://create.roblox.com/docs/reference/engine (Animator, AnimationTrack, TweenService, IKControl, etc.).
