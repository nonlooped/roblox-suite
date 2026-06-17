---
last_reviewed: 2026-06-17
---

# Integration, Events, Priorities, and Cross-System Patterns

## Marker-Driven Gameplay (the killer feature)

The single biggest upgrade most developers can make is moving from polling `track.TimePosition` to using `GetMarkerReachedSignal("MarkerName")`. **Do not use the older `KeyframeReached` event for new work; `GetMarkerReachedSignal` is the modern replacement.**

Examples of what you can drive purely from authored markers:
- Footstep sounds + dust ParticleEmitter at the correct foot Attachment.
- Enable/disable hitboxes or damage volumes exactly when the swing "connects".
- Spawn muzzle flash, shell ejection, or impact VFX.
- Trigger camera shake, screen flash, or UI hit markers.
- Start a secondary animation or IKControl (e.g. "grab" a prop at a specific frame).
- Play ability VFX or BillboardGui popups synchronized to the animation.

The parameter string on the marker is free-form text you control in the editor. Many teams use a simple convention like "leftFoot,heavy" or even small JSON strings that the connected function parses.

Inside marker handlers, keep work small and use `task.defer` for gameplay side-effects to avoid stalling the animation evaluator.

Because markers are part of the published animation asset, designers can retime or add new events without a programmer touching code (as long as the string names stay stable or are versioned).

## Priority & Weight Layering

Do not put everything at Action priority.

Typical layering for a character:
- Core (engine defaults, facial, etc.)
- Idle (breathing, subtle shifts)
- Movement (walk, run, strafe — these often blend with each other)
- Action (attacks, emotes, interact, abilities — these usually want to fully or mostly override lower layers)

You can play a low-weight "aim" or "upper body" track at Action priority while a walk/run continues at Movement. Use `track:AdjustWeight(0.6)` and `AdjustSpeed(...)` at runtime for fine control (e.g. variable walk speed affecting animation rate).

When a higher priority track starts with a fade time, the engine cross-fades the weights smoothly.

## Server vs Client Playback Decisions

- **Authority matters:** For a player's own character, animations played on the client replicate to the server through the Animator (the asset must be owned by the player or the experience). For NPCs and other players' characters, the server is usually the authority.
- **Server playback** (recommended for gameplay state): The AnimationTrack runs on the server and state replicates to clients. Good for synchronized attacks, movement abilities, etc. Server can also validate timing via markers or TimePosition if needed.
- **Client playback**: Purely visual or predictive (cosmetic emotes while moving, client-side reload animations, UI-driven preview animations). Cheaper and more responsive for pure eye candy. The server still needs to know the *intent* and results via Remotes.
- **Ownership/permissions:** An animation asset must be owned by the player or the experience/creator for a client-played animation on that player's character to replicate. If ownership is wrong, the server will ignore it.

Many polished games do a hybrid: client plays a predictive animation immediately, server plays the authoritative version and the client corrects/blends if the server disagrees.

**Important:** Markers are timing hints, not authoritative proof. Any gameplay effect (damage, hit registration) must be validated server-side using distance, stance, timing windows, stamina, etc.

## Combining with Other Systems

**Particles / VFX (see roblox-vfx skill):**
- Best pattern: Animation marker → in the connected function, find an Attachment on the rig (or create a temporary one) and either :Emit() on a pre-placed ParticleEmitter or parent a one-shot emitter.
- You can also tween properties on an emitter (Rate, Speed, etc.) from a marker if you want the effect to ramp up or change character during the animation.

**UI (see roblox-user-interfaces skill):**
- Markers or track events can start UI tweens (cooldown rings, ability icons lighting up, hit number popups).
- Conversely, a UI button press can start a 3D animation track (with proper server validation for gameplay actions).
- ViewportFrames inside UI can contain their own rigs playing tracks or being driven by IK — this is how many 3D item previews or emote selectors work.

**Client-server & security:**
- Never trust client animation state for damage, economy, or progression. Use markers or animation completion as a *hint*, then validate on the server (distance, timing windows, stamina, etc.).
- Markers are not authoritative proof of a hit; always validate stance, distance, and timing before applying gameplay effects.
- Replicate only what is necessary. Full pose data for many players can be expensive.
- Ensure animation assets are owned by the player or experience so client-played player-character animations replicate correctly.

**Performance notes:**
- Preload everything.
- Limit the number of simultaneously playing high-fidelity tracks + complex particle systems + transparent UI.
- Use the lowest sufficient priority and weight.
- Stop tracks promptly when they are no longer visible or relevant.

## Practical Checklist for a New Animated Feature

- [ ] Rig has proper Animator.
- [ ] Animation authored or chosen from catalog with correct priority.
- [ ] Markers added for all gameplay/VFX/UI sync points (with stable names).
- [ ] Preload step in loading sequence.
- [ ] Playback location decided (server for authority, client for cosmetics) and validated where necessary.
- [ ] IK or constraints added if procedural posing is required.
- [ ] Connected marker signals do the minimal work (spawn effect, play sound, start a short tween) and clean up after themselves.
- [ ] Tested with multiple characters and on lower-end devices for frame pacing.
- [ ] Track cleanup on death/remove or when the action is cancelled (disconnect marker/Stopped/Ended connections).

Mastering authored animations + precise marker timing + lightweight UI tweens + targeted IK is what makes Roblox experiences feel "next level" instead of "it moves when I press the button."
