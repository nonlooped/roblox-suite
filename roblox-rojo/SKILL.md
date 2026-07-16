---
name: roblox-rojo
description: "Rojo project management for Roblox — install the CLI and Studio plugin, init/serve/build/upload/sourcemap/syncback, `.project.json` format, file-to-instance sync rules (`.luau`/`.server.luau`/`.client.luau`/`.plugin.luau`), meta files, `emitLegacyScripts`, live-sync limits, and porting existing places. Use when setting up Rojo, writing project files, live-syncing to Studio, building places/models, or converting a place with syncback."
last_reviewed: 2026-07-09
---

# roblox-rojo

**Official sources (always check these for the latest):**
- https://rojo.space/docs/v7/ (docs index; current major is v7)
- https://rojo.space/docs/v7/getting-started/installation/
- https://rojo.space/docs/v7/getting-started/new-game/
- https://rojo.space/docs/v7/getting-started/existing-game/
- https://rojo.space/docs/v7/project-format/
- https://rojo.space/docs/v7/properties/
- https://rojo.space/docs/v7/sync-details/
- https://rojo.space/docs/v7/upgrade/
- https://github.com/rojo-rbx/rojo/releases (latest CLI/plugin releases; verify version before recommending install pins)
- https://github.com/rojo-rbx/rojo (source of truth for CLI flags and changelog when docs lag)

Rojo maps a filesystem project to Roblox instances so you can edit with external tools (VS Code, Git, linters, formatters) and live-sync or build into Studio/place files. This skill covers **Rojo 7** as documented at rojo.space and implemented in the current `rojo-rbx/rojo` release line.

## When to use this skill

Activate when the user is:
- Installing or upgrading Rojo (CLI, Studio plugin, VS Code extension, Rokit).
- Creating a new place/model/plugin project (`rojo init`).
- Writing or fixing `.project.json` / `.project.jsonc` trees.
- Live-syncing with `rojo serve` + the Studio plugin.
- Building places/models (`rojo build`) or uploading (`rojo upload`).
- Generating sourcemaps for Luau LSP (`rojo sourcemap`).
- Porting an existing place (`rojo syncback`, rbxlx-to-rojo, Lune).
- Choosing script naming (`.server.luau` vs `.client.luau` vs modules) or `emitLegacyScripts`.

Cross-reference:
- [roblox/SKILL.md](../roblox/SKILL.md) for architecture and routing.
- [roblox-core/SKILL.md](../roblox-core/SKILL.md) for services, `RunContext`, and the data model.
- [roblox-mcp/SKILL.md](../roblox-mcp/SKILL.md) when combining Rojo with Studio MCP / Script Sync for agent workflows.

## Mental model

| Piece | Role |
| --- | --- |
| **Rojo CLI** | Reads the project file + filesystem; serves live sync, builds place/model files, uploads, sourcemaps, syncback. |
| **Studio plugin** | Connects to the local serve session and applies patches into the open place. |
| **Project file** | `*.project.json` / `*.project.jsonc` describing the instance tree and options. |
| **Filesystem tree** | Scripts, models, JSON/TOML/YAML/CSV/text under `$path` nodes become Instances. |

Rojo is **filesystem → Studio** for live sync (one primary direction). Optional **two-way sync** in the plugin is experimental and incomplete — do not design production workflows around it. For place → files, use **`rojo syncback`** (Rojo 7.7+) or external porting tools.

## Quick start (correct order)

1. Install the **CLI** (Rokit recommended for projects; GitHub binaries or `cargo install rojo --version ^7` also supported).
2. Install the **Studio plugin** with `rojo plugin install` (or GitHub `rbxm` / Roblox.com plugin for the matching major).
3. `rojo init my-game` (or open folder + VS Code “Rojo: Open Menu”).
4. `rojo serve` in the project folder.
5. In Studio: open the Rojo plugin panel → **Connect**.
6. Edit files on disk; watch them sync. Use `rojo build -o build.rbxlx` for a one-shot place file.

Full install matrix and CLI flags: [references/installation-and-cli.md](references/installation-and-cli.md).

## Script file → Instance mapping (defaults)

Both `.lua` and `.luau` are supported. Default rules (from Rojo source / sync docs):

| File pattern | Instance (when `emitLegacyScripts` is **true**, the default) | Instance (when `emitLegacyScripts` is **false**) |
| --- | --- | --- |
| `*.server.lua(u)` | `Script` (legacy RunContext) | `Script` with `RunContext = Server` |
| `*.client.lua(u)` | `LocalScript` | `Script` with `RunContext = Client` |
| `*.plugin.lua(u)` | `Script` with `RunContext = Plugin` | same |
| other `*.lua(u)` | `ModuleScript` | same |

**Init usurpers** (replace the parent folder with a script): `init.server.lua(u)`, `init.client.lua(u)`, `init.plugin.lua(u)`, `init.lua(u)`. Only one init script type per folder. A directory with `default.project.json` / `default.project.jsonc` is treated as a nested project instead of a plain folder.

Other defaults: `.rbxm`/`.rbxmx` models, `.model.json(c)`, plain `.json(c)` → ModuleScript returning a table, `.toml` / `.yml`/`.yaml` similarly, `.csv` → `LocalizationTable`, `.txt` → `StringValue`.

Details, meta files, limitations: [references/sync-details.md](references/sync-details.md).

## Project file essentials

