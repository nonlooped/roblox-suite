---
name: roblox-suite
description: The primary entry-point and hub skill for high-quality Roblox development with Luau. Provides overarching architecture, server-authority principles, performance mindset, code organization, and direct references (with file paths) to specialized deep skills for datastores, animations (3D + UI + tweens), GUI containers and building blocks (plus particles-in-UI techniques), gamepasses and monetization rules, particles and visual effects, core services + Luau data/file types, client-server networking/security, Roblox Studio MCP server setup/tooling, physics and constraints, pathfinding/NPC AI, and testing/debugging. Use for any Roblox experience, scripting, UI, data, animation, effects, monetization, networking, security, physics, AI, agent-driven Studio workflows, or debugging task. This skill set is explicitly designed to overcome outdated, shallow, or incorrect model knowledge of current Luau and Roblox APIs by grounding everything in official docs, production patterns, gotchas, limits, and progressive disclosure to detailed references/.
---

# roblox-suite

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

- **Data persistence (datastores of all types, limits, versioning, safe patterns, leaderboards, manager/observability):** [roblox-data-persistence/SKILL.md](../roblox-data-persistence/SKILL.md)  
  Its references/ cover [types-of-datastores.md](../roblox-data-persistence/references/types-of-datastores.md), [core-operations-and-patterns.md](../roblox-data-persistence/references/core-operations-and-patterns.md), [limits-quotas-throttling-error-codes.md](../roblox-data-persistence/references/limits-quotas-throttling-error-codes.md), [versioning-metadata-recovery.md](../roblox-data-persistence/references/versioning-metadata-recovery.md), [best-practices-and-gotchas.md](../roblox-data-persistence/references/best-practices-and-gotchas.md) (listing/caching/advanced profiles covered in these and the main SKILL.md).

- **Animation & tweening (3D rigs/Animator/Tracks/IK/markers + all UI and 3D tweening with TweenService, easing, sequences, typewriter, integration):** [roblox-animation-and-tweening/SKILL.md](../roblox-animation-and-tweening/SKILL.md)  
  Its references/ cover [3d-animations.md](../roblox-animation-and-tweening/references/3d-animations.md), [ui-tweens-and-sequences.md](../roblox-animation-and-tweening/references/ui-tweens-and-sequences.md), [integration-and-events.md](../roblox-animation-and-tweening/references/integration-and-events.md) (IK and TweenService details in 3d-animations and ui-tweens).

- **User interfaces (containers, positioning, interaction, and "particles in the UI" techniques):** [roblox-user-interfaces/SKILL.md](../roblox-user-interfaces/SKILL.md)  
  Its references/ cover [gui-containers.md](../roblox-user-interfaces/references/gui-containers.md), [particles-in-ui.md](../roblox-user-interfaces/references/particles-in-ui.md). [scripts/UIParticlePool.lua](../roblox-user-interfaces/scripts/UIParticlePool.lua) is a 2D UI particle burst example.

- **Monetization & gamepasses (creation, selling flow, ownership + purchase finished handlers, rules/policy changes, secure granting):** [roblox-monetization-gamepasses/SKILL.md](../roblox-monetization-gamepasses/SKILL.md)  
  Its references/ expand on [creation-and-setup.md](../roblox-monetization-gamepasses/references/creation-and-setup.md), [purchase-flow-and-granting.md](../roblox-monetization-gamepasses/references/purchase-flow-and-granting.md), [rules-policies-and-security.md](../roblox-monetization-gamepasses/references/rules-policies-and-security.md).

- **Visual effects & particles (full ParticleEmitter mastery + Beams/Trails/Highlight, performance, flipbooks, shapes, marker integration):** [roblox-visual-effects-and-particles/SKILL.md](../roblox-visual-effects-and-particles/SKILL.md)  
  Its references/ cover [particle-emitter-properties.md](../roblox-visual-effects-and-particles/references/particle-emitter-properties.md), [shapes-flipbooks-and-advanced.md](../roblox-visual-effects-and-particles/references/shapes-flipbooks-and-advanced.md).

- **Fundamentals, services, and Luau types (every important service, Luau primitives + tables/enums/metatables/queues/stacks, type checking, serialization, script locations, no runtime FS reality, data model):** [roblox-fundamentals-and-services/SKILL.md](../roblox-fundamentals-and-services/SKILL.md)  
  Its references/ break down [services-catalog-and-usage.md](../roblox-fundamentals-and-services/references/services-catalog-and-usage.md), [luau-data-types-and-serialization.md](../roblox-fundamentals-and-services/references/luau-data-types-and-serialization.md), [script-locations-contexts-and-architecture.md](../roblox-fundamentals-and-services/references/script-locations-contexts-and-architecture.md). Hub-level architecture principles live in [references/architecture-principles.md](references/architecture-principles.md).

- **Client-server networking and security (remotes vs bindables, authority, network ownership, exploits & defenses, capabilities, secure data/monetization flows):** [roblox-client-server-networking-and-security/SKILL.md](../roblox-client-server-networking-and-security/SKILL.md)  
  Its references/ cover [remote-and-bindable-patterns.md](../roblox-client-server-networking-and-security/references/remote-and-bindable-patterns.md), [server-authority-and-validation.md](../roblox-client-server-networking-and-security/references/server-authority-and-validation.md), [exploits-and-defenses.md](../roblox-client-server-networking-and-security/references/exploits-and-defenses.md). Cross-skill secure flows are covered in [references/cross-skill-integration.md](references/cross-skill-integration.md).

