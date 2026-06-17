--!strict
--[[
    EffectBurst.lua

    Clone-and-destroy helper for one-shot particle bursts.

    Given a template ParticleEmitter (or a BasePart/Attachment that contains
    emitters), this module clones the emitters, parents them, emits a burst,
    and automatically cleans them up after the longest possible lifetime.

    Why clone-and-destroy?
    - The shared live emitter is never mutated, so there is no race condition
      between bursts and no gap in continuous emitters.
    - One-shot effects become self-contained instances that can outlive their
      caller and be destroyed safely when finished.

    Most one-shot effects should be emitted on the client only. Spawn the
    clone locally and call :Emit() from a LocalScript/Client module. This
    avoids replicating individual particles across the network and keeps
    authoritative ownership simple: the server tells the client *that* an
    effect happened (e.g. via a remote event); the client decides *how* to
    render it.

    Example:
        local EffectBurst = require(path.to.EffectBurst)
        EffectBurst.emitFrom(templateAttachment, {
            count = 25,
            clear = true, -- clear any existing particles before bursting
        })
]]

export type BurstConfig = {
    count: number?,
    clear: boolean?,
    parent: Instance?,
}

local DEFAULT_CONFIG: BurstConfig = {
    count = 20,
    clear = false,
}

local Debris = game:GetService("Debris")

local function getMaxLifetime(emitter: ParticleEmitter): number
    local lifetime = emitter.Lifetime
    if typeof(lifetime) == "NumberRange" then
        return lifetime.Max
    end
    return tonumber(lifetime) or 1
end

local function cloneAndBurst(templateEmitter: ParticleEmitter, config: BurstConfig): ParticleEmitter
    local clone: ParticleEmitter = templateEmitter:Clone()
    clone.Name ..= "_Burst"
    clone.Enabled = false
    clone.Rate = 0

    local burstParent = config.parent or templateEmitter.Parent
    if burstParent then
        clone.Parent = burstParent
    end

    if config.clear then
        clone:Clear()
    end

    local count = config.count or DEFAULT_CONFIG.count
    clone:Emit(count)

    local maxLifetime = getMaxLifetime(clone)
    Debris:AddItem(clone, maxLifetime)

    return clone
end

local function findTemplates(parent: Instance): { ParticleEmitter }
    local templates: { ParticleEmitter } = {}
    for _, child in ipairs(parent:GetDescendants()) do
        if child:IsA("ParticleEmitter") then
            table.insert(templates, child)
        end
    end
    return templates
end

local EffectBurst = {}

-- Emit from every ParticleEmitter found inside `parent`.
function EffectBurst.emitFrom(parent: Instance?, config: BurstConfig?): { ParticleEmitter }
    local resolvedConfig = config or DEFAULT_CONFIG
    local clones: { ParticleEmitter } = {}

    if not parent then
        return clones
    end

    local templates = findTemplates(parent)
    for _, templateEmitter in ipairs(templates) do
        local clone = cloneAndBurst(templateEmitter, resolvedConfig)
        table.insert(clones, clone)
    end

    return clones
end

-- Emit from a single ParticleEmitter template.
function EffectBurst.emitFromEmitter(templateEmitter: ParticleEmitter?, config: BurstConfig?): ParticleEmitter?
    if not templateEmitter then
        return nil
    end

    local resolvedConfig = config or DEFAULT_CONFIG
    return cloneAndBurst(templateEmitter, resolvedConfig)
end

return EffectBurst