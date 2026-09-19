---
name: roblox
description: "Route Roblox Luau tasks to specialist skills. Use for architecture decisions, broad development requests, or work spanning several Roblox systems."
last_reviewed: 2026-06-17
---

# roblox

**Engine API Reference (always the source of truth for classes/properties):** https://create.roblox.com/docs/reference/engine

Full documentation indexes for agents:
- https://create.roblox.com/docs/llms.txt (start here, then route to Engine vs Open Cloud sub-indexes)
- Engine-specific: https://create.roblox.com/docs/reference/engine/llms.txt

This hub skill gives the big picture and routes to specialist `SKILL.md` entry points. Each specialist owns its deep `references/` index so agents load only the material needed.

## Specialist skills

Choose the skill matching the task. Each specialist links to its own detailed references.

<!-- catalog:specialists:start -->
- [roblox-core](../roblox-core/SKILL.md): Choose services, types, serialization, and script locations
- [roblox-networking](../roblox-networking/SKILL.md): Design remotes, validate client requests, and control replication
- [roblox-datastores](../roblox-datastores/SKILL.md): Save player data, handle concurrent writes, and recover versions
- [roblox-user-interfaces](../roblox-user-interfaces/SKILL.md): Build responsive GUIs, handle input, and add UI effects
- [roblox-animation](../roblox-animation/SKILL.md): Animate rigs, configure IK, tween properties, and time marker events
- [roblox-vfx](../roblox-vfx/SKILL.md): Build particles, flipbooks, beams, trails, and highlights
- [roblox-audio](../roblox-audio/SKILL.md): Build audio graphs, mix effects, and migrate legacy Sound code
- [roblox-gamepasses](../roblox-gamepasses/SKILL.md): Handle passes, products, subscriptions, transfers, and purchase policy
- [roblox-open-cloud](../roblox-open-cloud/SKILL.md): Automate Roblox resources through REST APIs or supported HttpService calls
- [roblox-teleport](../roblox-teleport/SKILL.md): Move players between places, coordinate matchmaking, and hand off data
- [roblox-rojo](../roblox-rojo/SKILL.md): Set up filesystem projects, sync with Studio, build, and export places
- [roblox-mcp](../roblox-mcp/SKILL.md): Connect agents to Studio, inspect instances, edit scripts, and playtest
- [roblox-physics](../roblox-physics/SKILL.md): Build mechanisms, choose constraints, and assign physics ownership
- [roblox-npcs](../roblox-npcs/SKILL.md): Navigate NPCs, handle blocked paths, and build patrol or chase behavior
- [roblox-testing](../roblox-testing/SKILL.md): Reproduce bugs, write tests, and profile performance
<!-- catalog:specialists:end -->

## Shared constraints

1. **Server authority first.** Validate or simulate on the server. Client is for input, prediction, and cosmetics.
2. **Everything that talks to the cloud is fallible.** Wrap DataStore, Marketplace, Http, etc. calls in pcall. Have a plan for transient vs permanent errors.
3. **Preload assets.** ContentProvider:PreloadAsync for animations, images, sounds, models.
4. **Use modern APIs.** Animator + LoadAnimation, task.* scheduler, TweenService, IKControl, CollectionService tags, Attributes, etc. Avoid deprecated BodyMovers, wait/spawn/delay, Humanoid:LoadAnimation, etc.
5. **Respect limits.** DataStore budgets scale with concurrent users but are still finite. Particles and transparent UI are fill-rate expensive. Profile early.
6. **Structure for maintainability.** ServerScriptService for authority, ReplicatedStorage for shared modules, StarterGui for client UI roots, clear module boundaries, consistent naming.
7. **Test the hard parts.** Studio with API access only on test places. Multiple device classes. Low graphics quality for effects/UI. Concurrency (multiple servers touching the same keys).

## Modern API notes

- **Deferred events:** Set `Workspace.SignalBehavior = Enum.SignalBehavior.Deferred` (or use the corresponding project setting) so events queue and flush, avoiding re-entrancy issues.
- **Chat:** Use `TextChatService` for modern chat; the legacy `Chat` service still exists but is the older API.
- **MemoryStore:** Use `MemoryStoreService` for cross-server, short-lived, or high-throughput data, not regular DataStores.
- **Parallel Luau:** Use `Actor` instances and `task.synchronize()` / `task.desynchronize()` for compute-heavy work, with careful shared-state rules.
- **buffer type:** Use the `buffer` Luau type for compact binary data, serialization, and bit/byte manipulation.
- **UI safe zones:** Use `ScreenGui.ScreenInsets` and related properties to respect device notches and safe areas.
- **ConfigService:** Use a centralized configuration system (commonly a custom ConfigService module or `Configuration` instances) for live configuration and feature flags.

## Workflow

1. Load the specialist that owns the task. For broad architecture work, also read [architecture-principles.md](references/architecture-principles.md).
2. Follow that specialist's reference links for the feature or failure you are handling. For systems that interact, read [cross-skill-integration.md](references/cross-skill-integration.md).
3. Adapt script examples to the project and check their maturity labels. Validate changes in a dedicated test experience.
4. Before handing off, report which checks passed, which need Roblox integration, and any unresolved API or policy questions. Check uncertain behavior against the official sources above.

<!-- catalog:references:start -->
## Reference index

- [architecture-principles.md](references/architecture-principles.md): Choose authority boundaries, data flow, or project structure across systems.
- [cross-skill-integration.md](references/cross-skill-integration.md): Combine purchases with persistence, or animation with effects and UI.
<!-- catalog:references:end -->
