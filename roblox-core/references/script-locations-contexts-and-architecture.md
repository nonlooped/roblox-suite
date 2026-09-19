---
read_when: "Decide where scripts run or debug loading and replication"
last_reviewed: 2026-06-17
---

# Script locations, execution contexts, and architecture

**Main source:** https://create.roblox.com/docs/en-us/scripting/locations
**Related:** https://create.roblox.com/docs/en-us/projects/client-server, https://create.roblox.com/docs/en-us/projects/data-model, https://create.roblox.com/docs/en-us/workspace/streaming, https://create.roblox.com/docs/en-us/scripting/multithreading

## Where code runs

- **ServerScriptService + Script**: Runs only on the server. Has full access to DataStoreService, TeleportService, etc. Never replicates to clients. Use `RunContext.Server`; the `Legacy` setting exists only for backward compatibility.
- **ReplicatedStorage**: Holds shared ModuleScripts and assets. A Script placed here only runs if its `RunContext` is explicitly `Client` or `Server`; it does **not** run by default. Put shared logic in ModuleScripts and require them from client/server scripts.
- **StarterGui + LocalScript**: Clones into each player's PlayerGui. Runs only on that client's machine. All UI logic belongs here or in required client modules.
- **ReplicatedFirst + LocalScript**: Runs as early as possible on the client (before most other content replicates). Use for loading screens and critical early code.
- **Actor + Script** (placed inside models): Can run Parallel Luau when the Script uses `RunContext.Client`/`Server`, the Actor is parented to the DataModel, and the code explicitly calls `task.desynchronize()` / `task.synchronize()` (or uses `ConnectParallel()`). Placing a Script inside an Actor alone does not parallelize it. `require()` can be called from parallel contexts only when the module itself is parallel-safe; most engine APIs and many modules are not.
- Tools have special execution contexts. HopperBins are deprecated/legacy and should not be used for new work.

Modern execution is controlled by `BaseScript.RunContext` (`Legacy`, `Server`, `Client`, `Plugin`). `Legacy` is location-dependent and exists only for backward compatibility; prefer explicit `Server`/`Client` for new code. `RunContext` is set in Studio's Properties window and is read-only at runtime.

## Context checking

Always use:

```lua
local RunService = game:GetService("RunService")

if RunService:IsServer() then
    -- authoritative logic
elseif RunService:IsClient() then
    -- UI, input, prediction, cosmetics
end
```

`IsStudio()` detects the environment (Studio vs. live), not runtime context. Use it only for test/development guards, never as a substitute for `IsServer`/`IsClient`.

## Recommended Folder structure

- **ServerScriptService**
  - DataManager
  - Economy
  - GamepassHandler
  - ServerMain (or multiple small scripts)

- **ReplicatedStorage**
  - Modules (pure functions, constants, types)
  - SharedAssets (animations, sounds, models that both sides need)
  - Remotes (folder containing all RemoteEvent/RemoteFunction)

- **StarterGui**
  - MainHUD (ScreenGui)
  - Menus (multiple ScreenGuis)
  - ClientControllers (LocalScripts or folders with required modules)

- **Workspace**
  - Map, interactive objects, etc.

- **ServerStorage**
  - Server-only assets and temporary data.

## Parallel Luau (Actors)

For CPU-heavy work that doesn't need to yield often:
1. Create an Actor instance.
2. Parent the Actor to the DataModel.
3. Put your Script inside the Actor and set its `RunContext` to `Client` or `Server`.
4. Use `task.desynchronize()` / `task.synchronize()` around the heavy work.

See the multithreading docs for details and limitations.

## Load order

Roblox does not guarantee load order. Always use:
- `WaitForChild`
- `FindFirstChild` + defensive checks
- Proper initialization events or module setup functions

## Script control

- `BaseScript.Enabled` can stop or start a Script/LocalScript without deleting it.
- A `ModuleScript` runs once per requiring environment and caches its returned value.

## Architecture summary

- Server = truth
- Client = presentation + input
- ReplicatedStorage = shared pure logic and assets
- Clear boundaries + consistent naming prevent most "why doesn't this replicate" and "why can the client do this" bugs.
