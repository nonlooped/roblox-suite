--!strict
--[[
ServiceHelper.lua
Small utilities for working with Roblox services and modules safely.

local ServiceHelper = require(...)
local Players = ServiceHelper.getService("Players")
local MyModule = ServiceHelper.requireModule("MyModule") -- waits safely
]]

local ServiceHelper = {}

function ServiceHelper.getService(serviceName: string): Instance
    return game:GetService(serviceName)
end

local DEFAULT_TIMEOUT: number = 10

function ServiceHelper.requireModule<T>(moduleName: string, parent: Instance?, timeout: number?): T
    parent = parent or game:GetService("ReplicatedStorage")
    local module = parent:WaitForChild(moduleName, timeout or DEFAULT_TIMEOUT)
    if module and module:IsA("ModuleScript") then
        return require(module) :: T
    end
    error("Module not found or not a ModuleScript: " .. moduleName)
end

return ServiceHelper