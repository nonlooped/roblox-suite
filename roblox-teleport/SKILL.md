---
name: roblox-teleport
description: "Roblox TeleportService and multi-place architecture — the modern TeleportAsync API that replaces deprecated Teleport/TeleportPartyAsync/TeleportToPrivateServer variants. Covers TeleportOptions, reserved servers via ReserveServerAsync, the 50-player group limit, cross-experience restrictions, teleport data (and its client-spoofable security caveat), custom loading screens, DataStore handoff, and matchmaking with MessagingService/MemoryStoreService. Use whenever moving players between places, servers, or reserved servers."
last_reviewed: 2026-07-16
---

# roblox-teleport

**Official sources (always check these for the latest):**
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportService
- https://create.roblox.com/docs/en-us/projects/teleport
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportOptions
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportAsyncResult
- https://create.roblox.com/docs/projects/teleport (multi-place architecture)

TeleportService moves players between places and servers. The modern entry point is `TeleportAsync`; the older `Teleport`/`TeleportPartyAsync`/`TeleportToPlaceInstance`/`TeleportToPrivateServer`/`TeleportToSpawnByName` methods are deprecated and should not be used for new work.

Cross-reference:
- [roblox-datastores/SKILL.md](../roblox-datastores/SKILL.md) — handoff pattern for player data across teleports.
- [roblox-networking/SKILL.md](../roblox-networking/SKILL.md) — server authority, rate limiting, and the security model around teleport requests.
- [roblox-core/SKILL.md](../roblox-core/SKILL.md) — services and script contexts.

## When to use this skill

Activate when:
- Moving players between places in a universe (lobby → game world → dungeon).
- Building reserved/private servers (VIP servers, instanced dungeons, matchmaking rooms).
- Implementing matchmaking (server browser, party join, follow-friend).
- Passing data across teleports (lobby selection → game server).
- Building a custom teleport loading screen.
- Debugging teleport failures (`TeleportInitFailed`).

## Multi-place architecture

A **universe** (experience) can contain multiple **places**. Each place has its own `PlaceId`; the universe has a `UniverseId` (exposed as `game.GameId`). One place is the **primary place** — the one players join from the Roblox app's main entry point.

- Create additional places in the Creator Dashboard under your experience → Places.
- Each place must be published and (for it to be joinable) visible/enabled.
- `game.PlaceId` is the current place; `game.GameId` is the universe ID (sometimes called UniverseId).
- Places in the same universe share DataStores, MemoryStores, and Asset permissions.
- Cross-universe (cross-experience) teleports are restricted by default — see "Cross-experience teleports" below.

## TeleportAsync (the modern method)

`TeleportService:TeleportAsync(placeId, players, teleportOptions?)` is the single unified method. It can teleport to a different place, a specific server, or a reserved server. **Server-only** — calling from the client errors.

```lua
--!strict
local TeleportService = game:GetService("TeleportService")
local Players = game:GetService("Players")

local DESTINATION_PLACE_ID = 1234567890

local function teleportToPlace(player: Player)
    local options = Instance.new("TeleportOptions")
    -- options.ServerInstanceId = "..." -- to target a specific server
    -- options.ReservedServerAccessCode = "..." -- to join a reserved server
    -- options.ShouldReserveServer = true -- to create+join a new reserved server
    options:SetTeleportData({ reason = "lobby_choice", mode = "classic" })

    local ok, result = pcall(function()
        return TeleportService:TeleportAsync(DESTINATION_PLACE_ID, { player }, options)
    end)
    if not ok then
        warn("TeleportAsync failed:", tostring(result))
        return false
    end
    -- result is a TeleportAsyncResult with info about the destination
    return true
end
```

### Group teleport limits

- Groups can only be teleported **within a single experience** (same universe).
- **Max 50 players** per `TeleportAsync` call.

### Conflicting TeleportOptions

These combinations error with "Incompatible Parameters":
- `ReservedServerAccessCode` + `ServerInstanceId`
- `ShouldReserveServer` + `ServerInstanceId`
- `ShouldReserveServer` + `ReservedServerAccessCode`

## TeleportOptions

| Property | Purpose |
| --- | --- |
| `ServerInstanceId` | Target a specific server by `JobId`. |
| `ReservedServerAccessCode` | Join an existing reserved server by its access code. |
| `ShouldReserveServer` | Create a new reserved server and teleport into it. |
| `SetTeleportData(data)` / `GetTeleportData()` | Pass data to the destination (retrieved via `GetLocalPlayerTeleportData`). |

