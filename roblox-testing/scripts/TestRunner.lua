--!strict
--[[
    TestRunner.lua
    A minimal in-Studio test runner shim.

    This is NOT a replacement for TestEZ, which is the standard Roblox testing
    framework. Use TestEZ for real projects. This module is a small fallback
    for environments where TestEZ is not available.

    Usage:
        local TestRunner = require(path.to.TestRunner)
        local runner = TestRunner.new()

        runner:describe("Math", function()
            runner:it("adds numbers", function()
                runner:expect(1 + 1).toBe(2)
            end)
        end)

        runner:run()
]]

local TestService = game:GetService("TestService")

local TestRunner = {}
TestRunner.__index = TestRunner

function TestRunner.new(options)
    options = options or {}
    local self = setmetatable({}, TestRunner)
    self.suites = {}
    self.stack = {}
    self.hooks = { beforeEach = {}, afterEach = {} }
    self.useTestService = options.useTestService ~= false
    self.timeout = options.timeout or 5
    return self
end

function TestRunner:_currentSuite()
    return self.stack[#self.stack]
end

function TestRunner:describe(name, fn)
    local parent = self:_currentSuite()
    local suite = {
        name = name,
        tests = {},
        suites = {},
        parent = parent,
        beforeEach = {},
        afterEach = {},
    }

    if parent then
        table.insert(parent.suites, suite)
    else
        table.insert(self.suites, suite)
    end

    table.insert(self.stack, suite)
    fn()
    table.remove(self.stack)
end

function TestRunner:beforeEach(fn)
    local suite = self:_currentSuite()
    assert(suite, "beforeEach() must be called inside describe()")
    table.insert(suite.beforeEach, fn)
end

function TestRunner:afterEach(fn)
    local suite = self:_currentSuite()
    assert(suite, "afterEach() must be called inside describe()")
    table.insert(suite.afterEach, fn)
end

function TestRunner:it(name, fn)
    local suite = self:_currentSuite()
    assert(suite, "it() must be called inside describe()")
    table.insert(suite.tests, { name = name, fn = fn })
end

local function deepEqual(a, b)
    if a == b then
        return true
    end
    if typeof(a) ~= "table" or typeof(b) ~= "table" then
        return false
    end
    for k, v in pairs(a) do
        if not deepEqual(v, b[k]) then
            return false, k
        end
    end
    for k, _ in pairs(b) do
        if a[k] == nil then
            return false, k
        end
    end
    return true
end

local function isPromiseLike(obj)
    return typeof(obj) == "table" and typeof(obj.andThen) == "function"
end

function TestRunner:expect(value)
    local matchers = {}

    function matchers.toBe(expected)
        assert(value == expected, string.format("expected %s, got %s", tostring(expected), tostring(value)))
    end

    function matchers.toEqual(expected)
        local ok, key = deepEqual(value, expected)
        if not ok then
            if key ~= nil then
                assert(false, string.format("deep equality mismatch at key %s", tostring(key)))
            else
                assert(false, string.format("expected %s, got %s", tostring(expected), tostring(value)))
            end
        end
    end

    function matchers.toBeTruthy()
        assert(value, "expected truthy value")
    end

    function matchers.toBeNil()
        assert(value == nil, "expected nil")
    end

    function matchers.toBeType(typeName)
        assert(typeof(value) == typeName, string.format("expected type %s, got %s", typeName, typeof(value)))
    end

    function matchers.toBeGreaterThan(threshold)
        assert(typeof(value) == "number", "value must be a number")
        assert(value > threshold, string.format("expected value > %s, got %s", tostring(threshold), tostring(value)))
    end

    function matchers.toBeGreaterThanOrEqual(threshold)
        assert(typeof(value) == "number", "value must be a number")
        assert(value >= threshold, string.format("expected value >= %s, got %s", tostring(threshold), tostring(value)))
    end

    function matchers.toBeLessThan(threshold)
        assert(typeof(value) == "number", "value must be a number")
        assert(value < threshold, string.format("expected value < %s, got %s", tostring(threshold), tostring(value)))
    end

    function matchers.toBeLessThanOrEqual(threshold)
        assert(typeof(value) == "number", "value must be a number")
        assert(value <= threshold, string.format("expected value <= %s, got %s", tostring(threshold), tostring(value)))
    end

    function matchers.toBeCloseTo(expected, tolerance)
        tolerance = tolerance or 0.00001
        assert(typeof(value) == "number" and typeof(expected) == "number", "values must be numbers")
        assert(math.abs(value - expected) <= tolerance, string.format("expected %s to be close to %s (tolerance %s)", tostring(value), tostring(expected), tostring(tolerance)))
    end

    function matchers.toThrow(expectedPattern)
        local ok, err = pcall(value)
        assert(not ok, "expected function to throw")
        if expectedPattern then
            local errStr = tostring(err)
            assert(string.find(errStr, expectedPattern, 1, true), string.format("expected error to contain %q, got %q", expectedPattern, errStr))
        end
    end

    return matchers
end

function TestRunner:_runHooks(hooksList)
    for _, fn in ipairs(hooksList) do
        fn()
    end
end

function TestRunner:_collectHooks(suite, kind)
    local collected = {}
    local current = suite
    while current do
        for _, fn in ipairs(current[kind]) do
            table.insert(collected, fn)
        end
        current = current.parent
    end
    if kind == "beforeEach" then
        local reversed = {}
        for i = #collected, 1, -1 do
            table.insert(reversed, collected[i])
        end
        return reversed
    end
    return collected
end

function TestRunner:_runTest(test, suite)
    local beforeHooks = self:_collectHooks(suite, "beforeEach")
    local afterHooks = self:_collectHooks(suite, "afterEach")

    local ok, err = pcall(function()
        self:_runHooks(beforeHooks)
    end)
    if not ok then
        return false, "beforeEach failed: " .. tostring(err)
    end

    ok, err = pcall(test.fn)
    if ok then
        if isPromiseLike(err) then
            local resolved = false
            local promiseErr
            err:andThen(function()
                resolved = true
            end, function(e)
                resolved = true
                promiseErr = e
            end)
            local start = os.clock()
            while not resolved and os.clock() - start < self.timeout do
                task.wait(0.05)
            end
            if not resolved then
                ok = false
                err = "async test timed out"
            elseif promiseErr ~= nil then
                ok = false
                err = promiseErr
            end
        end
    end

    local afterOk, afterErr = pcall(function()
        self:_runHooks(afterHooks)
    end)
    if not afterOk then
        local prefix = err and (tostring(err) .. "; ") or ""
        ok = false
        err = prefix .. "afterEach failed: " .. tostring(afterErr)
    end

    return ok, err
end

function TestRunner:_runSuite(suite, indent, results)
    indent = indent or ""
    print(indent .. "Suite: " .. suite.name)

    for _, test in ipairs(suite.tests) do
        results.total += 1
        local ok, err = self:_runTest(test, suite)
        if ok then
            results.passed += 1
            print(indent .. "  [PASS] " .. test.name)
        else
            results.failed += 1
            local msg = indent .. "[FAIL] " .. suite.name .. " > " .. test.name .. ": " .. tostring(err)
            warn(msg)
            table.insert(results.errors, msg)
            if self.useTestService then
                pcall(function()
                    TestService:Error(msg)
                end)
            end
        end
    end

    for _, child in ipairs(suite.suites) do
        self:_runSuite(child, indent .. "  ", results)
    end
end

function TestRunner:run()
    local results = { total = 0, passed = 0, failed = 0, errors = {} }

    for _, suite in ipairs(self.suites) do
        self:_runSuite(suite, "", results)
    end

    print(string.format("\nResults: %d total, %d passed, %d failed", results.total, results.passed, results.failed))
    if results.failed > 0 then
        warn("Failed tests:")
        for _, err in ipairs(results.errors) do
            warn("  - " .. err)
        end
    end
    return results.failed == 0, results
end

return TestRunner
