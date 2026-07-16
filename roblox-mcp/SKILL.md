---
name: roblox-mcp
description: "Roblox Studio MCP server for connecting AI agents directly to Studio — read and write scripts, explore the data model, execute Luau, run playtests, capture the viewport, and control Studio. Covers prerequisites, enabling Studio as an MCP server, quick-connect vs JSON/CLI configuration for Cursor/VS Code/Claude/Codex, every available MCP tool, combining MCP with Script Sync for a file-based workflow, multi-instance handling, and security boundaries. Use when connecting an AI coding tool to Roblox Studio."
last_reviewed: 2026-06-17
---

# roblox-mcp

**Official sources (always check these for the latest):**
- https://create.roblox.com/docs/en-us/studio/mcp
- https://create.roblox.com/docs/en-us/ai/build
- https://create.roblox.com/docs/en-us/scripting/sync
- https://modelcontextprotocol.io/docs/getting-started/intro

This skill is about the **official Roblox Studio MCP server**, not a third-party wrapper. Once connected, your AI client can drive an open Roblox Studio session: read and edit scripts, search the game tree, run Luau, insert assets, start playtests, simulate input, and capture the viewport.

## When to use this skill

Activate when the user is:
- Setting up an AI coding tool (Cursor, VS Code + Claude Code, Claude Desktop, Codex CLI, etc.) to talk to Roblox Studio.
- Asking about the Roblox Studio MCP server, MCP tools, or the coding-harness workflow.
- Combining Script Sync with agent-driven Studio control.
- Troubleshooting why MCP tools are not showing up or not executing.
- Writing prompts or workflows that let an agent safely modify a place.

Cross-reference:
- [roblox/SKILL.md](../roblox/SKILL.md) for general Roblox architecture and specialized development skills.
- [roblox-core/SKILL.md](../roblox-core/SKILL.md) for services, script locations, and the data model.

## What the Studio MCP server is

Roblox Studio implements a **Model Context Protocol (MCP)** server using `stdio` transport. The server runs as a local process on your machine and proxies requests from a supported AI client into the active Studio session. It is the bridge between your editor's agent and Studio: Script Sync handles disk-to-Studio file syncing, while MCP handles everything else (Explorer selection, instance inspection, script editing, Luau execution, play mode, input simulation, and asset insertion).

## Prerequisites

