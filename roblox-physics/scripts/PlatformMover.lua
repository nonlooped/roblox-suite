--!strict
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

function PlatformMover.new(platform, waypoints, waitTime)
    local self = setmetatable({}, PlatformMover)
    self.platform = platform
    self.waypoints = waypoints or {}
    self.waitTime = waitTime or 2
    self.index = 1
    self.direction = 1
    self.running = false
    self.delayTask = nil

    -- AlignPosition cannot move an anchored assembly.
    platform.Anchored = false

    self.alignPos = platform:FindFirstChildOfClass("AlignPosition") or Instance.new("AlignPosition")
    self.alignPos.Mode = Enum.PositionAlignmentMode.OneAttachment
    self.alignPos.RigidityEnabled = false
    self.alignPos.MaxForce = platform.AssemblyMass * 1000
    self.alignPos.MaxVelocity = 20
    self.alignPos.Responsiveness = 20
    self.alignPos.Parent = platform

    self.alignOrn = platform:FindFirstChildOfClass("AlignOrientation") or Instance.new("AlignOrientation")
    self.alignOrn.Mode = Enum.OrientationAlignmentMode.OneAttachment
    self.alignOrn.AlignType = Enum.AlignType.AllAxes
    self.alignOrn.RigidityEnabled = false
    self.alignOrn.MaxTorque = platform.AssemblyMass * 500
    self.alignOrn.MaxAngularVelocity = 5
    self.alignOrn.Responsiveness = 20
    self.alignOrn.CFrame = platform.CFrame.Rotation
    self.alignOrn.Parent = platform

    if not self.alignPos.Attachment0 then
        local att = Instance.new("Attachment")
        att.Parent = platform
        self.alignPos.Attachment0 = att
    end
    if not self.alignOrn.Attachment0 then
        local att = Instance.new("Attachment")
        att.Parent = platform
        self.alignOrn.Attachment0 = att
    end

    return self
end

function PlatformMover:moveToNext()
    if #self.waypoints == 0 then return end

    local target = self.waypoints[self.index]
    self.alignPos.Position = target

    self.delayTask = task.delay(self.waitTime, function()
        self.delayTask = nil
        if not self.running then return end
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

function PlatformMover:start()
    if self.running then return end
    self.running = true
    self:moveToNext()
end

function PlatformMover:stop()
    self.running = false
    if self.delayTask then
        task.cancel(self.delayTask)
        self.delayTask = nil
    end
end

function PlatformMover:destroy()
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
