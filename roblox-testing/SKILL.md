---
name: roblox-testing
description: Testing, debugging, and profiling Roblox experiences — Developer Console, Output, logging discipline, pcall and assertion patterns, TestEZ unit tests, the MicroProfiler (client and server), Scene Analysis, Script Profiler, memory diagnostics, network debugging, Luau type checking, and connection cleanup. Use when something is broken, slow, or unreliable, or when setting up test workflows.
---

# roblox-testing

**Official sources (always check these for the latest):**
- https://create.roblox.com/docs/en-us/studio/developer-console
- https://create.roblox.com/docs/en-us/performance-optimization/identify
- https://create.roblox.com/docs/en-us/performance-optimization/microprofiler
- https://create.roblox.com/docs/en-us/performance-optimization/scene-analysis
- https://create.roblox.com/docs/en-us/studio/optimization/memory-usage
- https://create.roblox.com/docs/en-us/studio/optimization/scriptprofiler

This skill is about finding and fixing problems, not just writing code. It focuses on the tools and habits that separate working experiences from broken ones.

## When to use this skill

Activate when:
- Something is not behaving as expected (scripts, UI, physics, data, networking).
- Frame rate, memory, or server heartbeat is degrading.
- Setting up unit tests or reproducible test cases.
- Trying to isolate whether a bug is on the client or server.
- Debugging a live issue using the Developer Console.

Cross-reference:
- [roblox-core/SKILL.md](../roblox-core/SKILL.md) for services and script contexts.
- [roblox-networking/SKILL.md](../roblox-networking/SKILL.md) for debugging remote flows and network ownership.
- [roblox-datastores/SKILL.md](../roblox-datastores/SKILL.md) for DataStore retry patterns and debugging data store errors.
- [roblox-physics/SKILL.md](../roblox-physics/SKILL.md) for debugging physics ownership and sleep.
- [roblox-npcs/SKILL.md](../roblox-npcs/SKILL.md) for debugging NPC behavior.

## The debugging mindset

1. **Reproduce it.** If you can't reproduce it, you can't fix it.
2. **Isolate it.** Remove systems until the bug disappears; the last thing removed is the cause.
3. **Measure it.** Use tools instead of guessing.
4. **Fix one thing at a time.** Verify the fix and add a regression test if possible.
5. **Log defensively.** Good logs make future debugging faster.

## Logging discipline

Use `print`, `warn`, and `error` deliberately:
- `print` for normal diagnostics.
- `warn` for recoverable problems you should notice.
- `error` for programming errors that should stop execution.

Include context in log messages:

```lua
warn(string.format("[DataStore] Save failed for %d: %s", userId, tostring(err)))
```

Avoid logging secrets, player data, or PII.

## pcall and assertions

Wrap fallible calls, especially cloud services, HTTP, DataStores, Marketplace:

```lua
local ok, result = pcall(function()
    return someService:DoSomething()
end)
if not ok then
    warn("DoSomething failed:", result)
end
```

Use `assert` for internal invariants that should never fail:

```lua
assert(config.MaxSpeed > 0, "MaxSpeed must be positive")
```

## Developer Console

Open with `F9` in-game or in Studio play mode.

Tabs:
- **Log** — client/server output, errors, warnings.
- **Memory** — categorized memory usage.
- **Network** — HTTP and service requests.
- **Server Stats** — heartbeat, ping, data ping.
- **Script Profiler** — record script CPU usage.
- **MicroProfiler** — capture server dumps.

Toggle Client/Server views to see which side emitted output.

## Unit testing with TestEZ

