# Debugging Tools

Official guides:
- https://create.roblox.com/docs/en-us/studio/developer-console
- https://create.roblox.com/docs/en-us/performance-optimization/microprofiler
- https://create.roblox.com/docs/en-us/performance-optimization/scene-analysis

## Developer Console

Shortcuts:
- `F9` — open console.
- `/console` — in chat.

### Log tab

Filter by Output, Information, Warning, Error.
Toggle Client/Server to see which side produced output.

### Memory tab

- **PlaceMemory** — breakdown by assets and engine systems.
- **Luau heap** — detailed script allocation snapshots.

### Network tab

- Summary of HTTP and service requests.
- Per-request status, time, URL, response.

### Server Stats tab

- Heartbeat steps per second.
- Average ping/data ping.

## Output window

Studio-only output. Shows print/warn/error from edit-mode scripts.

## MicroProfiler

Shortcuts:
- `Ctrl+F6` (`⌘+F6`) — open.
- `Ctrl+P` (`⌘+P`) — pause.

Workflow:
1. Identify a frame-time spike.
2. Zoom into the timeline.
3. Find the widest task bar.
4. Cross-reference with the tag table.
5. Add `debug.profilebegin`/`debug.profileend` around suspicious script code.

Custom profiling:

```lua
debug.profilebegin("HeavyLoop")
-- expensive work
debug.profileend()
```

## Scene Analysis

Available in Studio under **Window → Performance Summary → Scene Analysis**.

Useful views:
- **Script memory** — which scripts allocate the most.
- **Unparented instances** — references held by scripts after instances are removed.
- **Instance composition** — total instance counts.
- **Audio/Animation memory** — asset retention.
- **Triangle composition** — rendering cost breakdown.

Scene Analysis is a Studio UI tool only; there is no public runtime API for it.

## Script Profiler

Records per-script CPU cost. Good for finding expensive scripts without manual labeling.

## Network simulation

Studio: `Alt+S` or **Test → Network Simulation**.

Simulate latency, jitter, and packet loss to reproduce multiplayer issues locally.

## Testing modes

- **Play** — local client+server.
- **Play Here** — spawn at camera.
- **Multi-client simulation** — test ownership and replication with multiple local players.

## Studio Debugger

Use Studio's built-in debugger for step-through debugging:
- Set breakpoints by clicking the gutter next to a line number.
- Run in **Play** mode and use the debugger controls to step over, into, or out.
- Inspect the call stack, local variables, and upvalues in the debugger panel.
- The debugger works in both client and server contexts when Studio runs both.

## Luau type checking

Use the Luau language server (`luau-lsp`) or Studio's Luau type checker to catch errors before runtime.

- Add type annotations to module exports and pure functions.
- Enable `--!strict` for new modules.
- Run `luau-lsp analyze` in CI when available.

## xpcall and debug.traceback

Use `xpcall` with `debug.traceback` to capture full stack traces from failures:

```lua
local ok, err = xpcall(riskyOperation, debug.traceback)
if not ok then
    warn(err)
end
```

Prefer `xpcall` at top-level entry points, scheduled callbacks, and connection handlers.

## Visual debugging

Use `DebugDraw` (see scripts) or temporary `Part` instances to visualize:
- Raycast hits
- Hitboxes
- Path waypoints
- Sensor ranges
- Network ownership boundaries

Always clean up debug visuals in production.
