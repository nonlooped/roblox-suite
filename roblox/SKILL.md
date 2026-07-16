---
name: roblox
description: "Roblox Luau development hub that routes agents to the right specialist skill and keeps every API recommendation cited to the official Engine Reference. Covers server-authority architecture, modern API selection (Animator, task.*, TweenService, IKControl), and progressive disclosure into deep skills spanning datastores, networking, UI, animation, VFX, audio, physics, NPCs, monetization, Open Cloud, teleportation, testing, Rojo, and Studio MCP. Use as the entry point for any Roblox task before loading a specialized skill."
last_reviewed: 2026-06-17
---

# roblox

**Engine API Reference (always the source of truth for classes/properties):** https://create.roblox.com/docs/reference/engine

Full documentation indexes for agents:
- https://create.roblox.com/docs/llms.txt (start here, then route to Engine vs Open Cloud sub-indexes)
- Engine-specific: https://create.roblox.com/docs/reference/engine/llms.txt

This hub skill gives the big picture and routes to specialist `SKILL.md` entry points. Each specialist owns its deep `references/` index so agents load only the material needed.

## When to Activate

Any mention of Roblox, Luau scripting inside experiences, building places, characters, UI/HUD/menus, saving data, animations, particles/effects, gamepasses/shops/monetization, services, client-server code, or "make this look good / feel responsive / be secure".

The sub-skills have very specific descriptions for precise activation. This hub is the safe default when the task is broad Roblox development.

## The Specialized Skills

The hub routes only to specialist entry points. Load the relevant specialist, then follow the reference links owned by that specialist. This keeps the hub small as the catalog grows.

<!-- catalog:specialists:start -->
- **Roblox core services, Luau types, and RunContext:** [roblox-core/SKILL.md](../roblox-core/SKILL.md) — Services, Luau types, serialization, script locations, `RunContext`, the data model
- **Roblox networking: remotes, server authority, security:** [roblox-networking/SKILL.md](../roblox-networking/SKILL.md) — Remotes, server authority, network ownership, exploit defenses, capabilities
- **Roblox DataStores: safe saves, versioning, quotas:** [roblox-datastores/SKILL.md](../roblox-datastores/SKILL.md) — DataStores, versioning, metadata, quotas, throttling, safe save/load patterns
- **Roblox UI: containers, responsive layouts, interaction:** [roblox-user-interfaces/SKILL.md](../roblox-user-interfaces/SKILL.md) — GUI containers, responsive layouts, interaction, particles-in-UI techniques
- **Roblox animation: Animator, IK, TweenService, markers:** [roblox-animation/SKILL.md](../roblox-animation/SKILL.md) — `Animator`, tracks, IK, `TweenService`, UI tweens, animation markers
- **Roblox VFX: ParticleEmitter, Beam, Trail, performance:** [roblox-vfx/SKILL.md](../roblox-vfx/SKILL.md) — `ParticleEmitter`, shapes, flipbooks, beams, trails, highlights, performance
- **Roblox audio: modern graph, legacy Sound, 3D, effects:** [roblox-audio/SKILL.md](../roblox-audio/SKILL.md) — Modern audio graph (`AudioPlayer`/`AudioEmitter`/`Wire`/TTS/STT), legacy `Sound`, 3D audio, effects, performance
- **Roblox monetization: game passes, products, subscriptions:** [roblox-gamepasses/SKILL.md](../roblox-gamepasses/SKILL.md) — Game passes, dev products, subscriptions, purchase flow, policy, Robux transfers, analytics
- **Roblox Open Cloud: REST APIs, keys, in-experience calls:** [roblox-open-cloud/SKILL.md](../roblox-open-cloud/SKILL.md) — Open Cloud REST APIs: API keys/OAuth2, data stores, assets, universes, webhooks, in-experience calling
- **Roblox TeleportService: TeleportAsync, reserved servers:** [roblox-teleport/SKILL.md](../roblox-teleport/SKILL.md) — `TeleportAsync`, `TeleportOptions`, reserved servers, multi-place, matchmaking, DataStore handoff
- **Rojo: filesystem projects, live sync, build:** [roblox-rojo/SKILL.md](../roblox-rojo/SKILL.md) — Rojo 7: CLI/plugin, project format, live sync, build/upload, sourcemap, syncback
- **Roblox Studio MCP: connect AI agents to Studio:** [roblox-mcp/SKILL.md](../roblox-mcp/SKILL.md) — Connect AI agents to Roblox Studio via MCP: setup, tools, Script Sync, playtesting
- **Roblox physics: assemblies, constraints, network ownership:** [roblox-physics/SKILL.md](../roblox-physics/SKILL.md) — Rigid bodies, assemblies, mechanical/mover constraints, network ownership, vehicles
- **Roblox NPCs: PathfindingService, AI patterns, patrol:** [roblox-npcs/SKILL.md](../roblox-npcs/SKILL.md) — PathfindingService, modifiers/links, waypoint following, patrol/chase AI patterns
- **Roblox testing: Developer Console, MicroProfiler, TestEZ:** [roblox-testing/SKILL.md](../roblox-testing/SKILL.md) — Developer Console, MicroProfiler, Scene Analysis, tests, logging, common bug fixes
<!-- catalog:specialists:end -->

## Overarching Principles (apply to everything)

