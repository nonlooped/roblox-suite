---
read_when: "Combine purchases with persistence, or animation with effects and UI"
last_reviewed: 2026-06-17
---

# Cross-skill integration patterns

## Data + client-server + monetization

- Client prompts purchase (roblox-gamepasses skill).
- Server receives `PromptGamePassPurchaseFinished`, validates, grants perks, and immediately saves ownership + perks via your data manager (roblox-datastores skill).
- On every PlayerAdded, re-verify with `UserOwnsGamePassAsync` (monetization) and load profile (data), then apply benefits.
- All sensitive Remotes that touch money or perks go through validation + rate limiting (roblox-networking skill).

## Animation + particles + UI

- Animation marker "AbilityCast" fires (animation skill).
- Handler spawns a 3D particle burst at a rig Attachment (roblox-vfx skill).
- Same handler or a follow-up tween starts a UI cooldown ring or floating text using CanvasGroup + tweens (roblox-user-interfaces + roblox-animation skills).
- For 3D previews in a shop UI, use a ViewportFrame containing a rig model (note that ViewportFrame does not render ParticleEmitter, Beam, Trail, or most 3D effects; use 2D UI particles for overlay effects instead) (user-interfaces particles-in-ui reference).

## roblox-core + everything

`roblox-core` is the base layer. Every other skill assumes you:
- Acquire services correctly with `GetService`.
- Know which code runs on client vs server.
- Understand what data can actually be stored in DataStores.
- Use proper module loading and initialization patterns.

Load `roblox-core` first when the task is broad.

## Performance across skills

- Profile animation, particles, and transparent UI together on mobile; their combined cost can exceed the frame budget.
- Use the performance notes in each skill (especially particles and UI).
- Profile with Developer Console + MicroProfiler.
- Reduce simultaneous effects when their combined cost exceeds the frame budget.
