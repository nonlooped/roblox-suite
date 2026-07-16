# High-risk regression fixture

`RunRegressionTests.server.lua` executes the focused RateLimiter, SafeDataStore write-policy, reserved-allocation, and Open Cloud retry-policy modules in a dedicated Studio test experience.

1. Install the pinned tools with Rokit.
2. Run `rojo serve default.project.json` and connect the Rojo plugin to a **dedicated test experience**.
3. Start a server playtest. The runner under `ServerScriptService` reports each fixture through `TestService` and asserts on failure.

These deterministic fixtures cover local policy and concurrency decisions. They do not simulate Roblox backend commit ambiguity or prove that a teleport arrived. Keep separate published-experience integration tests for DataStore, HTTP, and Teleport behavior.
