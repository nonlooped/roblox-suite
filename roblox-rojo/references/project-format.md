---
last_reviewed: 2026-07-09
---

# Project Format

Official docs:
- https://rojo.space/docs/v7/project-format/
- https://rojo.space/docs/v7/properties/
- https://rojo.space/docs/v7/upgrade/

Rojo projects are JSON (or JSONC) files ending in `.project.json` or `.project.jsonc`. Comments and trailing commas are accepted in recent 7.x releases. Optional `"$schema"` is supported on project/meta/model JSON files.

## Top-level fields

| Field | Required | Default / notes |
| --- | --- | --- |
| `name` | No* | Display/root name. Optional for `default.project.json` / `default.project.jsonc` (folder name used). Other files should set `name` or rely on documented naming behavior. |
| `tree` | **Yes** | Root [Instance Description](#instance-description). |
| `servePort` | No | Default live-sync port **34872**. Overridden by `rojo serve --port`. |
| `serveAddress` | No | Default bind when CLI `--address` omitted. |
| `servePlaceIds` | No | If set, live-sync only to these place IDs. |
| `blockedPlaceIds` | No | Place IDs that must not be live-synced (added in 7.5). |
| `placeId` | No | Applied in Studio on connect (`SetPlaceId`-equivalent). |
| `gameId` | No | Applied in Studio on connect (`SetUniverseId`-equivalent). |
| `serveAllowedHosts` | No | Extra Host/Origin values for `rojo serve` (7.7+). CLI `--allowed-hosts` overrides when provided. |
| `globIgnorePaths` | No | `[]`. Globs relative to the project folder. Gitignore-style **negation** supported in recent releases. |
| `emitLegacyScripts` | No | **`true`**. See [emitLegacyScripts](#emitlegacyscripts). |
| `syncRules` | No | `[]`. Custom file middleware rules (reset per nested project). |
| `syncbackRules` | No | Controls `rojo syncback` (see workflows reference). |

\*Docs historically called `name` required; releases since 7.4.1 allow omitting it for `default.project.json`. Prefer setting `name` for non-default project filenames.

Unknown keys are rejected (`deny_unknown_fields` in the implementation).

## Instance description

Each node maps to one Instance:

| Key | Meaning |
| --- | --- |
| `$className` | Class name. Optional if `$path` is set **or** the node is a known Roblox service (or Terrain under Workspace). |
| `$path` | Filesystem path relative to the project file’s folder. Optional if `$className` is set. |
| `$properties` | Map of properties (implicit or explicit values). |
| `$attributes` | Attributes map (project format support for `$attributes`). |
| `$ignoreUnknownInstances` | If true, leave unknown Studio children alone. Default: **`false` if `$path` is set, else `true`**. |
| `$id` / `id` | Instance id for manual Ref linking (advanced; see release notes for `Rojo_Target_*` attributes). |
| other keys | Child instances (name = key); values are nested instance descriptions. |

### emitLegacyScripts

| Value | `*.server.lua(u)` | `*.client.lua(u)` |
| --- | --- | --- |
| `true` (default) | `Script` (legacy RunContext) | `LocalScript` |
| `false` | `Script` + `RunContext = Server` | `Script` + `RunContext = Client` |

```json
{
  "name": "MyCoolRunContextProject",
  "emitLegacyScripts": false,
  "tree": {
    "$path": "src"
  }
}
```

## Property values

**Prefer implicit syntax** (Rojo validates against the reflection DB):

```json
{
  "$className": "Part",
  "$properties": {
    "Anchored": true,
    "Size": [2, 0.5, 6],
    "Material": "Wood"
  }
}
```

**Explicit syntax (Rojo 7)** — type name is the key (not Rojo 6’s `{ "Type", "Value" }`):

```json
{
  "$properties": {
    "Anchored": { "Bool": true },
    "Size": { "Vector3": [2, 0.5, 6] },
    "Material": { "Enum": 512 }
  }
}
```

Use explicit form for new/unknown properties or intentional type overrides. Full per-type formats: https://rojo.space/docs/v7/properties/

Not all types are writable from project files (e.g. some Ref/Region3 cases). Attributes support a documented subset of value types.

## syncRules

Override how files become instances (from 7.5+ changelog; each nested project resets rules):

```json
{
  "name": "SyncRulesAreCool",
  "syncRules": [
    {
      "pattern": "*.foo",
      "use": "text",
      "exclude": "*.exclude.foo"
    },
    {
      "pattern": "*.bar.baz",
      "use": "json",
      "suffix": ".bar.baz"
    }
  ],
  "tree": {
    "$path": "src"
  }
}
```

| `use` value | Behaves like |
| --- | --- |
| `serverScript` | `.server.lua` |
| `clientScript` | `.client.lua` |
| `moduleScript` | `.lua` |
| `pluginScript` | `.plugin.lua` |
| `legacyServerScript` | Script + Legacy RunContext |
| `legacyClientScript` | LocalScript |
| `runContextServerScript` | Script + Server RunContext |
| `runContextClientScript` | Script + Client RunContext |
| `json` / `toml` / `csv` / `text` / `jsonModel` / `rbxm` / `rbxmx` / `project` | matching extensions |
| `ignore` | skip |

## Example: model package

```json
{
  "name": "AwesomeLibrary",
  "tree": {
    "$path": "src"
  }
}
```

## Example: place layout

```json
{
  "name": "Sisyphus Simulator",
  "globIgnorePaths": ["**/*.spec.lua"],
  "tree": {
    "$className": "DataModel",
    "HttpService": {
      "$className": "HttpService",
      "$properties": {
        "HttpEnabled": true
      }
    },
    "ReplicatedStorage": {
      "$path": "src/ReplicatedStorage"
    },
    "StarterPlayer": {
      "StarterPlayerScripts": {
        "$path": "src/StarterPlayerScripts"
      }
    },
    "Workspace": {
      "$properties": {
        "Gravity": 67.3
      },
      "Terrain": {
        "$path": "Terrain.rbxm"
      }
    }
  }
}
```

Note: `HttpService.HttpEnabled` is listed among properties that often **cannot live-sync** and may require a built place file.

## Nested projects

A directory containing `default.project.json` or `default.project.jsonc` is replaced by that project’s tree (Rojo 6+). Nested projects should usually describe **models**, not full places. Sync rules do not inherit — redeclare them per project file.
