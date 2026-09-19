---
last_reviewed: 2026-08-18
---

# TeleportOptions and TeleportAsyncResult

> The September 2026 teleport value-type, GUI-reference, and arrival-confirmation corrections are experimental guidance pending a second human review. Test cross-place behavior in a published test experience.

**Official sources:**
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportOptions
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportAsyncResult

## TeleportOptions

`Instance.new("TeleportOptions")` creates an options object you pass as the third argument to `TeleportService:TeleportAsync(placeId, players, options)`. If omitted, `TeleportAsync` returns no result.

### Properties

| Property | Type | Purpose |
| --- | --- | --- |
| `ServerInstanceId` | string | Target a specific server by its `JobId`. Conflicts with `ReservedServerAccessCode` and `ShouldReserveServer`. |
| `ReservedServerAccessCode` | string | Join an existing reserved server by its access code (from `ReserveServerAsync` or `TeleportAsyncResult.ReservedServerAccessCode`). Conflicts with `ServerInstanceId` and `ShouldReserveServer`. |
| `ShouldReserveServer` | boolean | Create a new reserved server and teleport the players into it. Conflicts with `ServerInstanceId` and `ReservedServerAccessCode`. |

### Methods

| Method | Purpose |
| --- | --- |
| `SetTeleportData(data: Variant)` | Pass data to the destination. Retrieved via `GetLocalPlayerTeleportData()` on the destination client. |
| `GetTeleportData(): Variant` | Read back what was set — returns the data previously stored by `SetTeleportData()`, or `nil` if no data was set. |

### Conflicting combinations (error)

- `ReservedServerAccessCode` + `ServerInstanceId`
- `ShouldReserveServer` + `ServerInstanceId`
- `ShouldReserveServer` + `ReservedServerAccessCode`

Pick exactly one mode: public server (neither), specific server (`ServerInstanceId`), existing reserved (`ReservedServerAccessCode`), or new reserved (`ShouldReserveServer`).

### Teleport data rules

- Client-retrieved via `TeleportService:GetLocalPlayerTeleportData()` — **client-only**.
- **Spoofable.** Treat as a hint; validate gameplay-affecting claims server-side against DataStores.
- Supports primitives and engine value types such as `Vector3`, `CFrame`, `Color3`, `UDim2`, sequences, and enum items, including tables/arrays of supported values without mixed keys.
- Instances, functions, connections, signals, `SharedTable`, and engine-state objects such as `RaycastParams`/`RaycastResult` cannot cross this boundary. Roblox removes disallowed values and logs an error. Convert references to plain IDs or paths.
- `SetTeleportSetting` uses the same value-only restriction. A custom teleport GUI preserves references inside its own tree, but references to instances outside that tree are cleared; include required dependencies in the GUI tree.

## TeleportAsyncResult

Returned by `TeleportAsync` when a `TeleportOptions` is passed. Describes the selected destination, including a newly reserved server when `ShouldReserveServer` is used. It does not prove that the player arrived; observe arrival separately in the destination server.

Inspect its properties per the class reference; typical fields include the destination place ID and instance/access-code identifiers.

## Common patterns

### Teleport to a specific existing server

```lua
local options = Instance.new("TeleportOptions")
options.ServerInstanceId = targetJobId
options:SetTeleportData({ reason = "join_friend" })
TeleportService:TeleportAsync(DESTINATION_PLACE_ID, { player }, options)
```

### Create a new reserved server and teleport in

```lua
local options = Instance.new("TeleportOptions")
options.ShouldReserveServer = true
options:SetTeleportData({ matchId = "abc123" })
local result = TeleportService:TeleportAsync(DESTINATION_PLACE_ID, party, options)
-- result carries info about the newly created reserved server
```

### Join an existing reserved server

```lua
local options = Instance.new("TeleportOptions")
options.ReservedServerAccessCode = savedAccessCode
TeleportService:TeleportAsync(PLACE_ID, { player }, options)
```

## Sources

- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportOptions
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportAsyncResult
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportService