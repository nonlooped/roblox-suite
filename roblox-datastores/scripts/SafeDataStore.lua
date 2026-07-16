--!strict
-- Status: reviewed
-- Last verified: 2026-07-16
-- Test coverage: write-state regression fixture in tests/SafeDataStore.spec.lua; Studio integration still required.
-- Intended use: safety-oriented example; adapt and test against a dedicated test experience.
--[[
SafeDataStore.lua

Reads retry automatically. Writes do not: once a write call is invoked and
fails, Roblox documents that the backend outcome can be unknown. The caller
receives committed/rejected/unknown and must reconcile with a fresh read.

SetAsync-style writes preserve existing metadata atomically through
UpdateAsync when userIds or metadata are omitted. Increment operations are
implemented as one atomic UpdateAsync call and are never replayed by this
wrapper. Update transforms may run multiple times inside Roblox and therefore
must not yield or perform external side effects.
]]

local DataStoreService = game:GetService("DataStoreService")
local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")

if RunService:IsClient() then
    error("SafeDataStore must be required on the server", 2)
end

local MAX_KEY_LENGTH = 50
local MAX_USER_IDS = 50
local MAX_VALUE_SIZE = 4 * 1024 * 1024

export type WriteStatus = "committed" | "rejected" | "unknown"
export type WriteResult = {
    status: WriteStatus,
    value: any?,
    keyInfo: DataStoreKeyInfo?,
    error: any?,
    attempts: number,
}
export type Reconcile = (freshValue: any, freshInfo: DataStoreKeyInfo?) -> WriteStatus
export type WriteOptions = {
    -- Declares that replaying the entire operation is safe. False by default.
    idempotent: boolean?,
    -- Classifies a fresh, uncached read after an ambiguous response.
    reconcile: Reconcile?,
}
export type UpdateTransform = (
    currentValue: any,
    keyInfo: DataStoreKeyInfo?
) -> (any?, { number }?, { [string]: any }?)

type WriteOperation = () -> (any?, DataStoreKeyInfo?)

local SafeDataStore = {}
SafeDataStore.__index = SafeDataStore

type SafeDataStoreState = {
    _store: DataStore,
    _name: string,
    _maxRetries: number,
    _backoffBase: number,
    _backoffCap: number,
}

export type SafeDataStore = typeof(setmetatable({} :: SafeDataStoreState, SafeDataStore))

local function result(
    status: WriteStatus,
    attempts: number,
    value: any?,
    keyInfo: DataStoreKeyInfo?,
    err: any?
): WriteResult
    return {
        status = status,
        attempts = attempts,
        value = value,
        keyInfo = keyInfo,
        error = err,
    }
end

local function isTransientError(err: any): boolean
    if type(err) ~= "string" then
        return false
    end
    return err:match("[Tt]hrottl") ~= nil
        or err:match("[Ii]nternal") ~= nil
        or err:match("RequestRejected") ~= nil
        or err:match("DataModelNoAccess") ~= nil
end

local function validateKey(key: any): (boolean, string?)
    if type(key) ~= "string" or #key == 0 or #key > MAX_KEY_LENGTH then
        return false, `key must be a non-empty string up to {MAX_KEY_LENGTH} chars`
    end
    return true, nil
end

local function validateUserIds(userIds: any): (boolean, string?)
    if userIds == nil then
        return true, nil
    end
    if type(userIds) ~= "table" then
        return false, "userIds must be an array"
    end
    local count = 0
    for index, id in userIds do
        count += 1
        if
            type(index) ~= "number"
            or index % 1 ~= 0
            or index < 1
            or type(id) ~= "number"
            or id ~= id
            or id == math.huge
            or id == -math.huge
            or id % 1 ~= 0
        then
            return false, "userIds must be a dense array of finite integers"
        end
    end
    if count > MAX_USER_IDS then
        return false, `userIds array exceeds {MAX_USER_IDS} entries`
    end
    for index = 1, count do
        if userIds[index] == nil then
            return false, "userIds must not contain gaps"
        end
    end
    return true, nil
end

local function validateValueSize(value: any): (boolean, string?)
    local ok, encoded = pcall(function()
        return HttpService:JSONEncode(value)
    end)
    if not ok then
        return false, "value is not JSON-serializable"
    end
    if #encoded > MAX_VALUE_SIZE then
        return false, `serialized value exceeds {MAX_VALUE_SIZE} bytes`
    end
    return true, nil
end

local function preserve<T>(existing: T?, replacement: T?, empty: T): T
    if replacement ~= nil then
        return replacement
    end
    if existing ~= nil then
        return existing
    end
    return empty
end

