# Remote and Bindable Patterns

## RemoteEvent (Fire-and-Forget)

Best for most gameplay communication.

**Client to Server** (input/intent):
```lua
-- Client
RemoteEvent:FireServer("attack", targetPosition)

-- Server
RemoteEvent.OnServerEvent:Connect(function(player, action, data)
    if action == "attack" then
        -- validate player can attack, range, cooldown, etc.
        -- then apply effect and replicate result if needed
    end
end)
```

**Server to Client**:
- `FireClient(player, ...)` for one player
- `FireAllClients(...)` for everyone
- To target a specific subset of players, iterate over the desired players and call `FireClient` on each; there are no built-in variants for specific player lists.

## RemoteFunction (Request-Response)

Use sparingly because it yields the caller.

Good for:
- Client asking server for specific data that must be fresh (e.g. current shop prices, complex calculated stats)
- Server asking a specific client something (rarer)

Bad for frequent or performance-critical traffic.

> **Critical warning:** `RemoteFunction:InvokeClient` yields the server until the targeted client returns a value. A hostile or lagging client can leave the invocation pending and hang the server indefinitely. Avoid server→client invocation; if you must use it, enforce a timeout and treat the client as untrusted.

On the server, wrap `OnServerInvoke` handlers in `pcall` so an error in your validation logic does not propagate to the invoking client (which could leak internals or cause unexpected client-side failures).

## BindableEvent / BindableFunction

**Same side only.**

- Server modules talking to other server modules
- Client modules talking to other client modules

Never put a Bindable in a place where it could be used to bypass the network boundary.

Excellent for clean event-driven architecture within one side of the client/server divide.

## Recommended Patterns

1. **Central Remotes folder** in ReplicatedStorage. All RemoteEvents and RemoteFunctions live here with clear names.
2. **Wrapper modules** on both sides that expose clean APIs instead of raw Fire/OnEvent calls everywhere.
3. **Validation layer** on the server side of every Remote.
4. **Rate limiting** on sensitive or abusable Remotes.
5. **Source of truth** lives on the server. Remotes are for synchronization, not authority.

## Argument Sanitization Examples

Validate every argument from the client before using it.

```lua
-- Type and bounds checks
local function sanitizeDamage(amount: unknown): number
    if typeof(amount) ~= "number" then return 0 end
    if amount ~= amount then return 0 end -- NaN check
    return math.clamp(amount, 0, 100)
end

-- Instance validity and ancestry
local function sanitizeTarget(target: unknown, validFolder: Folder): Model?
    if typeof(target) ~= "Instance" or not target:IsA("Model") then return nil end
    if not target:IsDescendantOf(validFolder) then return nil end
    return target
end

-- Whitelisted table keys
local ALLOWED_KEYS = { Name = true, Slot = true }
local function sanitizeOptions(options: unknown): { [string]: unknown }
    if typeof(options) ~= "table" then return {} end
    local result = {}
    for key, value in pairs(options :: { [string]: unknown }) do
        if ALLOWED_KEYS[key] and typeof(key) == "string" then
            result[key] = value
        end
    end
    return result
end
```

> **Warning:** A client-to-server Instance reference can point to any Instance the client can see, including other players' characters or replicated map geometry. The server must re-check the Instance's ClassName, ancestry, and whether the player is allowed to interact with it. Do not trust the client to send the "right" object.

## Payload Sizes

Keep Remote payloads small. Sending large tables, long strings, or many Instances every frame can degrade server performance and increase bandwidth for all clients. Prefer compact identifiers (IDs, positions) and fetch detailed data on demand.

See the authority-and-validation reference for more validation and rate-limiting examples.
