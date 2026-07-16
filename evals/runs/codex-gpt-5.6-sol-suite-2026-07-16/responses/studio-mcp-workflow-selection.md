# studio-mcp-workflow-selection

Use Studio MCP as the agent’s control and observation plane; use Rojo or Script Sync as the durable code-editing path.

| Task | Preferred tool |
| --- | --- |
| Inspect the live Explorer tree or instance properties | Studio MCP |
| Search or read scripts that exist only in Studio | Studio MCP |
| Execute a short diagnostic Luau snippet | Studio MCP, after reviewing it |
| Insert or inspect Studio-only instances/assets | Studio MCP |
| Start play mode, simulate input, read output, or capture the viewport | Studio MCP |
| Edit long-lived, version-controlled Luau | Rojo or Script Sync |
| Produce deterministic place/model builds | Rojo |
| Define a filesystem-to-instance project tree | Rojo |
| Use Studio-native directory mappings without a Rojo project | Script Sync |
| Pull an existing place into a defined filesystem tree | `rojo syncback` |

A practical agent loop is:

1. Inspect the target place through MCP.
2. Edit managed source files on disk through Rojo or Script Sync.
3. Let the relevant sync system apply those changes to Studio.
4. Use MCP to inspect the resulting instances.
5. Start a playtest with MCP, collect console output, exercise the feature, and capture the viewport when visual verification matters.
6. Stop play mode, fix the disk source, and repeat.

Do not edit a Rojo- or Script-Sync-managed script through MCP unless deliberately resolving a one-off issue: the disk copy can overwrite the MCP edit. Also do not mix Rojo and Script Sync filename conventions without checking them; for example, Script Sync distinguishes `.client.luau` from `.local.luau`.

Security boundaries:

- Connect only trusted MCP clients and disable the Studio MCP server when it is not needed.
- Treat `execute_luau` as privileged arbitrary code. It can modify places, publish, write DataStores, issue HTTP requests, and access credentials available to Studio.
- Use a test place or disposable copy for agent changes and playtests.
- Keep durable source in version control and review diffs before publishing.
- Avoid credentials in scripts, repositories, prompts, and place files.
- Prefer one agent session per Studio instance, especially with Team Create.
- With multiple Studio windows, explicitly select the intended one before mutations.
- Keep Rojo serving on loopback and restrict allowed/place IDs when appropriate.

Playtesting is verification, not publication authorization. An agent may enter Play mode, simulate ordinary gameplay input, inspect output, and capture screenshots when asked to test. Publishing, production DataStore writes, external HTTP side effects, asset uploads, and changes to a live place should remain separate, explicitly authorized operations.
