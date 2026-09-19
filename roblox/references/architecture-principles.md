---
read_when: "Choose authority boundaries, data flow, or project structure across systems"
last_reviewed: 2026-06-17
---

# Roblox architecture principles

## Server authority as default posture

- The server decides outcomes for anything that affects shared state, economy, progression, or competitive fairness.
- Client sends intent ("I want to buy this", "I attacked with this swing").
- Server validates (range, timing, cost, line of sight, cooldowns, etc.) then either applies the change (and lets replication or a targeted Remote carry the result) or rejects it.
- Replicated display values such as leaderstats are visible to clients, but they remain authoritative on the server and are commonly used to drive server logic. Update them from the server result and never trust the client version for logic.

## Progressive data loading and saving

- On join: load from DataStore (with pcall + fresh read option after previous errors), merge defaults, re-verify ownership on PlayerAdded (gamepasses, etc.), sync safe derived state to client.
- During play: mutate in-memory profile, periodic auto-saves + immediate saves on important events using UpdateAsync for contended values.
- On leave / BindToClose: final save.
- Always have a plan for "the write appeared to fail but might have succeeded on the backend". Verify with UseCache=false Get.

## Asset and code loading discipline

- Preload animations, sounds, images, important models via ContentProvider:PreloadAsync early in the loading sequence.
- Use WaitForChild when requiring modules or waiting for services/children whose load order is not guaranteed.
- Structure: ReplicatedStorage for shared pure modules + asset containers, ServerScriptService for server authority, StarterGui for client UI roots (with LocalScripts or required client modules).

## Performance mindset

- Overlapping transparent particles and UI increase GPU fill-rate cost, especially on mobile.
- Instance count, part count, and streaming matter for world performance.
- Tween many things or play many complex animations at once? Profile.
- Use the lowest sufficient animation priority, particle rate, and UI transparency layers.
- Test at both lowest and highest graphics quality in Studio.

## Organization that scales

- One data store (or small number) per major domain with key prefixes for organization, rather than hundreds of tiny stores.
- Consistent key naming (e.g. "PlayerData_" .. userId or "Profiles/" .. userId).
- Module boundaries that mirror the skills (DataManager, UIManager, AnimationManager, Economy, etc.).
- Tags (CollectionService) and Attributes for lightweight dynamic grouping instead of deep fragile hierarchies.

## Security basics (applies everywhere)

- No client datastore writes or economy logic.
- All Marketplace prompts on client; all granting on server with re-verification.
- Rate limit sensitive Remotes with per-player buckets; track timestamps/counters per `Player.UserId`, not shared globals.
- Sanitize and validate all input: type checks, range checks, whitelist allowed values, reject malformed payloads before processing.
- Filter user-generated text with `TextService:FilterStringAsync` / `TextFilterResult` before displaying it anywhere.
- Keep `HttpService` secrets and API keys server-side; use `SecretsService` to store and retrieve them instead of embedding in scripts.
- Keep confidential data and anti-cheat parameters server-side; minimize client anti-cheat and assume the client is compromised.
- Audit third-party assets.
- Use capabilities where available.

## Testing and deployment hygiene

- Grant Studio backend access only to dedicated test experiences; do not point Studio sessions at production data.
- Use multiple places or a staging universe for testing data changes.
- Take snapshots before risky publishes that touch data logic.
- Monitor Data Stores Dashboard + Manager + general performance stats after every meaningful update.

## Choose a specialist

Use the [hub's specialist list](../SKILL.md) to find the skill that owns the task. Each specialist links to the references for its domain.
