--!strict
-- Status: experimental
-- Last verified: 2026-06-17
-- Test coverage: no automated coverage
-- Intended use: example; adapt and test before production.

--[[
    StudioModelProbe.lua
    A reusable utility for summarizing the Roblox data model.

    Usage with MCP execute_luau:
        local probe = require(game.ReplicatedStorage.StudioModelProbe)
        print(probe.summarize(game.Workspace, { maxDepth = 2 }))

    This is a pattern you can adapt when asking an agent to explore a large place.
]]

local HttpService = game:GetService("HttpService")

local StudioModelProbe = {}

export type ProbeOptions = {
    maxDepth: number?,
    includeProperties: boolean?,
    propertyNames: { string }?,
    includeAttributes: boolean?,
    maxChildren: number?,
}

export type InstanceSummary = {
    name: string,
    className: string,
    path: string,
    attributes: { [string]: any }?,
    properties: { [string]: any }?,
    children: { InstanceSummary }?,
    childCount: number,
    truncated: boolean?,
}

type ResolvedOptions = {
    maxDepth: number,
    includeProperties: boolean,
    propertyNames: { string },
    includeAttributes: boolean,
    maxChildren: number,
}

local DEFAULT_OPTIONS: ResolvedOptions = {
    maxDepth = 2,
    includeProperties = false,
    propertyNames = {
        "Archivable",
        "Locked",
        "Enabled",
        "Visible",
        "Transparency",
        "Reflectance",
        "Value",
        "Text",
    },
    includeAttributes = true,
    maxChildren = 50,
}

local function mergeOptions(options: ProbeOptions?): ResolvedOptions
    local source: ProbeOptions = options or {}
    return {
        maxDepth = source.maxDepth or DEFAULT_OPTIONS.maxDepth,
        includeProperties = if source.includeProperties == nil
            then DEFAULT_OPTIONS.includeProperties
            else source.includeProperties,
        propertyNames = source.propertyNames or DEFAULT_OPTIONS.propertyNames,
        includeAttributes = if source.includeAttributes == nil
            then DEFAULT_OPTIONS.includeAttributes
            else source.includeAttributes,
        maxChildren = source.maxChildren or DEFAULT_OPTIONS.maxChildren,
    }
end

-- Recursively summarize an instance tree.
function StudioModelProbe.summarize(
    instance: Instance,
    options: ProbeOptions?,
    currentDepth: number?
): InstanceSummary
    local resolvedOptions = mergeOptions(options)
    local depth = currentDepth or 0

    local maxDepth = resolvedOptions.maxDepth
    local maxChildren = resolvedOptions.maxChildren

    local entry: InstanceSummary = {
        name = instance.Name,
        className = instance.ClassName,
        path = instance:GetFullName(),
        childCount = 0,
    }

    if resolvedOptions.includeAttributes then
        local attributes: { [string]: any } = {}
        for name, value in pairs(instance:GetAttributes()) do
            local valueType = typeof(value)
            if
                valueType == "string"
                or valueType == "number"
                or valueType == "boolean"
                or value == nil
            then
                attributes[name] = value
            else
                attributes[name] = tostring(value)
            end
        end
        if next(attributes) then
            entry.attributes = attributes
        end
    end

    if resolvedOptions.includeProperties then
        local props: { [string]: any } = {
            Parent = instance.Parent and instance.Parent.Name or nil,
        }
        for _, propName in ipairs(resolvedOptions.propertyNames) do
            local propOk, propValue = pcall(function()
                return (instance :: any)[propName]
            end)
            if propOk then
                local valueType = typeof(propValue)
                if
                    valueType == "string"
                    or valueType == "number"
                    or valueType == "boolean"
                    or propValue == nil
                then
                    props[propName] = propValue
                elseif valueType ~= "Instance" then
                    props[propName] = tostring(propValue)
                end
            end
        end
        if next(props) then
            entry.properties = props
        end
    end

    if depth < maxDepth then
        local children = instance:GetChildren()
        local childSummaries = {}
        for i = 1, math.min(#children, maxChildren) do
            table.insert(
                childSummaries,
                StudioModelProbe.summarize(children[i], resolvedOptions, depth + 1)
            )
        end
        entry.children = childSummaries
        entry.childCount = #children
        entry.truncated = #children > maxChildren
    else
        entry.childCount = #instance:GetChildren()
    end

    return entry
end

-- Summarize multiple top-level services at once.
function StudioModelProbe.summarizeServices(
    serviceNames: { string }?,
    options: ProbeOptions?
): { [string]: any }
    local resolvedServiceNames = serviceNames
        or {
            "Workspace",
            "ServerScriptService",
            "ReplicatedStorage",
            "StarterGui",
            "StarterPack",
            "Lighting",
        }

    local result: { [string]: any } = {
        placeName = workspace.Name,
    }
    for _, name in ipairs(resolvedServiceNames) do
        local ok, service = pcall(function()
            return game:GetService(name)
        end)
        if ok then
            result[name] = StudioModelProbe.summarize(service, options)
        else
            result[name] = { error = tostring(service) }
        end
    end
    return result
end

-- Encode a summary as JSON for easy MCP consumption.
function StudioModelProbe.summarizeAsJson(instance: Instance, options: ProbeOptions?): string
    local summary = StudioModelProbe.summarize(instance, options)
    local ok, encoded = pcall(function()
        return HttpService:JSONEncode(summary)
    end)
    if ok then
        return encoded
    end
    warn("StudioModelProbe JSON encoding failed: " .. tostring(encoded))
    return "Error encoding summary: " .. tostring(encoded)
end

-- Encode multiple service summaries as JSON.
function StudioModelProbe.summarizeServicesAsJson(
    serviceNames: { string }?,
    options: ProbeOptions?
): string
    local summary = StudioModelProbe.summarizeServices(serviceNames, options)
    local ok, encoded = pcall(function()
        return HttpService:JSONEncode(summary)
    end)
    if ok then
        return encoded
    end
    warn("StudioModelProbe JSON encoding failed: " .. tostring(encoded))
    return "Error encoding summary: " .. tostring(encoded)
end

return StudioModelProbe
