--!strict
--[[
RateLimiter.lua
Per-player, per-action rate limiter using a token-bucket algorithm with abuse escalation.

Usage on server:
local RateLimiter = require(...)
local limiter = RateLimiter.new() -- dedicated instance
-- or
local limiter = RateLimiter.default -- shared singleton

if not limiter:canPerform(player, "BuyItem", 5) then
    -- too fast
    return
end
]]

local Players = game:GetService("Players")

local DEFAULT_CAPACITY = 10
local DEFAULT_REFILL_RATE = 1
local DEFAULT_MIN_INTERVAL = 0.5
local MAX_ACTIONS_PER_PLAYER = 64
local MAX_ABUSE_SCORE = 10

type AbuseRecord = {
    tokens: number,
    lastRefill: number,
    abuseScore: number,
}

export type RateLimiter = {
    records: { [number]: { [string]: AbuseRecord } },
    _connection: RBXScriptConnection?,
    new: () -> RateLimiter,
    default: RateLimiter,
    canPerform: (self: RateLimiter, player: Player, action: string, minInterval: number?) -> boolean,
    clearPlayer: (self: RateLimiter, player: Player) -> (),
}

local RateLimiter = {}
RateLimiter.__index = RateLimiter

function RateLimiter.new(): RateLimiter
    local self = setmetatable({}, RateLimiter) :: RateLimiter
    self.records = {}

    self._connection = Players.PlayerRemoving:Connect(function(player)
        self:clearPlayer(player)
    end)

    return self
end

RateLimiter.default = RateLimiter.new()

function RateLimiter:canPerform(player: Player, action: string, minInterval: number?): boolean
    if typeof(player) ~= "Instance" or not player:IsA("Player") then
        error("RateLimiter.canPerform: player must be a Player instance", 2)
    end
    if typeof(action) ~= "string" then
        error("RateLimiter.canPerform: action must be a string", 2)
    end
    local interval = minInterval or DEFAULT_MIN_INTERVAL
    if typeof(interval) ~= "number" or interval ~= interval or interval <= 0 then
        error("RateLimiter.canPerform: minInterval must be a positive number", 2)
    end

    local userId = player.UserId
    local playerRecords = self.records[userId]
    if not playerRecords then
        playerRecords = {}
        self.records[userId] = playerRecords
    end

    local actionCount = 0
    for _ in pairs(playerRecords) do
        actionCount += 1
    end
    if actionCount >= MAX_ACTIONS_PER_PLAYER and playerRecords[action] == nil then
        return false
    end

    local now = os.clock()
    local record = playerRecords[action]
    if not record then
        record = { tokens = DEFAULT_CAPACITY, lastRefill = now, abuseScore = 0 }
        playerRecords[action] = record
    end

    local elapsed = now - record.lastRefill
    record.tokens = math.min(DEFAULT_CAPACITY, record.tokens + elapsed * DEFAULT_REFILL_RATE)
    record.lastRefill = now

    local effectiveInterval = interval * (1 + record.abuseScore)
    if record.tokens < 1 then
        record.abuseScore = math.min(record.abuseScore + 0.5, MAX_ABUSE_SCORE)
        return false
    end

    if now - (record.lastRefill - elapsed) < effectiveInterval then
        record.abuseScore = math.min(record.abuseScore + 0.25, MAX_ABUSE_SCORE)
    else
        record.abuseScore = math.max(record.abuseScore - 0.1, 0)
    end

    record.tokens -= 1
    return true
end

function RateLimiter:clearPlayer(player: Player): ()
    if typeof(player) ~= "Instance" or not player:IsA("Player") then
        error("RateLimiter.clearPlayer: player must be a Player instance", 2)
    end
    self.records[player.UserId] = nil
end

return RateLimiter
