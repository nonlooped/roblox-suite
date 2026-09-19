---
last_reviewed: 2026-09-19
---

# MCP Tool Reference

Official source: https://create.roblox.com/docs/en-us/studio/mcp

Discover the target with `list_roblox_studios`, then include its `studio_id` on subsequent tool calls. Inspect the connected server's tool schemas for exact arguments; do not infer a shared active instance or reuse obsolete tool names.

## Scripts and inspection

| Tool | Use |
| --- | --- |
| `script_read` | Read a script or line range using its data-model path. |
| `multi_edit` | Apply several edits, or create a script at a new path. Requires `datamodel_type` set to `Edit`. |
| `script_search` | Fuzzy script-name search, up to 10 results. |
| `script_grep` | Search script contents, up to 50 matches. |
| `search_game_tree` | Explore instances with path, type, keyword, and depth filters. |
| `inspect_instance` | Inspect readable properties, attributes, and children. |
| `subagent` | Delegate exploration or playtesting with the `explore` or `playtest` type. |

For example: discover the intended Studio window, read `game.ServerScriptService.GameLogic` with its `studio_id`, and inspect the relevant instances before changing the script.

## Execution and playtesting

| Tool | Use |
| --- | --- |
| `get_studio_state` | Check play state and available data-model types. |
| `execute_luau` | Execute Luau in the specified `datamodel_type`: `Edit`, `Client`, or `Server`. |
| `start_stop_play` | Start or stop a playtest. |
| `get_console_output` | Retrieve the Studio output log. |
| `screen_capture` | Capture the viewport, optionally using a camera position and look-at target. |
| `character_navigation` | Move the test character to a position or instance path. |
| `user_keyboard_input` | Send ordered key, text, and wait actions. |
| `user_mouse_input` | Send ordered pointer, button, scroll, and wait actions. |

Check state before choosing an execution context. For a server-side test, start play mode, confirm that `Server` is available, execute there, and inspect `get_console_output`. Keep the same explicit `studio_id` throughout the sequence.

`execute_luau` runs code in your signed-in Studio session. Review code and use a dedicated test place before operations that can publish, access credentials, make HTTP requests, or write persistent data. A playtest is not an isolated replacement for a test experience when backend services are enabled.

## Assets and generated content

| Tool | Use |
| --- | --- |
| `generate_mesh` | Generate a textured mesh from a prompt. |
| `generate_material` | Generate a material variant and retrieve its base material and name. |
| `generate_procedural_model` | Generate a configurable model from primitive parts, optionally with image references. |
| `wait_job_finished` | Wait for a procedural generation job and inspect its final status. |
| `search_asset` | Search Creator Store or user/group/universe inventory using supported filters. |
| `insert_asset` | Insert an asset by numeric Roblox asset ID. |
| `upload_image` | Upload images from HTTP URLs and obtain asset IDs. |
| `store_image` | Load a local image and obtain a URI for another tool. |

Search before insertion, inspect asset permissions, and check generation status before using the result. Uploads create assets; a local image URI from `store_image` is not itself a published asset ID.

## Documentation and instance discovery

| Tool | Use |
| --- | --- |
| `http_get` | Retrieve allowed Roblox documentation URLs, optionally searching their content. |
| `skill` | Retrieve the Studio server's task-specific reference guidance. |
| `list_roblox_studios` | Discover window names, Studio instance IDs, and place IDs. |

Local places without place IDs are listed by name. If names collide, distinguish published places by place ID and resolve any remaining ambiguity before editing. Re-list after windows close or the intended target changes.

## Migration from older tool names

Use `subagent` with the appropriate type instead of `explore_subagent` or `playtest_subagent`; `search_asset`/`insert_asset` replace the old insertion workflow. Use `get_console_output`, `user_keyboard_input`, and `user_mouse_input` in current calls. The current documentation uses explicit `studio_id` targeting rather than `set_active_studio`.
