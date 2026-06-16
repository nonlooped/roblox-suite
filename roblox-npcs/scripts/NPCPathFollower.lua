--!strict
--[[
    NPCPathFollower.lua
    A strict, Humanoid-based path follower with cleanup.

    Usage:
        local NPCPathFollower = require(path.to.NPCPathFollower)
        local humanoid = npcModel:WaitForChild("Humanoid") :: Humanoid
        local follower = NPCPathFollower.new(humanoid)
        follower:follow(targetPosition)
        follower:stop()
        follower:Destroy()
]]

local PathfindingService = game:GetService("PathfindingService")

export type PathWaypoint = {
    Position: Vector3,
    Action: Enum.PathWaypointAction,
    Label: string,
}

export type NPCPathFollowerOptions = {
    agentRadius: number?,
    agentHeight: number?,
    agentCanJump: boolean?,
    agentCanClimb: boolean?,
    waypointSpacing: number?,
    costs: {[string]: number}?,
    calculationSecondsTimeout: number?,
    moveToTimeout: number?,
    moveToRetryDelay: number?,
    maxMoveFailures: number?,
    customActionHandlers: {[string]: (humanoid: Humanoid, waypoint: PathWaypoint, follower: NPCPathFollower) -> ()}?,
}

export type NPCPathFollower = {
    humanoid: Humanoid,
    options: NPCPathFollowerOptions,
    agentRadius: number,
    agentHeight: number,
    agentCanJump: boolean,
    agentCanClimb: boolean,
    waypointSpacing: number,
    costs: {[string]: number},
    calculationSecondsTimeout: number,
    moveToTimeout: number,
    moveToRetryDelay: number,
    maxMoveFailures: number,
    customActionHandlers: {[string]: (humanoid: Humanoid, waypoint: PathWaypoint, follower: NPCPathFollower) -> ()},

    path: any,
    waypoints: {PathWaypoint},
    currentIndex: number,
    blockedConnection: RBXScriptConnection?,
    reachedConnection: RBXScriptConnection?,
    diedConnection: RBXScriptConnection?,
    moveToTimeoutThread: thread?,
    recomputeThread: thread?,
    running: boolean,
    moveFailCount: number,
}

local NPCPathFollower = {}
NPCPathFollower.__index = NPCPathFollower

function NPCPathFollower.new(humanoid: Humanoid, options: NPCPathFollowerOptions?): NPCPathFollower
    local self = setmetatable({}, NPCPathFollower) :: NPCPathFollower
    self.humanoid = humanoid
    self.options = options or {}

    self.agentRadius = self.options.agentRadius or 2
    self.agentHeight = self.options.agentHeight or 5
    self.agentCanJump = self.options.agentCanJump ~= false
    self.agentCanClimb = self.options.agentCanClimb or false
    self.waypointSpacing = self.options.waypointSpacing or 4
    self.costs = self.options.costs or {}
    self.calculationSecondsTimeout = self.options.calculationSecondsTimeout or 1
    self.moveToTimeout = self.options.moveToTimeout or 6
    self.moveToRetryDelay = self.options.moveToRetryDelay or 0.2
    self.maxMoveFailures = self.options.maxMoveFailures or 3
    self.customActionHandlers = self.options.customActionHandlers or {}

    self.path = nil
    self.waypoints = {}
    self.currentIndex = 1
    self.blockedConnection = nil
    self.reachedConnection = nil
    self.diedConnection = nil
    self.moveToTimeoutThread = nil
    self.recomputeThread = nil
    self.running = false
    self.moveFailCount = 0

    self.diedConnection = humanoid.Died:Connect(function()
        self:stop()
    end)

    return self
end

function NPCPathFollower:createPath(): any
    local path = PathfindingService:CreatePath({
        AgentRadius = self.agentRadius,
        AgentHeight = self.agentHeight,
        AgentCanJump = self.agentCanJump,
        AgentCanClimb = self.agentCanClimb,
        WaypointSpacing = self.waypointSpacing,
        Costs = self.costs,
    })
    path.CalculationSecondsTimeout = self.calculationSecondsTimeout
    return path
end

function NPCPathFollower:_disconnectReached()
    if self.reachedConnection then
        self.reachedConnection:Disconnect()
        self.reachedConnection = nil
    end
end

function NPCPathFollower:_cancelMoveToTimeout()
    if self.moveToTimeoutThread then
        task.cancel(self.moveToTimeoutThread)
        self.moveToTimeoutThread = nil
    end
end

function NPCPathFollower:_cancelRecompute()
    if self.recomputeThread then
        task.cancel(self.recomputeThread)
        self.recomputeThread = nil
    end
