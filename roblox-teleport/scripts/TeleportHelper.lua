--!strict
--[[
    TeleportHelper.lua
    Server-side helper wrapping TeleportService:TeleportAsync with pcall,
    TeleportOptions construction, and a simple reserved-server-code cache.

    Usage:
        local TeleportHelper = require(path.to.TeleportHelper)

        -- Simple teleport to a public place
        TeleportHelper.teleportToPlace(player, DESTINATION_PLACE_ID, { mode = "classic" })

        -- Join a specific server by JobId
        TeleportHelper.teleportToServer(player, DESTINATION_PLACE_ID, jobId, { reason = "join_friend" })

        -- Create or reuse a reserved server for a match
        TeleportHelper.teleportToReservedServer({ player1, player2 }, DESTINATION_PLACE_ID, "match_42")
]]

local TeleportService = game:GetService("TeleportService")
local DataStoreService = game:GetService("DataStoreService")

export type TeleportHelper = {
    teleportToPlace: (player: Player, placeId: number, teleportData: any?) -> boolean,
    teleportToServer: (player: Player, placeId: number, jobId: string, teleportData: any?) -> boolean,
    teleportToReservedServer: (players: { Player }, placeId: number, matchId: string, teleportData: any?) -> boolean,
}

local TeleportHelper = {}

local reservedCodes = DataStoreService:GetDataStore("ReservedServerCodes")

local function makeOptions(teleportData: any?): TeleportOptions
    local options = Instance.new("TeleportOptions")
    if teleportData ~= nil then
        options:SetTeleportData(teleportData)
    end
    return options
end

local function teleport(players: { Player }, placeId: number, options: TeleportOptions?): boolean
    local ok, err = pcall(function()
        TeleportService:TeleportAsync(placeId, players, options)
    end)
    if not ok then
        warn("TeleportHelper: TeleportAsync failed:", tostring(err))
        return false
    end
    return true
end

function TeleportHelper.teleportToPlace(player: Player, placeId: number, teleportData: any?): boolean
    local options = makeOptions(teleportData)
    return teleport({ player }, placeId, options)
end

function TeleportHelper.teleportToServer(player: Player, placeId: number, jobId: string, teleportData: any?): boolean
    local options = makeOptions(teleportData)
    options.ServerInstanceId = jobId
    return teleport({ player }, placeId, options)
end

function TeleportHelper.teleportToReservedServer(players: { Player }, placeId: number, matchId: string, teleportData: any?): boolean
    local key = "reserved_" .. tostring(placeId) .. "_" .. matchId
    local code
    local ok, saved = pcall(function() return reservedCodes:GetAsync(key) end)
    if ok and typeof(saved) == "string" then
        code = saved
    else
        local reserveOk, newCode = pcall(function()
            return select(1, TeleportService:ReserveServerAsync(placeId))
        end)
        if not reserveOk or not newCode then
            warn("TeleportHelper: ReserveServerAsync failed:", tostring(newCode))
            return false
        end
        code = newCode
        pcall(function() reservedCodes:SetAsync(key, code) end)
    end

    local options = makeOptions(teleportData)
    options.ReservedServerAccessCode = code
    return teleport(players, placeId, options)
end

return TeleportHelper