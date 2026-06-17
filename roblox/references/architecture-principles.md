---
last_reviewed: 2026-06-17
---

# Overarching Roblox Architecture & Development Principles

This reference collects the cross-cutting principles that apply no matter which specialized skill (data, UI, animation, etc.) you are using.

## Server Authority as Default Posture

- The server decides outcomes for anything that affects shared state, economy, progression, or competitive fairness.
- Client sends intent ("I want to buy this", "I attacked with this swing").
- Server validates (range, timing, cost, line of sight, cooldowns, etc.) then either applies the change (and lets replication or a targeted Remote carry the result) or rejects it.
- Replicated display values such as leaderstats are visible to clients, but they remain authoritative on the server and are commonly used to drive server logic. Update them from the server result and never trust the client version for logic.

## Progressive Data Loading & Saving

- On join: load from DataStore (with pcall + fresh read option after previous errors), merge defaults, re-verify ownership on PlayerAdded (gamepasses, etc.), sync safe derived state to client.
- During play: mutate in-memory profile, periodic auto-saves + immediate saves on important events using UpdateAsync for contended values.
- On leave / BindToClose: final save.
- Always have a plan for "the write appeared to fail but might have succeeded on the backend" — verify with UseCache=false Get.

## Asset & Code Loading Discipline

- Preload animations, sounds, images, important models via ContentProvider:PreloadAsync early in the loading sequence.
- Use WaitForChild when requiring modules or waiting for services/children whose load order is not guaranteed.
- Structure: ReplicatedStorage for shared pure modules + asset containers, ServerScriptService for server authority, StarterGui for client UI roots (with LocalScripts or required client modules).

## Performance Mindset

- Transparent overdraw and fill-rate (lots of overlapping particles + UI) is the #1 mobile/GPU killer.
- Instance count, part count, and streaming matter for world performance.
- Tween many things or play many complex animations at once? Profile.
- Use the lowest sufficient animation priority, particle rate, and UI transparency layers.
- Test at both lowest and highest graphics quality in Studio.

## Organization That Scales

- One data store (or small number) per major domain with key prefixes for organization, rather than hundreds of tiny stores.
- Consistent key naming (e.g. "PlayerData_" .. userId or "Profiles/" .. userId).
- Module boundaries that mirror the skills (DataManager, UIManager, AnimationManager, Economy, etc.).
- Tags (CollectionService) and Attributes for lightweight dynamic grouping instead of deep fragile hierarchies.

## Security Basics (applies everywhere)

- No client datastore writes or economy logic.
- All Marketplace prompts on client; all granting on server with re-verification.
- Rate limit sensitive Remotes with per-player buckets; track timestamps/counters per `Player.UserId`, not shared globals.
- Sanitize and validate all input: type checks, range checks, whitelist allowed values, reject malformed payloads before processing.
- Filter user-generated text with `TextService:FilterStringAsync` / `TextFilterResult` before displaying it anywhere.
- Keep `HttpService` secrets and API keys server-side; use `SecretsService` to store and retrieve them instead of embedding in scripts.
- Keep confidential data and anti-cheat parameters server-side; minimize client anti-cheat and assume the client is compromised.
- Audit third-party assets.
- Use capabilities where available.

## Testing & Deployment Hygiene

- Studio "Enable Studio Access to API Services" only on dedicated test experiences, never production.
- Use multiple places or a staging universe for testing data changes.
- Take snapshots before risky publishes that touch data logic.
- Monitor Data Stores Dashboard + Manager + general performance stats after every meaningful update.

## When to Reach for Each Specialized Skill

- Anything that reads or writes persistent state across sessions → roblox-datastores skill (and its references/).
- Motion, character actions, or UI transitions → roblox-animation (and its references/).
- Any 2D interface, HUD, menu, or "particle" effect inside UI → roblox-user-interfaces (and its references/, especially particles-in-ui.md).
- Robux purchases, passes, or shops → roblox-gamepasses.
- Fire, smoke, sparks, trails, or other 3D world VFX → roblox-vfx.
- "How do I even structure this?" or "which service?" or "what can I actually store?" → roblox-core.
- "Is this safe on the client?" or "how do I securely call from client to server?" → roblox-networking.

Follow the file references inside each specialized skill. The depth is there when you need it; the hub keeps you from getting lost.
