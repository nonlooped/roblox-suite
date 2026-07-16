---
last_reviewed: 2026-06-17
---

# Common Bugs and Fixes

## Script silently fails

Causes:
- Error before any output; check Developer Console for errors.
- Script in wrong context (server vs client).
- Event handler disconnected or never connected.
- Infinite yield from `WaitForChild` with no timeout.

Fixes:
- Use `instance:WaitForChild("Name", timeout)`.
- Add `print` at key points to trace execution.
- Check script `RunContext` and parent location.
- Use `xpcall` with `debug.traceback` at entry points to capture full stack traces.

## Data not saving

Causes:
- DataStore call from client/LocalScript.
- Non-serializable value (function, metatable, cycle, inf/nan).
- Missing `pcall` around call.
- Studio backend access disabled for a test experience, or enabled against production data.

Fixes:
- Always call DataStores from server `Script`.
- Test serialization with `HttpService:JSONEncode`.
- Wrap every call in `pcall`.
- Do not let Studio sessions access production backend data; use a separate test experience.

## Remote events not working

Causes:
- Handler on wrong side.
- Firing before handler is connected.
- Argument types differ from handler signature.
- Remote instance not replicated yet.

Fixes:
- Define Remotes in `ReplicatedStorage`.
- Connect handlers early.
- Validate argument count and types.

## Lag spikes

Causes:
- Pathfinding every frame.
- Updating UI every frame without throttling.
- Unbatched DataStore operations.
- Spawning many effects/instances at once.

Fixes:
- Throttle expensive work.
- Batch changes.
- Use object pools.
- Profile with MicroProfiler.

## Physics jitter

Causes:
- Conflicting constraints.
- Wrong network ownership.
- Assembly splits from anchoring.
- Parts fighting each other with forces.

Fixes:
- Visualize constraints and ownership.
- Assign vehicle ownership to driver.
- Anchor only root parts of assemblies.
- Tune force limits.

## Memory leaks

Causes:
- `Heartbeat`/`Stepped` connections not disconnected.
- Tables caching instances after removal.
- Animation/Sound objects not cleaned up.
- Circular references with metatables.

Fixes:
- Disconnect connections in cleanup functions.
- Use `Instance.Destroying` or `AncestryChanged` to trigger cleanup.
- Check Scene Analysis → Unparented instances.
- Compare Luau heap snapshots.

## UI not updating

Causes:
- Property change not replicating.
- Layout not recalculating.
- Wrong parent or ZIndex.
- LocalScript not running in expected context.

Fixes:
- Set properties from the correct side.
- Force layout updates with size/position changes.
- Check StarterGui → PlayerGui cloning.

## Pathfinding failures

Causes:
- Agent parameters incompatible with destination.
- Destination beyond 3,000 studs or vertical limits.
- Dynamic obstacle blocking path.
- Node budget exhausted in complex world.

Fixes:
- Validate parameters.
- Recompute on `path.Blocked`.
- Break long paths into segments.
- Simplify complex geometry.

## Leaked event connections

Causes:
- `Heartbeat`/`Stepped` connections never disconnected.
- One-shot connections left connected after firing.
- Cleanup code unreachable on error paths.

Fixes:
- Use a Maid/Janitor-style collector.
- Use `:Once()` for one-shot handlers.
- Disconnect in `Instance.Destroying` or `AncestryChanged` handlers.

## spawn/delay misuse

Causes:
- Legacy `spawn`/`delay`/`wait` resume unpredictably and can defer indefinitely.

Fixes:
- Replace `spawn(fn)` with `task.defer(fn)` or `task.spawn(fn)`.
- Replace `delay(t, fn)` with `task.delay(t, fn)`.
- Replace `wait(t)` with `task.wait(t)`.

## Log spam and leaked secrets

Causes:
- Printing every frame or every event.
- Logging raw player data, identifiers, or API keys.

Fixes:
- Rate-limit logs with a time gate or counter.
- Sanitize values before logging.
- Never commit secrets; load them from secure configuration.

## DataStore throttling and failures

Causes:
- Missing retry on transient errors.
- Calling DataStores from the client.
- Saving non-serializable values.

Fixes:
- Wrap calls with exponential backoff and jitter.
- Validate JSON serialization before saving.
- Always call DataStores from a server `Script`.

## Network ownership issues

Causes:
- Server simulating objects that a player should control.
- Frequent ownership changes.

Fixes:
- Use `BasePart:SetNetworkOwner(player)` for vehicles and held items.
- Visualize ownership in debug builds with `GetNetworkOwner()`.
- Minimize ownership churn.

## Memory snapshot comparison

For a repeatable leak-finding workflow, compare snapshots:

1. Capture a baseline in a stable state.
2. Perform the suspected leak action repeatedly.
3. Return to the stable state and capture again.
4. Compare PlaceMemory, Luau heap, and instance counts.
5. Check Scene Analysis → Unparented instances.
