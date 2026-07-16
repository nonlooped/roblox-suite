# open-cloud-429

Use `HttpService:RequestAsync()` inside `pcall()`, exponential backoff with jitter, and a strict retry-safety flag. A retry can duplicate a mutation if the service committed it but the response was lost, so the helper must retry mutations only when the operation is independently idempotent—for example, it replaces a named resource, uses a stable operation ID that the receiving service deduplicates, or the endpoint explicitly guarantees replay safety.

```lua
-- ServerScriptService/OpenCloud.lua
local HttpService = game:GetService("HttpService")

local OpenCloud = {}

local MAX_ATTEMPTS = 5
local BASE_DELAY_SECONDS = 1
local MAX_DELAY_SECONDS = 16

local function isRecoverable(statusCode: number): boolean
	return statusCode == 429 or (statusCode >= 500 and statusCode <= 599)
end

local function getHeader(headers, wantedName: string): string?
	for name, value in headers or {} do
		if string.lower(name) == string.lower(wantedName) then
			return tostring(value)
		end
	end

	return nil
end

local function retryDelay(response, attempt: number): number
	-- Honor Retry-After when it is a numeric number of seconds.
	if response then
		local retryAfter = tonumber(getHeader(response.Headers, "retry-after"))
		if retryAfter then
			return math.clamp(retryAfter, 0, MAX_DELAY_SECONDS)
		end
	end

	local exponential = math.min(
		BASE_DELAY_SECONDS * 2 ^ (attempt - 1),
		MAX_DELAY_SECONDS
	)

	-- Full jitter prevents many game servers retrying simultaneously.
	return math.random() * exponential
end

export type Options = {
	Url: string,
	Method: string?,
	Body: string?,

	-- Set this only when replaying the exact same request cannot apply the
	-- mutation twice. GET/HEAD requests are made replay-safe automatically.
	ReplaySafe: boolean?,
}

function OpenCloud.request(options: Options)
	local method = string.upper(options.Method or "GET")
	local replaySafe = options.ReplaySafe == true
		or method == "GET"
		or method == "HEAD"

	local request = {
		Url = options.Url,
		Method = method,
		Headers = {
			["content-type"] = "application/json",
			["x-api-key"] = HttpService:GetSecret("OpenCloudApiKey"),
		},
		Body = options.Body,
	}

	for attempt = 1, MAX_ATTEMPTS do
		local sent, responseOrError = pcall(function()
			return HttpService:RequestAsync(request)
		end)

		if sent then
			local response = responseOrError

			if response.Success then
				return response
			end

			if not isRecoverable(response.StatusCode) then
				return nil, {
					Kind = "HttpError",
					StatusCode = response.StatusCode,
					Message = response.StatusMessage,
					Body = response.Body,
				}
			end

			-- A 429/5xx is recoverable, but replaying an unsafe mutation could
			-- duplicate it. Return an ambiguous result for reconciliation.
			if not replaySafe then
				return nil, {
					Kind = "AmbiguousMutation",
					StatusCode = response.StatusCode,
					Message = "Mutation was not retried because its outcome may be ambiguous",
					Body = response.Body,
				}
			end

			if attempt == MAX_ATTEMPTS then
				return nil, {
					Kind = "RetriesExhausted",
					StatusCode = response.StatusCode,
					Body = response.Body,
				}
			end

			task.wait(retryDelay(response, attempt))
		else
			-- A transport error gives no response, so a mutation may already
			-- have committed. Retry only operations known to be replay-safe.
			if not replaySafe then
				return nil, {
					Kind = "AmbiguousMutation",
					Message = tostring(responseOrError),
				}
			end

			if attempt == MAX_ATTEMPTS then
				return nil, {
					Kind = "TransportError",
					Message = tostring(responseOrError),
				}
			end

			task.wait(retryDelay(nil, attempt))
		end
	end

	error("unreachable")
end

return OpenCloud
```

Example of a read:

```lua
local OpenCloud = require(script.Parent.OpenCloud)

local response, err = OpenCloud.request({
	Url = "https://apis.roblox.com/cloud/v2/users/123456",
	Method = "GET",
})

if not response then
	warn(err.Kind, err.StatusCode, err.Message)
end
```

For a mutation, do not casually set `ReplaySafe = true`. A safe design is to generate one operation ID before the first attempt and use it as a resource key or send it to a trusted proxy that atomically records completed IDs. Reuse that same ID on every attempt. In-experience requests to Roblox Open Cloud allow only `x-api-key` and `content-type` request headers, so a generic `Idempotency-Key` header cannot be added directly; idempotency must come from the endpoint’s semantics or an intermediate service.

Enable **Allow HTTP Requests**, keep the API key in the experience’s secrets store, and grant it the smallest required permissions. Roblox recommends `pcall()` and exponential backoff, and applies separate in-experience Open Cloud rate limits. [Roblox in-game HTTP documentation](https://create.roblox.com/docs/cloud-services/http-service)
