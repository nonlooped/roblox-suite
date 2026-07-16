--!strict
-- Status: experimental
-- Last verified: 2026-06-17
-- Test coverage: no automated coverage
-- Intended use: example; adapt and test before production.

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

type DoorHingeState = {
    hinge: HingeConstraint?,
    isOpen: boolean,
}

export type DoorHinge = typeof(setmetatable({} :: DoorHingeState, DoorHinge))

function DoorHinge.new(hinge: HingeConstraint): DoorHinge
    local self = setmetatable(
        {
            hinge = hinge,
            isOpen = false,
        } :: DoorHingeState,
        DoorHinge
    )
    hinge.ActuatorType = Enum.ActuatorType.Servo
    hinge.ServoMaxTorque = 2000
    hinge.AngularSpeed = 3
    hinge.LimitsEnabled = true
    hinge.LowerAngle = 0
    hinge.UpperAngle = 90
    return self
end

function DoorHinge.open(self: DoorHinge)
    local hinge = self.hinge
    if not hinge then
        return
    end
    hinge.TargetAngle = hinge.UpperAngle
    self.isOpen = true
end

function DoorHinge.close(self: DoorHinge)
    local hinge = self.hinge
    if not hinge then
        return
    end
    hinge.TargetAngle = hinge.LowerAngle
    self.isOpen = false
end

function DoorHinge.toggle(self: DoorHinge)
    if self.isOpen then
        self:close()
    else
        self:open()
    end
end

function DoorHinge.destroy(self: DoorHinge)
    -- Release the servo so the hinge becomes passive after cleanup.
    local hinge = self.hinge
    if hinge then
        hinge.ActuatorType = Enum.ActuatorType.None
    end
    self.hinge = nil
end

return DoorHinge
