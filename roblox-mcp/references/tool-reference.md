# MCP Tool Reference

Official source: https://create.roblox.com/docs/en-us/studio/mcp

This file describes each tool the Roblox Studio MCP server exposes, plus practical prompt patterns. All actions target the currently active Studio instance (use `list_roblox_studios` + `set_active_studio` to switch).

## Scripts

### `script_read`

Reads a script from the game using dot-notation paths such as `game.ServerScriptService.MyScript`.

**Good for:** quickly viewing source without leaving your editor.

**Example prompt:**
> Use `script_read` to show me the full contents of `game.ServerScriptService.GameLogic`.

To read a specific range:
> Use `script_read` on `game.ReplicatedStorage.Config` and return lines 10 through 30.

### `multi_edit`

Applies multiple edits to a script in one call. If the target path does not exist, it creates a new script.

**Good for:** batch refactors, adding imports, or creating new scripts from a template.

**Example prompt:**
> Use `multi_edit` on `game.ServerScriptService.MyModule` to replace `print("old")` with `print("new")` and add `local RunService = game:GetService("RunService")` at the top.

### `script_search`

Fuzzy search for scripts by name. Returns up to 10 results.

**Good for:** finding a script when you only remember part of its name.

**Example prompt:**
> Use `script_search` to find any script named something like "Inventory".

### `script_grep`

Searches for a string pattern across all scripts in the game. Returns up to 50 matches.

**Good for:** finding every usage of a function or deprecated API.

**Example prompt:**
> Use `script_grep` to find every occurrence of `Humanoid:LoadAnimation`.

## Data model exploration

### `explore_subagent`

Spawns a parallel investigation of your place and returns a compact summary. Keeps the main conversation clean.

**Good for:** large places where a full tree dump would be overwhelming.

**Example prompt:**
> Use `explore_subagent` to summarize the Workspace structure and highlight any scripts that look like they handle player input.

### `search_game_tree`

Explores the instance hierarchy as a flat JSON array. Supports filtering by path, instance type, and keywords.

**Good for:** targeted exploration — for example, "every Part under Workspace" or "every ModuleScript under ReplicatedStorage".

**Example prompt:**
> Use `search_game_tree` to list all `Part` instances under `game.Workspace`.

### `inspect_instance`

Returns detailed information about a specific instance: readable properties, custom attributes, and a summary of children/descendants.

**Good for:** debugging why something behaves a certain way or checking attributes.

**Example prompt:**
> Use `inspect_instance` on `game.Workspace.SpawnLocation` and tell me its properties and attributes.

## Luau execution

### `execute_luau`

Runs arbitrary Luau code inside Studio. Returns the result or an error.

**Good for:** quick tests, one-off fixes, inspecting runtime state, or triggering actions that do not have a dedicated tool.

**Example prompt:**
> Use `execute_luau` to run `print(game:GetService("Players").NumPlayers)` and show me the output.

**Security warning:** `execute_luau` runs arbitrary Luau inside your signed-in Studio session. It can publish places, write to DataStores, make HTTP requests, access plugin-level APIs, read credentials loaded in Studio, and exfiltrate data. Only run code you have reviewed. Use a test place, and enable per-tool allowlists in your MCP client if available.

## Asset and content generation

### `generate_mesh`

Generates a textured 3D mesh.

**Example prompt:**
> Use `generate_mesh` to create a low-poly rock mesh and insert it under `game.Workspace`.

### `generate_material`

Generates a custom material or texture.

**Example prompt:**
> Use `generate_material` to generate a worn metal material and apply it to `game.Workspace.Platform`.

### `generate_procedural_model`

Generates procedural models that scale and adapt automatically.

**Example prompt:**
> Use `generate_procedural_model` to generate a small procedural tree and place it at `game.Workspace.TreeSpawn`.

### `insert_from_creator_store`

Inserts assets, plugins, and models from the Creator Store.

**Example prompt:**
> Use `insert_from_creator_store` to insert asset ID 123456789 as a model under `game.Workspace`.

## Playtesting

### `start_stop_play`

Starts or stops playtesting.

**Example prompt:**
> Use `start_stop_play` to start playtesting.

### `console_output`

Retrieves output logs while the game is running.

**Example prompt:**
> Use `console_output` to fetch the last 50 lines of output from the running playtest.

### `screen_capture`

Captures the current Studio viewport in Play mode and returns image data.

**Example prompt:**
> Use `screen_capture` to take a screenshot of the current playtest view.

### `playtest_subagent`

Spawns a test character that runs through gameplay scenarios.

**Example prompt:**
> Use `playtest_subagent` to spawn a character and walk to `game.Workspace.Goal`.

## Player input simulation

### `character_navigation`

Moves the player character to a position or instance.

**Example prompt:**
> Use `character_navigation` to move the player to the position (0, 10, 0).

### `keyboard_input`

Simulates key presses, holds, and text input.

**Example prompt:**
> Use `keyboard_input` to press the Space key once.

### `mouse_input`

Simulates mouse clicks, movement, and scrolling.

**Example prompt:**
> Use `mouse_input` to click at the center of the screen.

## Session management

### `list_roblox_studios`

Lists all connected Studio instances with name, ID, and active status.

**Example prompt:**
> Use `list_roblox_studios` to show me all open Studio windows.

### `set_active_studio`

Sets the target Studio instance for subsequent tool calls.

**Example prompt:**
> Use `set_active_studio` to target the instance named "WaveSurvival".

## Prompt-writing tips

- Be specific about instance paths (`game.ServerScriptService.MyScript` rather than "the server script").
- Prefer `multi_edit` for batch changes instead of many single edits.
- Use `explore_subagent` or `search_game_tree` before asking the agent to make broad changes.
- Combine `execute_luau` with `console_output` for quick test-driven checks.
- When playtesting, tell the agent to start play mode before capturing or simulating input.
