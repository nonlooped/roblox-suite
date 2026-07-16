# reserved-server-matchmaking

Each racing lobby may reserve a candidate, but `UpdateAsync` publishes exactly one allocation as the match winner. Losing candidates are never distributed. Initiation timestamps and destination arrival timestamps are separate durable milestones.

```lua
--!strict
-- Server-only ModuleScript

local DataStoreService = game:GetService("DataStoreService")
local HttpService = game:GetService("HttpService")
local TeleportService = game:GetService("TeleportService")

local allocations =
    DataStoreService:GetDataStore("ReservedMatchAllocations_v3")
local transit =
    DataStoreService:GetDataStore("ReservedMatchTransit_v3")

local ALLOCATION_LIFETIME = 60 * 60

export type Allocation = {
    allocationId: string,
    matchId: string,
    placeId: number,
    accessCode: string,
    privateServerId: string,
    createdAt: number,
    expiresAt: number,
}

export type AllocationState = "allocated" | "unknown" | "failed"

export type AllocationResult = {
    state: AllocationState,
    allocation: Allocation?,
    error: any?,
}

local Matchmaking = {}

local function allocationKey(matchId: string): string
    return `match:{matchId}`
end

local function transitKey(matchId: string, userId: number): string
    return `transit:{matchId}:{userId}`
end

local function isAllocation(value: any): boolean
    return type(value) == "table"
        and type(value.allocationId) == "string"
        and type(value.accessCode) == "string"
        and type(value.privateServerId) == "string"
        and type(value.expiresAt) == "number"
end

local function readFresh(
    store: DataStore,
    key: string
): (boolean, any)
    local options = Instance.new("DataStoreGetOptions")
    options.UseCache = false

    return pcall(function()
        return store:GetAsync(key, options)
    end)
end

local function getOrAllocate(
    matchId: string,
    placeId: number
): AllocationResult
    if matchId == "" or #allocationKey(matchId) > 50 then
        return {
            state = "failed",
            allocation = nil,
            error = "invalid_match_id",
        }
    end

    local reserveOk, accessCodeOrError, privateServerId = pcall(function()
        return TeleportService:ReserveServerAsync(placeId)
    end)

    if not reserveOk
        or type(accessCodeOrError) ~= "string"
        or type(privateServerId) ~= "string"
    then
        return {
            state = "failed",
            allocation = nil,
            error = accessCodeOrError,
        }
    end

    local now = os.time()
    local candidate: Allocation = {
        allocationId = HttpService:GenerateGUID(false),
        matchId = matchId,
        placeId = placeId,
        accessCode = accessCodeOrError,
        privateServerId = privateServerId,
        createdAt = now,
        expiresAt = now + ALLOCATION_LIFETIME,
    }

    local key = allocationKey(matchId)
    local publishOk, winnerOrError = pcall(function()
        return allocations:UpdateAsync(
            key,
            function(current: any, info: DataStoreKeyInfo?)
                local winner = candidate

                if isAllocation(current)
                    and current.matchId == matchId
                    and current.placeId == placeId
                    and current.expiresAt > now
                then
                    winner = current
                end

                local userIds = if info then info:GetUserIds() else {}
                local metadata = if info then info:GetMetadata() else {}
                return winner, userIds, metadata
            end
        )
    end)

    if publishOk and isAllocation(winnerOrError) then
        return {
            state = "allocated",
            allocation = winnerOrError,
            error = nil,
        }
    end

    -- Do not reserve and publish another candidate after an ambiguous result.
    local readOk, freshOrError = readFresh(allocations, key)
    if readOk
        and isAllocation(freshOrError)
        and freshOrError.expiresAt > now
    then
        return {
            state = "allocated",
            allocation = freshOrError,
            error = nil,
        }
    end

    return {
        state = "unknown",
        allocation = nil,
        error = if readOk then winnerOrError else freshOrError,
    }
end

local function markMilestone(
    allocation: Allocation,
    userId: number,
    milestone: "initiationRequestedAt" | "initiatedAt" | "arrivedAt"
): boolean
    local key = transitKey(allocation.matchId, userId)
    local now = os.time()

    local ok = pcall(function()
        transit:UpdateAsync(key, function(current: any, info: DataStoreKeyInfo?)
            local record = if type(current) == "table"
                then table.clone(current)
                else {
                    allocationId = allocation.allocationId,
                    matchId = allocation.matchId,
                    userId = userId,
                }

            -- Never mix milestones from a replacement allocation.
            if record.allocationId ~= allocation.allocationId then
                return nil
            end

            -- Each field is monotonic and is never cleared or overwritten.
            if record[milestone] == nil then
                record[milestone] = now
            end

            local userIds = if info then info:GetUserIds() else { userId }
            local metadata = if info then info:GetMetadata() else {}
            return record, userIds, metadata
        end)
    end)

    return ok
end

function Matchmaking.teleportParty(
    matchId: string,
    placeId: number,
    party: { Player }
): (boolean, string)
    if #party == 0 or #party > 50 then
        return false, "invalid_party_size"
    end

    for _, player in party do
        if player.Parent == nil then
            return false, "player_left"
        end
    end

    local allocationResult = getOrAllocate(matchId, placeId)
    local allocation = allocationResult.allocation
    if allocationResult.state ~= "allocated" or allocation == nil then
        return false, allocationResult.state
    end

    -- Record intent before making the yielding teleport call.
    for _, player in party do
        if not markMilestone(allocation, player.UserId, "initiationRequestedAt") then
            return false, "tracking_failed"
        end
    end

    local options = Instance.new("TeleportOptions")
    options.ReservedServerAccessCode = allocation.accessCode
    options:SetTeleportData({
        matchId = matchId,
        allocationId = allocation.allocationId,
    })

    local teleportOk, teleportError = pcall(function()
        return TeleportService:TeleportAsync(placeId, party, options)
    end)

    if not teleportOk then
        warn(`TeleportAsync failed: {tostring(teleportError)}`)
        return false, "teleport_failed"
    end

    -- A successful call means initiation, not destination arrival.
    for _, player in party do
        markMilestone(allocation, player.UserId, "initiatedAt")
    end

    return true, "teleport_initiated"
end

-- Call from PlayerAdded in the destination reserved-server place.
function Matchmaking.markArrival(player: Player): boolean
    local joinData = player:GetJoinData()
    local teleportData = joinData.TeleportData

    if type(teleportData) ~= "table"
        or type(teleportData.matchId) ~= "string"
        or type(teleportData.allocationId) ~= "string"
    then
        return false
    end

    local readOk, current = readFresh(
        allocations,
        allocationKey(teleportData.matchId)
    )

    if not readOk
        or not isAllocation(current)
        or current.allocationId ~= teleportData.allocationId
        or current.placeId ~= game.PlaceId
        or current.privateServerId ~= game.PrivateServerId
    then
        return false
    end

    return markMilestone(current, player.UserId, "arrivedAt")
end

return Matchmaking
```

Destination setup:

```lua
--!strict
-- ServerScriptService/ArrivalTracker.server.lua

local Players = game:GetService("Players")
local Matchmaking = require(script.Parent.Matchmaking)

Players.PlayerAdded:Connect(function(player: Player)
    if not Matchmaking.markArrival(player) then
        warn(`Could not verify reserved-server arrival for {player.UserId}`)
    end
end)
```

`ReserveServerAsync` cannot be made part of the DataStore transaction, so racing allocators may create unused candidate codes. Only the allocation returned by the atomic `UpdateAsync` winner is published or used. An ambiguous publication is reconciled with an uncached read before any further allocation attempt.

`initiationRequestedAt`, `initiatedAt`, and `arrivedAt` represent different facts. In particular, a successful `TeleportAsync` call must never be interpreted as proof that the destination server received the player.
