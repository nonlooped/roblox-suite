--!strict
-- Status: reviewed
-- Last verified: 2026-07-16
-- Test coverage: deterministic regression fixture in tests/RateLimiter.spec.lua
-- Intended use: example; adapt configuration and enforcement policy before production.
--[[
RateLimiter.lua
Per-player, per-action minimum-interval and token-bucket limiter.

The minimum interval is a hard rejection: rejected attempts do not consume a
bucket token or move the last-accepted timestamp. Dedicated instances must be
destroyed when their owning system shuts down.
]]

local Players = game:GetService("Players")

local DEFAULT_CAPACITY = 10
local DEFAULT_REFILL_RATE = 1
local DEFAULT_MIN_INTERVAL = 0.5
local MAX_ACTIONS_PER_PLAYER = 64
local MAX_ACTION_LENGTH = 100
local MAX_ABUSE_SCORE = 10

type Clock = () -> number

type AbuseRecord = {
    tokens: number,
    lastRefill: number,
    lastAccepted: number?,
    abuseScore: number,
}

export type DenialReason = "min_interval" | "token_bucket" | "action_limit" | "destroyed"
export type Config = {
    capacity: number?,
    refillRate: number?,
    defaultMinInterval: number?,
    maxActionsPerPlayer: number?,
    clock: Clock?,
}

type RateLimiterState = {
    records: { [number]: { [string]: AbuseRecord } },
    _connection: RBXScriptConnection?,
    _clock: Clock,
    _capacity: number,
    _refillRate: number,
    _defaultMinInterval: number,
    _maxActionsPerPlayer: number,
    _destroyed: boolean,
}

local RateLimiter = {}
RateLimiter.__index = RateLimiter

export type RateLimiter = typeof(setmetatable({} :: RateLimiterState, RateLimiter))

local function positiveNumber(value: number?, fallback: number, name: string): number
    local resolved = if value == nil then fallback else value
    if resolved ~= resolved or resolved == math.huge or resolved <= 0 then
        error(`RateLimiter.new: {name} must be a positive number`, 3)
    end
    return resolved
end

function RateLimiter.new(config: Config?): RateLimiter
    local options: Config = config or {}
    local self = setmetatable(
        {
            records = {},
            _connection = nil,
            _clock = options.clock or os.clock,
            _capacity = positiveNumber(options.capacity, DEFAULT_CAPACITY, "capacity"),
            _refillRate = positiveNumber(options.refillRate, DEFAULT_REFILL_RATE, "refillRate"),
            _defaultMinInterval = positiveNumber(
                options.defaultMinInterval,
                DEFAULT_MIN_INTERVAL,
                "defaultMinInterval"
            ),
            _maxActionsPerPlayer = math.floor(
                positiveNumber(
                    options.maxActionsPerPlayer,
                    MAX_ACTIONS_PER_PLAYER,
                    "maxActionsPerPlayer"
                )
            ),
            _destroyed = false,
        } :: RateLimiterState,
        RateLimiter
    )
    self._connection = Players.PlayerRemoving:Connect(function(player)
        self:clearPlayer(player)
    end)
    return self
end

function RateLimiter:_canPerformUserId(
    userId: number,
    action: string,
    minInterval: number?
): (boolean, DenialReason?)
    if self._destroyed then
        return false, "destroyed"
    end
    if userId ~= userId or userId == math.huge or userId == -math.huge or userId % 1 ~= 0 then
        error("RateLimiter: userId must be a finite integer", 2)
    end
    if action == "" or #action > MAX_ACTION_LENGTH then
        error(`RateLimiter: action must contain 1-{MAX_ACTION_LENGTH} bytes`, 2)
    end

    local interval = positiveNumber(minInterval, self._defaultMinInterval, "minInterval")
    local playerRecords = self.records[userId]
    if not playerRecords then
        playerRecords = {}
        self.records[userId] = playerRecords
    end

    local record = playerRecords[action]
    if not record then
        local actionCount = 0
        for _ in playerRecords do
            actionCount += 1
        end
        if actionCount >= self._maxActionsPerPlayer then
            return false, "action_limit"
        end

        local now = self._clock()
        record = {
            tokens = self._capacity,
            lastRefill = now,
            lastAccepted = nil,
            abuseScore = 0,
        }
        playerRecords[action] = record
    end

    local now = self._clock()
    local elapsed = math.max(0, now - record.lastRefill)
    record.tokens = math.min(self._capacity, record.tokens + elapsed * self._refillRate)
    record.lastRefill = now

    if record.lastAccepted ~= nil and now - record.lastAccepted < interval then
        record.abuseScore = math.min(record.abuseScore + 0.25, MAX_ABUSE_SCORE)
        return false, "min_interval"
    end
    if record.tokens < 1 then
        record.abuseScore = math.min(record.abuseScore + 0.5, MAX_ABUSE_SCORE)
        return false, "token_bucket"
    end

    record.tokens -= 1
    record.lastAccepted = now
    record.abuseScore = math.max(record.abuseScore - 0.1, 0)
    return true, nil
end

function RateLimiter:canPerform(
    player: Player,
    action: string,
    minInterval: number?
): (boolean, DenialReason?)
    if typeof(player) ~= "Instance" or not player:IsA("Player") then
        error("RateLimiter.canPerform: player must be a Player instance", 2)
    end
    if typeof(action) ~= "string" then
        error("RateLimiter.canPerform: action must be a string", 2)
    end
    return self:_canPerformUserId(player.UserId, action, minInterval)
end

function RateLimiter:clearPlayer(player: Player)
    if typeof(player) ~= "Instance" or not player:IsA("Player") then
        error("RateLimiter.clearPlayer: player must be a Player instance", 2)
    end
    self.records[player.UserId] = nil
end

function RateLimiter.destroy(self: RateLimiter)
    if self._destroyed then
        return
    end
    self._destroyed = true
    local connection = self._connection
    if connection then
        connection:Disconnect()
        self._connection = nil
    end
    table.clear(self.records)
end

local default = RateLimiter.new()
RateLimiter.default = default

return RateLimiter
