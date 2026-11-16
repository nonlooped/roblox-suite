---
read_when: "Select a destination server or inspect a teleport result"
last_reviewed: 2026-11-16
---

# TeleportOptions and TeleportAsyncResult

> The November 2026 GUID routing migration is experimental pending a second human review and Studio integration tests.

> The September 2026 teleport value-type, GUI-reference, and arrival-confirmation corrections are experimental guidance pending a second human review. Test cross-place behavior in a published test experience.

**Official sources:**
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportOptions
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportAsyncResult

## TeleportOptions

`Instance.new("TeleportOptions")` creates an options object you pass as the third argument to `TeleportService:TeleportAsync(placeId, players, options)`. The class reference documents a `TeleportAsyncResult` for VIP or reserved destinations when options are supplied; do not assume every public teleport returns one.

### Properties

| Property | Type | Purpose |
| --- | --- | --- |
| `ServerInstanceId` | string | Target a running server by `JobId`. |
| `ReservedServerId` | string | Server-generated GUID; first use creates a reserved server, reuse routes to it. |
| `VipServerId` | string | Target a player-purchased VIP server by `PrivateServerId` in its owning experience. |

`ReservedServerAccessCode` and `ShouldReserveServer` are deprecated legacy fields. Use `HttpService:GenerateGUID(false)` and `ReservedServerId` for new work. Existing access-code servers continue to work; a stored legacy code is not a new GUID allocation.

### Methods

| Method | Purpose |
| --- | --- |
| `SetTeleportData(data: Variant)` | Pass data to the destination. Retrieved via `GetLocalPlayerTeleportData()` on the destination client. |
| `GetTeleportData(): Variant` | Read back what was set; returns the data previously stored by `SetTeleportData()`, or `nil` if no data was set. |

### Routing conflicts

Set at most one of `ServerInstanceId`, `ReservedServerId`, `VipServerId`, `ReservedServerAccessCode`, or `ShouldReserveServer`. With none set, the engine can choose a public server or a VIP server the player recently joined.

### Teleport data rules

- Client-retrieved via `TeleportService:GetLocalPlayerTeleportData()`: **client-only**.
- **Spoofable.** Treat as a hint; validate gameplay-affecting claims server-side against DataStores.
- Supports primitives and engine value types such as `Vector3`, `CFrame`, `Color3`, `UDim2`, sequences, and enum items, including tables/arrays of supported values without mixed keys.
- Instances, functions, connections, signals, `SharedTable`, and engine-state objects such as `RaycastParams`/`RaycastResult` cannot cross this boundary. Roblox removes disallowed values and logs an error. Convert references to plain IDs or paths.
- `SetTeleportSetting` uses the same value-only restriction. A custom teleport GUI preserves references inside its own tree, but references to instances outside that tree are cleared; include required dependencies in the GUI tree.

## TeleportAsyncResult

Returned by `TeleportAsync` for a VIP or reserved destination when options are passed. Describes the selected destination, including a reserved or VIP server. It does not prove that the player arrived; observe arrival separately in the destination server.

`PrivateServerId` identifies the selected private destination. `ReservedServerAccessCode` is populated only for legacy access-code teleports, not GUID or VIP routing.

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
options.ReservedServerId = game:GetService("HttpService"):GenerateGUID(false)
options:SetTeleportData({ matchId = "abc123" })
local result = TeleportService:TeleportAsync(DESTINATION_PLACE_ID, party, options)
-- result carries info about the newly created reserved server
```

### Join an existing reserved server

```lua
local options = Instance.new("TeleportOptions")
options.ReservedServerId = savedReservedServerId
TeleportService:TeleportAsync(PLACE_ID, { player }, options)
```

## Sources

- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportOptions
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportAsyncResult
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportService
