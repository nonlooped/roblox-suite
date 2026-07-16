--!strict
-- Status: experimental
-- Last verified: 2026-06-17
-- Test coverage: no automated coverage
-- Intended use: example; adapt and test before production.

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

local NPCPathFollower = {}
NPCPathFollower.__index = NPCPathFollower

export type PathWaypoint = typeof(PathfindingService:CreatePath():GetWaypoints()[1])

export type NPCPathFollowerOptions =
    {
        agentRadius: number?,
        agentHeight: number?,
        agentCanJump: boolean?,
        agentCanClimb: boolean?,
        waypointSpacing: number?,
        costs: { [string]: number }?,
        calculationSecondsTimeout: number?,
        moveToTimeout: number?,
        moveToRetryDelay: number?,
        maxMoveFailures: number?,
        customActionHandlers: {
            [string]: (humanoid: Humanoid, waypoint: PathWaypoint, follower: NPCPathFollower) -> (),
        }?,
    }

type NPCPathFollowerState =
    {
        humanoid: Humanoid,
        options: NPCPathFollowerOptions,
        agentRadius: number,
        agentHeight: number,
        agentCanJump: boolean,
        agentCanClimb: boolean,
        waypointSpacing: number,
        costs: { [string]: number },
        calculationSecondsTimeout: number,
        moveToTimeout: number,
        moveToRetryDelay: number,
        maxMoveFailures: number,
        customActionHandlers: {
            [string]: (humanoid: Humanoid, waypoint: PathWaypoint, follower: NPCPathFollower) -> (),
        },

        path: Path?,
        waypoints: { PathWaypoint },
        currentIndex: number,
        blockedConnection: RBXScriptConnection?,
        reachedConnection: RBXScriptConnection?,
        diedConnection: RBXScriptConnection?,
        moveToTimeoutThread: thread?,
        recomputeThread: thread?,
        running: boolean,
        moveFailCount: number,
    }

export type NPCPathFollower = typeof(setmetatable({} :: NPCPathFollowerState, NPCPathFollower))

function NPCPathFollower.new(humanoid: Humanoid, options: NPCPathFollowerOptions?): NPCPathFollower
    local resolvedOptions: NPCPathFollowerOptions = options or {}
    local self = setmetatable(
        {
            humanoid = humanoid,
            options = resolvedOptions,
            agentRadius = resolvedOptions.agentRadius or 2,
            agentHeight = resolvedOptions.agentHeight or 5,
            agentCanJump = resolvedOptions.agentCanJump ~= false,
            agentCanClimb = resolvedOptions.agentCanClimb or false,
            waypointSpacing = resolvedOptions.waypointSpacing or 4,
            costs = resolvedOptions.costs or {},
            calculationSecondsTimeout = resolvedOptions.calculationSecondsTimeout or 1,
            moveToTimeout = resolvedOptions.moveToTimeout or 6,
            moveToRetryDelay = resolvedOptions.moveToRetryDelay or 0.2,
            maxMoveFailures = resolvedOptions.maxMoveFailures or 3,
            customActionHandlers = resolvedOptions.customActionHandlers or {},
            path = nil :: Path?,
            waypoints = {} :: { PathWaypoint },
            currentIndex = 1,
            blockedConnection = nil :: RBXScriptConnection?,
            reachedConnection = nil :: RBXScriptConnection?,
            diedConnection = nil :: RBXScriptConnection?,
            moveToTimeoutThread = nil :: thread?,
            recomputeThread = nil :: thread?,
            running = false,
            moveFailCount = 0,
        } :: NPCPathFollowerState,
        NPCPathFollower
    )

    self.diedConnection = humanoid.Died:Connect(function()
        self:stop()
    end)

    return self
end

function NPCPathFollower.createPath(self: NPCPathFollower): Path
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

function NPCPathFollower._disconnectReached(self: NPCPathFollower)
    if self.reachedConnection then
        self.reachedConnection:Disconnect()
        self.reachedConnection = nil
    end
end

function NPCPathFollower._cancelMoveToTimeout(self: NPCPathFollower)
    if self.moveToTimeoutThread then
        task.cancel(self.moveToTimeoutThread)
        self.moveToTimeoutThread = nil
    end
end

function NPCPathFollower._cancelRecompute(self: NPCPathFollower)
    if self.recomputeThread then
        task.cancel(self.recomputeThread)
        self.recomputeThread = nil
    end
end

function NPCPathFollower._cleanupPathConnections(self: NPCPathFollower)
    self:_cancelRecompute()
    if self.blockedConnection then
        self.blockedConnection:Disconnect()
        self.blockedConnection = nil
    end
    self:_disconnectReached()
    self:_cancelMoveToTimeout()
end

function NPCPathFollower.follow(self: NPCPathFollower, targetPosition: Vector3)
    if self.humanoid.Health <= 0 then
        return
    end

    self:stop()
    self.running = true
    self.moveFailCount = 0
    self:computeAndMove(targetPosition)
end

function NPCPathFollower.computeAndMove(self: NPCPathFollower, targetPosition: Vector3)
    if not self.running or self.humanoid.Health <= 0 then
        self:stop()
        return
    end

    self:_cleanupPathConnections()
    local path = self:createPath()
    self.path = path

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
        path:ComputeAsync(rootPart.Position, targetPosition)
    end)

    if not success or path.Status ~= Enum.PathStatus.Success then
        warn("NPCPathFollower failed:", err or path.Status)
        self:stop()
        return
    end

    self.waypoints = path:GetWaypoints()
    self.currentIndex = 1
    self.moveFailCount = 0

    self.blockedConnection = path.Blocked:Connect(function(blockedIndex: number)
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

function NPCPathFollower.moveToNextWaypoint(self: NPCPathFollower)
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

function NPCPathFollower._onMoveToTimeout(self: NPCPathFollower)
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

function NPCPathFollower.stop(self: NPCPathFollower)
    self.running = false
    self:_cleanupPathConnections()

    local rootPart = self.humanoid.RootPart
    if rootPart then
        self.humanoid:MoveTo(rootPart.Position)
    else
        self.humanoid:Move(Vector3.zero)
    end
end

function NPCPathFollower.Destroy(self: NPCPathFollower)
    self:stop()
    if self.diedConnection then
        self.diedConnection:Disconnect()
        self.diedConnection = nil
    end
end

return NPCPathFollower
