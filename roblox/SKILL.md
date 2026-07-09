---
name: roblox
description: Roblox Luau development hub that routes agents to the right specialist skill and keeps every API recommendation cited to the official Engine Reference. Covers server-authority architecture, modern API selection (Animator, task.*, TweenService, IKControl), and progressive disclosure into deep skills spanning datastores, networking, UI, animation, VFX, audio, physics, NPCs, monetization, Open Cloud, teleportation, testing, Rojo, and Studio MCP. Use as the entry point for any Roblox task before loading a specialized skill.
---

# roblox

**Engine API Reference (always the source of truth for classes/properties):** https://create.roblox.com/docs/reference/engine

Full documentation indexes for agents:
- https://create.roblox.com/docs/llms.txt (start here, then route to Engine vs Open Cloud sub-indexes)
- Engine-specific: https://create.roblox.com/docs/reference/engine/llms.txt

This hub skill exists because individual topics are deep and interconnected. It gives you the big picture, decision frameworks, and explicit pointers (with relative file paths) into the specialized skills' `references/` folders so agents can load only the exact detailed material needed.

## When to Activate

Any mention of Roblox, Luau scripting inside experiences, building places, characters, UI/HUD/menus, saving data, animations, particles/effects, gamepasses/shops/monetization, services, client-server code, or "make this look good / feel responsive / be secure".

The sub-skills have very specific descriptions for precise activation. This hub is the safe default when the task is broad Roblox development.

## The Specialized Skills (with direct references)

Load the full specialized SKILL.md when the task narrows. Then follow its "Read references/xxx.md for details" instructions for granular depth.

- **Data persistence (datastores of all types, limits, versioning, safe patterns, leaderboards, manager/observability):** [roblox-datastores/SKILL.md](../roblox-datastores/SKILL.md)  
  Its references/ cover [types-of-datastores.md](../roblox-datastores/references/types-of-datastores.md), [core-operations-and-patterns.md](../roblox-datastores/references/core-operations-and-patterns.md), [limits-quotas-throttling-error-codes.md](../roblox-datastores/references/limits-quotas-throttling-error-codes.md), [versioning-metadata-recovery.md](../roblox-datastores/references/versioning-metadata-recovery.md), [best-practices-and-gotchas.md](../roblox-datastores/references/best-practices-and-gotchas.md) (listing/caching/advanced profiles covered in these and the main SKILL.md).

- **Animation & tweening (3D rigs/Animator/Tracks/IK/markers + all UI and 3D tweening with TweenService, easing, sequences, typewriter, integration):** [roblox-animation/SKILL.md](../roblox-animation/SKILL.md)  
  Its references/ cover [3d-animations.md](../roblox-animation/references/3d-animations.md), [ui-tweens-and-sequences.md](../roblox-animation/references/ui-tweens-and-sequences.md), [integration-and-events.md](../roblox-animation/references/integration-and-events.md) (IK and TweenService details in 3d-animations and ui-tweens).

- **User interfaces (containers, positioning, interaction, and "particles in the UI" techniques):** [roblox-user-interfaces/SKILL.md](../roblox-user-interfaces/SKILL.md)  
  Its references/ cover [gui-containers.md](../roblox-user-interfaces/references/gui-containers.md), [particles-in-ui.md](../roblox-user-interfaces/references/particles-in-ui.md). [scripts/UIParticlePool.lua](../roblox-user-interfaces/scripts/UIParticlePool.lua) is a 2D UI particle burst example.

- **Monetization & gamepasses (creation, selling flow, ownership + purchase finished handlers, rules/policy changes, secure granting):** [roblox-gamepasses/SKILL.md](../roblox-gamepasses/SKILL.md)  
  Its references/ expand on [creation-and-setup.md](../roblox-gamepasses/references/creation-and-setup.md), [purchase-flow-and-granting.md](../roblox-gamepasses/references/purchase-flow-and-granting.md), [rules-policies-and-security.md](../roblox-gamepasses/references/rules-policies-and-security.md), [policyservice.md](../roblox-gamepasses/references/policyservice.md) (per-player policy gating: `ArePaidRandomItemsRestricted`, `IsEligibleToPurchaseSubscription`, China policies, trade rules), [subscriptions.md](../roblox-gamepasses/references/subscriptions.md) (recurring monthly benefits: `GetUserSubscriptionStatusAsync`, `PromptSubscriptionPurchase`, `UserSubscriptionStatusChanged`, payout rules, migration from passes).

