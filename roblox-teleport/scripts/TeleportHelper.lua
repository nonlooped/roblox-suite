--!strict
-- Status: reviewed
-- Last verified: 2026-07-16
-- Test coverage: concurrent-allocation fixture in tests/TeleportHelper.spec.lua; Studio integration still required.
-- Intended use: example; choose DataStore or MemoryStore coordination for your matchmaking lifetime.
--[[
TeleportHelper.lua

Reserved-server allocation publishes a candidate through UpdateAsync and every
allocator uses the winning record. Teleport initiation and destination arrival
are tracked separately. A successful TeleportAsync call only means initiation;
the destination must call markReservedServerArrival().
]]

local DataStoreService = game:GetService("DataStoreService")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local TeleportService = game:GetService("TeleportService")

local ALLOCATION_LIFETIME_SECONDS = 60 * 60
local MAX_MATCH_ID_LENGTH = 20
local reservedCodes = DataStoreService:GetDataStore("ReservedServerAllocations_v2")

export type TeleportData = { [string]: any }
export type AllocationState = "allocated" | "teleporting" | "arrived"
export type AllocationRecord = {
    allocationId: string,
    accessCode: string,
    placeId: number,
    matchId: string,
    state: AllocationState,
    createdAt: number,
    expiresAt: number,
    destinationJobId: string?,
}
export type ReservedTeleportState = "failed" | "allocated" | "teleport_started"
export type ReservedTeleportResult = {
    state: ReservedTeleportState,
    allocation: AllocationRecord?,
    error: any?,
}

local TeleportHelper = {}

local function allocationKey(placeId: number, matchId: string): string
    return `reserved_{placeId}_{matchId}`
end

local function validateReservedRequest(
    players: { Player },
    placeId: number,
    matchId: string
): string?
    if placeId ~= placeId or placeId == math.huge or placeId % 1 ~= 0 or placeId <= 0 then
        return "placeId must be a positive finite integer"
    end
    if matchId == "" or #matchId > MAX_MATCH_ID_LENGTH then
        return `matchId must contain 1-{MAX_MATCH_ID_LENGTH} bytes`
    end
    if #players == 0 or #players > 50 then
        return "reserved teleports require 1-50 players"
    end
    local seenUserIds: { [number]: boolean } = {}
    for _, player in players do
        if typeof(player) ~= "Instance" or not player:IsA("Player") or player.Parent ~= Players then
            return "every player must be a current Players member"
        end
        if seenUserIds[player.UserId] then
            return "players must not contain duplicates"
        end
        seenUserIds[player.UserId] = true
    end
    return nil
end

local function makeOptions(teleportData: TeleportData?): TeleportOptions
    local options = Instance.new("TeleportOptions")
    if teleportData ~= nil then
        options:SetTeleportData(teleportData)
    end
    return options
end

local function teleport(
    players: { Player },
    placeId: number,
    options: TeleportOptions?
): (boolean, any?)
    local ok, response = pcall(function()
        return TeleportService:TeleportAsync(placeId, players, options)
    end)
    if not ok then
        warn("TeleportHelper: TeleportAsync failed:", tostring(response))
        return false, response
    end
    return true, response
end

local function isAllocation(value: any): boolean
    return type(value) == "table"
        and type(value.allocationId) == "string"
        and type(value.accessCode) == "string"
        and type(value.expiresAt) == "number"
end

local function freshAllocation(key: string): AllocationRecord?
    local getOptions = Instance.new("DataStoreGetOptions")
    getOptions.UseCache = false
    local ok, value = pcall(function()
        return reservedCodes:GetAsync(key, getOptions)
    end)
    if ok and isAllocation(value) then
        return value :: AllocationRecord
    end
    return nil
end

function TeleportHelper._selectAllocation(
    current: any,
    candidate: AllocationRecord,
    now: number
): AllocationRecord
    if isAllocation(current) and (current :: AllocationRecord).expiresAt > now then
        return current :: AllocationRecord
    end
    return candidate
end