- **Roblox Studio MCP server (connect AI agents to Studio via MCP, Script Sync, tool reference, security/troubleshooting):** [roblox-studio-mcp-server/SKILL.md](../roblox-studio-mcp-server/SKILL.md)  
  Its references/ cover [setup-and-connection.md](../roblox-studio-mcp-server/references/setup-and-connection.md), [tool-reference.md](../roblox-studio-mcp-server/references/tool-reference.md), [script-sync-integration.md](../roblox-studio-mcp-server/references/script-sync-integration.md), [security-and-troubleshooting.md](../roblox-studio-mcp-server/references/security-and-troubleshooting.md). Diagnostic scripts are in [scripts/MCPReadyChecker.lua](../roblox-studio-mcp-server/scripts/MCPReadyChecker.lua) and [scripts/StudioModelProbe.lua](../roblox-studio-mcp-server/scripts/StudioModelProbe.lua).

- **Physics and constraints (rigid bodies, assemblies, mechanical/mover constraints, network ownership, collisions, sleep system, adaptive timestepping, units, vehicles, mechanisms):** [roblox-physics-and-constraints/SKILL.md](../roblox-physics-and-constraints/SKILL.md)  
  Its references/ cover [mechanical-constraints.md](../roblox-physics-and-constraints/references/mechanical-constraints.md), [mover-constraints.md](../roblox-physics-and-constraints/references/mover-constraints.md), [network-ownership.md](../roblox-physics-and-constraints/references/network-ownership.md), [collisions-and-filtering.md](../roblox-physics-and-constraints/references/collisions-and-filtering.md), [units-and-physical-properties.md](../roblox-physics-and-constraints/references/units-and-physical-properties.md). Example scripts are in [scripts/VehicleController.lua](../roblox-physics-and-constraints/scripts/VehicleController.lua), [scripts/DoorHinge.lua](../roblox-physics-and-constraints/scripts/DoorHinge.lua), [scripts/PlatformMover.lua](../roblox-physics-and-constraints/scripts/PlatformMover.lua), and [scripts/Suspension.lua](../roblox-physics-and-constraints/scripts/Suspension.lua).

- **Pathfinding and NPCs (PathfindingService, modifiers/links, waypoint following, state machines, patrol/chase/follow, streaming, performance at scale):** [roblox-pathfinding-and-npcs/SKILL.md](../roblox-pathfinding-and-npcs/SKILL.md)  
  Its references/ cover [pathfinding-service-details.md](../roblox-pathfinding-and-npcs/references/pathfinding-service-details.md), [modifiers-links-and-streaming.md](../roblox-pathfinding-and-npcs/references/modifiers-links-and-streaming.md), [npc-behavior-patterns.md](../roblox-pathfinding-and-npcs/references/npc-behavior-patterns.md), [performance-and-scaling.md](../roblox-pathfinding-and-npcs/references/performance-and-scaling.md). Example scripts are in [scripts/NPCPathFollower.lua](../roblox-pathfinding-and-npcs/scripts/NPCPathFollower.lua), [scripts/PatrolBehavior.lua](../roblox-pathfinding-and-npcs/scripts/PatrolBehavior.lua), and [scripts/PathfindingUtility.lua](../roblox-pathfinding-and-npcs/scripts/PathfindingUtility.lua).

- **Testing and debugging (Developer Console, MicroProfiler, Scene Analysis, Script Profiler, logging, pcall, unit tests, common bugs and fixes):** [roblox-testing-and-debugging/SKILL.md](../roblox-testing-and-debugging/SKILL.md)  
  Its references/ cover [testing-patterns.md](../roblox-testing-and-debugging/references/testing-patterns.md), [debugging-tools.md](../roblox-testing-and-debugging/references/debugging-tools.md), [performance-profiling.md](../roblox-testing-and-debugging/references/performance-profiling.md), [common-bugs-and-fixes.md](../roblox-testing-and-debugging/references/common-bugs-and-fixes.md). Example scripts are in [scripts/TestRunner.lua](../roblox-testing-and-debugging/scripts/TestRunner.lua), [scripts/Logger.lua](../roblox-testing-and-debugging/scripts/Logger.lua), and [scripts/DebugDraw.lua](../roblox-testing-and-debugging/scripts/DebugDraw.lua).

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

Safe datastore (see data skill for the full SafeDataStore wrapper in its scripts/):
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

1. Start with this hub + fundamentals-and-services if the task is broad.
2. Activate the most specific sub-skill(s) that match the request.
3. Inside the sub-skill, follow the explicit "Read references/..." instructions for the exact sub-topic.
4. Load the referenced .md file(s) for the deep tables, code samples, decision trees, and gotchas.
5. Use the scripts/ examples as starting points (adapt the SafeDataStore wrapper, particle pools, animation loaders, etc.).
6. Cross-link: data + client-server for secure persistence; animation + particles + UI for synchronized VFX; gamepasses + data for perk application; etc.
7. When in doubt, fall back to the Engine API reference and the llms.txt indexes.

This collection is intentionally deeper and more structured than generic "Roblox scripting" advice precisely because current models have gaps in the current Roblox API surface, limits details, modern patterns (Animator, IKControl, full DataStore v2, configurable rate limits, ViewportFrame previews for 3D UI — note ViewportFrame does not render ParticleEmitter, Beam, Trail, or most 3D effects, etc.), and security realities.

Use it, follow the references, and the resulting code will be correct, efficient, secure, and maintainable.
