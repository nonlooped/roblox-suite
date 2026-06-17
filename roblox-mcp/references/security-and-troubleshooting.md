---
last_reviewed: 2026-06-17
---

# Security and Troubleshooting

## Security checklist

MCP clients have broad access to your open Studio session. Follow these rules:

- [ ] Only connect MCP clients you trust.
- [ ] Use test places or copies of live places for agent experimentation.
- [ ] Keep your project under version control so you can review and revert agent changes.
- [ ] Do not commit place files (`.rbxl`, `.rbxlx`) or credentials to Git.
- [ ] Avoid running untrusted `execute_luau` snippets. Executed code can publish places, write to DataStores, make HTTP requests, access plugin-level APIs, read credentials loaded in Studio, and exfiltrate data. Run only in test places and review every snippet.
- [ ] Review generated mesh/material/procedural model insertions before publishing.
- [ ] When working in a team, coordinate so only one agent session targets a given Studio instance at a time.

## Trust model

The MCP server runs locally and communicates over `stdio`. Studio initiates the server; your AI client connects to it. While no credentials flow through the AI client directly, executed Luau runs with your signed-in Studio privileges and can access credentials stored in Studio, make network requests, and call Roblox web APIs.

## Disconnecting or disabling the server when not in use

- In Studio: **Assistant → ⋯ → Manage MCP Servers** and turn off **Enable Studio as MCP server**.
- Disconnect or remove the `Roblox_Studio` entry from your MCP client's configuration.
- Close Studio windows you are not using.

This reduces the chance of accidental or unintended agent actions.

## Common issues and fixes

### MCP tools do not appear in the AI client

1. Restart the AI client completely (not just the chat panel).
2. Restart Roblox Studio.
3. Confirm **Enable Studio as MCP server** is turned on.
4. Check the config file path or quick-connect setting.
5. If using JSON config, validate JSON syntax (missing commas are the most common cause).

### Quick connect does not list my client

- Install or update the client, then restart Studio.
- Some clients require a full machine restart of the client process to register.

### `execute_luau` returns an error

- The code runs inside Studio, so it must be valid Luau in the current context.
- Remember the client/server boundary: code runs in Studio's edit context unless play mode is active.
- Check that instances referenced in the code exist.

### Script Sync changes are not showing up

- Verify the service is synced to the correct top-level folder.
- Ensure file names end in `.luau`.
- Check that the beta feature is enabled and Studio was restarted.
- Use `game:GetService("InstanceFileSyncService"):GetStatus(instance)` on the script to inspect sync state.

### Play mode capture or input simulation fails

- Start play mode first with `start_stop_play`.
- Wait a moment for the play session to initialize before capturing or sending input.
- Some tools require the viewport to be in a valid state.

### Multiple Studio instances are confusing the agent

- Use `list_roblox_studios` to see all open instances.
- Use `set_active_studio` to lock the target instance.
- Close unused Studio windows when possible.

## JSON syntax quick check

A valid `mcpServers` block has entries separated by commas:

```json
{
  "mcpServers": {
    "Roblox_Studio": {
      "command": "cmd.exe",
      "args": ["/c", "%LOCALAPPDATA%\\Roblox\\mcp.bat"]
    },
    "Another_Server": {
      "command": "..."
    }
  }
}
```

Use an online JSON validator or your editor's JSON diagnostics if the config does not load.

## Getting more help

- Official MCP connection guide: https://create.roblox.com/docs/en-us/studio/mcp
- Coding harness tutorial: https://create.roblox.com/docs/en-us/ai/build
- Script Sync docs: https://create.roblox.com/docs/en-us/scripting/sync
- MCP protocol overview: https://modelcontextprotocol.io/docs/getting-started/intro
