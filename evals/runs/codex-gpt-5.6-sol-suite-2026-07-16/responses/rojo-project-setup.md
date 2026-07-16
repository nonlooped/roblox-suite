# rojo-project-setup

Minimal layout:

```text
MyGame/
├── default.project.json
└── src/
    ├── ReplicatedStorage/
    │   └── Shared.luau
    ├── ServerScriptService/
    │   └── Main.server.luau
    └── StarterPlayer/
        └── StarterPlayerScripts/
            └── Main.client.luau
```

`default.project.json`:

```json
{
  "name": "MyGame",
  "tree": {
    "$className": "DataModel",
    "ReplicatedStorage": {
      "$path": "src/ReplicatedStorage"
    },
    "ServerScriptService": {
      "$path": "src/ServerScriptService"
    },
    "StarterPlayer": {
      "StarterPlayerScripts": {
        "$path": "src/StarterPlayer/StarterPlayerScripts"
      }
    }
  }
}
```

Example files:

```lua
-- src/ReplicatedStorage/Shared.luau
return {
	Greeting = "Hello from Rojo",
}
```

```lua
-- src/ServerScriptService/Main.server.luau
local Shared = require(game:GetService("ReplicatedStorage").Shared)
print(Shared.Greeting)
```

```lua
-- src/StarterPlayer/StarterPlayerScripts/Main.client.luau
print("Client started")
```

Install and verify Rojo 7, then install its matching Studio plugin:

```bash
rojo --version
rojo plugin install
```

Live sync:

```bash
rojo serve
```

Open the project place in Studio, open the Rojo plugin, and connect to the server—normally `127.0.0.1:34872`.

Build a standalone place:

```bash
rojo build -o build.rbxlx
```

Rojo live sync is primarily **filesystem → Studio**. Files and the project tree are the source of truth for managed instances; Studio edits may be overwritten by the next patch. Experimental two-way plugin sync is not a dependable source-control workflow.

For the reverse direction, use an explicit operation such as:

```bash
rojo syncback . --input place.rbxlx --dry-run --list
rojo syncback . --input place.rbxlx
```

`syncback` only writes instances covered by nodes in the project tree. Keep Rojo bound to localhost unless remote exposure is intentional, and use `servePlaceIds` or `blockedPlaceIds` in important projects to prevent connecting to the wrong place.
