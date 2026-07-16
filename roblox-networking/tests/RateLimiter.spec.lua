--!strict
local function expect(condition: boolean)
    if not condition then
        error("regression expectation failed", 2)
    end
end

return function()
    local RateLimiter = require(script.Parent.Parent.scripts.RateLimiter)
    local now = 0
    local limiter = RateLimiter.new({
        capacity = 2,
        refillRate = 0.0001,
        defaultMinInterval = 1,
        maxActionsPerPlayer = 1,
        clock = function()
            return now
        end,
    })

    expect((limiter:_canPerformUserId(42, "BuyItem")))
    local immediate, immediateReason = limiter:_canPerformUserId(42, "BuyItem")
    expect(not immediate and immediateReason == "min_interval")

    now = 1
    expect((limiter:_canPerformUserId(42, "BuyItem")))
    now = 2
    local allowed, reason = limiter:_canPerformUserId(42, "BuyItem")
    expect(not allowed and reason == "token_bucket")

    local secondAction, actionReason = limiter:_canPerformUserId(42, "Trade")
    expect(not secondAction and actionReason == "action_limit")

    now = 10002
    expect((limiter:_canPerformUserId(42, "BuyItem")))
    limiter:destroy()
    local afterDestroy, destroyReason = limiter:_canPerformUserId(42, "BuyItem")
    expect(not afterDestroy and destroyReason == "destroyed")
    expect(limiter._connection == nil)
end
