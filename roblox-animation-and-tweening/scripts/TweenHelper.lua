--!strict
local TweenHelper = {}

export type TweenConfig = {
    duration: number,
    easingStyle: Enum.EasingStyle?,
    easingDirection: Enum.EasingDirection?,
    repeatCount: number?,
    reverses: boolean?,
    delayTime: number?,
}

local TweenService: TweenService = game:GetService("TweenService")

local function buildTweenInfo(config: TweenConfig): TweenInfo
    return TweenInfo.new(
        config.duration,
        config.easingStyle or Enum.EasingStyle.Quad,
        config.easingDirection or Enum.EasingDirection.Out,
        config.repeatCount or 0,
        config.reverses or false,
        config.delayTime or 0
    )
end

function TweenHelper.tween(instance: Instance, properties: { [string]: any }, config: TweenConfig): Tween
    local info = buildTweenInfo(config)
    local tween = TweenService:Create(instance, info, properties)
    tween:Play()
    return tween
end

function TweenHelper.tweenAsync(instance: Instance, properties: { [string]: any }, config: TweenConfig): boolean
    local tween = TweenHelper.tween(instance, properties, config)
    local completed = false
    local conn: RBXScriptConnection?
    conn = tween.Completed:Connect(function()
        completed = true
        if conn then
            conn:Disconnect()
        end
    end)
    while not completed do
        task.wait()
    end
    return completed
end

function TweenHelper.sequence(steps: { { instance: Instance, properties: { [string]: any }, config: TweenConfig } }): ()
    local current = 1
    local function playNext()
        if current > #steps then
            return
        end
        local step = steps[current]
        current += 1
        local tween = TweenHelper.tween(step.instance, step.properties, step.config)
        local conn: RBXScriptConnection?
        conn = tween.Completed:Once(function()
            if conn then
                conn:Disconnect()
            end
            playNext()
        end)
    end
    playNext()
end

return TweenHelper
