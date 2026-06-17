---
last_reviewed: 2026-06-17
---

# Services Catalog and Usage Patterns

**Main source:** https://create.roblox.com/docs/en-us/scripting/services

## The Fundamental Pattern

Every Roblox script almost always starts with:

```lua
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
-- etc.
```

Acquire each service **once** per script or module. Name the variable exactly after the service (convention).

Use `WaitForChild` when requiring modules or waiting for objects whose load order is uncertain.

## Container Services (DataModel children)

These form the structure of every place:

- **Workspace**: Everything that exists in the 3D world.
- **Lighting**: Global lighting, Atmosphere, Sky, Clouds, post-processing effects.
- **ReplicatedStorage**: Shared assets and ModuleScripts available to both client and server. ModuleScripts can be required from either side; Scripts here only run with the correct `RunContext`.
- **ReplicatedFirst**: Content that must replicate before anything else (use sparingly — mostly for loading screens). LocalScripts here run early.
- **ServerScriptService**: Server-only scripts and modules (never replicates to clients).
- **StarterGui / StarterPlayer / StarterPack**: Templates that get cloned into each player.
- **Players**: Contains all Player instances and their characters.
- **SoundService**: Global audio configuration and SoundGroups.

For service discovery, use:
- `game:GetService("ServiceName")` for known services.
- `game:FindService("Name")` for optional services (returns nil if missing).

`GetChildren` and `GetDescendants` return DataModel descendants, not a reliable service list; prefer `GetService`/`FindService` for services.

## Core Scripting Services

- **RunService**: PreSimulation fires before physics on both client and server; Heartbeat fires every frame after physics on both sides; PreRender is client-only and fires before rendering; IsServer(), IsClient(), IsStudio(), BindToRenderStep.
- **TweenService**: Property interpolation (see animation skill).
- **CollectionService**: Tag instances for easy grouping without folders. Tags replicate.
- **ContextActionService**: Bind actions to input in a context-aware way (great for tools and menus).
- **ContentProvider**: PreloadAsync for assets to avoid hitches.

## Cloud and Cross-Server Services

- **DataStoreService**
- **MemoryStoreService** (high-throughput temporary data)
- **MessagingService** (publish/subscribe between servers in the same universe)

## Monetization & Social

- **MarketplaceService**
- **BadgeService**
- **GroupService**
- **AvatarEditorService**, **AvatarCreationService**

## Other High-Value Services

- **TeleportService**
- **AnalyticsService**
- **HttpService** (outbound HTTP + JSONEncode/Decode only)
- **PathfindingService**
- **Debris** (schedule automatic cleanup of objects)
- **GuiService**, **UserInputService**, **VRService**

## Best Practices

- Never call `GetService` inside a hot loop.
- Cache the service reference at the top of the file.
- For optional services, use `FindService` and check for nil.
- Many services have both global methods and events — read the class reference.
- Prefer `task.wait`, `task.spawn`, `task.defer`, and `task.cancel` over deprecated `wait()`, `spawn()`, and `delay()`.

See the other references in this folder for Luau types, script locations, and architecture.
