--!strict
-- Status: reviewed
-- Last verified: 2026-07-16
-- Test coverage: retry-policy regression fixture in tests/OpenCloudRequest.spec.lua; endpoint integration still required.
-- Intended use: example; confirm endpoint-specific idempotency and authentication requirements.
--[[
OpenCloudRequest.lua

GET/HEAD/OPTIONS retry transient failures by default. Mutation retries require
an explicit idempotent=true declaration from the caller. In-experience Open
Cloud currently restricts request headers to x-api-key and content-type, so
idempotency must come from the endpoint/resource semantics rather than a custom
Idempotency-Key header.
]]

local HttpService = game:GetService("HttpService")

export type CloudResponse = {
    Success: boolean,
    StatusCode: number,
    StatusMessage: string,
    Body: string,
    Headers: { [string]: string },
}
export type RequestOptions = {
    maxAttempts: number?,
    idempotent: boolean?,
}

local BASE_URL = "https://apis.roblox.com/cloud/v2/"
local SAFE_METHODS = {
    GET = true,
    HEAD = true,
    OPTIONS = true,
}
local SUPPORTED_METHODS = {
    GET = true,
    HEAD = true,
    OPTIONS = true,
    POST = true,
    PUT = true,
    PATCH = true,
    DELETE = true,
}

local OpenCloudRequest = {}

local function getHeader(headers: { [string]: string }, wanted: string): string?
    local lowerWanted = string.lower(wanted)
    for name, value in headers do
        if string.lower(name) == lowerWanted then
            return value
        end
    end
    return nil
end

local function retryDelay(response: CloudResponse?, attempt: number): number
    if response then
        local retryAfter = tonumber(getHeader(response.Headers, "retry-after") or "")
        if retryAfter and retryAfter >= 0 then
            return retryAfter
        end
        local reset = tonumber(getHeader(response.Headers, "x-ratelimit-reset") or "")
        if reset and reset >= 0 then
            return reset
        end
    end
    return 0.5 * (2 ^ (attempt - 1))
end

local function transientStatus(response: CloudResponse): boolean
    local status = response.StatusCode
    return status == 408
        or status == 429
        or status == 500
        or status == 502
        or status == 503
        or status == 504
end

function OpenCloudRequest._retryPlan(method: string, options: RequestOptions?): (boolean, number)
    local requestOptions: RequestOptions = options or {}
    local normalizedMethod = string.upper(method)
    local mayRetry = SAFE_METHODS[normalizedMethod] == true or requestOptions.idempotent == true
    return mayRetry, if mayRetry then requestOptions.maxAttempts or 3 else 1
end

OpenCloudRequest._retryDelay = retryDelay

local function getApiKey()
    local secret = HttpService:GetSecret("APIKey")
    if not secret then
        error('APIKey secret not found. Store the key as a Secret named "APIKey".', 0)
    end
    return secret
end

function OpenCloudRequest.call(
    method: string,
    path: string,
    body: any?,
    options: RequestOptions?
): (boolean, CloudResponse?, any?)
    local requestOptions: RequestOptions = options or {}
    local normalizedMethod = string.upper(method)
    if SUPPORTED_METHODS[normalizedMethod] ~= true then
        return false, nil, `unsupported HTTP method: {method}`
    end
    local maxAttempts = requestOptions.maxAttempts or 3
    if
        maxAttempts ~= maxAttempts
        or maxAttempts == math.huge
        or maxAttempts % 1 ~= 0
        or maxAttempts < 1
    then
        return false, nil, "maxAttempts must be a positive integer"
    end
    if path == "" then
        return false, nil, "path must not be empty"
    end
    if path:find("..", 1, true) then
        return false, nil, "path must not contain '..'"
    end
    if body ~= nil and (normalizedMethod == "GET" or normalizedMethod == "HEAD") then
        return false, nil, `{normalizedMethod} requests must not include a body`
    end

    local setupOk, apiKey, encodedBody = pcall(function()
        local encoded = if body == nil then nil else HttpService:JSONEncode(body)
        return getApiKey(), encoded
    end)
    if not setupOk then
        return false, nil, apiKey
    end

    local _, allowedAttempts = OpenCloudRequest._retryPlan(normalizedMethod, requestOptions)
    local lastResponse: CloudResponse? = nil
    local lastError: any? = nil

    for attempt = 1, allowedAttempts do
        local headers = {
            ["content-type"] = "application/json",
            ["x-api-key"] = apiKey,
        }
        local response: CloudResponse? = nil
        local requestOk, requestError = pcall(function()
            response = HttpService:RequestAsync({
                Url = BASE_URL .. path,
                Method = normalizedMethod,
                Headers = headers,
                Body = encodedBody,
            }) :: CloudResponse
        end)

        if requestOk and response then
            lastResponse = response
            if response.Success then
                return true, response, nil
            end
            lastError = response.StatusMessage
            if not transientStatus(response) then
                return false, response, lastError
            end
        else
            lastError = requestError
        end

        if attempt < allowedAttempts then
            local delay = retryDelay(lastResponse, attempt)
            warn(`Open Cloud attempt {attempt} failed; retrying in {delay}s: {tostring(lastError)}`)
            task.wait(delay)
        end
    end

    return false, lastResponse, lastError
end

function OpenCloudRequest.decodeBody(body: string): (any?, any?)
    if body == "" then
        return nil, nil
    end
    local ok, decoded = pcall(function()
        return HttpService:JSONDecode(body)
    end)
    if not ok then
        return nil, decoded
    end
    return decoded, nil
end

return OpenCloudRequest
