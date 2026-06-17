---
last_reviewed: 2026-06-17
---

# Performance Profiling

Official guide: https://create.roblox.com/docs/en-us/performance-optimization/identify

## Frame time goals

| FPS | Frame time |
| --- | --- |
| 30 | 33.33 ms |
| 60 | 16.67 ms |
| 120 | 8.33 ms |
| 240 | 4.17 ms |

Consistent frame times matter more than average FPS.

## Server heartbeat

Capped at 60 FPS. Check in Developer Console → Server Stats → Heartbeat → Steps Per Sec.
If below 60, use MicroProfiler on the server to find the bottleneck.

## Client frame rate

Use `Shift+F5` in-game for debug stats, or test on a real mobile device.
High-end PCs can hide performance problems due to thermal/power headroom.

## MicroProfiler colors

- **Orange** — worker thread bottleneck (scripts, physics, pathfinding, animations).
- **Blue** — render thread bottleneck (geometry, effects, UI).
- **Red** — GPU wait (complex geometry, large textures, overdrawing).

## Server profiling

1. Join a live or test game with edit permissions.
2. Open Developer Console (`F9`).
3. Switch to **MicroProfiler** tab.
4. Choose Server, set frames and delay.
5. Click **Begin server recording**.
6. Open the saved HTML dump.

## Common bottlenecks

| Area | Typical causes |
| --- | --- |
| Scripts | Loops every frame, unbatched datastore calls, expensive string/table ops |
| Physics | Too many unanchored parts, conflicting constraints, no sleep |
| Rendering | Too many transparent parts, particles, lights, high-poly meshes |
| Memory | Unloaded assets, leaked instances, growing tables |
| Network | Excessive remote traffic, large replication payloads |

## Optimization workflow

1. Measure with MicroProfiler/Scene Analysis.
2. Identify the biggest single cost.
3. Change one thing.
4. Re-measure.
5. Repeat.

## Mobile profiling

1. Open MicroProfiler on mobile from Settings.
2. Note the IP:port displayed.
3. On a dev machine on the same network, open that IP:port in a browser.
4. Capture frames and analyze in the web UI.

## Counters mode and flame graphs

The web MicroProfiler supports:
- **Flame graphs** — aggregated call stacks.
- **Diff flame graphs** — compare two dumps.
- **X-Ray memory** — highlight allocation-heavy frames.

Use these for regressions and long-term tracking.

## Memory snapshot comparison workflow

Use the Developer Console Memory tab and Scene Analysis to find leaks:

1. Enter a stable baseline state (e.g., standing in lobby with no UI open).
2. Capture snapshot A from Developer Console → Memory or Scene Analysis.
3. Perform the suspected leak action (open/close UI, spawn/despawn enemies).
4. Return to the baseline state.
5. Capture snapshot B.
6. Compare:
   - Total PlaceMemory
   - Luau heap by script
   - Instance counts by category
   - Unparented instances in Scene Analysis
7. Investigate categories that did not return to baseline.
