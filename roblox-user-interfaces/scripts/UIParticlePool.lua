--!strict
-- Status: experimental
-- Last verified: 2026-06-17
-- Test coverage: no automated coverage
-- Intended use: example; adapt and test before production.

--[[
UIParticlePool.lua
Simple 2D UI particle pool using ImageLabels + TweenService.

Usage (client LocalScript or module):
local UIParticlePool = require(path.to.UIParticlePool)
local pool = UIParticlePool.new(parentFrame, { poolSize = 40 })

pool:emit({
    texture = "rbxassetid://...",
    count = 12,
    lifetime = 0.8,
    velocity = NumberRange.new(0.1, 0.2), -- scale units per second
    size = UDim2.fromScale(0.04, 0.04),
    color = Color3.fromRGB(255, 220, 100),
    spread = Vector2.new(1, 0.5),         -- random direction multiplier
})

Cleanup:
pool:destroy()
]]

local TweenService = game:GetService("TweenService")

export type UIParticlePoolOptions = {
    poolSize: number?,
    maxActive: number?,
    zIndex: number?,
}

export type UIParticleConfig = {
    texture: string?,
    count: number?,
    lifetime: number?,
    velocity: NumberRange | number?, -- scale units per second
    size: UDim2?,
    color: Color3?,
    spread: Vector2?,
    origin: UDim2?,
    startTransparency: number?,
    endTransparency: number?,
    rotation: number?,
    spin: number?,
}

local UIParticlePool = {}
UIParticlePool.__index = UIParticlePool

export type UIParticlePool = typeof(setmetatable(
    {} :: {
        _parent: GuiObject?,
        _pool: { ImageLabel },
        _active: { [ImageLabel]: boolean },
        _tweens: { [ImageLabel]: Tween },
        _connections: { [Tween]: RBXScriptConnection },
        _maxActive: number,
        _zIndex: number,
        _activeCount: number,
        _destroyed: boolean,
    },
    UIParticlePool
))

local function randomInRange(range: NumberRange | number): number
    if typeof(range) == "NumberRange" then
        return range.Min + math.random() * (range.Max - range.Min)
    end
    return range
end

local function createLabel(parent: GuiObject, zIndex: number): ImageLabel
    local label = Instance.new("ImageLabel")
    label.BackgroundTransparency = 1
    label.Visible = false
    label.AnchorPoint = Vector2.new(0.5, 0.5)
    label.ZIndex = zIndex
    label.Parent = parent
    return label
end

function UIParticlePool.new(parent: GuiObject, options: UIParticlePoolOptions?): UIParticlePool
    assert(
        typeof(parent) == "Instance" and parent:IsA("GuiObject"),
        "UIParticlePool.new expects a GuiObject parent"
    )
    local resolvedOptions: UIParticlePoolOptions = options or {}

    local self = setmetatable({}, UIParticlePool) :: UIParticlePool
    self._parent = parent
    self._pool = {}
    self._active = {}
    self._tweens = {}
    self._connections = {}
    self._maxActive = resolvedOptions.maxActive or 80
    self._zIndex = resolvedOptions.zIndex or 10
    self._activeCount = 0
    self._destroyed = false

    local initialSize = resolvedOptions.poolSize or math.max(30, self._maxActive)
    initialSize = math.min(initialSize, self._maxActive)

    for _ = 1, initialSize do
        table.insert(self._pool, createLabel(parent, self._zIndex))
    end

    return self
end

function UIParticlePool._acquire(self: UIParticlePool): ImageLabel?
    for _, label in ipairs(self._pool) do
        if not self._active[label] then
            return label
        end
    end

    if #self._pool < self._maxActive then
        local parent = self._parent
        assert(parent, "Cannot acquire a particle from a destroyed UIParticlePool")
        local label = createLabel(parent, self._zIndex)
        table.insert(self._pool, label)
        return label
    end

    return nil
end

function UIParticlePool._cleanupTween(self: UIParticlePool, label: ImageLabel)
    local tween = self._tweens[label]
    if tween then
        local conn = self._connections[tween]
        if conn then
            conn:Disconnect()
            self._connections[tween] = nil
        end
        tween:Cancel()
        self._tweens[label] = nil
    end
end

function UIParticlePool._release(self: UIParticlePool, label: ImageLabel)
    self:_cleanupTween(label)
    if self._active[label] then
        self._active[label] = nil
        self._activeCount -= 1
    end
    label.Visible = false
    label.Image = ""
end

function UIParticlePool.emit(self: UIParticlePool, config: UIParticleConfig?)
    assert(not self._destroyed, "Cannot emit from a destroyed UIParticlePool")
    local resolvedConfig: UIParticleConfig = config or {}

    local count = math.min(resolvedConfig.count or 10, self._maxActive - self._activeCount)
    if count <= 0 then
        return
    end

    local texture = resolvedConfig.texture or ""
    local lifetime = resolvedConfig.lifetime or 0.6
    local size = resolvedConfig.size or UDim2.fromScale(0.05, 0.05)
    local color = resolvedConfig.color or Color3.new(1, 1, 1)
    local spread = resolvedConfig.spread or Vector2.new(1, 1)
    local origin = resolvedConfig.origin or UDim2.fromScale(0.5, 0.5)
    local velocityRange = resolvedConfig.velocity or NumberRange.new(0.1, 0.2)
    local fadeInfo = TweenInfo.new(lifetime, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)

    for _ = 1, count do
        local label = self:_acquire()
        if not label then
            break
        end

        self._active[label] = true
        self._activeCount += 1

        label.Image = texture
        label.ImageColor3 = color
        label.ImageTransparency = resolvedConfig.startTransparency or 0
        label.Rotation = resolvedConfig.rotation or math.random(0, 360)
        label.Size = size
        label.Position = origin
        label.Visible = true

        local angle = math.random() * math.pi * 2
        local speed = randomInRange(velocityRange)
        local distance = speed * lifetime

        local offset = UDim2.fromScale(
            spread.X * math.cos(angle) * distance,
            spread.Y * math.sin(angle) * distance
        )
        local goal = {
            Position = origin + offset,
            ImageTransparency = resolvedConfig.endTransparency or 1,
            Rotation = label.Rotation + (resolvedConfig.spin or math.random(-90, 90)),
        }

        local tween = TweenService:Create(label, fadeInfo, goal)
        self._tweens[label] = tween
        self._connections[tween] = tween.Completed:Once(function()
            self:_release(label)
        end)
        tween:Play()
    end
end

function UIParticlePool.destroy(self: UIParticlePool)
    self._destroyed = true

    for _, label in ipairs(self._pool) do
        self:_cleanupTween(label)
        label:Destroy()
    end

    table.clear(self._pool)
    table.clear(self._active)
    table.clear(self._tweens)
    table.clear(self._connections)
    self._activeCount = 0
    self._parent = nil
end

return UIParticlePool
