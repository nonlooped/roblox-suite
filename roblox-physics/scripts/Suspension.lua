--[[
    Suspension.lua
    Simple spring-damper suspension using SpringConstraint.

    Setup:
    - A wheel part connected to a chassis part via SpringConstraint.
    - Attachment0 on chassis, Attachment1 on wheel.
    - Wheel must be unanchored. A single SpringConstraint lets the wheel move
      freely in 3D space, so constrain it to vertical motion with a
      PrismaticConstraint aligned to the suspension axis. A second
      SpringConstraint does not remove degrees of freedom.

    Usage:
        local Suspension = require(path.to.Suspension)
        Suspension.new(springConstraint, {
            stiffness = 8000,
            damping = 800,
            freeLength = 2,
        })
]]

local Suspension = {}
Suspension.__index = Suspension

function Suspension.new(spring, config)
    local self = setmetatable({}, Suspension)
    self.spring = spring

    self.spring.Stiffness = config.stiffness or 5000
    self.spring.Damping = config.damping or 500
    self.spring.FreeLength = config.freeLength or 3
    self.spring.MinLength = config.minLength or 0.5
    self.spring.MaxLength = config.maxLength or config.freeLength * 2

    return self
end

return Suspension
