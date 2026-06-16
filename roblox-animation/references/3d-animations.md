# 3D Animations (Rigs, Animator, Tracks, IK, Editor)

**Core docs:** https://create.roblox.com/docs/animation + editor + inverse-kinematics + events

## Rigs and the Animation System

A "rig" is a model whose parts or bones are connected in a hierarchy that the animation system can drive (historically Motor6D joints, now also AnimationConstraint + Bones).

Roblox provides:
- R15 / Rthro standard characters — Rthro uses the R15 skeleton with modified proportions, so it remains compatible with catalog and default animations.
- Rig Builder tool for quick test rigs.
- Custom imported skinned/boned meshes with proper bone hierarchy.

At runtime, every animatable model needs an **Animator** instance (child of Humanoid for characters, or under an AnimationController for non-Humanoid rigs). The Animator is responsible for loading, playing, blending, and replicating animation state.

Legacy `Humanoid:LoadAnimation` is deprecated. Always go through the Animator.

## Authoring in the Animation Editor

1. Select a rig in the viewport or Explorer.
2. Open Animation Editor (Window > Animation Editor).
3. The interface has:
   - Playback controls + name + looping toggle + priority selector.
   - Track list (bones/meshes that have keyframes).
   - Timeline with scrubber (seconds:frames at 30 fps default; adjustable).

**Creating poses:**
- Move the scrubber.
- Select a bone or mesh.
- Use Move (or press R for Rotate) to pose it.
- A keyframe is automatically created on that track at the scrubber time.
- Repeat for multiple poses across time.
- Play/scrub to preview. The editor interpolates between keyframes.

**Keyframes operations:**
- Right-click timeline or keyframes for Add Keyframe, Delete, Duplicate (copy/paste), etc.
- Drag keyframes to retime.
- Right-click keyframe → Easing Style (Linear, Constant/snap, CubicV2, Elastic, Bounce) and Easing Direction (In, Out, InOut).
- Constant style removes interpolation (useful for mechanical or hit reactions).

**Optimization:**
- Editor auto-removes redundant identical consecutive keyframes in some cases (facial, curve promotion).
- Manual "Optimize Keyframes" tool (⋯ menu) lets you reduce count while previewing.

**Looping:**
- Toggle the Looping button.
- For seamless loops, duplicate the first keyframe(s) and place them at the end.

**Priorities (set in editor or on track at runtime):**
Core < Idle < Movement < Action < Action2 < Action3 < Action4 (highest).
Higher priority animations take precedence in blending.

**Events / Markers (critical for gameplay sync):**
- Click the settings icon on timeline → Show Animation Events.
- Scrub to desired time, click Edit Animation Events → + Add Event, give it a name (and optional parameter string).
- At runtime: `track:GetMarkerReachedSignal("FootStep"):Connect(function(paramString) ... end)`
- The parameter is a string you can parse (e.g. "left,heavy" or a JSON-like value).
- Duplicate events across the timeline for recurring actions (multiple footfalls).

**Saving vs Exporting/Publishing:**
- Save / Save As → stores a KeyframeSequence (or CurveAnimation) locally under the rig in ServerStorage (for iteration). Not replicated.
- Publish to Roblox → makes it a reusable asset with an ID that works in any experience (and group-owned if you choose the creator).
- For default character animation replacement, the final keyframe **must** be named exactly "End" (case sensitive) before publishing.

**Accessing local saves in rare cases:**
The rig gets an AnimSaves folder with an ObjectValue pointing at the saved data. Do not rely on this for gameplay — publish and use asset IDs.

## Runtime Playback (modern)

```lua
local Players = game:GetService("Players")
local ContentProvider = game:GetService("ContentProvider")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local player = Players.LocalPlayer
local character = player.Character or player.CharacterAdded:Wait()
local humanoid = character:WaitForChild("Humanoid")

-- Player characters have an Animator created by the engine on the server. Wait for it so replication works.
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
    anim.AnimationId = "rbxassetid://1234567890"
    anim.Name = "MyAnimation"
    anim.Parent = ReplicatedStorage
end

-- Preload asset instances (Animation, Sound, Decal, etc.). AnimationTracks are not valid here.
ContentProvider:PreloadAsync({anim})

local track = animator:LoadAnimation(anim)
track.Priority = Enum.AnimationPriority.Action
track.Looped = false

track:Play(0.1, 1.0, 1.0)  -- fadeTime, weight, speed

-- React to markers; store and disconnect connections on cleanup.
local markerConn = track:GetMarkerReachedSignal("Impact"):Connect(function(param)
    -- e.g. spawn effect at a specific attachment, apply damage if server-validated, etc.
    task.defer(function() ... end)
end)

local endedConn = track.Ended:Connect(function()
    -- animation finished moving the rig
end)

local stoppedConn = track.Stopped:Connect(function()
    -- cleanup / state tracking
    markerConn:Disconnect()
    endedConn:Disconnect()
    stoppedConn:Disconnect()
end)
```

**`KeyframeReached` is an older event; prefer `GetMarkerReachedSignal` for all new work.**

