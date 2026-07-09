---
last_reviewed: 2026-07-09
---

# Installation and CLI

Official docs:
- https://rojo.space/docs/v7/getting-started/installation/
- https://rojo.space/docs/v7/getting-started/new-game/
- https://github.com/rojo-rbx/rojo/releases

Rojo has two installable pieces: the **server/CLI** and the **Roblox Studio plugin**. The optional **VS Code extension** can drive menu actions but does **not** put `rojo` on your PATH — install the CLI separately for terminal use.

## Install the CLI

### Rokit (recommended for projects)

[Rokit](https://github.com/rojo-rbx/rokit) is Rojo’s toolchain manager. After installing Rokit:

```bash
rokit add rojo-rbx/rojo
rokit install
```

Or pin in `rokit.toml` (example from the v7.7.0 release notes):

```toml
[tools]
rojo = "rojo-rbx/rojo@7.7.0"
```

Always verify the current version on the [GitHub Releases](https://github.com/rojo-rbx/rojo/releases) page before pinning.

### GitHub Releases

Pre-built binaries for Windows, macOS, and Linux: https://github.com/rojo-rbx/rojo/releases  
Put the binary on your system `PATH`.

### crates.io (compile from source)

Requires a current Rust toolchain (Rojo’s README states the MSRV; for 7.7.x this is Rust **1.88+**):

```bash
cargo install rojo --version ^7
# or a exact pin, e.g. cargo install rojo --version 7.7.0
```

## Install the Studio plugin

Match the plugin major to the CLI major (Rojo 7 plugin for Rojo 7 CLI).

1. **CLI (preferred):** `rojo plugin install` (also `rojo plugin uninstall`).
2. **GitHub:** download the release `rbxm` into Studio’s plugins folder (Plugins toolbar → **Plugins Folder**).
3. **Roblox.com:** [Rojo 7 plugin](https://www.roblox.com/library/13916111004/Rojo) (Install on the plugin page).

## VS Code extension

Marketplace: [evaera.vscode-rojo](https://marketplace.visualstudio.com/items?itemName=evaera.vscode-rojo)  
Provides UI for init/build/serve. Still install the CLI for PATH/`rojo` terminal commands. Command palette: **Rojo: Open Menu**.

## CLI surface (Rojo 7)

Global flags (from CLI): `--verbose` / `-v` (repeatable), `--color auto|always|never`.

| Subcommand | Purpose |
| --- | --- |
| `rojo init [path]` | Scaffold project. `--kind place\|model\|plugin` (default `place`). `--skip-git`. |
| `rojo serve [project]` | Live-sync server. `--address`, `--port`, `--allowed-hosts` (repeat/comma-separated). Defaults: address `127.0.0.1`, port `34872` (or project `servePort` / `serveAddress`). |
| `rojo build [project]` | Build place/model. Requires `--output` / `-o` **or** `--plugin`. Output extensions: `.rbxl`, `.rbxlx`, `.rbxm`, `.rbxmx`. `--watch`. `--plugin` writes under the local Studio plugins folder (relative path only). |
| `rojo upload [project]` | Build and upload. `--asset_id` required. Legacy: `--cookie` (optional on Windows if Studio cookie found). Open Cloud: `--api_key` + `--universe_id` (place upload). |
| `rojo sourcemap [project]` | Emit sourcemap JSON for tooling. `--output`, `--include-non-scripts`, `--watch`, `--absolute`. |
| `rojo syncback [project]` | Pull instances from a place/model file into the project tree. `--input` required (`.rbxl`/`.rbxlx`/`.rbxm`/`.rbxmx`). `--list`, `--dry-run`, `-y` / `--non-interactive`. |
| `rojo fmt-project` | Format project JSON. |
| `rojo doc` | Open documentation in the browser. |
| `rojo plugin install\|uninstall` | Manage the Studio plugin from the CLI. |

### Init kinds

- `place` — baseplate-style game project (default).
- `model` — library/model layout.
- `plugin` — plugin-oriented template (`rojo init --kind plugin`).

Example:

```bash
rojo init my-new-game
cd my-new-game
rojo serve
```

### Build examples

```bash
rojo build -o build.rbxlx          # XML place
rojo build -o build.rbxl           # binary place
rojo build -o model.rbxmx          # XML model
rojo build --plugin CoolPlugin.rbxm
rojo build -o build.rbxlx --watch
```

### Serve security notes (7.7+)

- Default bind is loopback.
- Host/Origin validation protects against DNS rebinding; `/api/open` is gated to local clients.
- Non-local binds warn. Extend accepted hosts with `--allowed-hosts` or project `serveAllowedHosts`.

### Upload security

Official docs recommend a **dedicated deploy account**, not a personal account, if using a security cookie. Prefer Open Cloud API keys with least privilege when using `--api_key`. Never commit cookies or keys.

On Windows with Studio installed, `--cookie` may be omitted for legacy upload and pulled from the Studio session.

### New game flow (docs)

1. `rojo init` (or VS Code menu).
2. Optional: `rojo build -o build.rbxlx` and open in Studio.
3. `rojo serve` → Studio plugin **Connect**.
4. Edit files; live sync applies supported changes.

Visit the URL printed by `rojo serve` (e.g. `http://localhost:34872/`) for session info in the browser UI.

## Versioning discipline

- Track https://github.com/rojo-rbx/rojo/releases for breaking changes.
- After upgrading the CLI, reinstall the plugin (`rojo plugin install`).
- Explicit project property syntax changed between Rojo 6 and 7; prefer implicit properties (see upgrade docs).
