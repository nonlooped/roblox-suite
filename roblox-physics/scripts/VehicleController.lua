--[[
    VehicleController.lua
    A client-authoritative vehicle chassis with server-side validation.

    Setup:
    - Four wheels as cylinders or spheres, each connected to the chassis via
      HingeConstraints or bearings (do not rigidly weld drive wheels).
    - Two HingeConstraints for front wheels (steering).
    - Two HingeConstraints for drive wheels with Motor actuator.
    - A VehicleSeat parented to the chassis.

    Usage:
        local VehicleController = require(path.to.VehicleController)
        local controller = VehicleController.new(vehicleModel)
        controller:destroy() -- call when the vehicle is removed
]]

local RunService = game:GetService("RunService")
local Players = game:GetService("Players")

local VehicleController = {}
VehicleController.__index = VehicleController

function VehicleController.new(model, config)
    config = config or {}
    local self = setmetatable({}, VehicleController)

    self.model = model
    self.seat = model:WaitForChild("VehicleSeat")
    self.maxSpeed = config.maxSpeed or 50
    self.turnAngle = config.turnAngle or 30
    self.wheelRadius = config.wheelRadius or 2

    self.driveMotors = {}
    self.steerHinges = {}

    for _, obj in ipairs(model:GetDescendants()) do
        if obj:IsA("HingeConstraint") then
            if obj.Name == "DriveMotor" then
                obj.ActuatorType = Enum.ActuatorType.Motor
                obj.MotorMaxTorque = config.motorMaxTorque or 5000
                obj.MotorMaxAcceleration = config.motorMaxAcceleration or 1500
                table.insert(self.driveMotors, obj)
            elseif obj.Name == "SteerHinge" then
                obj.ActuatorType = Enum.ActuatorType.Servo
                obj.ServoMaxTorque = config.servoMaxTorque or 5000
                obj.AngularSpeed = config.angularSpeed or 3
                table.insert(self.steerHinges, obj)
            end
        end
    end

    self.heartbeatConnection = nil
    self.validationConnection = nil
    self.occupantConnection = nil

    self:setupOwnership()
    self:startLoop()

    return self
end

function VehicleController:setupOwnership()
    self.occupantConnection = self.seat:GetPropertyChangedSignal("Occupant"):Connect(function()
        local humanoid = self.seat.Occupant
        if humanoid then
            local player = Players:GetPlayerFromCharacter(humanoid.Parent)
            if player then
                self.seat:SetNetworkOwner(player)
            end
        else
            self.seat:SetNetworkOwnershipAuto()
        end
    end)
end

function VehicleController:validateState()
    if not self.seat or not self.seat:IsDescendantOf(workspace) then
        return
    end

    local assemblyMass = self.seat.AssemblyMass
    if assemblyMass == math.huge then
        return
    end

    -- Simple server-side sanity check: if the client-owned assembly moves
    -- much faster than the configured limit, revoke ownership to stop exploits.
    local speed = self.seat.AssemblyLinearVelocity.Magnitude
    if speed > self.maxSpeed * 1.5 then
        self.seat:SetNetworkOwnershipAuto()
        for _, motor in ipairs(self.driveMotors) do
            motor.AngularVelocity = 0
        end
    end
end

function VehicleController:startLoop()
    self.heartbeatConnection = RunService.Heartbeat:Connect(function()
        if not self.seat or not self.seat:IsDescendantOf(workspace) then
            self:destroy()
            return
        end

        local steer = math.clamp(self.seat.Steer, -1, 1)
        local throttle = math.clamp(self.seat.Throttle, -1, 1)

        local targetAngle = -steer * self.turnAngle
        for _, hinge in ipairs(self.steerHinges) do
            hinge.TargetAngle = targetAngle
        end

        -- Convert linear speed (studs/s) to angular velocity (rad/s).
        local targetLinearVelocity = throttle * self.maxSpeed
        local targetAngularVelocity = targetLinearVelocity / self.wheelRadius
        for _, motor in ipairs(self.driveMotors) do
            motor.AngularVelocity = targetAngularVelocity
        end
    end)

    self.validationConnection = RunService.Heartbeat:Connect(function()
        self:validateState()
    end)
end

function VehicleController:destroy()
    if self.heartbeatConnection then
        self.heartbeatConnection:Disconnect()
        self.heartbeatConnection = nil
    end
    if self.validationConnection then
        self.validationConnection:Disconnect()
        self.validationConnection = nil
    end
    if self.occupantConnection then
        self.occupantConnection:Disconnect()
        self.occupantConnection = nil
    end

    for _, motor in ipairs(self.driveMotors) do
        motor.AngularVelocity = 0
    end
    for _, hinge in ipairs(self.steerHinges) do
        hinge.TargetAngle = 0
    end
end

return VehicleController
