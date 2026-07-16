# reserved-server-matchmaking

`ReserveServerAsync` and MemoryStore are separate services, so no literal exactly-once transaction exists across them. The following lease protocol ensures that two healthy racing servers publish and use one canonical allocation. A crash or ambiguous reserve failure can leave an unused orphan allocation, but it cannot cause two access codes to become canonical for the match.

```luau
-- ServerScriptService/MatchTeleport.lua
local HttpService = game:GetService("HttpService")
local MemoryStoreService = game:GetService("MemoryStoreService")
local Players = game:GetService("Players")
local TeleportService = game:GetService("TeleportService")

local TARGET_PLACE_ID = 1234567890

local allocations = MemoryStoreService:GetHashMap("MatchAllocations_v1")
local initiations = MemoryStoreService:GetHashMap("MatchTeleportInitiations_v1")
local arrivals = MemoryStoreService:GetHashMap("MatchTeleportArrivals_v1")

local LEASE_SECONDS = 30
local RECORD_TTL = 60 * 60
local POLL_SECONDS = 0.5
local ACQUIRE_TIMEOUT = 45

local function allocationKey(matchId: string): string
	return "match:" .. matchId
end

local function playerKey(matchId: string, userId: number): string
	return string.format("%s:user:%d", matchId, userId)
end

local function getCanonicalAllocation(matchId: string)
	local key = allocationKey(matchId)
	local ownerToken = game.JobId .. ":" .. HttpService:GenerateGUID(false)
	local deadline = os.clock() + ACQUIRE_TIMEOUT

	while os.clock() < deadline do
		local now = os.time()

		local updateOK, record = pcall(function()
			return allocations:UpdateAsync(key, function(current)
				if typeof(current) == "table" and current.phase == "ready" then
					return current
				end

				local leaseExpired = typeof(current) ~= "table"
					or current.phase ~= "allocating"
					or typeof(current.leaseUntil) ~= "number"
					or current.leaseUntil <= now

				if leaseExpired then
					return {
						phase = "allocating",
						owner = ownerToken,
						leaseUntil = now + LEASE_SECONDS,
					}
				end

				return current
			end, RECORD_TTL)
		end)

		if not updateOK then
			task.wait(POLL_SECONDS)
			continue
		end

		if record.phase == "ready" then
			return record
		end

		if record.phase ~= "allocating" or record.owner ~= ownerToken then
			task.wait(POLL_SECONDS)
			continue
		end

		-- Renew the lease while ReserveServerAsync yields.
		local stopHeartbeat = false
		task.spawn(function()
			while not stopHeartbeat do
				task.wait(LEASE_SECONDS / 3)
				if stopHeartbeat then
					break
				end

				pcall(function()
					allocations:UpdateAsync(key, function(current)
						if typeof(current) == "table"
							and current.phase == "allocating"
							and current.owner == ownerToken
						then
							local renewed = table.clone(current)
							renewed.leaseUntil = os.time() + LEASE_SECONDS
							return renewed
						end
						return current
					end, RECORD_TTL)
				end)
			end
		end)

		local reserveOK, accessCode, privateServerId = pcall(function()
			return TeleportService:ReserveServerAsync(TARGET_PLACE_ID)
		end)
		stopHeartbeat = true

		if not reserveOK then
			-- Let this ownership expire. If Roblox allocated before returning an
			-- error, that inaccessible allocation is an unavoidable orphan.
			task.wait(POLL_SECONDS)
			continue
		end

		local publishOK, canonical = pcall(function()
			return allocations:UpdateAsync(key, function(current)
				if typeof(current) == "table" and current.phase == "ready" then
					return current
				end

				if typeof(current) == "table"
					and current.phase == "allocating"
					and current.owner == ownerToken
				then
					return {
						phase = "ready",
						accessCode = accessCode,
						privateServerId = privateServerId,
						createdAt = os.time(),
					}
				end

				-- Ownership was lost, so this allocation must not be published.
				return current
			end, RECORD_TTL)
		end)

		if publishOK and canonical.phase == "ready" then
			return canonical
		end
	end

	return nil, "ALLOCATION_TIMEOUT"
end

local function teleportMatch(
	matchId: string,
	matchPlayers: {Player}
): (boolean, string?)
	assert(matchId ~= "", "matchId is required")

	local allocation, allocationError = getCanonicalAllocation(matchId)
	if not allocation then
		return false, allocationError
	end

	local attemptId = HttpService:GenerateGUID(false)

	-- Initiation authorization is recorded before the teleport call. If this
	-- cannot be recorded, do not teleport because arrival cannot be validated.
	for _, player in matchPlayers do
		local ok = pcall(function()
			initiations:SetAsync(playerKey(matchId, player.UserId), {
				matchId = matchId,
				userId = player.UserId,
				attemptId = attemptId,
				status = "initiated",
				initiatedAt = os.time(),
				sourceJobId = game.JobId,
			}, RECORD_TTL)
		end)

		if not ok then
			return false, "INITIATION_RECORD_FAILED"
		end
	end

	local options = Instance.new("TeleportOptions")
	options.ReservedServerAccessCode = allocation.accessCode
	options:SetTeleportData({
		-- TeleportData is untrusted and used only as a lookup hint.
		matchId = matchId,
		attemptId = attemptId,
	})

	local ok, err = pcall(function()
		TeleportService:TeleportAsync(TARGET_PLACE_ID, matchPlayers, options)
	end)

	if not ok then
		return false, tostring(err)
	end

	-- This means teleport initiation succeeded, not that anyone arrived.
	return true, attemptId
end

TeleportService.TeleportInitFailed:Connect(function(
	player,
	teleportResult,
	errorMessage,
	_placeId,
	options
)
	local data = options and options:GetTeleportData()
	if typeof(data) ~= "table"
		or typeof(data.matchId) ~= "string"
		or typeof(data.attemptId) ~= "string"
	then
		return
	end

	pcall(function()
		initiations:UpdateAsync(
			playerKey(data.matchId, player.UserId),
			function(current)
				if typeof(current) == "table"
					and current.attemptId == data.attemptId
				then
					local updated = table.clone(current)
					updated.status = "init_failed"
					updated.teleportResult = tostring(teleportResult)
					updated.errorMessage = tostring(errorMessage)
					updated.failedAt = os.time()
					return updated
				end
				return current
			end,
			RECORD_TTL
		)
	end)
end)

-- Run this listener in the destination place.
local function recordArrival(player: Player)
	local joinData = player:GetJoinData()
	local data = joinData.TeleportData

	if typeof(data) ~= "table"
		or typeof(data.matchId) ~= "string"
		or typeof(data.attemptId) ~= "string"
	then
		return
	end

	local allocationOK, allocation = pcall(function()
		return allocations:GetAsync(allocationKey(data.matchId))
	end)

	local initiationOK, initiation = pcall(function()
		return initiations:GetAsync(playerKey(data.matchId, player.UserId))
	end)

	-- TeleportData is client-visible, so authorize against server-side records.
	if not allocationOK
		or not initiationOK
		or typeof(allocation) ~= "table"
		or allocation.phase ~= "ready"
		or allocation.privateServerId ~= game.PrivateServerId
		or typeof(initiation) ~= "table"
		or initiation.userId ~= player.UserId
		or initiation.attemptId ~= data.attemptId
	then
		warn("Rejected unverifiable match arrival for", player.UserId)
		return
	end

	pcall(function()
		arrivals:SetAsync(playerKey(data.matchId, player.UserId), {
			matchId = data.matchId,
			userId = player.UserId,
			attemptId = data.attemptId,
			arrivedAt = os.time(),
			destinationJobId = game.JobId,
			privateServerId = game.PrivateServerId,
		}, RECORD_TTL)
	end)
end

Players.PlayerAdded:Connect(function(player)
	task.spawn(recordArrival, player)
end)

return teleportMatch
```

Initiation and arrival deliberately use different records: a successful `TeleportAsync` call does not prove arrival, and late initialization failures can fire separately. The destination treats `TeleportData` only as a hint and validates it against MemoryStore plus `game.PrivateServerId`. Reserved-server codes remain valid, while MemoryStore records expire, so durable match history should be copied to a DataStore if required. [Reserved-server API](https://create.roblox.com/docs/reference/engine/classes/TeleportService), [teleport failure behavior](https://create.roblox.com/docs/projects/teleport), [MemoryStore atomic updates](https://create.roblox.com/docs/cloud-services/memory-stores/hash-map)
