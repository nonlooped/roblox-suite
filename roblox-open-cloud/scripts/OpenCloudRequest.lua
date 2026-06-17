--!strict
--[[
    OpenCloudRequest.lua
    A small server-side helper for calling Open Cloud endpoints from in-experience
    via HttpService. Handles the x-api-key-as-Secret requirement, JSON encoding,
    pcall wrapping, and exponential backoff retry.

    Requirements:
    - "Allow HTTP Requests" enabled in Experience Settings.
    - An API key stored as a Secret named "APIKey" in your Secrets Store.

    Usage:
        local OpenCloudRequest = require(path.to.OpenCloudRequest)
        local ok, response = OpenCloudRequest.call("GET", "universes/123", nil, 3)
        if ok then
            local data = OpenCloudRequest.decodeBody(response.Body)
        end
]]

local HttpService = game:GetService("HttpService")

export type CloudResponse = {
    Success: boolean,
    StatusCode: number,
    StatusMessage: string,
    Body: string,
    Headers: { [string]: string },
}

export type OpenCloudRequest = {
    call: (method: string, path: string, body: any?, maxAttempts: number?) -> (boolean, CloudResponse?),
    decodeBody: (body: string) -> any?,
}

local OpenCloudRequest = {}

local BASE_URL = "https://apis.roblox.com/cloud/v2/"

local function getApiKey()
    local ok, secret = pcall(function()
        return HttpService:GetSecret("APIKey")
    end)
    if not ok or not secret then
        error("APIKey secret not found. Store your Open Cloud API key as a Secret named \"APIKey\".", 0)
    end
    return secret
end

function OpenCloudRequest.call(method: string, path: string, body: any?, maxAttempts: number?): (boolean, CloudResponse?)
    maxAttempts = maxAttempts or 3
    local apiKey = getApiKey()
    local url = BASE_URL .. path
    local encodedBody = if body ~= nil then HttpService:JSONEncode(body) else nil

    for attempt = 1, maxAttempts do
        local response
        local ok, err = pcall(function()
            response = HttpService:RequestAsync({
                Url = url,
                Method = method,
                Headers = {
                    ["Content-Type"] = "application/json",
                    ["x-api-key"] = apiKey, -- Secret, not string
                },
                Body = encodedBody,
            })
        end)

        if not ok then
            warn(`Open Cloud request error (attempt {attempt}): {tostring(err)}`)
        elseif response.Success then
            return true, response
        elseif response.StatusCode == 429 or response.StatusCode >= 500 then
            -- Recoverable: backoff
            local backoff = 2 ^ attempt * 0.5
            warn(`Open Cloud {response.StatusCode} (attempt {attempt}); retrying in {backoff}s`)
            task.wait(backoff)
        else
            -- Non-recoverable (4xx other than 429)
            warn(`Open Cloud error {response.StatusCode}: {response.StatusMessage}`)
            return false, response
        end
    end

    return false, nil
end

function OpenCloudRequest.decodeBody(body: string): any?
    if not body or body == "" then
        return nil
    end
    local ok, decoded = pcall(function()
        return HttpService:JSONDecode(body)
    end)
    if not ok then
        warn("Open Cloud: failed to decode response body:", tostring(decoded))
        return nil
    end
    return decoded
end

return OpenCloudRequest