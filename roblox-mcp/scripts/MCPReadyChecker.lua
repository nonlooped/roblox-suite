--!strict
--[[
    MCPReadyChecker.lua
    Diagnostic utilities for verifying Roblox Studio MCP + Script Sync readiness.

    Usage with MCP execute_luau:
        local checker = require(game.ReplicatedStorage.MCPReadyChecker)
        print(checker.getReport())

    Or copy the functions into an execute_luau prompt for a quick one-off check.
]]

local HttpService = game:GetService("HttpService")

local MCPReadyChecker = {}

-- Summarize a service: script count, module count, sync status if available.
function MCPReadyChecker.summarizeService(service)
    local syncStatus = "n/a"
    local ok, syncService = pcall(function()
        return game:GetService("InstanceFileSyncService")
    end)

    if ok and syncService and syncService.GetStatus then
        local statusOk, status = pcall(function()
            return syncService:GetStatus(service)
        end)
        if statusOk then
            syncStatus = tostring(status)
        end
    end

    local scriptCount = 0
    local moduleCount = 0
    for _, desc in ipairs(service:GetDescendants()) do
        if desc:IsA("Script") or desc:IsA("LocalScript") then
            scriptCount += 1
        elseif desc:IsA("ModuleScript") then
            moduleCount += 1
        end
    end

    return {
        name = service.Name,
        className = service.ClassName,
        syncStatus = syncStatus,
        scriptCount = scriptCount,
        moduleCount = moduleCount,
        childCount = #service:GetChildren(),
    }
end

-- Check key Studio services and whether they are present.
function MCPReadyChecker.checkServices()
    local services = {
        "Workspace",
        "ServerScriptService",
        "ReplicatedStorage",
        "StarterGui",
        "StarterPlayer",
        "Lighting",
        "Players",
    }

    local result = {}
    for _, name in ipairs(services) do
        local ok, service = pcall(function()
            return game:GetService(name)
        end)
        result[name] = ok and {
            present = true,
            childCount = #service:GetChildren(),
        } or {
            present = false,
            error = tostring(service),
        }
    end

    return result
end

-- Build a full readiness report as a table.
function MCPReadyChecker.buildReport()
    local starterPlayer = game:GetService("StarterPlayer")
    local starterPlayerScripts = starterPlayer:FindFirstChild("StarterPlayerScripts")
    local starterSummary
    if starterPlayerScripts then
        starterSummary = MCPReadyChecker.summarizeService(starterPlayerScripts)
    else
        starterSummary = { name = "StarterPlayerScripts", present = false }
    end

    local report = {
        placeName = workspace.Name,
        placeId = game.PlaceId,
        gameId = game.GameId,
        studioRuntime = "Roblox Studio",
        services = MCPReadyChecker.checkServices(),
        scriptSync = (function()
            local ok, err = pcall(function()
                return game:GetService("InstanceFileSyncService")
            end)
            if not ok then
                warn("InstanceFileSyncService unavailable: " .. tostring(err))
                return { available = false, error = tostring(err) }
            end
            return { available = true }
        end)(),
        keyServices = {
            ServerScriptService = MCPReadyChecker.summarizeService(game:GetService("ServerScriptService")),
            ReplicatedStorage = MCPReadyChecker.summarizeService(game:GetService("ReplicatedStorage")),
            StarterPlayerScripts = starterSummary,
        },
    }

    return report
end

-- Return the report as a pretty-printed JSON string for MCP output.
function MCPReadyChecker.getReport()
    local report = MCPReadyChecker.buildReport()
    local ok, encoded = pcall(function()
        return HttpService:JSONEncode(report)
    end)
    if ok then
        return encoded
    else
        warn("MCPReadyChecker JSON encoding failed: " .. tostring(encoded))
        return "Error encoding report: " .. tostring(encoded)
    end
end

return MCPReadyChecker
