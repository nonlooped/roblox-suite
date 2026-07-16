--!strict
-- Controlled Studio fixture. Run in a dedicated published test experience.
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TestService = game:GetService("TestService")

local suite = ReplicatedStorage:WaitForChild("RobloxSuite")
local specs = {
    suite:WaitForChild("roblox-networking"):WaitForChild("tests"):WaitForChild("RateLimiter.spec"),
    suite
        :WaitForChild("roblox-datastores")
        :WaitForChild("tests")
        :WaitForChild("SafeDataStore.spec"),
    suite:WaitForChild("roblox-teleport"):WaitForChild("tests"):WaitForChild("TeleportHelper.spec"),
    suite
        :WaitForChild("roblox-open-cloud")
        :WaitForChild("tests")
        :WaitForChild("OpenCloudRequest.spec"),
}

local failures = 0
for _, spec in specs do
    local ok, testOrError = pcall(require, spec)
    if ok then
        ok, testOrError = pcall(testOrError)
    end
    if ok then
        print(`[PASS] {spec.Name}`)
    else
        failures += 1
        TestService:Error(`[FAIL] {spec.Name}: {tostring(testOrError)}`)
    end
end

assert(failures == 0, `{failures} regression fixture(s) failed`)
