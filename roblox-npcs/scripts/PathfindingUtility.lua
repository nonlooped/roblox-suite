--!strict
-- Status: experimental
-- Last verified: 2026-06-17
-- Test coverage: no automated coverage
-- Intended use: example; adapt and test before production.

--[[
    PathfindingUtility.lua
    Helpers for throttled recomputation and waypoint formatting.

    Usage:
        local util = require(path.to.PathfindingUtility)
        local shouldRecompute, newPos, newTime = util.throttleRecompute(
            target.Position, lastPos, 0.5, 5, lastTime
        )
        print(util.formatWaypoint(waypoint))
]]

local PathfindingUtility = {}

function PathfindingUtility.throttleRecompute(
    currentPosition: Vector3,
    lastPosition: Vector3?,
    interval: number,
    minDistance: number,
    lastTime: number?
): (boolean, Vector3?, number?)
    local now = time()
    if lastTime and (now - lastTime) < interval then
        return false, lastPosition, lastTime
    end
    if lastPosition and (currentPosition - lastPosition).Magnitude < minDistance then
        return false, lastPosition, lastTime
    end
    return true, currentPosition, now
end

function PathfindingUtility.formatWaypoint(waypoint: {
    Position: Vector3,
    Action: Enum.PathWaypointAction,
    Label: string,
}?): string
    if not waypoint then
        return "Waypoint(nil)"
    end
    return string.format(
        "Waypoint(%s, %s, %s)",
        tostring(waypoint.Position),
        tostring(waypoint.Action),
        tostring(waypoint.Label)
    )
end

return PathfindingUtility
