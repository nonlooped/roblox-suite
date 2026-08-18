---
last_reviewed: 2026-08-18
---

# TeleportOptions and TeleportAsyncResult

**Official sources:**
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportOptions
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportAsyncResult

## TeleportOptions

`Instance.new("TeleportOptions")` creates an options object you pass as the third argument to `TeleportService:TeleportAsync(placeId, players, options)`. If omitted, `TeleportAsync` returns no result.

### Properties

| Property | Type | Purpose |
| --- | --- | --- |
| `ServerInstanceId` | string | Target a specific server by its `JobId`. Conflicts with `ReservedServerAccessCode` and `ShouldReserveServer`. |
| `ReservedServerAccessCode` | string | Join an existing reserved server by its access code (from `ReserveServerAsync`). Conflicts with `ServerInstanceId` and `ShouldReserveServer`. |
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
- Can carry any serializable value (tables, strings, numbers, booleans).

## TeleportAsyncResult

Returned by `TeleportAsync` when a `TeleportOptions` is passed. Provides information about the final teleport destination — useful for confirming where a player ended up, especially when `ShouldReserveServer` was used (the destination is a fresh reserved server).

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