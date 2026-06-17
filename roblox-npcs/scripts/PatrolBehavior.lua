--!strict
--[[
    PatrolBehavior.lua
    A simple state machine: Idle → Patrol → Chase → Attack → Return.

    Usage:
        local PatrolBehavior = require(path.to.PatrolBehavior)
        local NPCPathFollower = require(path.to.NPCPathFollower)

        local behavior = PatrolBehavior.new(npcModel, {
            patrolPoints = {
                workspace:WaitForChild("PatrolA").Position,
                workspace:WaitForChild("PatrolB").Position,
            },
            detectionRange = 30,
            attackRange = 5,
            chaseTimeout = 10,
            recomputeInterval = 0.5,
            recomputeMinDistance = 4,
            attackCooldown = 1,
        })
        behavior:start()
        behavior:Destroy()
]]

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")

local PatrolBehavior = {}
PatrolBehavior.__index = PatrolBehavior

function PatrolBehavior.new(model: Model, config: {[string]: any}?)
    local self = setmetatable({}, PatrolBehavior) :: any
    self.model = model
    self.humanoid = model:WaitForChild("Humanoid") :: Humanoid
    self.rootPart = model:WaitForChild("HumanoidRootPart") :: BasePart
    self.config = config or {}

    self.patrolPoints = self.config.patrolPoints or {}
    self.detectionRange = self.config.detectionRange or 30
    self.attackRange = self.config.attackRange or 5
    self.chaseTimeout = self.config.chaseTimeout or 10
    self.recomputeInterval = self.config.recomputeInterval or 0.5
    self.recomputeMinDistance = self.config.recomputeMinDistance or 4
    self.attackCooldown = self.config.attackCooldown or 1

    self.state = "Idle"
    self.patrolIndex = 1
    self.target = nil
    self.chaseTimer = 0
    self.follower = nil
    self.connection = nil
    self.destroyed = false
    self.lastRecomputeTime = 0
    self.lastRecomputePosition = nil
    self.lastAttackTime = 0

    self.humanoid.Died:Connect(function()
        self:Destroy()
    end)

    return self
end

function PatrolBehavior:start()
    if self.destroyed then return end
    if self.connection then return end

    self.connection = RunService.Heartbeat:Connect(function(dt: number)
        self:tick(dt)
    end)

    if #self.patrolPoints == 0 then
        self:setState("Idle")
    else
        self:setState("Patrol")
    end
end

function PatrolBehavior:stop()
    if self.connection then
        self.connection:Disconnect()
        self.connection = nil
    end
    if self.follower then
        self.follower:stop()
        self.follower = nil
    end
end

function PatrolBehavior:Destroy()
    if self.destroyed then return end
    self.destroyed = true
    self:stop()
    self.model = nil
    self.humanoid = nil
    self.rootPart = nil
    self.target = nil
end

function PatrolBehavior:setState(newState: string)
    self.state = newState
    if newState == "Patrol" then
        self.target = nil
        self:nextPatrolPoint()
    elseif newState == "Idle" then
        self.target = nil
        self.humanoid:Move(Vector3.zero)
        if self.follower then
            self.follower:stop()
            self.follower = nil
        end
    elseif newState == "Chase" then
        self.lastRecomputeTime = 0
        self.lastRecomputePosition = nil
        self.chaseTimer = 0
    elseif newState == "Return" then
        self.target = nil
        self.lastRecomputeTime = 0
        self.lastRecomputePosition = nil
    end
end

function PatrolBehavior:nextPatrolPoint()
    if #self.patrolPoints == 0 then return end
    self.patrolIndex = (self.patrolIndex % #self.patrolPoints) + 1
    self:moveTo(self.patrolPoints[self.patrolIndex])
end

function PatrolBehavior:moveTo(position: Vector3)
    if self.destroyed then return end
    if not self.follower then
        local NPCPathFollower = require(script.Parent.NPCPathFollower)
        self.follower = NPCPathFollower.new(self.humanoid)
    end
    self.follower:follow(position)
    self.lastRecomputeTime = time()
    self.lastRecomputePosition = position
end

function PatrolBehavior:findTarget(): Model?
    local closest: Model? = nil
    local closestDist = self.detectionRange

    local characters = {}
    for _, player in ipairs(Players:GetPlayers()) do
        if player.Character then
            table.insert(characters, player.Character)
        end
    end
    if #characters == 0 then
        return nil
    end

    local params = OverlapParams.new()
    params.FilterDescendantsInstances = characters
    params.FilterType = Enum.RaycastFilterType.Whitelist
    params.MaxParts = 100

    local parts = workspace:GetPartBoundsInRadius(self.rootPart.Position, self.detectionRange, params)
    for _, part in ipairs(parts) do
        local character = part:FindFirstAncestorOfClass("Model")
        if not character or character == self.model then
            continue
        end
        local hrp = character:FindFirstChild("HumanoidRootPart") :: BasePart?
        local humanoid = character:FindFirstChild("Humanoid") :: Humanoid?
        if hrp and humanoid and humanoid.Health > 0 then
            local dist = (hrp.Position - self.rootPart.Position).Magnitude
            if dist < closestDist then
                closestDist = dist
                closest = character
            end
        end
    end

    return closest
end

function PatrolBehavior:shouldRecompute(position: Vector3): boolean
    local now = time()
    if (now - self.lastRecomputeTime) < self.recomputeInterval then
        return false
    end
    if self.lastRecomputePosition and (position - self.lastRecomputePosition).Magnitude < self.recomputeMinDistance then
        return false
    end
    return true
end

function PatrolBehavior:tick(dt: number)
    if self.destroyed then return end
    if self.humanoid.Health <= 0 then
        self:Destroy()
        return
    end

    if self.state == "Patrol" or self.state == "Idle" then
        local target = self:findTarget()
        if target then
            self.target = target
            self:setState("Chase")
            return
        elseif self.state == "Patrol" and self.follower and not self.follower.running then
            self:nextPatrolPoint()
        end
    elseif self.state == "Chase" then
        if not self.target or not self.target:IsDescendantOf(workspace) then
            self:setState("Return")
            return
        end
        local hrp = self.target:FindFirstChild("HumanoidRootPart") :: BasePart?
        if not hrp then
            self:setState("Return")
            return
        end

        local dist = (hrp.Position - self.rootPart.Position).Magnitude
        if dist <= self.attackRange then
            self:setState("Attack")
            return
        end

        self.chaseTimer += dt
        if self.chaseTimer >= self.chaseTimeout then
            self:setState("Return")
            return
        end

        if self:shouldRecompute(hrp.Position) then
            self:moveTo(hrp.Position)
        end
    elseif self.state == "Attack" then
        if not self.target or not self.target:IsDescendantOf(workspace) then
            self:setState("Return")
            return
        end
        local hrp = self.target:FindFirstChild("HumanoidRootPart") :: BasePart?
        if not hrp then
            self:setState("Return")
            return
        end

        local dist = (hrp.Position - self.rootPart.Position).Magnitude
        if dist > self.attackRange then
            self:setState("Chase")
            return
        end

        local now = time()
        if now - self.lastAttackTime >= self.attackCooldown then
            self.lastAttackTime = now
            -- trigger server-side attack logic
        end
    elseif self.state == "Return" then
        self.target = nil
        if #self.patrolPoints == 0 then
            self:setState("Idle")
            return
        end
        local returnPos = self.patrolPoints[self.patrolIndex]
        if self:shouldRecompute(returnPos) then
            self:moveTo(returnPos)
        end
        if self.follower and not self.follower.running then
            self:setState("Patrol")
        end
    end
end

return PatrolBehavior
