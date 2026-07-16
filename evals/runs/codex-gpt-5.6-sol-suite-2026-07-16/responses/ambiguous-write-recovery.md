# ambiguous-write-recovery

Assign every logical effect a stable server-generated operation ID and store that ID atomically with the effect. Recovery always reuses the same ID.

```lua
--!strict
-- Server-only ModuleScript

local DataStoreService = game:GetService("DataStoreService")

local store = DataStoreService:GetDataStore("Economy_v4")

export type RecoveryState =
    "committed"
    | "not_committed"
    | "unknown"
    | "rejected"

export type RecoveryResult = {
    state: RecoveryState,
    operationId: string,
    value: any?,
    error: any?,
}

local function readFresh(key: string): (boolean, any)
    local options = Instance.new("DataStoreGetOptions")
    options.UseCache = false

    return pcall(function()
        return store:GetAsync(key, options)
    end)
end

local function hasOperation(value: any, operationId: string): boolean
    return type(value) == "table"
        and type(value.AppliedOperations) == "table"
        and value.AppliedOperations[operationId] == true
end

local function applyCoinDeltaOnce(
    userId: number,
    delta: number,
    operationId: string
): RecoveryResult
    if delta % 1 ~= 0 or delta <= 0 or operationId == "" then
        return {
            state = "rejected",
            operationId = operationId,
            value = nil,
            error = "invalid_argument",
        }
    end

    local key = `wallet:{userId}`

    local writeOk, valueOrError = pcall(function()
        return store:UpdateAsync(key, function(current: any, info: DataStoreKeyInfo?)
            local wallet = if type(current) == "table"
                then table.clone(current)
                else { Coins = 0 }

            local coins = wallet.Coins or 0
            if type(coins) ~= "number" or coins % 1 ~= 0 or coins < 0 then
                error("corrupt wallet")
            end

            local operations = if type(wallet.AppliedOperations) == "table"
                then table.clone(wallet.AppliedOperations)
                else {}

            if operations[operationId] ~= true then
                wallet.Coins = coins + delta
                operations[operationId] = true
                wallet.AppliedOperations = operations
            end

            local userIds = if info then info:GetUserIds() else { userId }
            local metadata = if info then info:GetMetadata() else {}

            return wallet, userIds, metadata
        end)
    end)

    if writeOk then
        return {
            state = "committed",
            operationId = operationId,
            value = valueOrError,
            error = nil,
        }
    end

    -- Never immediately replay an ambiguous write.
    local readOk, freshOrError = readFresh(key)
    if not readOk then
        return {
            state = "unknown",
            operationId = operationId,
            value = nil,
            error = freshOrError,
        }
    end

    if hasOperation(freshOrError, operationId) then
        return {
            state = "committed",
            operationId = operationId,
            value = freshOrError,
            error = nil,
        }
    end

    return {
        state = "not_committed",
        operationId = operationId,
        value = freshOrError,
        error = valueOrError,
    }
end

return applyCoinDeltaOnce
```

State meanings are explicit:

- `committed`: the write returned successfully or a fresh read found its operation marker.
- `not_committed`: a fresh backend read succeeded and did not contain the marker. Retrying is safe only with the same operation ID.
- `unknown`: neither the original response nor reconciliation established the backend outcome. Do not compensate, replay with a new ID, or tell the player the effect definitely failed.
- `rejected`: validation failed before a backend write was attempted.

If recovery itself fails, persist or queue the unresolved operation ID and reconcile later. A replacement operation must never receive a new ID merely because its first response was ambiguous.
