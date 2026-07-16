--!strict
local function expect(condition: boolean)
    if not condition then
        error("regression expectation failed", 2)
    end
end

return function()
    local OpenCloudRequest = require(script.Parent.Parent.scripts.OpenCloudRequest)

    local mayRetry, attempts = OpenCloudRequest._retryPlan("GET", { maxAttempts = 4 })
    expect(mayRetry and attempts == 4)

    mayRetry, attempts = OpenCloudRequest._retryPlan("POST", { maxAttempts = 4 })
    expect(not mayRetry and attempts == 1)

    mayRetry, attempts = OpenCloudRequest._retryPlan("POST", {
        maxAttempts = 4,
        idempotent = true,
    })
    expect(mayRetry and attempts == 4)

    local response: OpenCloudRequest.CloudResponse = {
        Success = false,
        StatusCode = 429,
        StatusMessage = "Too Many Requests",
        Body = "",
        Headers = { ["retry-after"] = "7", ["x-ratelimit-reset"] = "20" },
    }
    expect(OpenCloudRequest._retryDelay(response, 1) == 7)

    response.Headers = { ["x-ratelimit-reset"] = "20" }
    expect(OpenCloudRequest._retryDelay(response, 1) == 20)

    response.Headers = {}
    expect(OpenCloudRequest._retryDelay(response, 3) == 2)
end
