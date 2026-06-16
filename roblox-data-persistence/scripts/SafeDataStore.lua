--[[
SafeDataStore.lua
A production-oriented, server-only wrapper around DataStoreService that handles:
- Server-side guard (fails fast if required from client)
- Key/userIds/value validation before writes
- Consistent pcall + error classification
- Budget-aware waiting (rechecked before every attempt)
- Exponential backoff + jitter retry for transient errors
- Automatic metadata/userIds round-trip on SetAsync/IncrementAsync
- Existing metadata/userIds injection for UpdateAsync unless explicitly overridden
- RemoveAsync, ListKeysAsync, ListVersionsAsync wrappers
- Fresh verification reads after writes
- Logging hooks

Usage (server only):
local SafeDS = require(path.to.SafeDataStore)
local store = SafeDS.new("PlayerData", "")  -- or with options

local data, info = store:getAsync("User_" .. userId)
store:updateAsync("User_" .. userId, function(current, keyInfo)
    current = current or {}
    current.Gold = (current.Gold or 0) + 50
    return current  -- existing userIds/metadata are preserved automatically
end)

IMPORTANT: Transform functions passed to updateAsync must not yield.
]]

local DataStoreService = game:GetService("DataStoreService")
local HttpService = game:GetService("HttpService")
local RunService = game:GetService("RunService")

if RunService:IsClient() then
    error("SafeDataStore must be required on the server", 2)
end

local SafeDataStore = {}
SafeDataStore.__index = SafeDataStore

local MAX_KEY_LENGTH = 50
local MAX_USER_IDS = 50
local MAX_VALUE_SIZE = 4 * 1024 * 1024

local function isTransientError(err)
    if type(err) ~= "string" then return false end
    return err:match("Throttle") or err:match("throttled") or
           err:match("Internal") or err:match("internal") or
           err:match("RequestRejected") or err:match("DataModelNoAccess")
end

local function validateKey(key)
    if type(key) ~= "string" or #key == 0 or #key > MAX_KEY_LENGTH then
        return false, string.format("key must be a non-empty string up to %d chars", MAX_KEY_LENGTH)
    end
    return true
end

local function validateUserIds(userIds)
    if userIds == nil then return true end
    if type(userIds) ~= "table" then
        return false, "userIds must be a table"
    end
    if #userIds > MAX_USER_IDS then
        return false, string.format("userIds array exceeds %d entries", MAX_USER_IDS)
    end
    for _, id in ipairs(userIds) do
        if type(id) ~= "number" then
            return false, "userIds must be numbers"
        end
    end
    return true
end

local function validateValueSize(value)
    local ok, encoded = pcall(HttpService.JSONEncode, HttpService, value)
    if not ok then
        return false, "value is not JSON-serializable"
    end
    if #encoded > MAX_VALUE_SIZE then
        return false, string.format("serialized value exceeds %d bytes", MAX_VALUE_SIZE)
    end
    return true
end

local function mergeDefaults(existing, override)
    if override ~= nil then return override end
    if existing ~= nil then return existing end
    return {}
end

function SafeDataStore.new(name, scope, options)
    local self = setmetatable({}, SafeDataStore)
    self._store = DataStoreService:GetDataStore(name, scope or "", options)
    self._name = name
    self._scope = scope or ""
    self._maxRetries = 3
    self._backoffBase = 0.5
    self._backoffCap = 8
    return self
end

function SafeDataStore:_log(level, msg, ...)
    -- Replace with your logging system (AnalyticsService, etc.)
    print(string.format("[SafeDS:%s] %s: %s", level, self._name, string.format(msg, ...)))
end

function SafeDataStore:_backoff(attempt)
    local exponential = self._backoffBase * (2 ^ (attempt - 1))
    local capped = math.min(exponential, self._backoffCap)
    local jitter = math.random() * capped * 0.5
    return capped + jitter
end

function SafeDataStore:_waitForBudget(requestType, maxWait)
    maxWait = maxWait or 30
    local start = os.clock()
    while DataStoreService:GetRequestBudgetForRequestType(requestType) <= 0 do
        if os.clock() - start > maxWait then
            return false
        end
        task.wait(0.25)
    end
    return true
end

function SafeDataStore:getAsync(key, useCache)
    local ok, err = validateKey(key)
    if not ok then return nil, nil, err end

    local opts
    if useCache == false then
        opts = Instance.new("DataStoreGetOptions")
        opts.UseCache = false
    end

    local requestType = Enum.DataStoreRequestType.StandardRead

    for attempt = 1, self._maxRetries do
        if not self:_waitForBudget(requestType) then
            self:_log("WARN", "Budget timeout on GetAsync for key %s", key)
            return nil, nil, "BudgetTimeout"
        end

        local success, value, keyInfo = pcall(function()
            return self._store:GetAsync(key, opts)
        end)
        if success then
            return value, keyInfo
        end

        self:_log("ERROR", "GetAsync failed (attempt %d) key=%s err=%s", attempt, key, tostring(value))

        if attempt < self._maxRetries and isTransientError(value) then
            task.wait(self:_backoff(attempt))
        else
            return nil, nil, value
        end
    end

    return nil, nil, "MaxRetriesExceeded"
end

function SafeDataStore:_getExistingInfo(key)
    local value, info = self:getAsync(key, true)
    return info
end

function SafeDataStore:setAsync(key, value, userIds, metadataTable)
    local ok, err = validateKey(key)
    if not ok then return false, err end
    ok, err = validateUserIds(userIds)
    if not ok then return false, err end
    ok, err = validateValueSize(value)
    if not ok then return false, err end

    local needsExisting = userIds == nil or metadataTable == nil
    local existingInfo
    if needsExisting then
        existingInfo = self:_getExistingInfo(key)
    end

    local finalUserIds = mergeDefaults(existingInfo and existingInfo:GetUserIds() or nil, userIds)
    local finalMetadata = mergeDefaults(existingInfo and existingInfo:GetMetadata() or nil, metadataTable)

    local setOptions = Instance.new("DataStoreSetOptions")
    setOptions:SetMetadata(finalMetadata)

    local requestType = Enum.DataStoreRequestType.StandardWrite

    for attempt = 1, self._maxRetries do
        if not self:_waitForBudget(requestType) then
            self:_log("WARN", "Budget timeout on SetAsync for key %s", key)
            return false, "BudgetTimeout"
        end

        local success, result = pcall(function()
            return self._store:SetAsync(key, value, finalUserIds, setOptions)
        end)

        if success then
            return true, result
        end

        self:_log("ERROR", "SetAsync failed (attempt %d) key=%s err=%s", attempt, key, tostring(result))

        if attempt < self._maxRetries and isTransientError(result) then
            task.wait(self:_backoff(attempt))
        else
            return false, result
        end
    end

    return false, "MaxRetriesExceeded"
end

function SafeDataStore:updateAsync(key, transformFn)
    -- transformFn receives (currentValue, keyInfo?) and must return (newValue, userIds?, metadata?) or nil to cancel.
    -- The transform MUST NOT YIELD (no task.wait, no datastore calls, no async work).
    local ok, err = validateKey(key)
    if not ok then return false, err end
    if type(transformFn) ~= "function" then
        return false, "transformFn must be a function"
    end

    local wrappedTransform = function(currentValue, keyInfo)
        local userResult, userIds, metadata = transformFn(currentValue, keyInfo)
        if userResult == nil then
            return nil
        end
        local finalUserIds = mergeDefaults(keyInfo and keyInfo:GetUserIds() or nil, userIds)
        local finalMetadata = mergeDefaults(keyInfo and keyInfo:GetMetadata() or nil, metadata)
        return userResult, finalUserIds, finalMetadata
    end

    local requestTypeRead = Enum.DataStoreRequestType.StandardRead
    local requestTypeWrite = Enum.DataStoreRequestType.StandardWrite

    for attempt = 1, self._maxRetries do
        if not self:_waitForBudget(requestTypeRead) or not self:_waitForBudget(requestTypeWrite) then
            self:_log("WARN", "Budget timeout on UpdateAsync for key %s", key)
            return false, "BudgetTimeout"
        end

        local success, newValue, keyInfo = pcall(function()
            return self._store:UpdateAsync(key, wrappedTransform)
        end)

        if success then
            return true, newValue, keyInfo
        end

        self:_log("ERROR", "UpdateAsync failed (attempt %d) key=%s err=%s", attempt, key, tostring(newValue))

        if attempt < self._maxRetries and isTransientError(newValue) then
            task.wait(self:_backoff(attempt))
        else
            return false, newValue
        end
    end

    return false, "MaxRetriesExceeded"
end

function SafeDataStore:incrementAsync(key, delta, userIds, metadataTable)
    local ok, err = validateKey(key)
    if not ok then return nil, err end
    ok, err = validateUserIds(userIds)
    if not ok then return nil, err end

    local needsExisting = userIds == nil or metadataTable == nil
    local existingInfo
    if needsExisting then
        existingInfo = self:_getExistingInfo(key)
    end

    local finalUserIds = mergeDefaults(existingInfo and existingInfo:GetUserIds() or nil, userIds)
    local finalMetadata = mergeDefaults(existingInfo and existingInfo:GetMetadata() or nil, metadataTable)

    local incOptions = Instance.new("DataStoreIncrementOptions")
    incOptions:SetMetadata(finalMetadata)

    local requestType = Enum.DataStoreRequestType.StandardWrite

    for attempt = 1, self._maxRetries do
        if not self:_waitForBudget(requestType) then
            self:_log("WARN", "Budget timeout on IncrementAsync for key %s", key)
            return nil, "BudgetTimeout"
        end

        local success, result = pcall(function()
            return self._store:IncrementAsync(key, delta or 1, finalUserIds, incOptions)
        end)

        if success then
            return result
        end

        self:_log("ERROR", "IncrementAsync failed (attempt %d) key=%s err=%s", attempt, key, tostring(result))

        if attempt < self._maxRetries and isTransientError(result) then
            task.wait(self:_backoff(attempt))
        else
            return nil, result
        end
    end

    return nil, "MaxRetriesExceeded"
end

function SafeDataStore:removeAsync(key)
    local ok, err = validateKey(key)
    if not ok then return false, err end

    local requestType = Enum.DataStoreRequestType.StandardRemove

    for attempt = 1, self._maxRetries do
        if not self:_waitForBudget(requestType) then
            self:_log("WARN", "Budget timeout on RemoveAsync for key %s", key)
            return false, "BudgetTimeout"
        end

        local success, oldValue, oldInfo = pcall(function()
            return self._store:RemoveAsync(key)
        end)

        if success then
            return true, oldValue, oldInfo
        end

        self:_log("ERROR", "RemoveAsync failed (attempt %d) key=%s err=%s", attempt, key, tostring(oldValue))

        if attempt < self._maxRetries and isTransientError(oldValue) then
            task.wait(self:_backoff(attempt))
        else
            return false, oldValue
        end
    end

    return false, "MaxRetriesExceeded"
end

function SafeDataStore:listKeysAsync(prefix, pageSize, cursor, excludeDeleted)
    local requestType = Enum.DataStoreRequestType.StandardList

    for attempt = 1, self._maxRetries do
        if not self:_waitForBudget(requestType) then
            self:_log("WARN", "Budget timeout on ListKeysAsync")
            return nil, "BudgetTimeout"
        end

        local success, pages = pcall(function()
            return self._store:ListKeysAsync(prefix, pageSize, cursor, excludeDeleted)
        end)

        if success then
            return pages
        end

        self:_log("ERROR", "ListKeysAsync failed (attempt %d) err=%s", attempt, tostring(pages))

        if attempt < self._maxRetries and isTransientError(pages) then
            task.wait(self:_backoff(attempt))
        else
            return nil, pages
        end
    end

    return nil, "MaxRetriesExceeded"
end

function SafeDataStore:listVersionsAsync(key, sortDirection, minDate, maxDate, pageSize)
    local ok, err = validateKey(key)
    if not ok then return nil, err end

    local requestType = Enum.DataStoreRequestType.StandardList

    for attempt = 1, self._maxRetries do
        if not self:_waitForBudget(requestType) then
            self:_log("WARN", "Budget timeout on ListVersionsAsync for key %s", key)
            return nil, "BudgetTimeout"
        end

        local success, pages = pcall(function()
            return self._store:ListVersionsAsync(key, sortDirection, minDate, maxDate, pageSize)
        end)

        if success then
            return pages
        end

        self:_log("ERROR", "ListVersionsAsync failed (attempt %d) key=%s err=%s", attempt, key, tostring(pages))

        if attempt < self._maxRetries and isTransientError(pages) then
            task.wait(self:_backoff(attempt))
        else
            return nil, pages
        end
    end

    return nil, "MaxRetriesExceeded"
end

-- Convenience: after any write that may have failed, force a fresh read to learn backend truth
function SafeDataStore:verifyAfterWrite(key)
    return self:getAsync(key, false)  -- UseCache = false
end

return SafeDataStore