function SafeDataStore.new(name: string, scope: string?, options: DataStoreOptions?): SafeDataStore
    assert(type(name) == "string" and name ~= "", "name must be a non-empty string")
    local self = setmetatable({
        _store = DataStoreService:GetDataStore(name, scope or "", options),
        _name = name,
        _maxRetries = 3,
        _backoffBase = 0.5,
        _backoffCap = 8,
    }, SafeDataStore)
    return self
end

function SafeDataStore:_log(level: string, message: string, ...: any)
    warn(`[SafeDS:{self._name}:{level}] {string.format(message, ...)}`)
end

function SafeDataStore._backoff(self: SafeDataStore, attempt: number): number
    local capped = math.min(self._backoffBase * (2 ^ (attempt - 1)), self._backoffCap)
    return capped + math.random() * capped * 0.5
end

function SafeDataStore:_waitForBudget(
    requestType: Enum.DataStoreRequestType,
    maxWait: number?
): boolean
    local started = os.clock()
    local limit = maxWait or 30
    while DataStoreService:GetRequestBudgetForRequestType(requestType) <= 0 do
        if os.clock() - started >= limit then
            return false
        end
        task.wait(0.25)
    end
    return true
end

function SafeDataStore:getAsync(key: string, useCache: boolean?): (any?, DataStoreKeyInfo?, any?)
    local valid, validationError = validateKey(key)
    if not valid then
        return nil, nil, validationError
    end

    local getOptions: DataStoreGetOptions? = nil
    if useCache == false then
        local noCacheOptions = Instance.new("DataStoreGetOptions")
        noCacheOptions.UseCache = false
        getOptions = noCacheOptions
    end

    for attempt = 1, self._maxRetries do
        if not self:_waitForBudget(Enum.DataStoreRequestType.StandardRead) then
            return nil, nil, "BudgetTimeout"
        end
        local success, value, keyInfo = pcall(function()
            return self._store:GetAsync(key, getOptions)
        end)
        if success then
            return value, keyInfo, nil
        end
        self:_log("ERROR", "GetAsync attempt %d failed for %s: %s", attempt, key, tostring(value))
        if attempt == self._maxRetries or not isTransientError(value) then
            return nil, nil, value
        end
        task.wait(self:_backoff(attempt))
    end
    return nil, nil, "MaxRetriesExceeded"
end

function SafeDataStore:_reconcile(key: string, callback: Reconcile): WriteResult
    local value, keyInfo, readError = self:getAsync(key, false)
    if readError ~= nil then
        return result("unknown", 1, nil, nil, readError)
    end
    local ok, status = pcall(callback, value, keyInfo)
    if not ok then
        return result("unknown", 1, value, keyInfo, status)
    end
    if status ~= "committed" and status ~= "rejected" and status ~= "unknown" then
        return result("unknown", 1, value, keyInfo, "reconcile returned an invalid status")
    end
    return result(status, 1, value, keyInfo, nil)
end

function SafeDataStore:_write(
    key: string,
    requestTypes: { Enum.DataStoreRequestType },
    operation: WriteOperation,
    options: WriteOptions?
): WriteResult
    local writeOptions: WriteOptions = options or {}
    local maxAttempts = if writeOptions.idempotent == true then self._maxRetries else 1

    for attempt = 1, maxAttempts do
        for _, requestType in requestTypes do
            if not self:_waitForBudget(requestType) then
                return result("rejected", attempt - 1, nil, nil, "BudgetTimeout")
            end
        end

        local success, value, keyInfo = pcall(operation)
        if success then
            return result("committed", attempt, value, keyInfo, nil)
        end

        local writeError = value
        self:_log("ERROR", "write attempt %d failed for %s: %s", attempt, key, tostring(writeError))
        if writeOptions.reconcile then
            local reconciled = self:_reconcile(key, writeOptions.reconcile)
            reconciled.attempts = attempt
            if reconciled.status ~= "unknown" then
                return reconciled
            end
        end

        local mayReplay = writeOptions.idempotent == true
            and attempt < maxAttempts
            and isTransientError(writeError)
        if not mayReplay then
            return result("unknown", attempt, nil, nil, writeError)
        end
        task.wait(self:_backoff(attempt))
    end

    return result("unknown", maxAttempts, nil, nil, "MaxRetriesExceeded")
end

function SafeDataStore:setAsync(
    key: string,
    value: any,
    userIds: { number }?,
    metadata: { [string]: any }?,
    options: WriteOptions?
): WriteResult
    local valid, validationError = validateKey(key)
    if not valid then
        return result("rejected", 0, nil, nil, validationError)
    end
    valid, validationError = validateUserIds(userIds)
    if not valid then
        return result("rejected", 0, nil, nil, validationError)
    end
    valid, validationError = validateValueSize(value)
    if not valid then
        return result("rejected", 0, nil, nil, validationError)
    end

    if userIds == nil or metadata == nil then
        return self:_write(
            key,
            { Enum.DataStoreRequestType.StandardRead, Enum.DataStoreRequestType.StandardWrite },
            function()
                return self._store:UpdateAsync(key, function(_current, keyInfo)
                    return value,
                        preserve(keyInfo and keyInfo:GetUserIds() or nil, userIds, {}),
                        preserve(keyInfo and keyInfo:GetMetadata() or nil, metadata, {})
                end)
            end,
            options
        )
    end

    local setOptions = Instance.new("DataStoreSetOptions")
    setOptions:SetMetadata(metadata)
    return self:_write(key, { Enum.DataStoreRequestType.StandardWrite }, function()
        return self._store:SetAsync(key, value, userIds, setOptions), nil
    end, options)
