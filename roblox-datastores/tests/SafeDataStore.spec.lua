--!strict
local function expect(condition: boolean)
    if not condition then
        error("regression expectation failed", 2)
    end
end

return function()
    local SafeDataStore = require(script.Parent.Parent.scripts.SafeDataStore)

    local function fakeStore(reconciled: boolean?): SafeDataStore.SafeDataStore
        local fake = setmetatable({
            _maxRetries = 3,
            _log = function() end,
            _backoff = function()
                return 0
            end,
            _reconcile = function()
                return {
                    status = if reconciled then "committed" else "unknown",
                    attempts = 1,
                    value = if reconciled then { operationId = "abc" } else nil,
                    keyInfo = nil,
                    error = nil,
                }
            end,
        }, SafeDataStore)
        return (fake :: unknown) :: SafeDataStore.SafeDataStore
    end

    local calls = 0
    local store = fakeStore()
    local firstResult = SafeDataStore._write(store, "key", {}, function()
        calls += 1
        error("InternalError")
    end, nil)
    expect(calls == 1 and firstResult.status == "unknown")

    calls = 0
    store = fakeStore()
    local replayResult = SafeDataStore._write(store, "key", {}, function()
        calls += 1
        error("InternalError")
    end, { idempotent = true })
    expect(calls == 3 and replayResult.status == "unknown")

    calls = 0
    store = fakeStore(true)
    local reconciledResult = SafeDataStore._write(store, "key", {}, function()
        calls += 1
        error("InternalError")
    end, {
        idempotent = true,
        reconcile = function()
            return "committed"
        end,
    })
    expect(calls == 1 and reconciledResult.status == "committed")
end