1. **Latest Roblox Studio** — update through the launcher or download from the [Creator Hub](https://create.roblox.com/docs/studio/setup).
2. **An MCP-capable AI client** — Cursor, VS Code with Claude Code, Claude Desktop, Codex CLI, Gemini CLI, Antigravity, or any client that supports `stdio` transport.
3. **A Roblox account** signed into Studio.
4. **Git** (recommended) for the file-based workflow.

## Enabling the server in Studio

1. Open Studio and load the place you want the agent to work on.
2. Open **Assistant** (button in the upper right).
3. Click **⋯ → Manage MCP Servers**.
4. Turn on **Enable Studio as MCP server**.
5. The panel shows quick-connect options and manual configuration snippets. A green indicator appears when a client connects.

If you do not see MCP options, restart Studio after updating to the latest version.

## Connecting your client

Choose the method that matches your client:

**Quick connect** — easiest. Supports Antigravity, Codex CLI, Claude Code, Claude Desktop, Cursor, Gemini CLI, and Visual Studio Code.
1. In Studio: **Assistant → ⋯ → Manage MCP Servers → Quick connect**.
2. Turn on your installed client.
3. Restart the client if the tools do not appear immediately.

**JSON configuration** — for clients that read an `mcp.json` or similar config file. See [references/setup-and-connection.md](references/setup-and-connection.md) for per-OS, copy-paste configurations.

**CLI command** — for clients that need a raw command. See [references/setup-and-connection.md](references/setup-and-connection.md) for Windows and macOS commands.

After connecting, verify with:
> Use the Roblox MCP to read the current game tree in Roblox Studio. List what's in Workspace.

## What you can do with the MCP tools

The server exposes tools in several categories. The full list, parameters, and example prompts are in [references/tool-reference.md](references/tool-reference.md).

| Category | Examples |
| --- | --- |
| **Scripts** | `script_read`, `multi_edit`, `script_search`, `script_grep` |
| **Data model** | `search_game_tree`, `inspect_instance`, `explore_subagent` |
| **Luau execution** | `execute_luau` |
| **Asset generation & insertion** | `generate_mesh`, `generate_material`, `generate_procedural_model`, `insert_from_creator_store` |
| **Playtesting** | `start_stop_play`, `console_output`, `screen_capture`, `playtest_subagent` |
| **Input simulation** | `character_navigation`, `keyboard_input`, `mouse_input` |
| **Session management** | `list_roblox_studios`, `set_active_studio` |

## MCP + Script Sync: the complete agent workflow

Script Sync maps folders on disk (`ServerScriptService/`, `ReplicatedStorage/`, `StarterPlayerScripts/`, etc.) to Studio services, so `.luau` files you edit locally appear in Studio automatically. MCP covers everything Script Sync cannot reach: editing `StarterGui`, inserting models, running commands, playtesting, and inspecting instances.

Typical agent loop:
1. Edit disk files through Script Sync for reusable modules and scripts.
2. Use MCP to inspect instances, run Luau snippets, start play mode, and capture output/screenshots.
3. Use MCP to edit scripts that live in containers not covered by Script Sync (for example, `StarterGui`).

See [references/script-sync-integration.md](references/script-sync-integration.md) for the full setup and a starter-project layout.

## Multi-instance handling

You can connect one MCP client to multiple Studio windows. The server usually picks the right instance from context (for example, an object path that only exists in one place). To switch manually, use:
- `list_roblox_studios` — show all connected Studio instances.
- `set_active_studio` — target a specific instance for subsequent calls.

## Security and trust

MCP clients can read and modify your open places. Treat MCP connections like any privileged integration:
- Only connect clients you trust.
- Work on test places or version-controlled projects.
- Review agent edits before publishing.
- Keep `.rbxlx` and other place files out of Git (use the starter `.gitignore`).
- Disconnect or disable the MCP server when it is not in use.
- Treat `execute_luau` as privileged code: it can publish places, write to DataStores, make HTTP requests, and access credentials loaded in Studio.

See [references/security-and-troubleshooting.md](references/security-and-troubleshooting.md) for the full security checklist and troubleshooting steps.

## Verification checklist

- [ ] Studio is updated and MCP is enabled.
- [ ] AI client shows the Roblox MCP tools after restart.
- [ ] `script_read` or `search_game_tree` returns the current place structure.
- [ ] Script Sync maps the expected service folders to disk (if using file-based workflow).
- [ ] `execute_luau` can run a simple `print` and return output.
- [ ] `start_stop_play` enters/exits play mode successfully.

## Scripts

- `scripts/MCPReadyChecker.lua` — a diagnostic snippet you can run with `execute_luau` to verify Script Sync status and basic model health.
- `scripts/StudioModelProbe.lua` — a reusable utility for summarizing the game tree, useful as a pattern for agent exploration prompts.

## How to proceed

1. Confirm prerequisites and enable MCP in Studio.
2. Connect your client using quick connect or the manual config in [references/setup-and-connection.md](references/setup-and-connection.md).
3. Verify the connection with a simple tree-read or `execute_luau` call.
4. If using a file-based workflow, set up Script Sync per [references/script-sync-integration.md](references/script-sync-integration.md).
5. Use the tool reference to craft precise agent prompts and the security guide to keep the workflow safe.

<!-- catalog:references:start -->
## Reference index

- [script-sync-integration.md](references/script-sync-integration.md)
- [security-and-troubleshooting.md](references/security-and-troubleshooting.md)
- [setup-and-connection.md](references/setup-and-connection.md)
- [tool-reference.md](references/tool-reference.md)
<!-- catalog:references:end -->
