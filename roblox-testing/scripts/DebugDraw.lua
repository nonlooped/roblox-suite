--[[
    DebugDraw.lua
    Utility for drawing temporary debug visuals in the 3D world.

    Usage:
        local DebugDraw = require(path.to.DebugDraw)
        DebugDraw.point(workspace, Vector3.new(0, 10, 0), Color3.fromRGB(255, 0, 0), 2)
        DebugDraw.ray(workspace, origin, direction, Color3.fromRGB(0, 255, 0), 2)
        DebugDraw.box(workspace, cframe, size, Color3.fromRGB(0, 0, 255), 2)

        DebugDraw.clear() -- removes all tracked debug parts
]]

local DebugDraw = {}

local registry = {}

local function validateParent(parent)
    assert(typeof(parent) == "Instance", "parent must be an Instance")
end

local function createBase()
    local part = Instance.new("Part")
    part.Anchored = true
    part.CanCollide = false
    part.CanQuery = false
    part.CanTouch = false
    part.Material = Enum.Material.SmoothPlastic
    return part
end

local function track(part, lifetime)
    table.insert(registry, part)

    if lifetime then
        task.delay(lifetime, function()
            if part.Parent ~= nil then
                part:Destroy()
            end
            for i = #registry, 1, -1 do
                if registry[i] == part then
                    table.remove(registry, i)
                    break
                end
            end
        end)
    end
end

function DebugDraw.point(parent, position, color, lifetime)
    validateParent(parent)
    local part = createBase()
    part.Shape = Enum.PartType.Ball
    part.Size = Vector3.new(0.5, 0.5, 0.5)
    part.CFrame = CFrame.new(position)
    part.Color = color or Color3.fromRGB(255, 0, 0)
    part.Parent = parent
    track(part, lifetime)
    return part
end

function DebugDraw.ray(parent, origin, direction, color, lifetime)
    validateParent(parent)
    local distance = direction.Magnitude
    assert(distance > 0, "direction must be non-zero")

    local part = createBase()
    part.Size = Vector3.new(0.1, 0.1, distance)
    part.CFrame = CFrame.lookAt(origin, origin + direction) * CFrame.new(0, 0, -distance / 2)
    part.Color = color or Color3.fromRGB(0, 255, 0)
    part.Parent = parent
    track(part, lifetime)
    return part
end

function DebugDraw.box(parent, cframe, size, color, lifetime)
    validateParent(parent)
    local part = createBase()
    part.Size = size
    part.CFrame = cframe
    part.Transparency = 0.7
    part.Color = color or Color3.fromRGB(0, 0, 255)
    part.Parent = parent
    track(part, lifetime)
    return part
end

function DebugDraw.clear()
    for i = #registry, 1, -1 do
        local part = registry[i]
        if part and part.Parent ~= nil then
            part:Destroy()
        end
        registry[i] = nil
    end
end

return DebugDraw