local function allocate(placeId: number, matchId: string): (AllocationRecord?, any?)
    local reserveOk, accessCode = pcall(function()
        return select(1, TeleportService:ReserveServerAsync(placeId))
    end)
    if not reserveOk or type(accessCode) ~= "string" then
        return nil, accessCode
    end

    local now = os.time()
    local candidate: AllocationRecord = {
        allocationId = HttpService:GenerateGUID(false),
        accessCode = accessCode,
        placeId = placeId,
        matchId = matchId,
        state = "allocated",
        createdAt = now,
        expiresAt = now + ALLOCATION_LIFETIME_SECONDS,
        destinationJobId = nil,
    }
    local key = allocationKey(placeId, matchId)
    local publishOk, winner = pcall(function()
        return reservedCodes:UpdateAsync(key, function(current: any): AllocationRecord?
            return TeleportHelper._selectAllocation(current, candidate, now)
        end)
    end)
    if publishOk and isAllocation(winner) then
        return winner :: AllocationRecord, nil
    end

    -- UpdateAsync failures can be ambiguous. Read without cache and use the
    -- backend winner rather than reserving/publishing another code.
    local reconciled = freshAllocation(key)
    if reconciled and reconciled.expiresAt > now then
        return reconciled, nil
    end
    return nil, winner
end

local function updateState(
    allocation: AllocationRecord,
    state: AllocationState,
    destinationJobId: string?
): (AllocationRecord?, any?)
    local key = allocationKey(allocation.placeId, allocation.matchId)
    local ok, updated = pcall(function()
        return reservedCodes:UpdateAsync(key, function(current: any): AllocationRecord?
            if not isAllocation(current) then
                return nil
            end
            local record = current :: AllocationRecord
            if record.allocationId ~= allocation.allocationId then
                return nil
            end
            record.state = state
            record.destinationJobId = destinationJobId
            return record
        end)
    end)
    if ok and isAllocation(updated) then
        return updated :: AllocationRecord, nil
    end

    local reconciled = freshAllocation(key)
    if
        reconciled
        and reconciled.allocationId == allocation.allocationId
        and reconciled.state == state
    then
        return reconciled, nil
    end
    return nil, updated
end

function TeleportHelper.teleportToPlace(
    player: Player,
    placeId: number,
    teleportData: TeleportData?
): boolean
    local optionsOk, options = pcall(makeOptions, teleportData)
    if not optionsOk then
        warn("TeleportHelper: invalid teleport data:", tostring(options))
        return false
    end
    local ok = teleport({ player }, placeId, options)
    return ok
end

function TeleportHelper.teleportToServer(
    player: Player,
    placeId: number,
    jobId: string,
    teleportData: TeleportData?
): boolean
    local optionsOk, options = pcall(makeOptions, teleportData)
    if not optionsOk then
        warn("TeleportHelper: invalid teleport data:", tostring(options))
        return false
    end
    options.ServerInstanceId = jobId
    local ok = teleport({ player }, placeId, options)
    return ok
end

function TeleportHelper.teleportToReservedServer(
    players: { Player },
    placeId: number,
    matchId: string,
    teleportData: TeleportData?
): (boolean, ReservedTeleportResult)
    local validationError = validateReservedRequest(players, placeId, matchId)
    if validationError then
        return false, { state = "failed", allocation = nil, error = validationError }
    end

    local allocation, allocationError = allocate(placeId, matchId)
    if not allocation then
        return false, { state = "failed", allocation = nil, error = allocationError }
    end

    local trackingRecord, trackingError = updateState(allocation, "teleporting", nil)
    if not trackingRecord then
        return false, { state = "allocated", allocation = allocation, error = trackingError }
    end

    local data: TeleportData = {}
    if teleportData then
        for key, value in teleportData do
            data[key] = value
        end
    end
    data.reservedAllocationId = trackingRecord.allocationId
    data.reservedMatchId = matchId

    local optionsOk, options = pcall(makeOptions, data)
    if not optionsOk then
        return false, { state = "allocated", allocation = trackingRecord, error = options }
    end
    options.ReservedServerAccessCode = trackingRecord.accessCode
    local started, teleportError = teleport(players, placeId, options)
    if not started then
        return false, { state = "allocated", allocation = trackingRecord, error = teleportError }
    end
    return true, { state = "teleport_started", allocation = trackingRecord, error = nil }
end

function TeleportHelper.markReservedServerArrival(
    placeId: number,
    matchId: string,
    allocationId: string
): (boolean, AllocationRecord?)
    local current = freshAllocation(allocationKey(placeId, matchId))
    if not current or current.allocationId ~= allocationId then
        return false, nil
    end
    local updated = updateState(current, "arrived", game.JobId)
    return updated ~= nil, updated
end

return TeleportHelper
