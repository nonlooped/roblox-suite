---
last_reviewed: 2026-06-17
---

# Testing Patterns

Official guide: https://roblox.github.io/testez/

## TestEZ

The standard Roblox testing framework is [TestEZ](https://github.com/Roblox/testez). It supports nested `describe`/`it` blocks, lifecycle hooks, async tests, and a rich matcher API.

```lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TestEZ = require(ReplicatedStorage.DevPackages.TestEZ)

TestEZ.TestBootstrap:run({ game.ReplicatedStorage.Tests })
```

## When to write tests

- Pure utility functions (math, formatting, validation).
- Data transformation and serialization logic.
- State machines with deterministic transitions.
- Anything that has broken before and must not break again.

## Test structure with TestEZ

```lua
describe("MathUtils", function()
    local clamp

    beforeEach(function()
        clamp = require(ReplicatedStorage.MathUtils).clamp
    end)

    it("clamps values", function()
        expect(clamp(5, 0, 10)).to.equal(5)
        expect(clamp(-1, 0, 10)).to.equal(0)
        expect(clamp(11, 0, 10)).to.equal(10)
    end)
end)
```

TestEZ matchers include `to.equal`, `to.be.near`, `to.be.a`, `to.throw`, `to.be.ok`, `to.be.truthy`, and more.

## Example async test

```lua
it("loads data asynchronously", function()
    return expect(Promise.resolve(42)).to.equal(42)
end)
```

For tests that return a Promise, TestEZ waits for resolution. See TestEZ documentation for the exact async API.

## Integration vs unit tests

- **Unit tests** run fast and don't need a running game.
- **Integration tests** require services, instances, or network state. Run them in Studio play mode.

## TestService (legacy)

`TestService:Error(msg)` marks a test failure visibly in Studio output. It is useful for simple in-Studio checks, but new projects should prefer TestEZ.

```lua
local TestService = game:GetService("TestService")

local ok, err = pcall(someTest)
if not ok then
    TestService:Error(err)
end
```

## Running tests

- Place TestEZ test scripts under `ReplicatedStorage.Tests` or another discoverable folder.
- Use `TestEZ.TestBootstrap:run({ folder })` from a single entry point.
- For CI-style testing, collect all test modules and run them with a single runner.
- The scripts/TestRunner.lua module is a minimal shim for environments where TestEZ is unavailable.

## Good test habits

- One assertion per behavior.
- Test edge cases (empty tables, nil, huge values).
- Keep tests deterministic; avoid randomness.
- Clean up any instances created during tests.
- Use `beforeEach`/`afterEach` for shared setup and teardown.
- Mock engine services for unit tests instead of relying on the live data model.
