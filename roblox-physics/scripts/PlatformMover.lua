--!strict
-- Status: experimental
-- Last verified: 2026-06-17
-- Test coverage: no automated coverage
-- Intended use: example; adapt and test before production.

--[[
    PlatformMover.lua
    A moving platform using AlignPosition + AlignOrientation.

    Setup:
    - A platform part (must be unanchored for AlignPosition to simulate it).
    - An AlignPosition and AlignOrientation inside the platform.
    - Attachment0 on platform, Attachment1 optional (leave unset for world mode).
    - Configure AlignPosition.Mode = OneAttachment to use world Position.

    Usage:
        local PlatformMover = require(path.to.PlatformMover)
        local platform = PlatformMover.new(workspace.MovingPlatform, {
            workspace.PointA.Position,
            workspace.PointB.Position,
        }, 5)
        platform:start()
        platform:stop()
        platform:destroy()
]]

local PlatformMover = {}
PlatformMover.__index = PlatformMover

type PlatformMoverState = {
    platform: BasePart,
    waypoints: { Vector3 },
    waitTime: number,
    index: number,
    direction: number,
    running: boolean,
    delayTask: thread?,
    alignPos: AlignPosition?,
    alignOrn: AlignOrientation?,
}

export type PlatformMover = typeof(setmetatable({} :: PlatformMoverState, PlatformMover))

function PlatformMover.new(
    platform: BasePart,
    waypoints: { Vector3 }?,
    waitTime: number?
): PlatformMover
    -- AlignPosition cannot move an anchored assembly.
    platform.Anchored = false

    local alignPos = platform:FindFirstChildOfClass("AlignPosition")
        or Instance.new("AlignPosition")
    alignPos.Mode = Enum.PositionAlignmentMode.OneAttachment
    alignPos.RigidityEnabled = false
    alignPos.MaxForce = platform.AssemblyMass * 1000
    alignPos.MaxVelocity = 20
    alignPos.Responsiveness = 20
    alignPos.Parent = platform

    local alignOrn = platform:FindFirstChildOfClass("AlignOrientation")
        or Instance.new("AlignOrientation")
    alignOrn.Mode = Enum.OrientationAlignmentMode.OneAttachment
    alignOrn.AlignType = Enum.AlignType.AllAxes
    alignOrn.RigidityEnabled = false
    alignOrn.MaxTorque = platform.AssemblyMass * 500
    alignOrn.MaxAngularVelocity = 5
    alignOrn.Responsiveness = 20
    alignOrn.CFrame = platform.CFrame.Rotation
    alignOrn.Parent = platform

    if not alignPos.Attachment0 then
        local att = Instance.new("Attachment")
        att.Parent = platform
        alignPos.Attachment0 = att
    end
    if not alignOrn.Attachment0 then
        local att = Instance.new("Attachment")
        att.Parent = platform
        alignOrn.Attachment0 = att
    end

    local self = setmetatable(
        {
            platform = platform,
            waypoints = waypoints or {},
            waitTime = waitTime or 2,
            index = 1,
            direction = 1,
            running = false,
            delayTask = nil :: thread?,
            alignPos = alignPos,
            alignOrn = alignOrn,
        } :: PlatformMoverState,
        PlatformMover
    )

    return self
end

function PlatformMover.moveToNext(self: PlatformMover)
    if #self.waypoints == 0 then
        return
    end

    local target = self.waypoints[self.index]
    local alignPos = self.alignPos
    if not alignPos then
        return
    end
    alignPos.Position = target

    self.delayTask = task.delay(self.waitTime, function()
        self.delayTask = nil
        if not self.running then
            return
        end
        self.index += self.direction
        if self.index > #self.waypoints then
            self.index = #self.waypoints - 1
            self.direction = -1
        elseif self.index < 1 then
            self.index = 2
            self.direction = 1
        end
        self:moveToNext()
    end)
end

function PlatformMover.start(self: PlatformMover)
    if self.running then
        return
    end
    self.running = true
    self:moveToNext()
end

function PlatformMover.stop(self: PlatformMover)
    self.running = false
    if self.delayTask then
        task.cancel(self.delayTask)
        self.delayTask = nil
    end
end

function PlatformMover.destroy(self: PlatformMover)
    self:stop()
    if self.alignPos then
        self.alignPos:Destroy()
        self.alignPos = nil
    end
    if self.alignOrn then
        self.alignOrn:Destroy()
        self.alignOrn = nil
    end
end

return PlatformMover
