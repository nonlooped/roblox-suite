--!strict
-- Status: experimental
-- Last verified: 2026-06-17
-- Test coverage: no automated coverage
-- Intended use: example; adapt and test before production.

local AnimationLoader = {}
AnimationLoader.__index = AnimationLoader

type AnimationLoaderState = {
    animator: Animator?,
    cache: { [Animation]: AnimationTrack },
    connections: { RBXScriptConnection },
    destroyed: boolean,
}

export type AnimationLoader = typeof(setmetatable({} :: AnimationLoaderState, AnimationLoader))

function AnimationLoader.new(animator: Animator): AnimationLoader
    assert(animator and animator:IsA("Animator"), "AnimationLoader requires a valid Animator")
    local self = setmetatable(
        {
            animator = animator,
            cache = {},
            connections = {},
            destroyed = false,
        } :: AnimationLoaderState,
        AnimationLoader
    )
    return self
end

function AnimationLoader:LoadTrack(
    animation: Animation,
    priority: Enum.AnimationPriority?,
    fadeTime: number?,
    weight: number?,
    speed: number?
): AnimationTrack
    assert(not self.destroyed, "AnimationLoader has been destroyed")
    local animator = assert(self.animator, "AnimationLoader has no Animator")
    local track = self.cache[animation]
    if not track then
        track = animator:LoadAnimation(animation)
        self.cache[animation] = track
    end
    track.Priority = priority or Enum.AnimationPriority.Action
    track:Play(fadeTime or 0.1, weight or 1, speed or 1)
    return track
end

function AnimationLoader:PlayById(
    assetId: string,
    priority: Enum.AnimationPriority?,
    fadeTime: number?,
    weight: number?,
    speed: number?
): AnimationTrack?
    local animation = Instance.new("Animation")
    animation.AnimationId = assetId
    local numericId = assetId:match("%d+")
    animation.Name = if numericId then "Anim_" .. numericId else "Anim"
    local track: AnimationTrack = self:LoadTrack(animation, priority, fadeTime, weight, speed)
    self.connections[#self.connections + 1] = track.Stopped:Connect(function()
        self.cache[animation] = nil
        track:Destroy()
        animation:Destroy()
    end)
    return track
end

function AnimationLoader:StopAll(fadeTime: number?)
    for _, track in pairs(self.cache) do
        if track.IsPlaying then
            track:Stop(fadeTime or 0.1)
        end
    end
end

function AnimationLoader:Destroy()
    if self.destroyed then
        return
    end
    self.destroyed = true
    for _, conn in ipairs(self.connections) do
        conn:Disconnect()
    end
    table.clear(self.connections)
    self:StopAll(0)
    table.clear(self.cache)
    self.animator = nil
end

return AnimationLoader