Minimal place-shaped tree (services inferred without `$className` for known services):

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
        "$path": "src/StarterPlayerScripts"
      }
    }
  }
}
```

Important top-level fields (docs + current CLI):

| Field | Purpose |
| --- | --- |
| `name` | Project/instance name (optional for `default.project.json` — folder name used). |
| `tree` | Root instance description (required). |
| `servePort` | Default port for `rojo serve` (default **34872**). |
| `serveAddress` | Default bind address when CLI `--address` omitted. |
| `servePlaceIds` / `blockedPlaceIds` | Allow/deny live-sync targets by place ID. |
| `placeId` / `gameId` | Set Studio place/universe IDs on connect. |
| `serveAllowedHosts` | Extra Host/Origin values for serve (hostname access); CLI `--allowed-hosts` overrides. |
| `globIgnorePaths` | Globs to ignore (gitignore-style negation supported in recent releases). |
| `emitLegacyScripts` | Default **true** = Script/LocalScript; **false** = RunContext Scripts for server/client files. |
| `syncRules` | Custom file→middleware patterns. |
| `syncbackRules` | Controls `rojo syncback` behavior. |

Instance nodes use `$className`, `$path`, `$properties`, `$attributes`, `$ignoreUnknownInstances`, plus child keys. Prefer **implicit** property syntax. Full format: [references/project-format.md](references/project-format.md).

## Daily commands

```bash
# New project (place | model | plugin)
rojo init my-game
rojo init --kind model
rojo init --kind plugin --skip-git

# Live sync (default localhost:34872)
rojo serve
rojo serve --port 34872 --address 127.0.0.1

# Build place/model
rojo build -o build.rbxlx
rojo build -o build.rbxl
rojo build --plugin MyPlugin.rbxm
rojo build -o out.rbxlx --watch

# Sourcemap for editor tooling
rojo sourcemap --output sourcemap.json
rojo sourcemap --watch --absolute

# Upload (prefer dedicated deploy account; never commit cookies/keys)
rojo upload --asset_id PLACE_ID --cookie "..."
rojo upload --asset_id PLACE_ID --api_key "..." --universe_id UNIVERSE_ID

# Place file → filesystem into an existing project tree
rojo syncback . --input place.rbxl
rojo syncback . --input place.rbxlx --dry-run --list

# Plugin management / docs / format
rojo plugin install
rojo plugin uninstall
rojo doc
rojo fmt-project
```

## Live-sync limitations (do not ignore)

Not all property types apply in real time (Studio plugin API limits). Common cases that may need a full **build + open** instead of live sync:

- Binary data (Terrain, CSG)
- `MeshPart.MeshId`
- `HttpService.HttpEnabled`

Property type coverage for build vs live sync is documented on the Properties page and rbx-dom’s coverage chart. When live sync fails for a class/property, rebuild with `rojo build` and open the place.

`rojo serve` binds to loopback by default. Binding to a network-reachable address exposes the session: recent Rojo versions validate Host/Origin, gate some APIs to local clients, and warn on non-local binds. Prefer localhost; if you must expose, use `serveAllowedHosts` / `--allowed-hosts` deliberately.

## Porting existing games

1. Refactor Studio code into fewer service-rooted locations (`ReplicatedStorage`, `ServerScriptService`, `StarterPlayer`, tags via `CollectionService`) before porting.
2. Prefer **`rojo syncback`** with a project that already lists the services/paths you want filled (`rojo syncback path/to/project --input place.rbxl`). Only descendants of nodes present in the project tree are written.
3. Alternatives called out in official docs: [rbxlx-to-rojo](https://github.com/rojo-rbx/rbxlx-to-rojo), [Lune](https://github.com/lune-org/lune) for custom pipelines.
4. Leaving Rojo is always possible: Rojo builds normal place/model files; you can stop using the filesystem tree and edit in Studio only.

Workflows and syncback rules: [references/workflows-and-syncback.md](references/workflows-and-syncback.md).

## Agent checklist (do this, not that)

- **Do** pin CLI + plugin to the **same major** (Rojo 7 plugin with Rojo 7 CLI).
- **Do** run `rojo plugin install` after upgrading the CLI.
- **Do** put shared modules under `ReplicatedStorage` paths and server authority under `ServerScriptService`.
- **Do** use `.luau` (Rojo’s `init` templates use `.luau` since 7.4).
- **Do** set `emitLegacyScripts: false` only when the team understands modern `RunContext` scripts (and that client files become `Script`+Client, not `LocalScript`).
- **Do not** invent CLI flags or project keys — if unsure, run `rojo --help` / `rojo <cmd> --help` or re-check docs/changelog.
- **Do not** commit `.ROBLOSECURITY` cookies or Open Cloud API keys used with `rojo upload`.
- **Do not** treat experimental two-way sync as reliable source control.
- **Do not** confuse Rojo with Roblox **Script Sync** or **Studio MCP** — different tools; they can coexist (see roblox-mcp).

## Verification

- [ ] `rojo --version` reports a 7.x release matching the intended pin.
- [ ] Studio shows the Rojo 7 plugin; connect succeeds against `rojo serve`.
- [ ] Editing a `.server.luau` under a mapped `$path` updates the correct service in Studio.
- [ ] `rojo build -o build.rbxlx` opens cleanly in Studio.
- [ ] `sourcemap.json` is gitignored if generated (Rojo’s default gitignore template includes it in recent releases).

## How to proceed

1. Confirm install path: [references/installation-and-cli.md](references/installation-and-cli.md).
2. Shape the tree: [references/project-format.md](references/project-format.md).
3. Name files correctly: [references/sync-details.md](references/sync-details.md).
4. For teams / porting / deploy: [references/workflows-and-syncback.md](references/workflows-and-syncback.md).

<!-- catalog:references:start -->
## Reference index

- [installation-and-cli.md](references/installation-and-cli.md)
- [project-format.md](references/project-format.md)
- [sync-details.md](references/sync-details.md)
- [workflows-and-syncback.md](references/workflows-and-syncback.md)
<!-- catalog:references:end -->
