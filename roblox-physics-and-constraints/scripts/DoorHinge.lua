--[[
    DoorHinge.lua
    A servo-powered door with open/close state.

    Setup:
    - A door part with a HingeConstraint named "Hinge".
    - The hinge's Attachment0 should be on the door frame, Attachment1 on the door.
    - The hinge Axis should point up (rotation axis).
    - Keep the door assembly server-owned for authoritative collision; call
      :destroy() when the door is removed to clean up the servo state.

    Usage:
        local DoorHinge = require(path.to.DoorHinge)
        local door = DoorHinge.new(workspace.DoorModel.Hinge)
        door:open()
        door:close()
        door:destroy()
]]

local DoorHinge = {}
DoorHinge.__index = DoorHinge

function DoorHinge.new(hinge)
    local self = setmetatable({}, DoorHinge)
    self.hinge = hinge
    self.hinge.ActuatorType = Enum.ActuatorType.Servo
    self.hinge.ServoMaxTorque = 2000
    self.hinge.AngularSpeed = 3
    self.hinge.LimitsEnabled = true
    self.hinge.LowerAngle = 0
    self.hinge.UpperAngle = 90
    self.isOpen = false
    return self
end

function DoorHinge:open()
    self.hinge.TargetAngle = self.hinge.UpperAngle
    self.isOpen = true
end

function DoorHinge:close()
    self.hinge.TargetAngle = self.hinge.LowerAngle
    self.isOpen = false
end

function DoorHinge:toggle()
    if self.isOpen then
        self:close()
    else
        self:open()
    end
end

function DoorHinge:destroy()
    -- Release the servo so the hinge becomes passive after cleanup.
    self.hinge.ActuatorType = Enum.ActuatorType.None
    self.hinge = nil
end

return DoorHinge
