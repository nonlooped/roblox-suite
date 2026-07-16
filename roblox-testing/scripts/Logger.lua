--!strict
-- Status: experimental
-- Last verified: 2026-06-17
-- Test coverage: no automated coverage
-- Intended use: example; adapt and test before production.

--[[
    Logger.lua
    A simple structured logger with level filtering.

    Usage:
        local Logger = require(path.to.Logger)
        local log = Logger.new("InventorySystem", Logger.Levels.Warn)
        log:info("Loaded")
        log:warn("Missing item %d", 123)
        log:error("Failed to save: %s", err)

    Notes:
        - log:error halts execution by calling Lua's error() function.
        - Contextual fields are not supported by this minimal logger.
          Include any context directly in the message or use a structured
          logging library for field-based output.
]]

local Logger = {}
Logger.Levels = {
    Debug = 1,
    Info = 2,
    Warn = 3,
    Error = 4,
}

Logger.__index = Logger

function Logger.new(name: string?, minLevel: number?)
    local self = setmetatable({}, Logger)
    self.name = name or "Logger"
    self.minLevel = minLevel or Logger.Levels.Info
    return self
end

function Logger:_log(levelName: string, levelValue: number, fmt: string, ...: any)
    if levelValue < self.minLevel then
        return
    end
    local ok, msg = pcall(string.format, fmt, ...)
    if not ok then
        msg = "[bad format string: " .. tostring(fmt) .. "]"
    end
    local output = string.format("[%s][%s] %s", self.name, levelName, msg)
    if levelValue >= Logger.Levels.Error then
        error(output, 3)
    elseif levelValue >= Logger.Levels.Warn then
        warn(output)
    else
        print(output)
    end
end

function Logger:debug(fmt: string, ...: any)
    self:_log("DEBUG", Logger.Levels.Debug, fmt, ...)
end

function Logger:info(fmt: string, ...: any)
    self:_log("INFO", Logger.Levels.Info, fmt, ...)
end

function Logger:warn(fmt: string, ...: any)
    self:_log("WARN", Logger.Levels.Warn, fmt, ...)
end

function Logger:error(fmt: string, ...: any)
    self:_log("ERROR", Logger.Levels.Error, fmt, ...)
end

return Logger
