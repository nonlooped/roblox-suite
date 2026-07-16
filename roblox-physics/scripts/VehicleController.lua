--!strict
-- Status: experimental
-- Last verified: 2026-06-17
-- Test coverage: no automated coverage
-- Intended use: example; adapt and test before production.

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

export type VehicleControllerConfig = {
    maxSpeed: number?,
    turnAngle: number?,
    wheelRadius: number?,
    motorMaxTorque: number?,
    motorMaxAcceleration: number?,
    servoMaxTorque: number?,
    angularSpeed: number?,
}

type VehicleControllerState = {
    model: Model,
    seat: VehicleSeat,
    maxSpeed: number,
    turnAngle: number,
    wheelRadius: number,
    driveMotors: { HingeConstraint },
    steerHinges: { HingeConstraint },
    heartbeatConnection: RBXScriptConnection?,
    validationConnection: RBXScriptConnection?,
    occupantConnection: RBXScriptConnection?,
}

export type VehicleController =
    typeof(setmetatable({} :: VehicleControllerState, VehicleController))

function VehicleController.new(model: Model, config: VehicleControllerConfig?): VehicleController
    local resolvedConfig: VehicleControllerConfig = config or {}
    local self = setmetatable(
        {
            model = model,
            seat = model:WaitForChild("VehicleSeat") :: VehicleSeat,
            maxSpeed = resolvedConfig.maxSpeed or 50,
            turnAngle = resolvedConfig.turnAngle or 30,
            wheelRadius = resolvedConfig.wheelRadius or 2,
            driveMotors = {} :: { HingeConstraint },
            steerHinges = {} :: { HingeConstraint },
            heartbeatConnection = nil :: RBXScriptConnection?,
            validationConnection = nil :: RBXScriptConnection?,
            occupantConnection = nil :: RBXScriptConnection?,
        } :: VehicleControllerState,
        VehicleController
    )

    for _, obj in ipairs(model:GetDescendants()) do
        if obj:IsA("HingeConstraint") then
            if obj.Name == "DriveMotor" then
                obj.ActuatorType = Enum.ActuatorType.Motor
                obj.MotorMaxTorque = resolvedConfig.motorMaxTorque or 5000
                obj.MotorMaxAcceleration = resolvedConfig.motorMaxAcceleration or 1500
                table.insert(self.driveMotors, obj)
            elseif obj.Name == "SteerHinge" then
                obj.ActuatorType = Enum.ActuatorType.Servo
                obj.ServoMaxTorque = resolvedConfig.servoMaxTorque or 5000
                obj.AngularSpeed = resolvedConfig.angularSpeed or 3
                table.insert(self.steerHinges, obj)
            end
        end
    end

    self:setupOwnership()
    self:startLoop()

    return self
end

function VehicleController.setupOwnership(self: VehicleController)
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

function VehicleController.validateState(self: VehicleController)
    if not self.seat:IsDescendantOf(workspace) then
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

function VehicleController.startLoop(self: VehicleController)
    self.heartbeatConnection = RunService.Heartbeat:Connect(function()
        if not self.seat:IsDescendantOf(workspace) then
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

function VehicleController.destroy(self: VehicleController)
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