## TeleportAsyncResult

When `TeleportOptions` is passed, `TeleportAsync` returns a `TeleportAsyncResult` with information about the final teleport destination. Useful for confirming where a player ended up.

## TeleportInitFailed (error handling)

`TeleportService.TeleportInitFailed` fires when a teleport fails to start. Connect to it to show a retry UI. Failure reasons include invalid place ID, empty player list, non-Player instances, wrong teleport options type, client-called `TeleportAsync`, and conflicting parameters.

```lua
TeleportService.TeleportInitFailed:Connect(function(
    player: Player,
    reason: Enum.TeleportResult,
    errMsg: string,
    placeId: number,
    options: TeleportOptions
)
    warn(`Teleport failed for {player.Name} to {placeId}: {reason.Name} - {errMsg}`)
    -- Show retry UI, log options, etc.
end)
```

## Reserved servers

`TeleportService:ReserveServerAsync(placeId)` (server-only, yields) returns an access code plus a `PrivateServerId`. Players can only join a reserved server via that access code — they can't join through normal matchmaking.

- A server starts when the access code is first used.
- Access codes remain valid indefinitely; a reserved server can be rejoined even if no server is currently running (a new one starts).
- Detect reserved-server context: `local isReserved = game.PrivateServerId ~= "" and game.PrivateServerOwnerId == 0`.
- `PrivateServerId` is constant across server instances for the same access code; `JobId` is not.
- **Cross-platform caveat:** Xbox/PlayStation players with cross-play disabled land in a different server than cross-play-enabled players — multiple servers can share a `PrivateServerId`. Use `game.MatchmakingType` to differentiate.

```lua
--!strict
local TeleportService = game:GetService("TeleportService")
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

-- Reserve a candidate, then atomically publish-or-use the winner.
local store = DataStoreService:GetDataStore("ReservedServerAllocations_v2")
local reserveOk, candidateCode = pcall(function()
    return select(1, TeleportService:ReserveServerAsync(game.PlaceId))
end)
local code: string? = nil
if reserveOk and typeof(candidateCode) == "string" then
    local now = os.time()
    local candidate = { accessCode = candidateCode, expiresAt = now + 3600, state = "allocated" }
    local publishOk, winner = pcall(function()
        return store:UpdateAsync("DungeonRoom_1", function(current)
            if type(current) == "table" and type(current.accessCode) == "string" and current.expiresAt > now then
                return current
            end
            return candidate
        end)
    end)
    if publishOk and type(winner) == "table" then
        code = winner.accessCode -- every racing allocator uses the same winner
    end
end

local function sendToDungeon(player: Player)
    if not code then return end
    local options = Instance.new("TeleportOptions")
    options.ReservedServerAccessCode = code
    options:SetTeleportData({ room = 1 })
    pcall(function()
        TeleportService:TeleportAsync(game.PlaceId, { player }, options)
    end)
end
```

## Passing data across teleports

Two mechanisms, with different security profiles:

### `TeleportOptions:SetTeleportData` / `GetLocalPlayerTeleportData`

Set on the source server (via `TeleportOptions`), retrieved on the destination client via `TeleportService:GetLocalPlayerTeleportData()`. **Client-only retrieval.** Can carry any serializable value.

**Security:** exploiters can spoof teleport data. Send sensitive data (currency, entitlements) through `DataStoreService` instead, and use teleport data only for non-sensitive hints (selected game mode, cosmetic loadout preference).

### `SetTeleportSetting` / `GetTeleportSetting`

Client-only, stored locally, preserved across teleports within the same game. Good for client-side preferences (crouch state, UI tab) that don't need server trust. Also spoofable — use server-side validation for anything that affects gameplay.

## Custom loading screen

`TeleportService:SetTeleportGui(gui)` (client) sets a `ScreenGui` shown during teleport. `TeleportService:GetArrivingTeleportGui()` (client, at the destination) retrieves it so you can parent it to `PlayerGui` and run your own transition. The teleport GUI does **not** cross into a different game (universe), and does not persist across multiple teleports — set it before each one.

