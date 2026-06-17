---
last_reviewed: 2026-06-17
---

# Matchmaking Patterns

**Official sources:**
- https://create.roblox.com/docs/en-us/projects/teleport
- https://create.roblox.com/docs/reference/engine/classes/MessagingService
- https://create.roblox.com/docs/en-us/cloud-services/memory-stores

Matchmaking in Roblox is build-it-yourself — there's no built-in matchmaker. You compose `TeleportService:TeleportAsync` with a coordination layer (`MessagingService`, `MemoryStoreService`, or an external HTTP service) to route players into the right servers.

All patterns respect the **50-player-per-`TeleportAsync`** limit (split larger groups into multiple calls) and the **server-only** rule for `TeleportAsync`.

## Pattern 1: Simple lobby → match (intra-universe)

A dedicated lobby place collects players; when enough are ready, `TeleportAsync` sends them to a game place in the same universe.

```lua
--!strict
-- Server, in the lobby place
local TeleportService = game:GetService("TeleportService")
local Players = game:GetService("Players")

local GAME_PLACE_ID = 1234567890
local PLAYERS_PER_MATCH = 8

local readyPlayers: { Player } = {}

local function tryStartMatch()
    if #readyPlayers >= PLAYERS_PER_MATCH then
        local batch = {}
        for i = 1, PLAYERS_PER_MATCH do
            table.insert(batch, readyPlayers[i])
        end
        local options = Instance.new("TeleportOptions")
        options:SetTeleportData({ matchStartedAt = os.time() })
        pcall(function()
            TeleportService:TeleportAsync(GAME_PLACE_ID, batch, options)
        end)
        -- Remove the batch from readyPlayers
        for i = PLAYERS_PER_MATCH, 1, -1 do
            table.remove(readyPlayers, i)
        end
    end
end
```

**Scaling:** if you have multiple lobby servers, use `MessagingService` to broadcast readiness across them, or move to Pattern 3.

## Pattern 2: Reserved server per match

For instanced dungeons, private matches, or anything that must be isolated: reserve a server, persist the access code, teleport the party in.

```lua
--!strict
local TeleportService = game:GetService("TeleportService")
local DataStoreService = game:GetService("DataStoreService")

local PLACE_ID = game.PlaceId
local codes = DataStoreService:GetDataStore("MatchServerCodes")

local function getOrCreateCode(matchId: string): string?
    local ok, saved = pcall(function() return codes:GetAsync("match_" .. matchId) end)
    if ok and typeof(saved) == "string" then
        return saved
    end
    local reserveOk, code = pcall(function() return select(1, TeleportService:ReserveServerAsync(PLACE_ID)) end)
    if reserveOk and code then
        pcall(function() codes:SetAsync("match_" .. matchId, code) end)
        return code
    end
    return nil
end

local function sendPartyToMatch(matchId: string, party: { Player })
    local code = getOrCreateCode(matchId)
    if not code then return end
    local options = Instance.new("TeleportOptions")
    options.ReservedServerAccessCode = code
    options:SetTeleportData({ matchId = matchId })
    pcall(function()
        TeleportService:TeleportAsync(PLACE_ID, party, options)
    end)
end
```

Reserved servers persist across restarts (the access code stays valid); rejoining starts a new server if none is running.

## Pattern 3: Server browser via MemoryStoreService

For experiences with many game servers, maintain a `MemoryStoreService` sorted map of active servers and let players browse/join. This scales better than `MessagingService` fan-out.

```lua
--!strict
-- On each game server, register and keep fresh:
local MemoryStoreService = game:GetService("MemoryStoreService")
local Players = game:GetService("Players")

local serversMap = MemoryStoreService:GetSortedMap("ActiveGameServers")
local SERVER_TTL = 60 -- seconds

local function heartbeat()
    pcall(function()
        serversMap:SetAsync(game.JobId, {
            playerCount = #Players:GetPlayers(),
            mode = "classic",
            updated = os.time(),
        }, SERVER_TTL)
    end)
end

-- Loop the heartbeat while the server is alive
task.spawn(function()
    while true do
        heartbeat()
        task.wait(15)
    end
end)
```

```lua
--!strict
-- In the lobby, list servers and let a player join one:
local TeleportService = game:GetService("TeleportService")
local MemoryStoreService = game:GetService("MemoryStoreService")

local serversMap = MemoryStoreService:GetSortedMap("ActiveGameServers")

local function listServers(): { { jobId: string, playerCount: number } }?
    local ok, entries = pcall(function()
        return serversMap:GetRangeAsync(Enum.SortDirection.Ascending, 50)
    end)
    if not ok then return nil end
    local result = {}
    for _, entry in ipairs(entries) do
        table.insert(result, { jobId = entry.key, playerCount = entry.value.playerCount })
    end
    return result
end

local function joinServer(player: Player, jobId: string)
    local options = Instance.new("TeleportOptions")
    options.ServerInstanceId = jobId
    pcall(function()
        TeleportService:TeleportAsync(game.PlaceId, { player }, options)
    end)
end
```

Use `MemoryStoreService`'s TTL so dead servers age out of the map automatically.

## Pattern 4: External matchmaking service

For skill-based matchmaking, party queues, or anything too complex for in-engine coordination, use an external HTTP service as the matchmaker. It returns a destination (place ID + `JobId`, or a fresh reserved-server access code); the lobby then `TeleportAsync`s the party.

- See roblox-networking for the `HttpService` security model (server-only, validate responses, don't trust client-supplied destinations).
- See roblox-open-cloud for in-experience Open Cloud calls if your matchmaker needs to read/write Roblox resources.

## Cross-server coordination: when to use what

| Need | Use |
| --- | --- |
| Broadcast a one-off event to all servers of a universe | `MessagingService:PublishAsync` |
| Shared, TTL'd, queryable state across servers (server lists, queues, lobbies) | `MemoryStoreService` (sorted maps, queues, hash maps) |
| Complex/skill-based matchmaking, cross-experience, or heavy logic | External HTTP service |
| Persisting match results or player data | `DataStoreService` |

`MessagingService` is fire-and-forget; if a server isn't listening when the message publishes, it misses it. `MemoryStoreService` is stateful and queryable — better for "what's currently available." External services are the most flexible but add a dependency and latency.

## Security and limits

- **`TeleportAsync` is server-only.** Client-initiated teleports must go through a validated RemoteEvent.
- **Rate-limit** teleport request Remotes per player.
- **Whitelist** allowed destination place IDs server-side; don't accept client-supplied place IDs unsanitized.
- **50 players per `TeleportAsync`** call — split larger parties.
- **Group teleports are universe-only** — you cannot `TeleportAsync` a group across experiences.
- **Studio can't test teleports** — publish and test in the Roblox app.
- Reserved-server access codes are long-lived; treat them as semi-secret (anyone with the code can join the reserved server).

## Sources

- https://create.roblox.com/docs/en-us/projects/teleport
- https://create.roblox.com/docs/reference/engine/classes/MessagingService
- https://create.roblox.com/docs/en-us/cloud-services/memory-stores
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportService