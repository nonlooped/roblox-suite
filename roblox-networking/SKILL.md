---
name: roblox-networking
description: "Design or review Roblox client-server communication. Use for remotes, bindables, replication, network ownership, input validation, rate limiting, and exploit defenses."
last_reviewed: 2026-07-16
---

# roblox-networking

**Core sources:** https://create.roblox.com/docs/projects/client-server , https://create.roblox.com/docs/scripting/security/security-tactics (server-authority techniques), the entire scripting/security/ section (security-tactics, defensive-design, client-server-boundary, network-ownership, access-control, etc.), events/remote and bindable, plus the relevant Engine classes (RemoteEvent, RemoteFunction, Bindable*, RunService, etc.).

## Authority boundary

The server is authoritative for game state and simulation. The client simulates for responsiveness and renders what the server tells it. Anything that can be abused (economy, progression, combat outcomes, movement in competitive play) must be validated or simulated on the server.

## Communication tools

**RemoteEvent**. Fire-and-forget across the boundary.
- Client → Server: `RemoteEvent:FireServer(...)` → server handler receives `(player, ...)`
- Server → Client: `FireClient(player, ...)` or `FireAllClients(...)`

**RemoteFunction**. Request/response (yields).
- Client: `InvokeServer(...)` → server `OnServerInvoke(player, ...)`
- Server can InvokeClient (less common, has caveats).

> **Critical warning:** `RemoteFunction:InvokeClient` yields the server until the targeted client returns a value. A hostile or lagging client can leave the invocation pending and hang the server indefinitely. Avoid server→client invocation; if you must use it, enforce a timeout and treat the client as untrusted.

**BindableEvent / BindableFunction**. Same-side only (server modules talking to each other, or client modules). They stay on one side of the network boundary.

General rule: Client sends *intent*. Server decides *outcome* and replicates the result (or lets normal Instance replication handle it).

## Server authority techniques

- Validate every client action (distance, rate, prerequisites, stamina, line-of-sight, etc.).
- Simulate critical systems on the server (or at least re-execute the important parts).
- Use server tables or Attributes as source of truth, not leaderstats or client-visible values.
- For movement/physics in competitive games: rely on Roblox physics + network ownership + server validation/correction.
- Replicate only what each client needs (don't broadcast entire inventories every frame).

See the official server-authority techniques page for movement validation, physics, etc.

## Network ownership

Unanchored parts and assemblies have a network owner (usually the nearest player or the server, based on proximity and client capacity). The owner simulates the physics locally for low latency. Server can call `BasePart:SetNetworkOwner(player or nil)` to set ownership for the **entire connected assembly**. Anchored parts are always owned by the server and cannot be manually reassigned.

Critical for vehicles, projectiles, pushable objects, etc. Misuse leads to rubber-banding for other players or easy exploitation.

## Common exploit classes and defenses

- Speed/fly/noclip: server movement validation or physics ownership + correction.
- Remote spam / duplication: per-player rate limiting + server-side cooldowns + argument validation.
- LocalScript injection / free-model backdoors: audit assets, use capabilities, server validation.
- Tampering with leaderstats or client-visible values: treat them as pure display; authoritative state lives in server tables or DataStores.
- Information disclosure: don't parent secret models in replicated locations; use streaming, server-only storage (ServerStorage/ServerScriptService), and avoid putting sensitive geometry/triggers where clients can see them. `CanQuery` and collision groups are **not** confidentiality controls; they only affect spatial queries and physics collisions, not replication or rendering.

**Rate limiting pattern (simple but effective):**
Keep a table of last action times per player per action type. On Remote, check delta. Warn or kick on abuse.

**Capabilities (experimental security layer):**
Script capabilities let you restrict what scripts are allowed to do at a granular level. They are currently experimental. To use them, set `Workspace.SandboxedInstanceMode = Enum.SandboxedInstanceMode.Experimental`, then set `Sandboxed = true` and assign a `SecurityCapabilities` value on the script or a parent container (Model/Folder). This restricts the script to only the abilities in its capabilities set.

## Access control and confidentiality

- What the client can see: control with Instance streaming, don't parent sensitive geometry in Workspace if clients shouldn't know the exact layout, use server-only containers where possible.
- Confidential data (exact economy formulas, drop rates, anti-cheat parameters) should stay on the server.

## Secure monetization and data flows (tie-in to other skills)

- Prompt purchase on client.
- For game passes: only grant benefits inside `PromptGamePassPurchaseFinished` when `wasPurchased == true`, and re-verify ownership with `UserOwnsGamePassAsync` on `PlayerAdded`.
- For developer products and subscriptions: validate and grant benefits only inside the server-side `ProcessReceipt` callback.
- DataStore writes only from server Scripts.
- Any client Remote that says "I bought X, give me the item" must be ignored or treated as a hint and re-validated on the server.

## Practical placement rules

- Authoritative logic, economy, progression, combat resolution, datastore access → ServerScriptService or server-only modules.
- UI, input handling, cosmetic prediction, local VFX → client (LocalScripts or client modules under PlayerGui or required from ReplicatedStorage with IsClient branches).
- Shared pure functions / constants / Remote definitions → ReplicatedStorage modules (loaded on both sides but executed in context).

Use `RunService` context checks everywhere you are unsure.

## Scripts

- `scripts/RateLimiter.lua`: a reviewed per-player/per-action limiter with a hard minimum interval, token capacity/refill, bounded action-key allocation, and denial reasons. Call `destroy()` on dedicated instances to disconnect cleanup; `RateLimiter.default` is the shared singleton.

<!-- catalog:references:start -->
## Reference index

- [exploits-and-defenses.md](references/exploits-and-defenses.md): Review movement exploits, remote abuse, asset backdoors, or data exposure.
- [remote-and-bindable-patterns.md](references/remote-and-bindable-patterns.md): Choose events versus functions or define communication payloads.
- [server-authority-and-validation.md](references/server-authority-and-validation.md): Validate remote arguments, enforce cooldowns, or review client prediction.
<!-- catalog:references:end -->
