--!strict
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

function PathfindingUtility.formatWaypoint(waypoint: {Position: Vector3, Action: any, Label: string}?): string
    if not waypoint then
        return "Waypoint(nil)"
    end
    return string.format("Waypoint(%s, %s, %s)",
        tostring(waypoint.Position),
        tostring(waypoint.Action),
        tostring(waypoint.Label)
    )
end

return PathfindingUtility