```lua
--!strict
-- At the destination, in ReplicatedFirst
local TeleportService = game:GetService("TeleportService")
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

### Pattern 1: Lobby → match (simple round-robin)

A lobby place collects players; when enough are ready, `TeleportAsync` sends them to a game place. Use `MessagingService` to coordinate across lobby servers if you have multiple lobbies.

### Pattern 2: Reserved server per match

For instanced dungeons or private matches: `ReserveServerAsync` → persist the access code in a DataStore keyed by match ID → teleport the party with `ReservedServerAccessCode` → players arrive in an isolated server.

### Pattern 3: Server browser via MemoryStoreService

Maintain a `MemoryStoreService` sorted map of active servers (keyed by `JobId`, value = player count / mode / ping). The lobby lists entries; when a player picks one, `TeleportOptions.ServerInstanceId = jobId` and `TeleportAsync`. Update the sorted map from each game server on join/leave. This scales better than `MessagingService` for many servers.

### Pattern 4: External matchmaking service

For complex matchmaking (skill-based, party queues), use an external HTTP service as the matchmaker. It returns a `placeId` + `JobId` or a fresh reserved-server access code; the lobby then `TeleportAsync`s the party. See roblox-networking for the `HttpService` security model and roblox-open-cloud for in-experience Open Cloud calls.

All matchmaking must respect the **50-player-per-`TeleportAsync`** limit; split larger groups into multiple calls.

## DataStore handoff across teleports

The robust pattern for moving player state between places:

1. **Source server:** on the triggering event, save the player's profile via `UpdateAsync` (see roblox-datastores). Then teleport.
2. **Destination server:** on `PlayerAdded`, load the profile via `GetAsync` (consider `UseCache=false` for a fresh read if the save was recent).
3. **Race condition:** if the save hasn't flushed by the time the destination loads, you'll get stale data. Mitigate by: (a) awaiting save confirmation before teleporting when the data is critical, or (b) passing a "load this version" hint in teleport data and retrying the load until it matches.
4. **Never trust teleport data for the authoritative state.** Teleport data is a hint; the DataStore is the truth.

## Security

- **`TeleportAsync` is server-only.** The client cannot call it directly — if you need client-initiated teleports, the client sends a RemoteEvent and the server validates then calls `TeleportAsync`.
- **Rate-limit teleport requests** per player. A hostile client spamming "teleport me" Remotes can disrupt your server flow and burn DataStore budget if you save on each trigger.
- **Validate the destination.** Don't let a client-supplied place ID drive the teleport unsanitized — whitelist allowed destinations server-side.
- **Teleport data is spoofable.** Treat it as a hint; re-validate any gameplay-affecting claim on the destination server against DataStores.
- **`GetLocalPlayerTeleportData` is client-only** and returns client-controlled data. Don't use it for authoritative decisions on the server.

## Studio limitation

**TeleportService does not work during Studio playtesting.** You must publish the experience and test teleports in the Roblox application. Plan for this in your testing workflow — teleport logic can only be verified live.

## Gotchas

- Players lose character state across teleports (new place = new character). Save/load via DataStores; don't try to carry live character state.
- `BindToClose` on the source server can race with the teleport — finish saves before triggering teleports when data is critical.
- The default teleport loading message was removed; `CustomizedTeleportUI` is deprecated and does nothing.
- Cross-platform (Xbox/PS with cross-play off) can split a reserved server into multiple servers with the same `PrivateServerId`.
- Group teleports are universe-only; you cannot `TeleportAsync` a group across experiences.
- The 50-player limit is per call — larger groups need multiple calls, and ordering matters for "arrive together" semantics.
- Follow-friend: `Players.PlayerAdded` → check `player.FollowUserId` → `GetPlayerPlaceInstanceAsync(followId)` → `TeleportToPlaceInstance`. Note `GetPlayerPlaceInstanceAsync` returns `JobId`, not the reserved-server access code, so it won't work to follow a friend into a reserved server.

## Scripts

- `scripts/TeleportHelper.lua` — a reviewed server-side example with atomic reserved-code publication, expiry, ambiguous-allocation reconciliation, and separate `teleporting`/`arrived` states.

## How to proceed

1. Decide your place architecture: primary place + sub-places in one universe.
2. For cross-place teleports, use `TeleportAsync` (server) + `TeleportOptions`.
3. For reserved servers, reserve a candidate and publish it through `UpdateAsync`; use whichever allocation wins. Track teleport initiation separately from destination arrival.
4. Pass non-sensitive hints via teleport data; pass authoritative state via DataStores.
5. Connect `TeleportInitFailed` for retry UI.
6. Validate and rate-limit any client-initiated teleport Remote.
7. Test in the Roblox app (not Studio) with a published experience.

<!-- catalog:references:start -->
## Reference index

- [matchmaking.md](references/matchmaking.md)
- [teleport-options.md](references/teleport-options.md)
<!-- catalog:references:end -->
