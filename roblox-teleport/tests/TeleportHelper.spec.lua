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
        code: string,
        expiresAt: number
    ): TeleportHelper.AllocationRecord
        return {
            allocationId = id,
            accessCode = code,
            placeId = 100,
            matchId = "match-42",
            state = "allocated",
            createdAt = 1000,
            expiresAt = expiresAt,
            destinationJobId = nil,
        }
    end

    local first = candidate("first", "code-a", 2000)
    local second = candidate("second", "code-b", 2000)
    local stored = TeleportHelper._selectAllocation(nil, first, 1000)
    local secondWinner = TeleportHelper._selectAllocation(stored, second, 1000)
    expect(stored.accessCode == "code-a")
    expect(secondWinner.accessCode == "code-a")
    expect(secondWinner.allocationId == "first")

    local expired = candidate("old", "old-code", 999)
    local replacement = candidate("new", "new-code", 2000)
    local winner = TeleportHelper._selectAllocation(expired, replacement, 1000)
    expect(winner.accessCode == "new-code")
end