- **Visual effects & particles (full ParticleEmitter mastery + Beams/Trails/Highlight, performance, flipbooks, shapes, marker integration):** [roblox-vfx/SKILL.md](../roblox-vfx/SKILL.md)  
  Its references/ cover [particle-emitter-properties.md](../roblox-vfx/references/particle-emitter-properties.md), [shapes-flipbooks-and-advanced.md](../roblox-vfx/references/shapes-flipbooks-and-advanced.md).

- **Core services, Luau types, and architecture (every important service, Luau primitives + tables/enums/metatables/queues/stacks, type checking, serialization, script locations, no runtime FS reality, data model):** [roblox-core/SKILL.md](../roblox-core/SKILL.md)
  Its references/ break down [services-catalog-and-usage.md](../roblox-core/references/services-catalog-and-usage.md), [luau-data-types-and-serialization.md](../roblox-core/references/luau-data-types-and-serialization.md), [script-locations-contexts-and-architecture.md](../roblox-core/references/script-locations-contexts-and-architecture.md). Hub-level architecture principles live in [references/architecture-principles.md](references/architecture-principles.md).

- **Client-server networking and security (remotes vs bindables, authority, network ownership, exploits & defenses, capabilities, secure data/monetization flows):** [roblox-networking/SKILL.md](../roblox-networking/SKILL.md)  
  Its references/ cover [remote-and-bindable-patterns.md](../roblox-networking/references/remote-and-bindable-patterns.md), [server-authority-and-validation.md](../roblox-networking/references/server-authority-and-validation.md), [exploits-and-defenses.md](../roblox-networking/references/exploits-and-defenses.md). Cross-skill secure flows are covered in [references/cross-skill-integration.md](references/cross-skill-integration.md).

- **Roblox Studio MCP server (connect AI agents to Studio via MCP, Script Sync, tool reference, security/troubleshooting):** [roblox-mcp/SKILL.md](../roblox-mcp/SKILL.md)  
  Its references/ cover [setup-and-connection.md](../roblox-mcp/references/setup-and-connection.md), [tool-reference.md](../roblox-mcp/references/tool-reference.md), [script-sync-integration.md](../roblox-mcp/references/script-sync-integration.md), [security-and-troubleshooting.md](../roblox-mcp/references/security-and-troubleshooting.md). Diagnostic scripts are in [scripts/MCPReadyChecker.lua](../roblox-mcp/scripts/MCPReadyChecker.lua) and [scripts/StudioModelProbe.lua](../roblox-mcp/scripts/StudioModelProbe.lua).

- **Rojo filesystem projects (CLI/plugin install, `.project.json`, live sync, build/upload, sourcemap, syncback, file→instance mapping):** [roblox-rojo/SKILL.md](../roblox-rojo/SKILL.md)  
  Its references/ cover [installation-and-cli.md](../roblox-rojo/references/installation-and-cli.md), [project-format.md](../roblox-rojo/references/project-format.md), [sync-details.md](../roblox-rojo/references/sync-details.md), [workflows-and-syncback.md](../roblox-rojo/references/workflows-and-syncback.md).

- **Physics and constraints (rigid bodies, assemblies, mechanical/mover constraints, network ownership, collisions, sleep system, adaptive timestepping, units, vehicles, mechanisms):** [roblox-physics/SKILL.md](../roblox-physics/SKILL.md)  
  Its references/ cover [mechanical-constraints.md](../roblox-physics/references/mechanical-constraints.md), [mover-constraints.md](../roblox-physics/references/mover-constraints.md), [network-ownership.md](../roblox-physics/references/network-ownership.md), [collisions-and-filtering.md](../roblox-physics/references/collisions-and-filtering.md), [units-and-physical-properties.md](../roblox-physics/references/units-and-physical-properties.md). Example scripts are in [scripts/VehicleController.lua](../roblox-physics/scripts/VehicleController.lua), [scripts/DoorHinge.lua](../roblox-physics/scripts/DoorHinge.lua), [scripts/PlatformMover.lua](../roblox-physics/scripts/PlatformMover.lua), and [scripts/Suspension.lua](../roblox-physics/scripts/Suspension.lua).

