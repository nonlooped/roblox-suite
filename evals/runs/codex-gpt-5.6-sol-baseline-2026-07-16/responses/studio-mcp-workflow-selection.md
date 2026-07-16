# studio-mcp-workflow-selection

Use Studio MCP when the task depends on the actual open Studio session:

- Inspecting the current data model, including content not represented on disk.
- Creating or configuring parts, constraints, UI, assets, or instance properties.
- Reading Studio scripts before a filesystem project exists.
- Running Luau probes and examining output or runtime state.
- Starting a playtest and verifying behavior involving physics, replication, UI, characters, or engine-only APIs.
- Diagnosing a problem that cannot be reproduced through static source inspection.

Use Rojo or Script Sync when the task primarily changes code:

- Editing many scripts or performing repository-wide refactors.
- Creating reviewable diffs and preserving Git history.
- Running formatters, linters, tests, or CI.
- Maintaining filesystem source as the canonical version.
- Repeating deterministic builds across machines.

The strongest workflow combines them: make durable code changes through Rojo/Script Sync, then use Studio MCP to inspect the resulting instances and run focused playtests. Roblox’s coding-harness guide likewise presents filesystem sync and MCP as complementary: sync handles source files, while MCP accesses the game tree and playtesting. [Roblox coding-harness workflow](https://create.roblox.com/docs/ai/build)

Security boundaries:

- Studio MCP can read and modify the currently open place and can execute Luau. Connect only trusted MCP clients, review tool approvals, and confirm the active Studio instance before mutations.
- Work in a saved copy or version-controlled project. Keep API keys, `.ROBLOSECURITY` cookies, production credentials, and unrelated local files out of prompts and source.
- Grant Open Cloud credentials minimum scopes and never embed them in scripts.
- Asset insertion or upload, publishing, monetization changes, production data mutation, and destructive bulk edits should require explicit human approval.
- Treat Creator Store models and generated scripts as untrusted until reviewed.

Playtests are a verification boundary, not proof of production correctness. Confirm whether a tool is operating in edit mode, client play mode, or server play mode. Runtime instances and runtime script edits are usually discarded when play stops, so durable changes belong in filesystem source or edit mode. Test both server and client behavior, stop the playtest after collecting results, and validate RemoteEvents and security rules on the server. Never use a production place or live player data merely to make a test convenient.

The built-in Studio MCP server can explore the data model, edit scripts, execute code, and run playtests, and Roblox explicitly warns that connected clients can read and modify open places. [Studio MCP documentation](https://create.roblox.com/docs/studio/mcp)