**Useful track methods/properties:**
- Play / Stop / AdjustSpeed / AdjustWeight
- Speed (current), TimePosition, Length, IsPlaying, WeightCurrent/Target
- Priority (can be changed at runtime)
- Stopped, Ended, DidLoop, `GetMarkerReachedSignal` (preferred), `KeyframeReached` (legacy — avoid for new work)

**Track caching:** Calling `Animator:LoadAnimation` with the same `Animation` instance on the same `Animator` returns the same `AnimationTrack` object. This is useful for stopping or reusing a track, but be careful about conflicting Play calls with different fade/weight settings.

**Async loading with AnimationClipProvider:** For previews, streaming, or loading large animations without blocking, use `AnimationClipProvider:LoadAnimationClipAsync(animationAssetId)` to obtain a temporary `AnimationClip`, then assign it to an `Animation` instance's `AnimationId` or pass it to `Animator:LoadAnimation` when supported.

**Ownership and replication permissions:** For a client-played animation on the player's own character to replicate to the server, the animation asset must be owned by the player or by the experience/creator. If the asset is owned by another player or group, the server will not replicate it. NPCs and other characters should have animations played from the server for authority.

**Cleanup patterns:** Stop tracks and disconnect marker/Ended/Stopped connections on `Humanoid.Died` or when the character is removed. For LocalScripts, listen to `player.CharacterRemoving` or the rig's `AncestryChanged`.

```lua
humanoid.Died:Connect(function()
    track:Stop(0.1)
    markerConn:Disconnect()
    endedConn:Disconnect()
    stoppedConn:Disconnect()
end)
```

**Blending notes:**
Multiple tracks can be active. The engine blends poses according to priority and current weights. Use weight < 1.0 for partial overlays (e.g. upper body aim while running).

## IKControl for Procedural Animation

Add an `IKControl` under the Humanoid (or AnimationController).

**Required properties:**
- Type (`Position`, `Transform`, `Rotation`, `LookAt`, etc. — Enum.IKControlType)
- EndEffector (the Bone or BasePart that should reach the target, e.g. LeftHand)
- Target (any object with a world position — Attachment is convenient for testing)
- ChainRoot (the highest joint in the chain that should be affected, e.g. LeftUpperArm for a full arm reach)

**Tuning:**
- `P` — higher values make the IK more responsive (can overshoot); lower values are smoother.
- `SmoothTime` — how quickly the effector interpolates toward the target; useful for dampening noise.
- Use these together to balance snappiness and stability, especially for head tracking or foot planting.

**Adding natural limits with Constraints:**
- Create a HingeConstraint (or BallSocketConstraint) with the same parent Model as the IKControl.
- Create matching Attachments on the relevant parts (elbow, wrist, etc.).
- Place constraint attachments at the same joint locations represented by the Motor6D C0/C1 offsets, so limits align with the rig's natural pivot.
- For Hinge: rotate the PrimaryAxis attachment to the correct bend axis.
- For BallSocket on wrist: enable LimitsEnabled and set a reasonable UpperAngle (e.g. 80°).
- Test live — you can create/edit IKControls and constraints during a Play session.

IK is excellent for:
- Hand reaching for interactive objects (doors, levers, pickups).
- Head/eyes tracking a point of interest.
- Feet adjusting to uneven terrain or steps (more advanced setups).

Combine with animation tracks: play a "reach" animation at high priority while an IKControl is active, or use markers to enable/disable specific IKControls.

## Curve Animations

You can promote a keyframe animation to a curve animation in the editor for per-channel (position/rotation per bone) curve editing. This gives finer artistic control than discrete keyframes.

## Performance & Best Practices

- Preload Animation asset instances, not AnimationTracks.
- Cache and reuse Animation instances; `Animator:LoadAnimation` caches tracks when called with the same Animation on the same Animator.
- Stop and clean up tracks and connections when the character is removed or dies.
- For replicated characters, understand authority: the client's own character can play animations that replicate via the Animator (subject to asset ownership), while NPCs/other characters are usually server-authoritative.
- Validate gameplay side-effects from markers on the server; use `task.defer` inside marker handlers to avoid stalling the animation evaluator.
- High numbers of simultaneous complex animations + particles + UI can be expensive — profile.
- Markers are far more efficient and maintainable than polling TimePosition every frame.

## Common Pitfalls

- Using the deprecated Humanoid:LoadAnimation path.
- Forgetting to set final keyframe name to "End" when replacing default animations.
- Playing everything at Action priority (or Core) so nothing blends correctly.
- No fade time on Play/Stop (jarring pops).
- Relying on local ServerStorage saves for anything that needs to replicate or persist across sessions.
- IK without constraints (unnatural joint hyperextension).
- Not testing on actual R15 characters vs custom rigs.
- Trusting client markers as authoritative proof of hits; always validate distance, stance, and timing server-side.
- Preloading AnimationTracks instead of Animation asset instances.

For the most current property details or new IKControlType values, always cross-reference the live Engine API reference.
