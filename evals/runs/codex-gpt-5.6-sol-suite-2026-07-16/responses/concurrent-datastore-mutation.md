# concurrent-datastore-mutation

This uses `UpdateAsync`, so two servers adding coins to the same profile do not overwrite each other. A server-created operation ID makes retries and reconciliation idempotent.

```lua
--!strict
-- Server-only ModuleScript

local DataStoreService = game:GetService("DataStoreService")
local HttpService = game:GetService("HttpService")

local profiles = DataStoreService:GetDataStore("PlayerProfiles_v3")

export type MutationState = "committed" | "not_committed" | "unknown"

export type MutationResult = {
    state: MutationState,
    operationId: string,
    profile: any?,
    error: any?,
}

local function cloneDictionary(source: any): { [any]: any }
    local result = {}
    if type(source) == "table" then
        for key, value in source do
            result[key] = value
        end
    end
    return result
end

local function containsUserId(userIds: { number }, userId: number): boolean
    for _, existing in userIds do
        if existing == userId then
            return true
        end
    end
    return false
end

local function freshRead(key: string): (boolean, any)
    local options = Instance.new("DataStoreGetOptions")
    options.UseCache = false

    local ok, value = pcall(function()
        return profiles:GetAsync(key, options)
    end)
    return ok, value
end

local function add100Coins(
    userId: number,
    operationId: string?
): MutationResult
    local opId = operationId or HttpService:GenerateGUID(false)
    local key = `profile:{userId}`

    local ok, valueOrError = pcall(function()
        return profiles:UpdateAsync(key, function(current: any, info: DataStoreKeyInfo?)
            local profile = cloneDictionary(current)
            local coins = profile.Coins or 0

            if type(coins) ~= "number" or coins % 1 ~= 0 or coins < 0 then
                error("Stored Coins value is invalid")
            end

            local applied = cloneDictionary(profile.AppliedMutations)
            if applied[opId] ~= true then
                profile.Coins = coins + 100
                applied[opId] = true
                profile.AppliedMutations = applied
            end

            -- Preserve every existing user ID and add this owner if necessary.
            local userIds = if info then info:GetUserIds() else {}
            if not containsUserId(userIds, userId) then
                userIds = table.clone(userIds)
                table.insert(userIds, userId)
            end

            -- Returning the existing metadata prevents UpdateAsync from clearing it.
            local metadata = if info then info:GetMetadata() else {}

            return profile, userIds, metadata
        end)
    end)

    if ok then
        return {
            state = "committed",
            operationId = opId,
            profile = valueOrError,
            error = nil,
        }
    end

    -- The request failed locally, but the backend might have committed it.
    local readOk, fresh = freshRead(key)
    if not readOk then
        return {
            state = "unknown",
            operationId = opId,
            profile = nil,
            error = valueOrError,
        }
    end

    if type(fresh) == "table"
        and type(fresh.AppliedMutations) == "table"
        and fresh.AppliedMutations[opId] == true
    then
        return {
            state = "committed",
            operationId = opId,
            profile = fresh,
            error = nil,
        }
    end

    return {
        state = "not_committed",
        operationId = opId,
        profile = fresh,
        error = valueOrError,
    }
end

return add100Coins
```

The callback must not yield, wait, access another DataStore, fire remotes, award achievements, or perform any other external side effect. Roblox may invoke it multiple times when resolving concurrent writes.

A failed `pcall` does not prove the mutation failed. The caller must retain the same `operationId`, reconcile with an uncached read, and reuse that ID for any later retry. Using a new ID could add another 100 coins. The operation ledger must remain durable; it may only be compacted when an equally durable receipt/archive proves old IDs can no longer be replayed.
