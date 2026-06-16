# Network Ownership

Official guide: https://create.roblox.com/docs/physics/network-ownership

## What ownership does

Roblox uses distributed physics. Each unanchored assembly is simulated by either the server or a client. The owner simulates locally and replicates state.

- **Server-owned** — authoritative, higher latency for clients.
- **Client-owned** — responsive for that player, but exploitable.
- **Anchored parts** are always server-owned.

## Automatic ownership

By default, unanchored parts near a player's character are owned by that client. Ownership can transfer as characters move.

## Manual ownership

Server-side only:

```lua
part:SetNetworkOwner(player)     -- assign to a player
part:SetNetworkOwnershipAuto()   -- revert to engine defaults
part:GetNetworkOwner()           -- get current owner
```

Rules:
- You can only set ownership on an unanchored assembly root.
- Anchoring resets ownership to server.
- Setting ownership on one assembly in a mechanism sets ownership for the whole mechanism.

## Common vehicle pattern

When a player sits in a `VehicleSeat`, give them ownership so driving feels responsive:

```lua
local Players = game:GetService("Players")
local vehicleSeat = script.Parent

vehicleSeat:GetPropertyChangedSignal("Occupant"):Connect(function()
    local humanoid = vehicleSeat.Occupant
    if humanoid then
        local player = Players:GetPlayerFromCharacter(humanoid.Parent)
        if player then
            vehicleSeat:SetNetworkOwner(player)
        end
    else
        vehicleSeat:SetNetworkOwnershipAuto()
    end
end)
```

Also assign ownership of loose parts on the vehicle (e.g., cargo) to the same driver.

## Security implications

- Clients can teleport or warp owned parts.
- `Touched` events fired by client-owned parts can be faked.
- Do not use client-owned physics for authoritative damage, scoring, or checkpoints.
- Validate important gameplay events on the server using position/distance/time checks.

## Visualization

Enable **Network owners** in Visualization Options. Colors are shown per-assembly:
- Blue — the local player owns the assembly.
- Green — another client owns the assembly.
- Red — buffer zone, pending transfer.
- White/grey — server owns the assembly.
- Black — no owner (not simulated).

## Debugging tips

- If a vehicle feels laggy for the driver, check that the driver owns it.
- If a mechanism jitters, ensure all connected assemblies share the same owner.
- If a part is black, it may be massless with no owner; anchor it or give it physical significance.
