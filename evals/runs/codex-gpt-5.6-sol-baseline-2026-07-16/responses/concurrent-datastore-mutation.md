# concurrent-datastore-mutation

Use `UpdateAsync`, preserve all unrelated value fields, and return the existing key metadata and associated user IDs. An operation ID makes retries safe when an error leaves the write outcome uncertain.

```luau
local DataStoreService = game:GetService("DataStoreService")
local profiles = DataStoreService:GetDataStore("Profiles_v1")

export type AddResult =
	"APPLIED"
	| "ALREADY_APPLIED"
	| "CONFIRMED_AFTER_ERROR"
	| "UNKNOWN_RETRY_SAME_ID"

local function hasOperation(profile: any, operationId: string): boolean
	return typeof(profile) == "table"
		and typeof(profile.coinOperations) == "table"
		and profile.coinOperations[operationId] == true
end

local function add100Coins(
	userId: number,
	operationId: string
): (AddResult, any?)
	assert(operationId ~= "", "A stable operation ID is required")

	local key = "user:" .. userId
	local insertedByFinalCallback = false

	local ok, valueOrError = pcall(function()
		return profiles:UpdateAsync(key, function(oldValue, keyInfo)
			insertedByFinalCallback = false

			local profile =
				if typeof(oldValue) == "table"
				then table.clone(oldValue)
				else {}

			local operations =
				if typeof(profile.coinOperations) == "table"
					then table.clone(profile.coinOperations)
					else {}

			if operations[operationId] == true then
				return profile,
					keyInfo and keyInfo:GetUserIds() or {userId},
					keyInfo and keyInfo:GetMetadata() or {}
			end

			local oldCoins = profile.coins
			if typeof(oldCoins) ~= "number"
				or oldCoins ~= math.floor(oldCoins)
				or oldCoins < 0
			then
				oldCoins = 0
			end

			profile.coins = oldCoins + 100
			operations[operationId] = true
			profile.coinOperations = operations
			insertedByFinalCallback = true

			return profile,
				keyInfo and keyInfo:GetUserIds() or {userId},
				keyInfo and keyInfo:GetMetadata() or {}
		end)
	end)

	if ok then
		if insertedByFinalCallback then
			return "APPLIED", valueOrError
		end
		return "ALREADY_APPLIED", valueOrError
	end

	-- Bypass the ordinary GetAsync cache when resolving a failed write.
	local options = Instance.new("DataStoreGetOptions")
	options.UseCache = false

	local readOK, current = pcall(function()
		return profiles:GetAsync(key, options)
	end)

	if readOK and hasOperation(current, operationId) then
		return "CONFIRMED_AFTER_ERROR", current
	end

	return "UNKNOWN_RETRY_SAME_ID", valueOrError
end

return add100Coins
```

`UpdateAsync` may invoke its callback multiple times during contention. The callback therefore must not yield and must not perform external side effects, mutate unrelated outside state, generate a new operation ID, or assume it runs once. It should compute a deterministic replacement from its arguments.

A failed call does not necessarily prove that the backend rejected the write. Retry only with the same `operationId`; the marker and coin change reside in the same atomic value, preventing the addition from being applied twice. Keep markers for as long as the operation might be retried—blindly pruning them reintroduces duplicates. Roblox also recommends uncached reads when verifying uncertain writes. [Data-store documentation](https://create.roblox.com/docs/cloud-services/data-stores/versioning-listing-and-caching)
