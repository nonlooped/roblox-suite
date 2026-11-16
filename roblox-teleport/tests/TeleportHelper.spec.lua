--!strict
local function expect(condition: boolean)
    if not condition then
        error("regression expectation failed", 2)
    end
end

return function()
    local TeleportHelper = require(script.Parent.Parent.scripts.TeleportHelper)

    local function candidate(
        id: string,
        serverId: string,
        expiresAt: number
    ): TeleportHelper.AllocationRecord
        return {
            allocationId = id,
            reservedServerId = serverId,
            placeId = 100,
            matchId = "match-42",
            state = "allocated",
            createdAt = 1000,
            expiresAt = expiresAt,
            destinationJobId = nil,
        }
    end

    local first = candidate("first", "server-a", 2000)
    local second = candidate("second", "server-b", 2000)
    local stored = TeleportHelper._selectAllocation(nil, first, 1000)
    local secondWinner = TeleportHelper._selectAllocation(stored, second, 1000)
    expect(stored.reservedServerId == "server-a")
    expect(secondWinner.reservedServerId == "server-a")
    expect(secondWinner.allocationId == "first")

    -- Legacy records must never win a GUID-based allocation, even before expiry.
    local legacy = { allocationId = "legacy", accessCode = "legacy-code", expiresAt = 2000 }
    expect(TeleportHelper._selectAllocation(legacy, second, 1000).reservedServerId == "server-b")

    expect(TeleportHelper._selectAllocation(first, second, 2000).allocationId == "second")

    local expired = candidate("old", "old-server", 999)
    local replacement = candidate("new", "new-server", 2000)
    local winner = TeleportHelper._selectAllocation(expired, replacement, 1000)
    expect(winner.reservedServerId == "new-server")
end