end

function NPCPathFollower:_cleanupPathConnections()
    self:_cancelRecompute()
    if self.blockedConnection then
        self.blockedConnection:Disconnect()
        self.blockedConnection = nil
    end
    self:_disconnectReached()
    self:_cancelMoveToTimeout()
end

function NPCPathFollower:follow(targetPosition: Vector3)
    if self.humanoid.Health <= 0 then
        return
    end

    self:stop()
    self.running = true
    self.moveFailCount = 0
    self:computeAndMove(targetPosition)
end

function NPCPathFollower:computeAndMove(targetPosition: Vector3)
    if not self.running or self.humanoid.Health <= 0 then
        self:stop()
        return
    end

    self:_cleanupPathConnections()
    self.path = self:createPath()

    local character = self.humanoid.Parent
    if not character then
        self:stop()
        return
    end
    local rootPart = character:FindFirstChild("HumanoidRootPart") :: BasePart?
    if not rootPart then
        self:stop()
        return
    end

    local success, err = pcall(function()
        self.path:ComputeAsync(rootPart.Position, targetPosition)
    end)

    if not success or self.path.Status ~= Enum.PathStatus.Success then
        warn("NPCPathFollower failed:", err or self.path.Status)
        self:stop()
        return
    end

    self.waypoints = self.path:GetWaypoints()
    self.currentIndex = 1
    self.moveFailCount = 0

    self.blockedConnection = self.path.Blocked:Connect(function(blockedIndex: number)
        if not self.running or self.humanoid.Health <= 0 then
            return
        end
        if blockedIndex >= self.currentIndex then
            self:_cancelRecompute()
            self.recomputeThread = task.delay(0, function()
                self.recomputeThread = nil
                if self.running then
                    self:computeAndMove(targetPosition)
                end
            end)
        end
    end)

    self:moveToNextWaypoint()
end

function NPCPathFollower:moveToNextWaypoint()
    if not self.running or self.humanoid.Health <= 0 then
        self:stop()
        return
    end

    if self.currentIndex > #self.waypoints then
        self:stop()
        return
    end

    local waypoint = self.waypoints[self.currentIndex]

    self:_disconnectReached()
    self:_cancelMoveToTimeout()

    if waypoint.Label ~= "" then
        local handler = self.customActionHandlers[waypoint.Label]
        if handler then
            handler(self.humanoid, waypoint, self)
        end
    end

    if waypoint.Action == Enum.PathWaypointAction.Jump then
        self.humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
    elseif waypoint.Action == Enum.PathWaypointAction.Climb then
        -- Climbing truss parts is handled automatically by the Humanoid.
    end

    self.humanoid:MoveTo(waypoint.Position)

    self.moveToTimeoutThread = task.delay(self.moveToTimeout, function()
        self:_onMoveToTimeout()
    end)

    self.reachedConnection = self.humanoid.MoveToFinished:Connect(function(reached: boolean)
        self:_cancelMoveToTimeout()
        if not self.running then
            return
        end
        if self.humanoid.Health <= 0 then
            self:stop()
            return
        end

        if reached then
            self.moveFailCount = 0
            self.currentIndex += 1
            self:moveToNextWaypoint()
        else
            self.moveFailCount += 1
            if self.moveFailCount > self.maxMoveFailures then
                warn("NPCPathFollower: MoveTo failed too many times, stopping.")
                self:stop()
                return
            end
            task.delay(self.moveToRetryDelay, function()
                if self.running then
                    self:moveToNextWaypoint()
                end
            end)
        end
    end)
end

function NPCPathFollower:_onMoveToTimeout()
    if not self.running or self.humanoid.Health <= 0 then
        self:stop()
        return
    end

    self:_disconnectReached()
    self.moveFailCount += 1
    if self.moveFailCount > self.maxMoveFailures then
        warn("NPCPathFollower: MoveTo timed out too many times, stopping.")
        self:stop()
        return
    end

    task.delay(self.moveToRetryDelay, function()
        if self.running then
            self:moveToNextWaypoint()
        end
    end)
end

function NPCPathFollower:stop()
    self.running = false
    self:_cleanupPathConnections()

    local rootPart = self.humanoid.RootPart
    if rootPart then
        self.humanoid:MoveTo(rootPart.Position)
    else
        self.humanoid:Move(Vector3.zero)
    end
end

function NPCPathFollower:Destroy()
    self:stop()
    if self.diedConnection then
        self.diedConnection:Disconnect()
        self.diedConnection = nil
    end
end

return NPCPathFollower
