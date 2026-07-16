--!strict
-- Status: experimental
-- Last verified: 2026-06-17
-- Test coverage: no automated coverage
-- Intended use: example; adapt and test before production.

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

export type TestRunnerOptions = {
    useTestService: boolean?,
    timeout: number?,
}

type Hook = () -> ()
type TestCase = {
    name: string,
    fn: () -> any,
}
type Suite = {
    name: string,
    tests: { TestCase },
    suites: { Suite },
    parent: Suite?,
    beforeEach: { Hook },
    afterEach: { Hook },
}
type TestResults = {
    total: number,
    passed: number,
    failed: number,
    errors: { string },
}
type PromiseLike = {
    andThen: (
        self: PromiseLike,
        onResolve: (...any) -> (),
        onReject: (any) -> ()
    ) -> any,
}

export type TestRunner = typeof(setmetatable(
    {} :: {
        suites: { Suite },
        stack: { Suite },
        hooks: { beforeEach: { Hook }, afterEach: { Hook } },
        useTestService: boolean,
        timeout: number,
    },
    TestRunner
))

function TestRunner.new(options: TestRunnerOptions?): TestRunner
    local resolvedOptions: TestRunnerOptions = options or {}
    local self = setmetatable({}, TestRunner) :: TestRunner
    self.suites = {}
    self.stack = {}
    self.hooks = { beforeEach = {}, afterEach = {} }
    self.useTestService = resolvedOptions.useTestService ~= false
    self.timeout = resolvedOptions.timeout or 5
    return self
end

function TestRunner._currentSuite(self: TestRunner): Suite?
    return self.stack[#self.stack]
end

function TestRunner.describe(self: TestRunner, name: string, fn: () -> ())
    local parent = self:_currentSuite()
    local suite: Suite = {
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

function TestRunner.beforeEach(self: TestRunner, fn: Hook)
    local suite = self:_currentSuite()
    assert(suite, "beforeEach() must be called inside describe()")
    table.insert(suite.beforeEach, fn)
end

function TestRunner.afterEach(self: TestRunner, fn: Hook)
    local suite = self:_currentSuite()
    assert(suite, "afterEach() must be called inside describe()")
    table.insert(suite.afterEach, fn)
end

function TestRunner.it(self: TestRunner, name: string, fn: () -> any)
    local suite = self:_currentSuite()
    assert(suite, "it() must be called inside describe()")
    table.insert(suite.tests, { name = name, fn = fn })
end

local function deepEqual(a: any, b: any): (boolean, any?)
    if a == b then
        return true, nil
    end
    if typeof(a) ~= "table" or typeof(b) ~= "table" then
        return false, nil
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
    return true, nil
end

local function isPromiseLike(obj: any): boolean
    return typeof(obj) == "table" and typeof(obj.andThen) == "function"
end

function TestRunner.expect(_self: TestRunner, value: any)
    local matchers = {}

    function matchers.toBe(expected: any)
        assert(
            value == expected,
            string.format("expected %s, got %s", tostring(expected), tostring(value))
        )
    end

    function matchers.toEqual(expected: any)
        local ok, key = deepEqual(value, expected)
        if not ok then
            if key ~= nil then
                assert(false, string.format("deep equality mismatch at key %s", tostring(key)))
            else
                assert(
                    false,
                    string.format("expected %s, got %s", tostring(expected), tostring(value))
                )
            end
        end
    end

    function matchers.toBeTruthy()
        assert(value, "expected truthy value")
    end

    function matchers.toBeNil()
        assert(value == nil, "expected nil")
    end

    function matchers.toBeType(typeName: string)
        assert(
            typeof(value) == typeName,
            string.format("expected type %s, got %s", typeName, typeof(value))
        )
    end

    function matchers.toBeGreaterThan(threshold: number)
        assert(typeof(value) == "number", "value must be a number")
        assert(
            value > threshold,
            string.format("expected value > %s, got %s", tostring(threshold), tostring(value))
        )
    end

    function matchers.toBeGreaterThanOrEqual(threshold: number)
        assert(typeof(value) == "number", "value must be a number")
        assert(
            value >= threshold,
            string.format("expected value >= %s, got %s", tostring(threshold), tostring(value))
        )
    end

    function matchers.toBeLessThan(threshold: number)
        assert(typeof(value) == "number", "value must be a number")
        assert(
            value < threshold,
            string.format("expected value < %s, got %s", tostring(threshold), tostring(value))
        )
    end

    function matchers.toBeLessThanOrEqual(threshold: number)
        assert(typeof(value) == "number", "value must be a number")
        assert(
            value <= threshold,
            string.format("expected value <= %s, got %s", tostring(threshold), tostring(value))
        )
    end

    function matchers.toBeCloseTo(expected: number, tolerance: number?)
        local resolvedTolerance = tolerance or 0.00001
        assert(typeof(value) == "number" and typeof(expected) == "number", "values must be numbers")
        assert(
            math.abs(value - expected) <= resolvedTolerance,
            string.format(
                "expected %s to be close to %s (tolerance %s)",
                tostring(value),
                tostring(expected),
                tostring(resolvedTolerance)
            )
        )
    end

    function matchers.toThrow(expectedPattern: string?)
        assert(typeof(value) == "function", "value must be a function")
        local ok, err = pcall(value :: () -> any)
        assert(not ok, "expected function to throw")
        if expectedPattern then
            local errStr = tostring(err)
            assert(
                string.find(errStr, expectedPattern, 1, true),
                string.format("expected error to contain %q, got %q", expectedPattern, errStr)
            )
        end
    end

    return matchers
end

function TestRunner._runHooks(_self: TestRunner, hooksList: { Hook })
    for _, fn in ipairs(hooksList) do
        fn()
    end
end

function TestRunner._collectHooks(
    _self: TestRunner,
    suite: Suite,
    kind: "beforeEach" | "afterEach"
): { Hook }
    local collected: { Hook } = {}
    local current: Suite? = suite
    while current do
        local hooks = if kind == "beforeEach" then current.beforeEach else current.afterEach
        for _, fn in ipairs(hooks) do
            table.insert(collected, fn)
        end
        current = current.parent
    end
    if kind == "beforeEach" then
        local reversed: { Hook } = {}
        for i = #collected, 1, -1 do
            table.insert(reversed, collected[i])
        end
        return reversed
    end
    return collected
end

function TestRunner._runTest(self: TestRunner, test: TestCase, suite: Suite): (boolean, any?)
    local beforeHooks = self:_collectHooks(suite, "beforeEach")
    local afterHooks = self:_collectHooks(suite, "afterEach")

    local ok, err = pcall(function()
        self:_runHooks(beforeHooks)
    end)
    if not ok then
        return false, "beforeEach failed: " .. tostring(err)
    end

    local testOk, testResult: any = pcall(test.fn)
    ok = testOk
    err = testResult
    if ok then
        if isPromiseLike(testResult) then
            local resolved = false
            local promiseErr: any = nil
            local promise = testResult :: PromiseLike
            promise:andThen(function()
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
                testResult = "async test timed out"
            elseif promiseErr ~= nil then
                ok = false
                testResult = promiseErr
            end
        end
    end

    err = testResult

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

function TestRunner._runSuite(self: TestRunner, suite: Suite, indent: string?, results: TestResults)
    local resolvedIndent = indent or ""
    print(resolvedIndent .. "Suite: " .. suite.name)

    for _, test in ipairs(suite.tests) do
        results.total += 1
        local ok, err = self:_runTest(test, suite)
        if ok then
            results.passed += 1
            print(resolvedIndent .. "  [PASS] " .. test.name)
        else
            results.failed += 1
            local msg = resolvedIndent
                .. "[FAIL] "
                .. suite.name
                .. " > "
                .. test.name
                .. ": "
                .. tostring(err)
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
        self:_runSuite(child, resolvedIndent .. "  ", results)
    end
end

function TestRunner.run(self: TestRunner): (boolean, TestResults)
    local results: TestResults = { total = 0, passed = 0, failed = 0, errors = {} }

    for _, suite in ipairs(self.suites) do
        self:_runSuite(suite, "", results)
    end

    print(
        string.format(
            "\nResults: %d total, %d passed, %d failed",
            results.total,
            results.passed,
            results.failed
        )
    )
    if results.failed > 0 then
        warn("Failed tests:")
        for _, err in ipairs(results.errors) do
            warn("  - " .. err)
        end
    end
    return results.failed == 0, results
end

return TestRunner
