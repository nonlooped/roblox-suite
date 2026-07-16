--!strict
-- Status: experimental
-- Last verified: 2026-06-17
-- Test coverage: no automated coverage
-- Intended use: example; adapt and test before production.

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
local NPCPathFollower = require(script.Parent.NPCPathFollower)

type PatrolState = "Idle" | "Patrol" | "Chase" | "Attack" | "Return"

export type PatrolBehaviorConfig = {
    patrolPoints: { Vector3 }?,
    detectionRange: number?,
    attackRange: number?,
    chaseTimeout: number?,
    recomputeInterval: number?,
    recomputeMinDistance: number?,
    attackCooldown: number?,
}

type PathFollower = NPCPathFollower.NPCPathFollower

type PatrolBehaviorState = {
    model: Model?,
    humanoid: Humanoid?,
    rootPart: BasePart?,
    config: PatrolBehaviorConfig,
    patrolPoints: { Vector3 },
    detectionRange: number,
    attackRange: number,
    chaseTimeout: number,
    recomputeInterval: number,
    recomputeMinDistance: number,
    attackCooldown: number,
    state: PatrolState,
    patrolIndex: number,
    target: Model?,
    chaseTimer: number,
    follower: PathFollower?,
    connection: RBXScriptConnection?,
    destroyed: boolean,
    lastRecomputeTime: number,
    lastRecomputePosition: Vector3?,
    lastAttackTime: number,
}

local PatrolBehavior = {}
PatrolBehavior.__index = PatrolBehavior

export type PatrolBehavior = typeof(setmetatable({} :: PatrolBehaviorState, PatrolBehavior))

function PatrolBehavior.new(model: Model, config: PatrolBehaviorConfig?): PatrolBehavior
    local resolvedConfig: PatrolBehaviorConfig = config or {}
    local humanoid = model:WaitForChild("Humanoid") :: Humanoid
    local self = setmetatable(
        {
            model = model,
            humanoid = humanoid,
            rootPart = model:WaitForChild("HumanoidRootPart") :: BasePart,
            config = resolvedConfig,
            patrolPoints = resolvedConfig.patrolPoints or {},
            detectionRange = resolvedConfig.detectionRange or 30,
            attackRange = resolvedConfig.attackRange or 5,
            chaseTimeout = resolvedConfig.chaseTimeout or 10,
            recomputeInterval = resolvedConfig.recomputeInterval or 0.5,
            recomputeMinDistance = resolvedConfig.recomputeMinDistance or 4,
            attackCooldown = resolvedConfig.attackCooldown or 1,
            state = "Idle" :: PatrolState,
            patrolIndex = 1,
            target = nil :: Model?,
            chaseTimer = 0,
            follower = nil :: PathFollower?,
            connection = nil :: RBXScriptConnection?,
            destroyed = false,
            lastRecomputeTime = 0,
            lastRecomputePosition = nil :: Vector3?,
            lastAttackTime = 0,
        } :: PatrolBehaviorState,
        PatrolBehavior
    )

    humanoid.Died:Connect(function()
        self:Destroy()
    end)

    return self
end

function PatrolBehavior.start(self: PatrolBehavior)
    if self.destroyed then
        return
    end
    if self.connection then
        return
    end

    self.connection = RunService.Heartbeat:Connect(function(dt: number)
        self:tick(dt)
    end)

    if #self.patrolPoints == 0 then
        self:setState("Idle")
    else
        self:setState("Patrol")
    end
end

function PatrolBehavior.stop(self: PatrolBehavior)
    if self.connection then
        self.connection:Disconnect()
        self.connection = nil
    end
    if self.follower then
        self.follower:stop()
        self.follower = nil
    end
end

function PatrolBehavior.Destroy(self: PatrolBehavior)
    if self.destroyed then
        return
    end
    self.destroyed = true
    self:stop()
    self.model = nil
    self.humanoid = nil
    self.rootPart = nil
    self.target = nil
end

function PatrolBehavior.setState(self: PatrolBehavior, newState: PatrolState)
    self.state = newState
    if newState == "Patrol" then
        self.target = nil
        self:nextPatrolPoint()
    elseif newState == "Idle" then
        self.target = nil
        local humanoid = self.humanoid
        if humanoid then
            humanoid:Move(Vector3.zero)
        end
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

function PatrolBehavior.nextPatrolPoint(self: PatrolBehavior)
    if #self.patrolPoints == 0 then
        return
    end
    self.patrolIndex = (self.patrolIndex % #self.patrolPoints) + 1
    self:moveTo(self.patrolPoints[self.patrolIndex])
end

function PatrolBehavior.moveTo(self: PatrolBehavior, position: Vector3)
    if self.destroyed then
        return
    end
    if not self.follower then
        local humanoid = self.humanoid
        if not humanoid then
            return
        end
        self.follower = NPCPathFollower.new(humanoid)
    end
    local follower = self.follower
    if follower then
        follower:follow(position)
    end
    self.lastRecomputeTime = time()
    self.lastRecomputePosition = position
end

function PatrolBehavior.findTarget(self: PatrolBehavior): Model?
    local model = self.model
    local rootPart = self.rootPart
    if not model or not rootPart then
        return nil
    end
    local closest: Model? = nil
    local closestDist = self.detectionRange

    local characters: { Instance } = {}
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
    params.FilterType = Enum.RaycastFilterType.Include
    params.MaxParts = 100

    local parts = workspace:GetPartBoundsInRadius(rootPart.Position, self.detectionRange, params)
    for _, part in ipairs(parts) do
        local character = part:FindFirstAncestorOfClass("Model")
        if not character or character == model then
            continue
        end
        local hrp = character:FindFirstChild("HumanoidRootPart") :: BasePart?
        local humanoid = character:FindFirstChild("Humanoid") :: Humanoid?
        if hrp and humanoid and humanoid.Health > 0 then
            local dist = (hrp.Position - rootPart.Position).Magnitude
            if dist < closestDist then
                closestDist = dist
                closest = character
            end
        end
    end

    return closest
end

function PatrolBehavior.shouldRecompute(self: PatrolBehavior, position: Vector3): boolean
    local now = time()
    if (now - self.lastRecomputeTime) < self.recomputeInterval then
        return false
    end
    if
        self.lastRecomputePosition
        and (position - self.lastRecomputePosition).Magnitude < self.recomputeMinDistance
    then
        return false
    end
    return true
end

function PatrolBehavior.tick(self: PatrolBehavior, dt: number)
    if self.destroyed then
        return
    end
    local humanoid = self.humanoid
    local rootPart = self.rootPart
    if not humanoid or not rootPart then
        return
    end
    if humanoid.Health <= 0 then
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

        local dist = (hrp.Position - rootPart.Position).Magnitude
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

        local dist = (hrp.Position - rootPart.Position).Magnitude
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
