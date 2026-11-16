---
read_when: "Coordinate lobbies, reserved servers, allocation races, or player-data handoff"
last_reviewed: 2026-11-16
---

# Matchmaking patterns

> The November 2026 GUID routing migration is experimental pending a second human review and Studio integration tests. Existing v2 access-code records are not migrated; drain active sessions before adopting the helper's separate v3 store.

**Official sources:**
- https://create.roblox.com/docs/en-us/projects/teleport
- https://create.roblox.com/docs/reference/engine/classes/MessagingService
- https://create.roblox.com/docs/en-us/cloud-services/memory-stores

Build matchmaking by combining `TeleportService:TeleportAsync` with a coordination layer (`MessagingService`, `MemoryStoreService`, or an external HTTP service) to route players into the right servers.

All patterns respect the **50-player-per-`TeleportAsync`** limit (split larger groups into multiple calls) and the **server-only** rule for `TeleportAsync`.

## Pattern 1: simple lobby → match (intra-universe)

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

## Pattern 2: reserved server per match

For instanced dungeons, private matches, or anything that must be isolated: generate a GUID, atomically persist the winning ID, teleport the party in.

```lua
--!strict
local TeleportService = game:GetService("TeleportService")
local HttpService = game:GetService("HttpService")
local DataStoreService = game:GetService("DataStoreService")

local PLACE_ID = game.PlaceId
local serverIds = DataStoreService:GetDataStore("MatchServerIds_v2")

local function getOrCreateServerId(matchId: string): string?
    local serverId = HttpService:GenerateGUID(false)

    local now = os.time()
    local candidate = { reservedServerId = serverId, expiresAt = now + 3600, state = "allocated" }
    local publishOk, winner = pcall(function()
        return serverIds:UpdateAsync("match_" .. matchId, function(current)
            if type(current) == "table" and type(current.reservedServerId) == "string" and current.expiresAt > now then
                return current
            end
            return candidate
        end)
    end)
    if publishOk and type(winner) == "table" then
        return winner.reservedServerId -- all concurrent allocators use the atomic winner
    end
    -- A failed write can be ambiguous. Reconcile with GetAsync(UseCache=false)
    -- before deciding whether allocation failed; see scripts/TeleportHelper.lua.
    return nil
end

local function sendPartyToMatch(matchId: string, party: { Player })
    local serverId = getOrCreateServerId(matchId)
    if not serverId then return end
    local options = Instance.new("TeleportOptions")
    options.ReservedServerId = serverId
    options:SetTeleportData({ matchId = matchId })
    pcall(function()
        TeleportService:TeleportAsync(PLACE_ID, party, options)
    end)
end
```

Reserved server IDs remain valid, but allocation records should carry an expiry so matchmaking state does not live forever. The source can record `teleporting` only after allocation; the destination must separately mark `arrived`. For short-lived queues and locks, prefer a TTL'd MemoryStore record.

## Pattern 3: server browser via MemoryStoreService

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

## Pattern 4: external matchmaking service

For skill-based matchmaking, party queues, or anything too complex for in-engine coordination, use an external HTTP service as the matchmaker. It returns a destination (place ID + `JobId`, or a server-generated reserved-server GUID); the lobby then `TeleportAsync`s the party.

- See roblox-networking for the `HttpService` security model (server-only, validate responses, don't trust client-supplied destinations).
- See roblox-open-cloud for in-experience Open Cloud calls if your matchmaker needs to read/write Roblox resources.

## Cross-server coordination: when to use what

| Need | Use |
| --- | --- |
| Broadcast a one-off event to all servers of a universe | `MessagingService:PublishAsync` |
| Shared, TTL'd, queryable state across servers (server lists, queues, lobbies) | `MemoryStoreService` (sorted maps, queues, hash maps) |
| Complex/skill-based matchmaking, cross-experience, or heavy logic | External HTTP service |
| Persisting match results or player data | `DataStoreService` |

`MessagingService` is fire-and-forget; if a server isn't listening when the message publishes, it misses it. `MemoryStoreService` is stateful and queryable, so use it to track currently available servers. External services are the most flexible but add a dependency and latency.

## Security and limits

- **`TeleportAsync` is server-only.** Client-initiated teleports must go through a validated RemoteEvent.
- **Rate-limit** teleport request Remotes per player.
- **Whitelist** allowed destination place IDs server-side; don't accept client-supplied place IDs unsanitized.
- **50 players per `TeleportAsync`** call: split larger parties.
- **Group teleports are universe-only**: you cannot `TeleportAsync` a group across experiences.
- **Studio testing**: use `TeleportAsync` in Test or Team Test within one experience; see the skill entry point for limitations.
- Generate reserved-server IDs on the server and validate who may request a join.

## Sources

- https://create.roblox.com/docs/en-us/projects/teleport
- https://create.roblox.com/docs/reference/engine/classes/MessagingService
- https://create.roblox.com/docs/en-us/cloud-services/memory-stores
- https://create.roblox.com/docs/en-us/reference/engine/classes/TeleportService
