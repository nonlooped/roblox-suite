---
last_reviewed: 2026-07-09
---

# Sync Details

Official docs:
- https://rojo.space/docs/v7/sync-details/
- https://rojo.space/docs/v7/properties/
- rbx-dom coverage: https://github.com/rojo-rbx/rbx-dom#property-type-coverage

How Rojo turns filesystem entries into Roblox Instances under a `$path` (and default project roots).

## Default file rules

Supported by current Rojo 7 (docs + source `default_sync_rules`):

| Concept | Patterns |
| --- | --- |
| Folders | any directory → `Folder` (unless usurped) |
| Server scripts | `*.server.lua`, `*.server.luau` |
| Client scripts | `*.client.lua`, `*.client.luau` |
| Plugin scripts | `*.plugin.lua`, `*.plugin.luau` → `Script` + `RunContext = Plugin` |
| Module scripts | other `*.lua` / `*.luau` |
| Nested projects | `*.project.json`, `*.project.jsonc` |
| JSON models | `*.model.json`, `*.model.jsonc` |
| JSON modules | other `*.json` / `*.jsonc` (not meta/model/project) → ModuleScript returning a table |
| TOML modules | `*.toml` |
| YAML modules | `*.yml`, `*.yaml` (synced similarly to JSON/TOML modules; 7.6+) |
| Localization | `*.csv` → `LocalizationTable` |
| Plain text | `*.txt` → `StringValue` |
| Models | `*.rbxm`, `*.rbxmx` |
| Meta | `*.meta.json`, `*.meta.jsonc` (adjacent metadata; not Instances themselves) |

JSONC is accepted anywhere JSON is for project/meta/model/module inputs (7.7+ / 7.6.1 comments+commas).

### Script class behavior and `emitLegacyScripts`

See [project-format.md](project-format.md#emitlegacyscripts). Summary:

- Default (`emitLegacyScripts: true`): server files → `Script`; client files → `LocalScript`.
- Modern RunContext mode (`emitLegacyScripts: false`): server/client files → `Script` with `RunContext` Server/Client.

`*.plugin.lua(u)` always targets Plugin RunContext.

### Init files (directory usurpers)

If a folder would become a `Folder`, these files turn the **folder** into a script (children become children of the script):

| File | Script kind |
| --- | --- |
| `init.server.lua(u)` | server (per emitLegacyScripts) |
| `init.client.lua(u)` | client (per emitLegacyScripts) |
| `init.plugin.lua(u)` | plugin |
| `init.lua(u)` | module |
| `init.csv` | localization table init |

Also: `default.project.json` / `default.project.jsonc` inside a directory uses the **project** middleware instead of scanning as a plain folder.

Only one init script style should be present. Init scripts require the directory middleware to produce a Folder first (conflicts if something else already changed the class).

### Meta files (`*.meta.json`)

Attach Rojo data next to non-project instances:

```json
{
  "className": "Tool",
  "properties": {
    "Grip": [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1]
  },
  "ignoreUnknownInstances": true
}
```

| Field | Use |
| --- | --- |
| `className` | Only in `init.meta.json` — change the folder’s class (e.g. to `Tool`). |
| `properties` | Set properties on the adjacent instance (not for `.rbxm`/`.rbxmx`/`.model.json`, which already define properties). |
| `ignoreUnknownInstances` | Same meaning as `$ignoreUnknownInstances`. |

Example: disable a script with `foo.meta.json` beside `foo.server.luau`:

```json
{
  "properties": {
    "Disabled": true
  }
}
```

## JSON models (`.model.json`)

Hand-written instance trees (Remotes, simple hierarchies). File name supplies the instance name; top-level `Name` is optional/discouraged when it disagrees with the file name.

```json
{
  "className": "Folder",
  "children": [
    {
      "name": "RootPart",
      "className": "Part",
      "properties": {
        "Size": [4, 4, 4]
      }
    },
    {
      "name": "SendMoney",
      "className": "RemoteEvent"
    }
  ]
}
```

Recent Rojo accepts camelCase keys (`className`, `children`, `properties`, `name`) for JSON models; older PascalCase still appears in docs samples — prefer the format your Rojo version emits/accepts and validate with `rojo build` / serve.

## JSON / TOML / YAML modules

Non-model JSON becomes a `ModuleScript` whose source is `return { ... }` matching the document. TOML/YAML behave analogously. TOML `DateTime` values become **strings**, not Roblox DateTime values.

## Live-sync limitations

Documented cases that often fail or need a full build:

- Binary data (Terrain, CSG parts)
- `MeshPart.MeshId`
- `HttpService.HttpEnabled`

Type support differs for **build** vs **live sync** (see Properties page tables). When live sync cannot apply a change, generate a place with `rojo build` and open it.

Fallback recreation for difficult instances (e.g. some MeshParts/Unions) may delete/recreate instances and can break unknown references — be careful on large places.

## Line endings

Rojo normalizes Lua sources to LF when syncing (avoids spurious Windows CRLF diffs).

## What Rojo is not

- Not Roblox **Script Sync** (Studio’s built-in disk mapping; different naming rules — see roblox-mcp).
- Not a full round-trip Studio editor: two-way sync is experimental; use **syncback** for place → files.
