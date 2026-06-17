---
last_reviewed: 2026-06-17
---

# Script Sync Integration

Official guides:
- https://create.roblox.com/docs/en-us/scripting/sync
- https://create.roblox.com/docs/en-us/ai/build

## What Script Sync does

Script Sync lets you edit Luau scripts on your local disk with any text editor or AI agent, then syncs those files into Roblox Studio automatically. It covers disk-to-Studio mapping for services such as:

- `ServerScriptService/`
- `ReplicatedStorage/`
- `StarterPlayerScripts/`
- Other eligible service folders

Files you create or edit in those mapped folders appear as scripts in the Explorer almost immediately.

## Enable Script Sync

Script Sync is a beta feature.

1. In Studio: **File → Beta Features**.
2. Find **Script Sync**, enable it, and save.
3. Restart Studio when prompted.

## Connect each service to a disk folder

1. In the Explorer, right-click a service (for example, **ServerScriptService**).
2. Choose **Script Sync → Sync with Directory**. (Older Studio builds labeled this **Sync to**.)
3. Browse to your project folder.

Important:
- Select the top-level project folder, not the individual service folders inside it.
- If your folders are named exactly `ServerScriptService`, `ReplicatedStorage`, and `StarterPlayerScripts`, Script Sync matches them automatically.

## File naming conventions

Script Sync uses the file extension to decide which Roblox script class to create. Use the exact suffixes below:

| File | Created instance | RunContext |
| --- | --- | --- |
| `Name.server.luau` | `Script` | `Server` |
| `Name.client.luau` | `Script` | `Client` |
| `Name.local.luau` | `LocalScript` | — |
| `Name.legacy.luau` | `Script` | `Legacy` |
| `Name.plugin.luau` | `Script` | `Plugin` |
| `Name.luau` | `ModuleScript` | — |
| `init.server.luau`, `init.client.luau`, `init.local.luau`, `init.legacy.luau`, `init.plugin.luau`, `init.luau` | Same as above, using the parent folder's name | Same as above |
| Directory with no `.luau` file | `Folder` | — |

Common mistakes:
- `Test.shared.luau` does **not** create a `ModuleScript` named `Test`. It creates an instance literally named `Test.shared`. Use `Test.luau` for a `ModuleScript`.
- `Test.client.luau` creates a `Script` with `RunContext = Client`, **not** a `LocalScript`. Use `Test.local.luau` for a `LocalScript`.

## Typical project layout

The official starter project (`WaveSurvival.zip`) uses this structure:

```
WaveSurvival/
├── .gitignore
├── WaveSurvival.rbxlx          # excluded from Git by .gitignore
├── ServerScriptService/        # server logic
├── ReplicatedStorage/          # shared modules
└── StarterPlayerScripts/       # client scripts
```

Use `.gitkeep` files to preserve empty folders in Git until you add real scripts.

## Where MCP fits in

Script Sync handles scripts that map to disk. MCP handles everything else:

| Task | Use |
| --- | --- |
| Edit a `.luau` file in `ServerScriptService/` | Script Sync |
| Create a script inside `StarterGui` | MCP `multi_edit` |
| Inspect a `Part`'s properties | MCP `inspect_instance` |
| Insert a Creator Store model | MCP `insert_from_creator_store` |
| Run a quick test snippet | MCP `execute_luau` |
| Start play mode and check output | MCP `start_stop_play` + `console_output` |
| Capture a screenshot | MCP `screen_capture` |

## End-to-end verification prompt

After both Script Sync and MCP are connected, ask your agent:

> Use the Roblox MCP connection to verify Script Sync is working properly. Create `ServerScriptService/Test.server.luau`, `ReplicatedStorage/Test.luau`, and `StarterPlayerScripts/Test.local.luau` that each print a distinct message, then run `game:GetService("InstanceFileSyncService"):GetStatus(instance)` on each to confirm sync status. Start play mode, capture the output, and then delete the test scripts.

This confirms:
- MCP can create and edit scripts.
- Script Sync maps the expected folders.
- `execute_luau` and `console_output` work.
- Play mode starts and stops cleanly.

## Script Sync warnings and limitations

- **Attributes and tags are ignored.** Script Sync does not preserve `Instance:SetAttribute()` values or `CollectionService` tags. Back up your place before syncing, or store that data outside synced scripts.
- **Back up your place first.** Syncing can overwrite or delete instances if file names change or files are removed.
- **Both Script Sync and the Studio MCP server are beta features.** Behavior and menu names may change.
- **Editing a synced script through MCP can cause conflicts.** If Script Sync is active for a service, prefer editing the source file on disk. MCP edits may be overwritten on the next sync.
- **Use caution with Team Create.** Multiple authors, or an agent plus Script Sync, can overwrite each other's changes.
- **Use the Luau LSP** (for example, the `JohnnyMorganz.luau-lsp` VS Code extension) for diagnostics, autocomplete, and type-checking in the synced files.

## Best practices

- Keep place files (`.rbxl`, `.rbxlx`) out of Git; commit only source scripts and config.
- Use Script Sync for long-lived code; use MCP for ad-hoc Studio operations.
- When an agent edits a script via MCP, verify the change in the Explorer or with `script_read`.
- Run playtests frequently when iterating with an agent.