- **Pathfinding and NPCs (PathfindingService, modifiers/links, waypoint following, state machines, patrol/chase/follow, streaming, performance at scale):** [roblox-npcs/SKILL.md](../roblox-npcs/SKILL.md)  
  Its references/ cover [pathfinding-service-details.md](../roblox-npcs/references/pathfinding-service-details.md), [modifiers-links-and-streaming.md](../roblox-npcs/references/modifiers-links-and-streaming.md), [npc-behavior-patterns.md](../roblox-npcs/references/npc-behavior-patterns.md), [performance-and-scaling.md](../roblox-npcs/references/performance-and-scaling.md). Example scripts are in [scripts/NPCPathFollower.lua](../roblox-npcs/scripts/NPCPathFollower.lua), [scripts/PatrolBehavior.lua](../roblox-npcs/scripts/PatrolBehavior.lua), and [scripts/PathfindingUtility.lua](../roblox-npcs/scripts/PathfindingUtility.lua).

- **Testing and debugging (Developer Console, MicroProfiler, Scene Analysis, Script Profiler, logging, pcall, unit tests, common bugs and fixes):** [roblox-testing/SKILL.md](../roblox-testing/SKILL.md)  
  Its references/ cover [testing-patterns.md](../roblox-testing/references/testing-patterns.md), [debugging-tools.md](../roblox-testing/references/debugging-tools.md), [performance-profiling.md](../roblox-testing/references/performance-profiling.md), [common-bugs-and-fixes.md](../roblox-testing/references/common-bugs-and-fixes.md). Example scripts are in [scripts/TestRunner.lua](../roblox-testing/scripts/TestRunner.lua), [scripts/Logger.lua](../roblox-testing/scripts/Logger.lua), and [scripts/DebugDraw.lua](../roblox-testing/scripts/DebugDraw.lua).

- **Audio (modern modular audio graph: AudioPlayer, AudioEmitter, AudioListener, AudioDeviceOutput/Input, Wire, TTS/STT, effects; legacy Sound/SoundGroup; 2D vs 3D; acoustic simulation; performance; asset permissions):** [roblox-audio/SKILL.md](../roblox-audio/SKILL.md)  
  Its references/ cover [audio-effects.md](../roblox-audio/references/audio-effects.md), [audio-graph-vs-sound.md](../roblox-audio/references/audio-graph-vs-sound.md). Example script in [scripts/AudioBus.lua](../roblox-audio/scripts/AudioBus.lua).

- **Open Cloud (REST API for Roblox resources from outside the engine or via HttpService: API keys/OAuth2, data & memory stores, assets, universes/places, users, groups, subscriptions, webhooks, in-experience calling, rate limits, security):** [roblox-open-cloud/SKILL.md](../roblox-open-cloud/SKILL.md)  
  Its references/ cover [auth-and-keys.md](../roblox-open-cloud/references/auth-and-keys.md), [calling-from-in-experience.md](../roblox-open-cloud/references/calling-from-in-experience.md). Example script in [scripts/OpenCloudRequest.lua](../roblox-open-cloud/scripts/OpenCloudRequest.lua).

- **TeleportService and multi-place (TeleportAsync, TeleportOptions, TeleportAsyncResult, ReserveServerAsync, reserved servers, matchmaking patterns, DataStore handoff, cross-experience teleports, teleport data, custom loading screens, security, Studio limitation):** [roblox-teleport/SKILL.md](../roblox-teleport/SKILL.md)  
  Its references/ cover [teleport-options.md](../roblox-teleport/references/teleport-options.md), [matchmaking.md](../roblox-teleport/references/matchmaking.md). Example script in [scripts/TeleportHelper.lua](../roblox-teleport/scripts/TeleportHelper.lua).

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
5. Use the scripts/ examples as starting points (adapt the SafeDataStore wrapper, particle pools, animation loaders, etc.).
6. Cross-link: datastores + networking for secure persistence; animation + vfx + UI for synchronized VFX; gamepasses + datastores for perk application; etc.
7. When in doubt, fall back to the Engine API reference and the llms.txt indexes.

This collection is intentionally deeper and more structured than generic "Roblox scripting" advice precisely because current models have gaps in the current Roblox API surface, limits details, modern patterns (Animator, IKControl, full DataStore v2, configurable rate limits, ViewportFrame previews for 3D UI — note ViewportFrame does not render ParticleEmitter, Beam, Trail, or most 3D effects, etc.), and security realities.

Use it, follow the references, and the resulting code will be correct, efficient, secure, and maintainable.