The standard Roblox testing framework is [TestEZ](https://github.com/Roblox/testez). It supports nested `describe`/`it` blocks, lifecycle hooks, async tests, and a rich matcher API.

TestEZ example:

```lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TestEZ = require(ReplicatedStorage.DevPackages.TestEZ)

local MathUtils = require(ReplicatedStorage.MathUtils)

describe("MathUtils", function()
    it("clamps values", function()
        expect(MathUtils.clamp(5, 0, 10)).to.equal(5)
        expect(MathUtils.clamp(-1, 0, 10)).to.equal(0)
        expect(MathUtils.clamp(11, 0, 10)).to.equal(10)
    end)
end)

TestEZ.TestBootstrap:run({ game.ReplicatedStorage.Tests })
```

For legacy in-Studio tests, `TestService:Error(msg)` can mark failures visibly in Studio output, but most projects should prefer TestEZ. The scripts folder contains a minimal `TestRunner.lua` shim only for environments where TestEZ is unavailable.

## Luau type checking

Use the [Luau language server](https://luau.org/) (`luau-lsp`) or the Luau type checker in Studio to catch errors before runtime.

Best practices:
- Add type annotations to module exports and pure functions.
- Run `luau-lsp analyze` in CI or before committing.
- Enable `--!strict` for new modules.
- Do not over-type untyped engine APIs; prefer casts at boundaries.

## Studio Debugger

Use Studio's built-in debugger for step-through debugging:
- Set breakpoints by clicking the gutter next to a line number.
- Run in **Play** mode and use the debugger controls to step over, into, or out.
- Inspect the call stack, local variables, and upvalues in the debugger panel.
- The debugger works in both client and server contexts when Studio runs both.

## xpcall and debug.traceback

Use `xpcall` with `debug.traceback` to capture full stack traces from failures:

```lua
local ok, err = xpcall(function()
    riskyOperation()
end, debug.traceback)
if not ok then
    warn(err)
end
```

This is especially useful at top-level entry points, scheduled callbacks, and connection handlers where `pcall` alone discards the stack.

## Connection cleanup

Leaked `RBXScriptConnection` objects are a common source of memory leaks and stale state. Prefer explicit cleanup patterns:

- Use a Maid/Janitor-style collector:

```lua
local Maid = require(path.to.Maid)
local maid = Maid.new()

maid:GiveTask(workspace.ChildAdded:Connect(onChild))
maid:GiveTask(RunService.Heartbeat:Connect(onStep))

maid:Destroy() -- disconnects everything
```

- Use `:Once()` for one-shot event handlers.
- Use `Instance.Destroying` to trigger cleanup when an instance is removed:

```lua
obj.Destroying:Connect(function()
    cleanup()
end)
```

- Always pair `:Connect()` with a matching `:Disconnect()` or destruction.

## Prefer task over spawn/delay

The `task` library is more predictable than legacy `spawn`, `delay`, and `wait`:

```lua
-- good
task.wait(1)
task.delay(1, callback)
task.spawn(coroutineOrFn)

-- avoid
spawn(callback)
delay(1, callback)
wait(1)
```

`task.defer` is useful for yielding to the next resumption cycle without opening a new thread.

## Log rate limiting and secrets hygiene

- Never log secrets, keys, user identifiers, or personal information.
- Sanitize values before logging:

```lua
local function sanitize(value)
    if typeof(value) == "Instance" and value:IsA("Player") then
        return "Player(" .. tostring(value.UserId) .. ")"
    end
    return value
end
```

- Rate-limit noisy logs to avoid flooding the console and network:

```lua
local lastLog = 0
local function throttledLog(message)
    local now = os.clock()
    if now - lastLog > 5 then
        lastLog = now
        warn(message)
    end
end
```

## Network ownership

Incorrect network ownership causes jittery physics and replication lag. Visualize ownership and assign it explicitly:

```lua
-- Server
part:SetNetworkOwner(player)

-- Client-side visualization (debug only)
local ownershipLabel -- create BillboardGui or use DebugDraw
```

Use `BasePart:GetNetworkOwner()` to inspect ownership. Vehicles and held items should usually be owned by the controlling player.

## DataStore retry pattern

Wrap DataStore calls with exponential backoff and jitter:

```lua
local function dataStoreWithRetry(fn, maxAttempts)
    maxAttempts = maxAttempts or 5
    for attempt = 1, maxAttempts do
        local ok, result = pcall(fn)
        if ok then
            return true, result
        elseif attempt == maxAttempts then
            return false, result
        else
            warn("DataStore attempt " .. attempt .. " failed; retrying...")
            task.wait(2 ^ attempt * 0.1 + math.random() * 0.5)
        end
    end
end
```

Always call DataStores from the server and validate serialization before saving.

## Memory snapshot comparison

Use the Developer Console Memory tab or Scene Analysis to compare snapshots:

1. Capture a baseline snapshot in a stable state.
2. Play through the action that may leak (spawn/despawn enemies, open/close UI).
3. Return to the stable state and capture a second snapshot.
4. Compare PlaceMemory, Luau heap, and instance counts.
5. Investigate categories that did not return to baseline; look for unparented instances in Scene Analysis.

## MicroProfiler

Open with `Ctrl+F6` (`⌘+F6`) in Studio or the desktop client.

Use it to:
- Find frame-time spikes.
- Identify whether a bottleneck is script compute, physics, or rendering.
- Capture server dumps from the Developer Console.
- Add custom labels with `debug.profilebegin`/`debug.profileend`.

Key colors:
- **Orange** — worker thread (scripts, physics, animations) bottleneck.
- **Blue** — render thread bottleneck.
- **Red** — GPU wait / render complexity.

## Scene Analysis

Available in Studio under **Window → Performance Summary → Scene Analysis**.

Views:
- **Script memory** — per-script Luau heap.
- **Unparented instances** — potential memory leaks held by scripts.
- **Instance composition** — counts by category.
- **Audio/Animation memory** — asset memory usage.
- **Triangle composition** — draw call breakdown.

Scene Analysis is a Studio UI tool; there is no public `SceneAnalysisService` API.

## Script Profiler

Records CPU time per script. Use it when MicroProfiler points to scripts but you need to know which script.

## Common bug categories

| Symptom | Likely causes |
| --- | --- |
| Script silently fails | Missing `pcall`, error swallowed, wrong script context |
| Data not saving | DataStore called from client, non-serializable value, no `pcall` |
| Remote not working | Wrong side, handler not connected, argument mismatch |
| Lag spikes | Pathfinding every frame, too many particles, unbatched loops |
| Physics jitter | Wrong network ownership, assembly splits, conflicting constraints |
| NPCs stuck | Blocked path not recomputed, bad agent params, streaming issues |
| UI doesn't update | Property not replicated, wrong parent, layout order |
| Memory grows forever | Leaked connections, unparented instances, cached assets |

## Network debugging

- Check **Network** tab in Developer Console for HTTP/DataStore failures.
- Use `Shift+F3` in-game for network debug stats.
- Distinguish network ping (round-trip time) from data ping (replication queue).
- Simulate latency/jitter with Studio Network Simulation (`Alt+S`).

## Load time debugging

Measure load time:

```lua
local start = os.clock()
game.Loaded:Connect(function()
    print("Loaded in", os.clock() - start)
end)
```

Enable **Print Join Size Breakdown** in Studio Settings → Network to see the largest replicated instances.

## Scripts

- `scripts/TestRunner.lua` — a minimal TestEZ fallback with nested suites, lifecycle hooks, matchers, async support, and TestService integration.
- `scripts/Logger.lua` — a structured logger with level filtering and guarded formatting.
- `scripts/DebugDraw.lua` — utility for drawing rays, points, and boxes in 3D for visual debugging.

## How to proceed

1. Reproduce the issue reliably.
2. Check logs and errors in the Developer Console.
3. Determine client vs server scope.
4. Use MicroProfiler/Script Profiler for performance issues.
5. Use Scene Analysis for memory leaks and scene composition.
6. Add targeted logging or tests to confirm the fix.
7. Verify on low-end devices and with network simulation when relevant.
8. Compare memory snapshots before and after suspected leaks.
