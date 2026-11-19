---
name: roblox-teleport
description: "Move Roblox players between places, public servers, or reserved servers. Use for TeleportAsync, matchmaking, loading screens, teleport failures, and persistent-data handoff."
last_reviewed: 2026-11-16
---

# roblox-teleport

> The November 2026 GUID routing migration is experimental pending a second human review and Studio integration tests. The public-routing and VIP purchase notes are experimental pending a second human review and published-experience verification. Existing v2 access-code records are not migrated; drain active sessions before adopting the helper's separate v3 store.

**Official sources:**
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportService
- https://create.roblox.com/docs/en-us/projects/teleport
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportOptions
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportAsyncResult
- https://create.roblox.com/docs/projects/teleport (multi-place architecture)

TeleportService moves players between places and servers. The modern entry point is `TeleportAsync` (server-only); the older `Teleport` (client), `TeleportPartyAsync`, `TeleportToPlaceInstance`, `TeleportToPrivateServer`, and `TeleportToSpawnByName` methods are **deprecated**. Use `TeleportAsync()` instead. For client-initiated teleports, fire a `RemoteEvent` to the server and let the server call `TeleportAsync()`; do not call `Teleport()` from the client for new work, even if the place is configured as "Fully Open." See the [migrate to secure teleports](https://create.roblox.com/docs/en-us/projects/teleport#migrate-to-secure-teleports) guide.

Cross-reference:
- [roblox-datastores/SKILL.md](../roblox-datastores/SKILL.md): handoff pattern for player data across teleports.
- [roblox-networking/SKILL.md](../roblox-networking/SKILL.md): server authority, rate limiting, and the security model around teleport requests.
- [roblox-core/SKILL.md](../roblox-core/SKILL.md): services and script contexts.

## Multi-place architecture

A **universe** (experience) can contain multiple **places**. Each place has its own `PlaceId`; the universe has a `UniverseId` (exposed as `game.GameId`). The **primary place** is the one players join from the Roblox app's main entry point.

- Create additional places in the Creator Dashboard under your experience → Places.
- Each place must be published and (for it to be joinable) visible/enabled.
- `game.PlaceId` is the current place; `game.GameId` is the universe ID (sometimes called UniverseId).
- Places in the same universe share DataStores, MemoryStores, and Asset permissions.
- Cross-universe (cross-experience) teleports are restricted by default. See "Cross-experience teleports" below.

## TeleportAsync (the modern method)

`TeleportService:TeleportAsync(placeId, players, teleportOptions?)` is the single unified method. It can teleport to a different place, a specific server, or a reserved server. **Server-only**. Calling from the client errors. `Teleport()` and the other legacy methods now carry a deprecation message directing you to `TeleportAsync()` (see [Teleport between places](https://create.roblox.com/docs/en-us/projects/teleport#migrate-to-secure-teleports)).

```lua
--!strict
local TeleportService = game:GetService("TeleportService")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")

local DESTINATION_PLACE_ID = 1234567890

local function teleportToPlace(player: Player)
    local options = Instance.new("TeleportOptions")
    -- options.ServerInstanceId = "..." -- to target a specific server
    -- options.ReservedServerId = HttpService:GenerateGUID(false) -- create a reserved destination
    options:SetTeleportData({ reason = "lobby_choice", mode = "classic" })

    local ok, result = pcall(function()
        return TeleportService:TeleportAsync(DESTINATION_PLACE_ID, { player }, options)
    end)
    if not ok then
        warn("TeleportAsync failed:", tostring(result))
        return false
    end
    -- Private destinations can return TeleportAsyncResult; success is not arrival.
    return true
end
```

### Group teleport limits

- Groups can only be teleported **within a single experience** (same universe).
- **Max 50 players** per `TeleportAsync` call.

### Conflicting TeleportOptions

Set at most one routing field: `ServerInstanceId`, `ReservedServerId`, `VipServerId`, `ForcePublicServer` (when true), or either legacy field (`ReservedServerAccessCode`, `ShouldReserveServer`). Combining them errors.

## TeleportOptions

| Property | Purpose |
| --- | --- |
| `ServerInstanceId` | Target a specific server by `JobId`. |
| `ReservedServerId` | A server-generated GUID; first use creates a reserved server, reuse targets the same destination. |
| `VipServerId` | Target a player-purchased VIP server by its `PrivateServerId`, within that VIP server's experience. |
| `ForcePublicServer` (bool) | Force a public destination for this teleport instead of letting the engine infer a VIP return. |
| `SetTeleportData(data)` / `GetTeleportData()` | Pass non-sensitive hints to the destination. |

Legacy `ReservedServerAccessCode` and `ShouldReserveServer` are deprecated. Replace `ReserveServerAsync` with `HttpService:GenerateGUID(false)` for new work. Existing access-code servers remain compatible; do not reinterpret stored access codes as new IDs.

## TeleportAsyncResult and failures

With options and a VIP or reserved destination, `TeleportAsync` can return destination information, not proof of arrival. `PrivateServerId` identifies a reserved or VIP destination; `ReservedServerAccessCode` is populated only for legacy routing. Track arrival separately on the destination server.

Wrap `TeleportAsync` in `pcall` and handle `TeleportInitFailed` for failures after initiation. Its arguments are player, `Enum.TeleportResult`, message, place ID, and options. Retry only suitable failures with bounded backoff and the same destination ID. VIP access is checked for each player, so a group can partially fail.

## Reserved and VIP servers

Generate a GUID on the server, atomically publish it with `UpdateAsync`, and use the winning `ReservedServerId` for every member of a match. See [matchmaking](references/matchmaking.md) and the experimental helper for allocation races and ambiguous writes.

For VIP servers, set `VipServerId` to the target VIP server's `PrivateServerId`. Carry the origin VIP ID separately when returning from a reserved match; the match's own `PrivateServerId` is not the origin VIP ID. Validate requests server-side. With no routing field set, a single-player teleport can infer a return to a VIP server the player originally joined. `ForcePublicServer = true` bypasses that inference for this teleport only; it defaults to `false` and does not clear VIP context for later teleports.

For a purchase prompt, [`MarketplaceService:PromptVIPServerPurchase(player)`](https://create.roblox.com/docs/en-us/reference/engine/classes/MarketplaceService#PromptVIPServerPurchase) prompts for a VIP server in the current experience. It returns immediately without a purchase result and does not route anyone. Verify availability in a published test experience.

In production, a reserved server has `game.PrivateServerId ~= ""` and `game.PrivateServerOwnerId == 0`. Its ID stays constant across restarts; `JobId` identifies one running instance. Cross-play settings can split players across instances sharing a private server ID.

## Passing data across teleports

Two mechanisms, with different security profiles:

### `TeleportOptions:SetTeleportData` / `GetLocalPlayerTeleportData`

Set on the source server (via `TeleportOptions`), retrieved on the destination client via `TeleportService:GetLocalPlayerTeleportData()`. **Client-only retrieval.** Can carry any serializable value.

**Security:** exploiters can spoof teleport data. Send sensitive data (currency, entitlements) through `DataStoreService` instead, and use teleport data only for non-sensitive hints (selected game mode, cosmetic loadout preference).

### `SetTeleportSetting` / `GetTeleportSetting`

Client-only, stored locally, preserved across teleports within the same game. Good for client-side preferences (crouch state, UI tab) that don't need server trust. Also spoofable. Use server-side validation for anything that affects gameplay.

## Custom loading screen

`TeleportService:SetTeleportGui(gui)` (client) sets a `ScreenGui` shown during teleport. `TeleportService:GetArrivingTeleportGui()` (client, at the destination) retrieves it so you can parent it to `PlayerGui` and run your own transition. The teleport GUI does **not** cross into a different game (universe), and does not persist across multiple teleports. Set it before each one.

```lua
--!strict
-- At the destination, in ReplicatedFirst
local TeleportService = game:GetService("TeleportService")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local ReplicatedFirst = game:GetService("ReplicatedFirst")

local customLoadingScreen = TeleportService:GetArrivingTeleportGui()
if customLoadingScreen then
    local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui")
    ReplicatedFirst:RemoveDefaultLoadingScreen()
    customLoadingScreen.Parent = playerGui
    task.wait(5)
    customLoadingScreen:Destroy()
end
```

## Cross-experience teleports

Teleporting from your experience to **another experience owned by others fails by default**. To enable cross-experience teleportation, follow the steps in the official [Teleport between places](https://create.roblox.com/docs/en-us/projects/teleport#enable-cross-experience-teleportation) doc. Within your own universe (cross-place), teleports work without extra setup.

`TeleportService:PromptExperienceDetailsAsync(player, universeId)` (client-only, yields) prompts the player with experience details and a Join button. If the player is ineligible to join the target experience, the button is disabled. The join button is always disabled during Studio playtesting.

## Matchmaking patterns

### Pattern 1: lobby → match (simple round-robin)

A lobby place collects players; when enough are ready, `TeleportAsync` sends them to a game place. Use `MessagingService` to coordinate across lobby servers if you have multiple lobbies.

### Pattern 2: reserved server per match

For instanced dungeons or private matches: generate a GUID on the server → atomically persist the winning ID in a DataStore keyed by match ID → initiate the party teleport with `ReservedServerId` → confirm arrival separately on the destination server.

### Pattern 3: server browser via MemoryStoreService

Maintain a `MemoryStoreService` sorted map of active servers (keyed by `JobId`, value = player count / mode / ping). The lobby lists entries; when a player picks one, `TeleportOptions.ServerInstanceId = jobId` and `TeleportAsync`. Update the sorted map from each game server on join/leave. This scales better than `MessagingService` for many servers.

### Pattern 4: external matchmaking service

For complex matchmaking (skill-based, party queues), use an external HTTP service as the matchmaker. It returns a `placeId` + `JobId` or a server-generated reserved-server GUID; the lobby then `TeleportAsync`s the party. See roblox-networking for the `HttpService` security model and roblox-open-cloud for in-experience Open Cloud calls.

All matchmaking must respect the **50-player-per-`TeleportAsync`** limit; split larger groups into multiple calls.

## DataStore handoff across teleports

To move player state between places:

1. **Source server:** on the triggering event, save the player's profile via `UpdateAsync` (see roblox-datastores). Then teleport.
2. **Destination server:** on `PlayerAdded`, load the profile via `GetAsync` (consider `UseCache=false` for a fresh read if the save was recent).
3. **Race condition:** if the save hasn't flushed by the time the destination loads, you'll get stale data. Mitigate by: (a) awaiting save confirmation before teleporting when the data is critical, or (b) passing a "load this version" hint in teleport data and retrying the load until it matches.
4. **Never trust teleport data for the authoritative state.** Teleport data is a hint; the DataStore is the truth.

## Security

- **`TeleportAsync` is server-only.** The client cannot call it directly. If you need client-initiated teleports, the client sends a RemoteEvent and the server validates then calls `TeleportAsync`. The legacy client method `Teleport()` is now deprecated (use `TeleportAsync()` on the server); see the migration guide above.
- **Rate-limit teleport requests** per player. A hostile client spamming "teleport me" Remotes can disrupt your server flow and burn DataStore budget if you save on each trigger.
- **Validate the destination.** Don't let a client-supplied place ID drive the teleport unsanitized. Whitelist allowed destinations server-side.
- **Teleport data is spoofable.** Treat it as a hint; re-validate any gameplay-affecting claim on the destination server against DataStores.
- **`GetLocalPlayerTeleportData` is client-only** and returns client-controlled data. Don't use it for authoritative decisions on the server.

## Studio testing

`TeleportAsync` supports Studio **Test** and **Team Test**, including MCP playtest automation, without publishing. Destinations open as new test servers. Only places in the starting experience are supported.

- In Test, `PrivateServerId` and `JobId` are empty. In Team Test, every server is private, including public destinations.
- Team Test may give a destination `PrivateServerId` different from the supplied `ReservedServerId`; reuse the original reserved ID for subsequent joins.
- `VipServerId` teleports and `GetPlayerPlaceInstanceAsync` do not work in testing. Deprecated teleport methods are unsupported.
- Check VIP access, cross-experience behavior, and production server identity in a published test experience.

Source: https://create.roblox.com/docs/en-us/projects/teleport#test-teleports-in-studio

## Gotchas

- Players lose character state across teleports (new place = new character). Save/load via DataStores; don't try to carry live character state.
- `BindToClose` on the source server can race with the teleport. Finish saves before triggering teleports when data is critical.
- The default teleport loading message was removed; `CustomizedTeleportUI` is deprecated and does nothing.
- Cross-platform (Xbox/PS with cross-play off) can split a reserved server into multiple servers with the same `PrivateServerId`.
- Group teleports are universe-only; you cannot `TeleportAsync` a group across experiences.
- The 50-player limit is per call. Larger groups need multiple calls, and ordering matters for "arrive together" semantics.
- Follow-friend: `Players.PlayerAdded` → check `player.FollowUserId` → `GetPlayerPlaceInstanceAsync(followId)` → `TeleportAsync` with `ServerInstanceId`. Note `GetPlayerPlaceInstanceAsync` returns `JobId`, not the reserved-server access code, so it won't work to follow a friend into a reserved server.

## Scripts

- `scripts/TeleportHelper.lua`: an experimental server-side example with atomic reserved-ID publication, expiry, ambiguous-allocation reconciliation, and separate `teleporting`/`arrived` states.

## How to proceed

1. Decide your place architecture: primary place + sub-places in one universe.
2. For cross-place teleports, use `TeleportAsync` (server) + `TeleportOptions`.
3. For reserved servers, generate a candidate GUID and publish it through `UpdateAsync`; use whichever allocation wins. Track teleport initiation separately from destination arrival.
4. Pass non-sensitive hints via teleport data; pass authoritative state via DataStores.
5. Connect `TeleportInitFailed` for retry UI.
6. Validate and rate-limit any client-initiated teleport Remote.
7. Test `TeleportAsync` in Studio, then verify production-specific behavior in a published test experience.

<!-- catalog:references:start -->
## Reference index

- [matchmaking.md](references/matchmaking.md): Coordinate lobbies, reserved servers, allocation races, or player-data handoff.
- [teleport-options.md](references/teleport-options.md): Select a destination server or inspect a teleport result.
<!-- catalog:references:end -->