1. **Server authority first.** Validate or simulate on the server. Client is for input, prediction, and cosmetics.
2. **Everything that talks to the cloud is fallible.** Wrap DataStore, Marketplace, Http, etc. calls in pcall. Have a plan for transient vs permanent errors.
3. **Preload assets.** ContentProvider:PreloadAsync for animations, images, sounds, models.
4. **Use modern APIs.** Animator + LoadAnimation, task.* scheduler, TweenService, IKControl, CollectionService tags, Attributes, etc. Avoid deprecated BodyMovers, wait/spawn/delay, Humanoid:LoadAnimation, etc.
5. **Respect limits.** DataStore budgets scale with concurrent users but are still finite. Particles and transparent UI are fill-rate expensive. Profile early.
6. **Structure for maintainability.** ServerScriptService for authority, ReplicatedStorage for shared modules, StarterGui for client UI roots, clear module boundaries, consistent naming.
7. **Test the hard parts.** Studio with API access only on test places. Multiple device classes. Low graphics quality for effects/UI. Concurrency (multiple servers touching the same keys).
8. **Progressive disclosure & references.** The sub-skills are deliberately split so the agent only loads the exact deep material it needs. Follow the "read references/xxx.md" pointers inside each specialized skill.

## Quick Reference Patterns (hub level)

See the individual skills for full versions with error handling.

Service acquisition:
```lua
--!strict
local TweenService: TweenService = game:GetService("TweenService")
local DataStoreService: DataStoreService = game:GetService("DataStoreService")
local MarketplaceService: MarketplaceService = game:GetService("MarketplaceService")
local RunService: RunService = game:GetService("RunService")
```

Safe datastore (see roblox-datastores skill for the full SafeDataStore wrapper in its scripts/):
```lua
--!strict
-- assumes `store`, `key`, `newValue`, `userIds`, and `metadata` are already in scope
local success: boolean, value: any, keyInfo: DataStoreKeyInfo? = pcall(function(): (any, DataStoreKeyInfo?)
    return store:UpdateAsync(key, function(current: any, info: DataStoreKeyInfo?): (any, {number}?, {[string]: any}?)
        -- pure transform, no yielding
        return newValue, userIds, metadata
    end)
end)
```

Modern animation play:
```lua
--!strict
-- Player characters: the engine creates the Animator; load animations client-side.
-- For local NPCs/rigs without one, create the Animator once and reuse it.
local humanoid: Humanoid = (script.Parent :: Instance):WaitForChild("Humanoid") :: Humanoid
local animator: Animator = humanoid:WaitForChild("Animator") :: Animator
local animInstance: Animation = script:WaitForChild("Animation") :: Animation
local track: AnimationTrack = animator:LoadAnimation(animInstance)
track:Play(0.1, 1, 1)
track:GetMarkerReachedSignal("MarkerName"):Connect(function(param: string)
    -- spawn effect, play sound, start tween, etc.
end)
```

UI tween (scale + AnchorPoint):
```lua
--!strict
local TweenService: TweenService = game:GetService("TweenService")
local obj: GuiObject = (script.Parent :: Instance) :: GuiObject
obj.AnchorPoint = Vector2.new(0.5, 0.5)
TweenService:Create(obj, TweenInfo.new(0.3, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
    Size = UDim2.fromScale(1.1, 1.1)
} :: { [string]: any }):Play()
```

Purchase flow (see gamepasses skill):
- Client prompts only.
- Server grants in PromptGamePassPurchaseFinished and re-verifies on PlayerAdded.

Audio:
- Modern audio uses `AudioPlayer` + `AudioEmitter` + `AudioDeviceOutput` (the new audio graph API).
- Legacy `Sound` objects still work but are the older API.

## Modern API notes

- **Deferred events:** Set `Workspace.SignalBehavior = Enum.SignalBehavior.Deferred` (or use the corresponding project setting) so events queue and flush, avoiding re-entrancy issues.
- **Chat:** Use `TextChatService` for modern chat; the legacy `Chat` service still exists but is the older API.
- **MemoryStore:** Use `MemoryStoreService` for cross-server, short-lived, or high-throughput data, not regular DataStores.
- **Parallel Luau:** Use `Actor` instances and `task.synchronize()` / `task.desynchronize()` for compute-heavy work, with careful shared-state rules.
- **buffer type:** Use the `buffer` Luau type for compact binary data, serialization, and bit/byte manipulation.
- **UI safe zones:** Use `ScreenGui.ScreenInsets` and related properties to respect device notches and safe areas.
- **ConfigService:** Use a centralized configuration system (commonly a custom ConfigService module or `Configuration` instances) for live configuration and feature flags.

## How to Work Effectively With This Toolset

1. Start with this hub + roblox-core if the task is broad.
2. Activate the most specific sub-skill(s) that match the request.
3. Inside the sub-skill, follow the explicit "Read references/..." instructions for the exact sub-topic.
4. Load the referenced .md file(s) for the deep tables, code samples, decision trees, and gotchas.
5. Treat `scripts/` as maturity-labeled examples. Adapt and test them in a dedicated experience before production use.
6. Cross-link: datastores + networking for secure persistence; animation + vfx + UI for synchronized VFX; gamepasses + datastores for perk application; etc.
7. When in doubt, fall back to the Engine API reference and the llms.txt indexes.

This collection is intentionally deeper and more structured than generic "Roblox scripting" advice precisely because current models have gaps in the current Roblox API surface, limits details, modern patterns (Animator, IKControl, full DataStore v2, configurable rate limits, ViewportFrame previews for 3D UI — note ViewportFrame does not render ParticleEmitter, Beam, Trail, or most 3D effects, etc.), and security realities.

Use it to select current APIs and safer patterns, then validate the result with static analysis, tests, and the relevant official documentation.

<!-- catalog:references:start -->
## Reference index

- [architecture-principles.md](references/architecture-principles.md)
- [cross-skill-integration.md](references/cross-skill-integration.md)
<!-- catalog:references:end -->
