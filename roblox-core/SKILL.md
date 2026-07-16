---
name: roblox-core
description: "Luau fundamentals and the complete Roblox service catalog — game:GetService patterns, data types, serialization rules, script locations, execution contexts, and the client-server data model. Load first so higher-level skills rest on correct assumptions about types, authority, and where code can run."
last_reviewed: 2026-06-17
---

# roblox-core

**Key sources:** https://create.roblox.com/docs/en-us/scripting/services, https://create.roblox.com/docs/en-us/luau, https://create.roblox.com/docs/en-us/luau/tables, https://create.roblox.com/docs/en-us/luau/type-checking, https://create.roblox.com/docs/en-us/scripting/locations, https://create.roblox.com/docs/en-us/projects/data-model, https://create.roblox.com/docs/en-us/projects/client-server, https://create.roblox.com/docs/en-us/workspace/streaming, https://create.roblox.com/docs/en-us/scripting/multithreading, https://create.roblox.com/docs/en-us/scripting/attributes

Every other skill in this toolset assumes you understand the material here.

## The Universal Roblox Scripting Pattern

1. `local Service = game:GetService("ServiceName")` — do this once, name the variable after the service.
2. `local Module = require(ReplicatedStorage:WaitForChild("Module"))`
3. Local helper functions.
4. Connect to events.

Services are the primary way you access engine functionality instead of a traditional standard library.

## Modern Task Library

Use the modern `task` API; the legacy globals `wait()`, `spawn()`, and `delay()` are deprecated/soft-deprecated:

- `task.wait(n?)` — yields for about `n` seconds (default one frame) and returns elapsed time.
- `task.spawn(f, ...)` — schedules `f` to run asynchronously.
- `task.defer(f, ...)` — defers `f` until after the current event cycle.
- `task.cancel(thread)` — cancels a thread returned by `task.spawn`/`task.defer`.

For parallel code, `task.desynchronize()` and `task.synchronize()` move the current thread between the parallel and serial phases.

## Important Services (categorized)

**Container / hierarchy services** (visible in Explorer, part of the DataModel):
- Workspace (3D content)
- Lighting (environment, atmosphere, post effects)
- ReplicatedStorage / ReplicatedFirst (shared code & assets)
- ServerScriptService (server-only logic)
- StarterGui / StarterPlayer / StarterPack (templates cloned to players)
- Players, Teams, SoundService, etc.

**Core runtime & scripting services:**
- RunService — Heartbeat fires after physics on both sides; PreSimulation fires before physics on both sides; PreRender is client-only and fires before rendering.
- TweenService (see animation skill)
- CollectionService (tags)
- ContextActionService, UserInputService, GuiService
- ContentProvider (preloading)

**Cloud / persistence / cross-server:**
- DataStoreService, MemoryStoreService, MessagingService (see roblox-datastores skill)

**Monetization:**
- MarketplaceService (gamepasses, dev products — see dedicated skill)
- BadgeService, etc.

**Other high-value ones:** TeleportService, AnalyticsService, HttpService (outbound only + JSONEncode/Decode), PathfindingService, etc.

Discover services with `game:GetService` (known services) or `game:FindService` (optional). Avoid using `game:GetChildren()` for service discovery — not every DataModel child is a service, and services can be lazily created. Acquire each service once per script/module.

## Instance Creation Best Practice

Configure an instance before parenting it to avoid redundant replication and extra changed events:

```lua
local part = Instance.new("Part")
part.Anchored = true
part.Size = Vector3.new(4, 1, 2)
part.Position = Vector3.new(0, 10, 0)
part.Parent = workspace
```

Set `Parent` last; do not use the `Instance.new("Part", parent)` two-argument form.

## Luau Data Types & What You Can Actually Persist

- nil (unique "nothing"; assigning nil to an array index creates a hole, but dictionary keys can conceptually map to nil — the value is still absent from the table)
- boolean
- number (64-bit double; avoid inf/-inf/nan for DataStore/JSON compatibility)
- string (UTF-8; must be valid UTF-8 for DataStores; the `utf8` library iterates Unicode codepoints, not grapheme clusters)
- table (arrays 1-based or dictionaries; the only complex Luau type)
- Roblox datatypes (Enum.Foo.Bar, CFrame, Vector3, Color3, UDim2, Ray, NumberSequence, ColorSequence, PhysicalProperties, buffer, etc.)
- userdata (rarely used directly in modern Luau; most engine objects are Instances or datatypes)

Note: "tuple" (multiple return values) and `Enum` are not built-in Luau types. Multiple returns are a language feature, and `Enum` values are Roblox-specific datatypes.

**For DataStores, Remotes, and JSON:**
Only tables containing the primitives above (no functions, limited cycles, no custom metatables on the saved table itself). Test suspect data with HttpService:JSONEncode during development, but remember that a successful JSONEncode is a sanity check, not a guarantee against every DataStore constraint (e.g. invalid UTF-8, key/size limits).

