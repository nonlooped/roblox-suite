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

local REQUEST_TYPES = {
    "StandardRead", "StandardWrite", "StandardList", "StandardRemove",
    "OrderedRead", "OrderedWrite", "OrderedRemove",
    -- Note: GetVersionAsync/GetVersionAtTimeAsync count as StandardRead, not separate budget categories.
    -- OrderedList is intentionally omitted: GetRequestBudgetForRequestType always returns 0 for it.
}

local NO_BUDGET_INSPECTION = {
    OrderedList = true,
}

function BudgetMonitor.printAllBudgets()
    print("=== Current DataStore Request Budgets ===")
    for _, name in ipairs(REQUEST_TYPES) do
        local enumItem = Enum.DataStoreRequestType[name]
        if enumItem then
            local budget = DataStoreService:GetRequestBudgetForRequestType(enumItem)
            print(string.format("%-20s : %d", name, budget))
        end
    end
    print("OrderedList            : budget inspection always returns 0")
end

function BudgetMonitor.configureForBusyServer()
    -- Example aggressive but reasonable settings for a popular game or migration server.
    -- Tune based on your actual concurrent player count and workload.
    -- Call this ONLY during server initialization, once per type.

    local function safeSet(requestTypeName, base, perPlayer)
        local enumItem = Enum.DataStoreRequestType[requestTypeName]
        if enumItem then
            local ok, err = pcall(function()
                DataStoreService:SetRateLimitForRequestType(enumItem, base, perPlayer)
            end)
            if ok then
                print("Configured", requestTypeName, "base=", base, "perPlayer=", perPlayer)
            else
                warn("Failed to set rate limit for", requestTypeName, err)
            end
        end
    end

    -- These are examples — respect the per-type constraints documented in the class reference.
    -- The per-player StandardWrite value here matches the Roblox default (40). Lowering it reduces
    -- per-server burst but can cause write throttling under load; raising it increases headroom
    -- but also raises the ceiling on how much a single server can consume.
    safeSet("StandardRead", 2000, 50)
    safeSet("StandardWrite", 1500, 40)
    safeSet("StandardList", 300, 5)
    safeSet("StandardRemove", 1000, 20)

    safeSet("OrderedRead", 1500, 40)
    safeSet("OrderedWrite", 1000, 20)
    safeSet("OrderedList", 150, 3)
    safeSet("OrderedRemove", 800, 15)
end

function BudgetMonitor.waitForAnyBudget(requestTypeName, timeout)
    local enumItem = Enum.DataStoreRequestType[requestTypeName]
    if not enumItem then return false end
    if NO_BUDGET_INSPECTION[requestTypeName] then
        warn("Cannot wait for budget of " .. requestTypeName .. "; GetRequestBudgetForRequestType always returns 0 for this type.")
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
