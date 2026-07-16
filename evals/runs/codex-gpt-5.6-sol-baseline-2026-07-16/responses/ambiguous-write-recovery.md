# ambiguous-write-recovery

The effect and its idempotency marker must be written atomically to the same key. This implementation never interprets a timeout as definite failure.

```luau
local DataStoreService = game:GetService("DataStoreService")
local store = DataStoreService:GetDataStore("AccountState_v1")

local State = table.freeze({
	APPLIED = "APPLIED",
	ALREADY_APPLIED = "ALREADY_APPLIED",
	CONFIRMED_AFTER_ERROR = "CONFIRMED_AFTER_ERROR",
	UNKNOWN_RETRY_SAME_ID = "UNKNOWN_RETRY_SAME_ID",
})

local function containsOperation(value: any, operationId: string): boolean
	return typeof(value) == "table"
		and typeof(value.appliedOperations) == "table"
		and value.appliedOperations[operationId] ~= nil
end

local function applyEffectOnce(
	key: string,
	operationId: string,
	amount: number
): (string, any?)
	assert(operationId ~= "", "operationId must be stable across retries")
	assert(amount == math.floor(amount), "amount must be an integer")

	local created = false

	local ok, result = pcall(function()
		return store:UpdateAsync(key, function(old, keyInfo)
			created = false

			local value = if typeof(old) == "table" then table.clone(old) else {}
			local markers =
				if typeof(value.appliedOperations) == "table"
					then table.clone(value.appliedOperations)
					else {}

			if markers[operationId] ~= nil then
				return value,
					keyInfo and keyInfo:GetUserIds() or {},
					keyInfo and keyInfo:GetMetadata() or {}
			end

			local balance = value.balance
			if typeof(balance) ~= "number" or balance ~= math.floor(balance) then
				balance = 0
			end

			value.balance = balance + amount
			markers[operationId] = {
				amount = amount,
				appliedAt = os.time(),
			}
			value.appliedOperations = markers
			created = true

			return value,
				keyInfo and keyInfo:GetUserIds() or {},
				keyInfo and keyInfo:GetMetadata() or {}
		end)
	end)

	if ok then
		return if created
			then State.APPLIED, result
			else State.ALREADY_APPLIED, result
	end

	local options = Instance.new("DataStoreGetOptions")
	options.UseCache = false

	local readOK, current = pcall(function()
		return store:GetAsync(key, options)
	end)

	if readOK and containsOperation(current, operationId) then
		return State.CONFIRMED_AFTER_ERROR, current
	end

	-- Even a successful read without the marker is not treated as proof that an
	-- earlier timed-out request can never arrive. The same ID remains retry-safe.
	return State.UNKNOWN_RETRY_SAME_ID, result
end

return {
	State = State,
	applyEffectOnce = applyEffectOnce,
}
```

The caller should treat both `APPLIED` and `CONFIRMED_AFTER_ERROR` as success, `ALREADY_APPLIED` as previously completed success, and `UNKNOWN_RETRY_SAME_ID` as retryable only with the identical ID.

This protects effects representable inside that DataStore value. A non-transactional side effect—such as sending an HTTP request—cannot be made exactly-once in the same transaction. Persist an outbox entry atomically, then have a worker deliver it using the same idempotency key; otherwise the crash gap between the DataStore write and external call is unavoidable.
