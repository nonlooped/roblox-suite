--!strict
-- Status: experimental
-- Last verified: 2026-06-17
-- Test coverage: no automated coverage
-- Intended use: example; adapt and test before production.

--[[
BudgetMonitor.lua
Utilities for inspecting and configuring DataStore request budgets at server startup.
Call early in a Script under ServerScriptService (once per server).

Example:
local BudgetMonitor = require(...)
BudgetMonitor.configureForBusyServer()
BudgetMonitor.printAllBudgets()
]]

local DataStoreService = game:GetService("DataStoreService")

local BudgetMonitor = {}

type RequestTypeEntry = {
    name: string,
    requestType: Enum.DataStoreRequestType,
}

local REQUEST_TYPES: { RequestTypeEntry } = {
    { name = "StandardRead", requestType = Enum.DataStoreRequestType.StandardRead },
    { name = "StandardWrite", requestType = Enum.DataStoreRequestType.StandardWrite },
    { name = "StandardList", requestType = Enum.DataStoreRequestType.StandardList },
    { name = "StandardRemove", requestType = Enum.DataStoreRequestType.StandardRemove },
    { name = "OrderedRead", requestType = Enum.DataStoreRequestType.OrderedRead },
    { name = "OrderedWrite", requestType = Enum.DataStoreRequestType.OrderedWrite },
    { name = "OrderedRemove", requestType = Enum.DataStoreRequestType.OrderedRemove },
    -- Note: GetVersionAsync/GetVersionAtTimeAsync count as StandardRead, not separate budget categories.
    -- OrderedList is intentionally omitted: GetRequestBudgetForRequestType always returns 0 for it.
}

local REQUEST_TYPES_BY_NAME: { [string]: Enum.DataStoreRequestType } = {
    StandardRead = Enum.DataStoreRequestType.StandardRead,
    StandardWrite = Enum.DataStoreRequestType.StandardWrite,
    StandardList = Enum.DataStoreRequestType.StandardList,
    StandardRemove = Enum.DataStoreRequestType.StandardRemove,
    OrderedRead = Enum.DataStoreRequestType.OrderedRead,
    OrderedWrite = Enum.DataStoreRequestType.OrderedWrite,
    OrderedList = Enum.DataStoreRequestType.OrderedList,
    OrderedRemove = Enum.DataStoreRequestType.OrderedRemove,
}

function BudgetMonitor.printAllBudgets()
    print("=== Current DataStore Request Budgets ===")
    for _, entry in REQUEST_TYPES do
        local budget = DataStoreService:GetRequestBudgetForRequestType(entry.requestType)
        print(string.format("%-20s : %d", entry.name, budget))
    end
    print("OrderedList            : budget inspection always returns 0")
end

function BudgetMonitor.configureForBusyServer()
    -- Example aggressive but reasonable settings for a popular game or migration server.
    -- Tune based on your actual concurrent player count and workload.
    -- Call this ONLY during server initialization, once per type.

    local function safeSet(
        requestTypeName: string,
        requestType: Enum.DataStoreRequestType,
        base: number,
        perPlayer: number
    )
        local ok, err = pcall(function()
            DataStoreService:SetRateLimitForRequestType(requestType, base, perPlayer)
        end)
        if ok then
            print("Configured", requestTypeName, "base=", base, "perPlayer=", perPlayer)
        else
            warn("Failed to set rate limit for", requestTypeName, err)
        end
    end

    -- These are examples — respect the per-type constraints documented in the class reference.
    -- The per-player StandardWrite value here matches the Roblox default (40). Lowering it reduces
    -- per-server burst but can cause write throttling under load; raising it increases headroom
    -- but also raises the ceiling on how much a single server can consume.
    safeSet("StandardRead", Enum.DataStoreRequestType.StandardRead, 2000, 50)
    safeSet("StandardWrite", Enum.DataStoreRequestType.StandardWrite, 1500, 40)
    safeSet("StandardList", Enum.DataStoreRequestType.StandardList, 300, 5)
    safeSet("StandardRemove", Enum.DataStoreRequestType.StandardRemove, 1000, 20)

    safeSet("OrderedRead", Enum.DataStoreRequestType.OrderedRead, 1500, 40)
    safeSet("OrderedWrite", Enum.DataStoreRequestType.OrderedWrite, 1000, 20)
    -- OrderedList: SetRateLimitForRequestType accepts the enum, but GetRequestBudgetForRequestType
    -- always returns 0 for it, so the limit cannot be inspected at runtime.
    safeSet("OrderedList", Enum.DataStoreRequestType.OrderedList, 150, 3)
    safeSet("OrderedRemove", Enum.DataStoreRequestType.OrderedRemove, 800, 15)
end

function BudgetMonitor.waitForAnyBudget(requestTypeName: string, timeout: number?): boolean
    local enumItem = REQUEST_TYPES_BY_NAME[requestTypeName]
    if not enumItem then
        return false
    end
    if requestTypeName == "OrderedList" then
        warn(
            "Cannot wait for budget of "
                .. requestTypeName
                .. "; GetRequestBudgetForRequestType always returns 0 for this type."
        )
        return false
    end

    local start = os.clock()
    while DataStoreService:GetRequestBudgetForRequestType(enumItem) <= 0 do
        if os.clock() - start > (timeout or 30) then
            return false
        end
        task.wait(0.25)
    end
    return true
end

return BudgetMonitor
