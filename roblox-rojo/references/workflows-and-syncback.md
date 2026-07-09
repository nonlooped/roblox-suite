---
last_reviewed: 2026-07-09
---

# Workflows and Syncback

Official docs:
- https://rojo.space/docs/v7/getting-started/existing-game/
- https://rojo.space/docs/v7/workflows/
- https://github.com/rojo-rbx/rojo/releases (syncback details; docs may lag new features)

## Collaboration models (docs status)

The official “Recommended Workflows” page distinguishes:

- **Partially managed Rojo** — Rojo owns scripts (and maybe some instances); world/building may stay in Team Create.
- **Fully managed Rojo** — entire place comes from the filesystem/build pipeline (CI-friendly, hermetic builds).

Those pages are still marked **TODO** in places on rojo.space. Practical guidance from Getting Started + release notes:

- Prefer **per-developer places** for live sync rather than many people connecting Rojo into one Team Create session when possible.
- Use `servePlaceIds` / `blockedPlaceIds` so a project cannot overwrite the wrong place.
- Use Git (or another VCS) on the filesystem tree as the source of truth for managed instances.
- For production deploy automation, `rojo build` / `rojo upload` (cookie or Open Cloud) from CI; see the Desert Bus 2077 sample linked from the docs: https://github.com/Roblox/desert-bus-2077

## Porting an existing game

### Prepare in Studio first

Filesystem layout works best when code is not scattered inside arbitrary GUI/parts/tools duplicates:

- Move logic into `ReplicatedStorage`, `ServerScriptService`, `StarterPlayer`, etc.
- Replace copy-pasted scripts with modules + `CollectionService` tags where appropriate.

### `rojo syncback` (Rojo 7.7+)

Converts instances from a place/model file **into** paths defined by an existing project:

```bash
rojo syncback path/to/project --input path/to/file.rbxl
rojo syncback . --input place.rbxlx --dry-run --list
rojo syncback . --input place.rbxl -y
```

Rules:

- Only instances that are **referenced in the project tree or descendants of those nodes** are written. If you want Workspace children, `Workspace` (or a `$path` under it) must appear in the project.
- Many teams keep a **separate project file** used only for syncback so the serve/build project stays lean.
- Flags: `--list` (plan to stdout), `--dry-run` (no writes), `-y` / `--non-interactive` (skip confirm).

#### `syncbackRules` on the project

```json
{
  "name": "MyGame",
  "tree": {
    "$className": "DataModel",
    "ServerScriptService": { "$path": "src/ServerScriptService" },
    "ReplicatedStorage": { "$path": "src/ReplicatedStorage" }
  },
  "syncbackRules": {
    "ignoreTrees": [
      "ServerStorage/ImportantSecrets"
    ],
    "ignorePaths": [
      "src/ServerStorage/Secrets/*"
    ],
    "ignoreProperties": {
      "BasePart": ["Color"]
    },
    "syncCurrentCamera": false,
    "syncUnscriptable": true,
    "ignoreReferents": false
  }
}
```

| Field | Meaning |
| --- | --- |
| `ignoreTrees` | Paths in the **Roblox file** to skip. |
| `ignorePaths` | Paths on the **filesystem** to skip (gitignore-style negation supported in recent releases). |
| `ignoreProperties` | Per-class property names not written back. |
| `syncCurrentCamera` | Include Workspace CurrentCamera; default **false**. |
| `syncUnscriptable` | Include properties the Studio plugin cannot set; default **true**. |
| `ignoreReferents` | If true, skip referent properties (e.g. `Model.PrimaryPart`); default **false** (include them). |

Actors and bindable/remote event/function variants may sync back as JSON files (7.7+). Referent properties pointing at instances outside the syncback set were a bug source — fixed in 7.7.0; still design trees so targets are included when you need refs.

### Other porting tools (official docs)

- [rbxlx-to-rojo](https://github.com/rojo-rbx/rbxlx-to-rojo) — automated porting helper.
- [Lune](https://github.com/lune-org/lune) — scriptable pipelines for large/complex conversions.

### Leaving Rojo

Edit the built place in Studio and stop using the filesystem tree. Rojo always produces normal places/models — no lock-in.

## Plugin settings (behavioral)

From release notes / plugin UX (verify in your plugin version):

- **Open Scripts Externally** — open script edits in the system editor.
- **Two-Way Sync** — experimental; not reliable for source control.
- **Patch confirmation** modes (Initial / Always / Large Changes / Unlisted PlaceId).
- **Sync reminder** when reconnecting to a previously synced place (Forget option in recent plugin).
- **Auto Connect** / playtest-related options — experimental; may break when Studio changes.

## CI / hermetic builds

Typical pipeline:

1. Install pinned Rojo (Rokit or binary).
2. `rojo build -o place.rbxlx` (or `.rbxl`).
3. Upload via Open Cloud (`rojo upload --api_key ... --universe_id ... --asset_id ...`) or your own uploader.
4. Keep secrets in the CI secret store, never in the repo.

## Combining with other Studio tools

| Tool | Role vs Rojo |
| --- | --- |
| **Rojo** | Project file + filesystem middleware → build/serve/syncback. |
| **Script Sync** | Studio-native folder mapping with its own suffixes (`.server.luau`, `.local.luau`, etc.). Different convention — do not mix naming blindly. |
| **Studio MCP** | Agent control plane (inspect, execute Luau, playtest). Complements Rojo; does not replace project format. |

See [roblox-mcp/SKILL.md](../../roblox-mcp/SKILL.md) for MCP + Script Sync.

## Common failure modes

| Symptom | Check |
| --- | --- |
| Plugin won’t connect | CLI major matches plugin; `rojo serve` running; host/port; firewall; Host allowlist if non-local. |
| Wrong place overwritten | Set `servePlaceIds` / `blockedPlaceIds`. |
| Scripts wrong class | `emitLegacyScripts` and file suffix (`.server` / `.client` / `.plugin`). |
| Properties missing after sync | Live-sync type limits; rebuild place. |
| Syncback wrote nothing | Target services missing from project `tree`; path ignore rules too broad. |
| Nested project ignored syncRules | Sync rules reset per project file — redeclare. |
