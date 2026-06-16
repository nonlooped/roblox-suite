--!strict
local AnimationLoader = {}
AnimationLoader.__index = AnimationLoader

export type AnimationLoader = {
    animator: Animator,
    cache: { [Animation]: AnimationTrack },
    connections: { RBXScriptConnection },
    LoadTrack: (self: AnimationLoader, animation: Animation, priority: Enum.AnimationPriority?, fadeTime: number?, weight: number?, speed: number?) -> AnimationTrack,
    PlayById: (self: AnimationLoader, assetId: string, priority: Enum.AnimationPriority?, fadeTime: number?, weight: number?, speed: number?) -> AnimationTrack?,
    StopAll: (self: AnimationLoader, fadeTime: number?) -> (),
    Destroy: (self: AnimationLoader) -> (),
}

local TweenService: TweenService = game:GetService("TweenService")

function AnimationLoader.new(animator: Animator): AnimationLoader
    assert(animator and animator:IsA("Animator"), "AnimationLoader requires a valid Animator")
    local self = setmetatable({}, AnimationLoader) :: any
    self.animator = animator
    self.cache = {}
    self.connections = {}
    return self :: AnimationLoader
end

function AnimationLoader:LoadTrack(
    animation: Animation,
    priority: Enum.AnimationPriority?,
    fadeTime: number?,
    weight: number?,
    speed: number?
): AnimationTrack
    local track = self.cache[animation]
    if not track or not track.IsPlaying then
        track = self.animator:LoadAnimation(animation)
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
    animation.Name = "Anim_" .. assetId:match("%d+") or "Anim"
    local track = self:LoadTrack(animation, priority, fadeTime, weight, speed)
    self.connections[#self.connections + 1] = track.Stopped:Connect(function()
        if animation then
            animation:Destroy()
        end
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
    for _, conn in ipairs(self.connections) do
        conn:Disconnect()
    end
    table.clear(self.connections)
    self:StopAll(0)
    table.clear(self.cache)
    self.animator = nil :: any
end

return AnimationLoader