## Data Structures Built on Tables

- Stacks (LIFO) and Queues (FIFO) — easy with table.insert/remove at ends or custom ring buffers.
- Metatables — __index, __newindex, __add, __concat, __len, __call, etc. for class-like behavior, defaults, operator overloading, readonly wrappers.
- Modern table helpers — `table.create`, `table.find`, `table.clone`, `table.freeze`/`table.isfrozen`.

## Type Checking

Gradual and opt-in. Use `--!strict` at the top of a file (it is file-level) or a `.luaurc` project configuration for project-wide type checking. Add annotations (`local x: number`, function signatures) for large modules. Inference does a lot of the work. Catches bugs at edit time with zero runtime cost.

## Script Locations & Execution Contexts (this is where most bugs originate)

- ServerScriptService + Script (`RunContext.Server`) → server only, full power (DataStores, etc.).
- ReplicatedStorage → stores shared ModuleScripts/assets. A Script here only runs if its `RunContext` is set to `Client` or `Server`; use ModuleScripts for shared logic.
- StarterGui + LocalScript → per-player client only (inside the cloned PlayerGui).
- ReplicatedFirst + LocalScript → very early client execution (loading screens).
- Actor + Script with `RunContext.Client/Server` → can run Parallel Luau when the code calls `task.desynchronize()` or uses `ConnectParallel()`. The Actor must be parented to the DataModel and the Script must have an explicit RunContext; placing a Script inside an Actor alone does not parallelize it. `require()` can be called from parallel contexts only when the module itself is parallel-safe; most engine APIs and many modules are not.
- Tools have special execution contexts. HopperBins are deprecated/legacy and should not be used for new work.

Modern Roblox uses `BaseScript.RunContext` (`Legacy`, `Server`, `Client`, `Plugin`). `Legacy` exists only for backward compatibility and is location-dependent; prefer explicit `Server` or `Client` for new code. `RunContext` is set in Studio's Properties window and is read-only at runtime.

Always branch runtime authority with `RunService:IsServer()` and `IsClient()`. `IsStudio()` detects the environment (Studio vs. live), not runtime context, so use it only for test/development guards.

**Never** put datastore writes, economy, or authoritative gameplay logic anywhere a client can influence it directly.

## "Files" and Data in Luau/Roblox

Inside a running experience there is **no direct filesystem access** (security). You cannot open arbitrary files or write player-visible logs.

What you have instead:
- DataStores / MemoryStores for persistent or temporary "save data".
- ModuleScripts for reusable code (`require` works like a cached module system: a ModuleScript runs once and returns the same value on subsequent requires).
- HttpService:JSONEncode/Decode + web calls for external data exchange.
- In Studio: plugins have limited file APIs, and external tools (Rojo, Script Sync) can sync code from the filesystem, but experience scripts never have arbitrary filesystem access.

For complex data you often serialize tables to JSON strings for storage or transmission.

## Important Topics Often Missed

- **Attributes** — use `:SetAttribute`/`GetAttribute` for lightweight per-instance data; prefer them over legacy Value objects.
- **Random** — use the `Random` class (`Random.new(seed)`) for deterministic or independent random streams instead of global `math.randomseed`.
- **StreamingEnabled** — on the client, instances can stream in/out; always use `WaitForChild`/`Instance.StreamingMode` defensively and avoid hard references to far-away parts.
- **table utilities** — `table.create(n, value)`, `table.find(t, value)`, `table.clone(t)`, and `table.freeze(t)`/`table.isfrozen(t)` are the modern helpers.
- **BaseScript.Enabled** — disables/enables a script without deleting it.
- **ModuleScript caching** — `require` executes a ModuleScript once per environment and caches the returned value.
- **Sequence / physical types** — `NumberSequence`, `ColorSequence`, and `PhysicalProperties` are common Roblox datatypes for particles, beams, and part materials.

## Architecture Foundations

- Server authority is the default safe posture.
- Replication is selective and streaming-aware.
- Use ReplicatedStorage for shared modules/assets, ServerScriptService for server logic, StarterGui for client UI entry points.
- CollectionService tags + Attributes for lightweight grouping and data without heavy Instance hierarchies.
- Parallel Luau + Actors when you need CPU-bound work off the main thread.

This skill is the base. Load the specialized skills (datastores, UI, animation, vfx, gamepasses, networking, audio, open-cloud, teleport) on top of it.

## Scripts

- `scripts/ServiceHelper.lua` — small utilities for safely acquiring services and requiring modules with timeouts.

<!-- catalog:references:start -->
## Reference index

- [luau-data-types-and-serialization.md](references/luau-data-types-and-serialization.md)
- [script-locations-contexts-and-architecture.md](references/script-locations-contexts-and-architecture.md)
- [services-catalog-and-usage.md](references/services-catalog-and-usage.md)
<!-- catalog:references:end -->
