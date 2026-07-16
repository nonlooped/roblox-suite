# open-cloud-429

Use conservative retry semantics: retry reads and explicitly idempotent writes, but never blindly replay an unsafe mutation after a transport error or 5xx. Those failures are ambiguous—the server may already have committed the operation.

```lua
--!strict
-- Server-only ModuleScript. Store APIKey in the experience Secrets Store.
local HttpService = game:GetService("HttpService")

export type RetrySafety = "read" | "idempotent" | "unsafe-mutation"

export type RequestOptions = {
	Method: string,
	Path: string,
	Body: any?,
	Safety: RetrySafety,
	MaxAttempts: number?,
	MaxDelaySeconds: number?,
}

export type Result = {
	Ok: boolean,
	Response: any?,
	Error: any?,
	Indeterminate: boolean,
}

local OpenCloud = {}

local function normalizedHeaders(headers: {[string]: string}?): {[string]: string}
	local result = {}

	if headers then
		for name, value in headers do
			result[string.lower(name)] = value
		end
	end

	return result
end

local function retryDelay(response: any?, attempt: number, maximum: number): number
	if response then
		local headers = normalizedHeaders(response.Headers)

		local retryAfter = tonumber(headers["retry-after"])
		if retryAfter then
			return math.min(math.max(retryAfter, 0), maximum)
		end

		local reset = tonumber(headers["x-ratelimit-reset"])
		if reset then
			-- Accommodate either a Unix timestamp or a relative delay.
			local seconds = if reset > os.time() then reset - os.time() else reset
			return math.min(math.max(seconds, 0), maximum)
		end
	end

	local exponential = math.min(2 ^ (attempt - 1), maximum)
	return math.random() * exponential -- full jitter
end

function OpenCloud.request(options: RequestOptions): Result
	local maxAttempts = options.MaxAttempts or 4
	local maxDelay = options.MaxDelaySeconds or 30
	local encodedBody = if options.Body ~= nil
		then HttpService:JSONEncode(options.Body)
		else nil

	local lastResponse: any? = nil
	local lastError: any? = nil

	for attempt = 1, maxAttempts do
		local response: any? = nil
		local success, requestError = pcall(function()
			response = HttpService:RequestAsync({
				Url = `https://apis.roblox.com/cloud/v2/{options.Path}`,
				Method = options.Method,
				Headers = {
					["content-type"] = "application/json",
					["x-api-key"] = HttpService:GetSecret("APIKey"),
				},
				Body = encodedBody,
			})
		end)

		if not success then
			lastError = requestError

			-- The request may have reached Roblox before the transport failed.
			if options.Safety == "unsafe-mutation" then
				return {
					Ok = false,
					Response = nil,
					Error = requestError,
					Indeterminate = true,
				}
			end
		else
			lastResponse = response

			if response.Success then
				return {
					Ok = true,
					Response = response,
					Error = nil,
					Indeterminate = false,
				}
			end

			local status = response.StatusCode
			local rejectedByRateLimit = status == 429
			local ambiguousServerFailure = status >= 500 and status <= 599

			if not rejectedByRateLimit and not ambiguousServerFailure then
				return {
					Ok = false,
					Response = response,
					Error = nil,
					Indeterminate = false,
				}
			end

			-- A 5xx may have been returned after committing a mutation.
			if ambiguousServerFailure and options.Safety == "unsafe-mutation" then
				return {
					Ok = false,
					Response = response,
					Error = nil,
					Indeterminate = true,
				}
			end
		end

		if attempt < maxAttempts then
			task.wait(retryDelay(lastResponse, attempt, maxDelay))
		end
	end

	return {
		Ok = false,
		Response = lastResponse,
		Error = lastError,
		Indeterminate = false,
	}
end

return OpenCloud
```

Example:

```lua
local result = OpenCloud.request({
	Method = "PATCH",
	Path = "groups/123/memberships/456",
	Body = {
		role = "groups/123/roles/789",
	},
	-- Reapplying the same absolute role assignment has the same final state.
	Safety = "idempotent",
})

if not result.Ok then
	if result.Indeterminate then
		-- Read the resource and reconcile its current state; do not replay blindly.
		warn("Mutation outcome is unknown")
	else
		warn("Request failed", result.Response, result.Error)
	end
end
```

Use `"unsafe-mutation"` for increments, creates without a stable resource identity, message publication, or any operation that produces an additional effect each time. On an indeterminate result, read the resource or consult an operation record before deciding whether another mutation is necessary. In-experience Open Cloud only permits `x-api-key` and `content-type`, so a custom idempotency header cannot generally be added.
