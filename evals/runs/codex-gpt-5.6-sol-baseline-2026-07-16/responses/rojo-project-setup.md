# rojo-project-setup

A minimal Rojo 7 layout:

```text
my-game/
├── default.project.json
└── src/
    ├── client/
    │   └── init.client.luau
    ├── server/
    │   └── init.server.luau
    └── shared/
        └── Example.luau
```

`default.project.json`:

```json
{
  "name": "MyGame",
  "tree": {
    "$className": "DataModel",

    "ReplicatedStorage": {
      "Shared": {
        "$path": "src/shared"
      }
    },

    "ServerScriptService": {
      "Server": {
        "$path": "src/server"
      }
    },

    "StarterPlayer": {
      "StarterPlayerScripts": {
        "Client": {
          "$path": "src/client"
        }
      }
    }
  }
}
```

Example scripts:

```lua
-- src/server/init.server.luau
print("Server started")
```

```lua
-- src/client/init.client.luau
print("Client started")
```

```lua
-- src/shared/Example.luau
return {
	Message = "Hello from Rojo",
}
```

Commands:

```sh
# Optionally scaffold a starter project:
rojo init my-game

# Start the live-sync server:
rojo serve

# Then open the Rojo Studio plugin and click Connect.

# Build an XML place:
rojo build -o build.rbxlx

# Or build a binary place:
rojo build -o build.rbxl
```

Rojo’s authoritative direction is **filesystem/project → Studio**. `rojo serve` exposes the filesystem representation, and the Studio plugin applies those changes to the open data model. Editing a Rojo-managed script or instance in Studio does not normally write the change back to disk; it may be overwritten by the next sync. Keep source-controlled content in files and use Studio primarily for content deliberately outside the managed tree.

`$ignoreUnknownInstances` controls whether Studio-only children under a managed node are retained or removed. Also note that some properties and data—such as Terrain, CSG binary data, and certain protected properties—cannot be live-synced completely. [Rojo’s setup guide](https://rojo.space/docs/v7/getting-started/new-game/) documents `serve` and `build`; its [sync details](https://rojo.space/docs/v7/sync-details/) explain how files become instances and list live-sync limitations.