end

function SafeDataStore:updateAsync(
    key: string,
    transform: UpdateTransform,
    options: WriteOptions?
): WriteResult
    local valid, validationError = validateKey(key)
    if not valid then
        return result("rejected", 0, nil, nil, validationError)
    end
    if type(transform) ~= "function" then
        return result("rejected", 0, nil, nil, "transform must be a function")
    end

    local cancelled = false
    local writeResult = self:_write(
        key,
        { Enum.DataStoreRequestType.StandardRead, Enum.DataStoreRequestType.StandardWrite },
        function()
            return self._store:UpdateAsync(key, function(current, keyInfo)
                local newValue, userIds, metadata = transform(current, keyInfo)
                if newValue == nil then
                    cancelled = true
                    return nil
                end
                return newValue,
                    preserve(keyInfo and keyInfo:GetUserIds() or nil, userIds, {}),
                    preserve(keyInfo and keyInfo:GetMetadata() or nil, metadata, {})
            end)
        end,
        options
    )
    if writeResult.status == "committed" and cancelled then
        return result("rejected", writeResult.attempts, nil, nil, "Cancelled")
    end
    return writeResult
end

function SafeDataStore:incrementAsync(
    key: string,
    delta: number?,
    userIds: { number }?,
    metadata: { [string]: any }?
): WriteResult
    local amount = delta or 1
    if amount % 1 ~= 0 then
        return result("rejected", 0, nil, nil, "delta must be an integer")
    end
    -- One UpdateAsync invocation preserves metadata atomically. This wrapper
    -- intentionally never replays IncrementAsync after an ambiguous response.
    return self:updateAsync(key, function(current, keyInfo)
        if current ~= nil and type(current) ~= "number" then
            error("stored value is not a number")
        end
        return (current or 0) + amount,
            preserve(keyInfo and keyInfo:GetUserIds() or nil, userIds, {}),
            preserve(keyInfo and keyInfo:GetMetadata() or nil, metadata, {})
    end)
end

function SafeDataStore:removeAsync(key: string, options: WriteOptions?): WriteResult
    local valid, validationError = validateKey(key)
    if not valid then
        return result("rejected", 0, nil, nil, validationError)
    end
    return self:_write(key, { Enum.DataStoreRequestType.StandardRemove }, function()
        return self._store:RemoveAsync(key)
    end, options)
end

function SafeDataStore:verifyAfterWrite(key: string): (any?, DataStoreKeyInfo?, any?)
    return self:getAsync(key, false)
end

function SafeDataStore:listKeysAsync(
    prefix: string?,
    pageSize: number?,
    cursor: string?,
    excludeDeleted: boolean?
): (DataStoreKeyPages?, any?)
    for attempt = 1, self._maxRetries do
        if not self:_waitForBudget(Enum.DataStoreRequestType.StandardList) then
            return nil, "BudgetTimeout"
        end
        local success, pages = pcall(function()
            return self._store:ListKeysAsync(prefix, pageSize, cursor, excludeDeleted)
        end)
        if success then
            return pages, nil
        end
        if attempt == self._maxRetries or not isTransientError(pages) then
            return nil, pages
        end
        task.wait(self:_backoff(attempt))
    end
    return nil, "MaxRetriesExceeded"
end

function SafeDataStore:listVersionsAsync(
    key: string,
    sortDirection: Enum.SortDirection?,
    minDate: number?,
    maxDate: number?,
    pageSize: number?
): (DataStoreVersionPages?, any?)
    local valid, validationError = validateKey(key)
    if not valid then
        return nil, validationError
    end
    for attempt = 1, self._maxRetries do
        if not self:_waitForBudget(Enum.DataStoreRequestType.StandardList) then
            return nil, "BudgetTimeout"
        end
        local success, pages = pcall(function()
            return self._store:ListVersionsAsync(key, sortDirection, minDate, maxDate, pageSize)
        end)
        if success then
            return pages, nil
        end
        if attempt == self._maxRetries or not isTransientError(pages) then
            return nil, pages
        end
        task.wait(self:_backoff(attempt))
    end
    return nil, "MaxRetriesExceeded"
end

return SafeDataStore
