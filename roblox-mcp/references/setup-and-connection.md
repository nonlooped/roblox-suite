---
last_reviewed: 2026-06-17
---

# Setup and Connection

Official guide: https://create.roblox.com/docs/en-us/studio/mcp

## Quick connect

The fastest path. Studio detects supported clients installed on your machine.

Supported clients (as of the latest docs):
- Antigravity
- Codex CLI
- Claude Code
- Claude Desktop
- Cursor
- Gemini CLI
- Visual Studio Code

Steps:
1. In Studio: **Assistant → ⋯ → Manage MCP Servers**.
2. Make sure **Enable Studio as MCP server** is on.
3. Expand **Quick connect**.
4. Turn on the client you want to use.
5. Restart the AI client if its tool list does not update immediately.

If your client does not appear, install it and restart Studio.

## JSON configuration

Most MCP clients read a JSON config file. Add the `Roblox_Studio` entry under `mcpServers`.

### Windows

```json
{
  "mcpServers": {
    "Roblox_Studio": {
      "command": "cmd.exe",
      "args": [
        "/c",
        "%LOCALAPPDATA%\\Roblox\\mcp.bat"
      ]
    }
  }
}
```

### macOS

```json
{
  "mcpServers": {
    "Roblox_Studio": {
      "command": "/Applications/RobloxStudio.app/Contents/MacOS/StudioMCP"
    }
  }
}
```

Notes:
- If you already have other servers, add a comma after the previous entry and paste the `Roblox_Studio` block.
- Validate JSON syntax. A missing comma or bracket prevents the config from loading.
- Paths assume the default install location. Adjust if you installed Studio elsewhere.

## CLI command

Some clients accept a raw command instead of JSON.

### Windows

```bash
cmd.exe /c %LOCALAPPDATA%\Roblox\mcp.bat
```

### macOS

```bash
/Applications/RobloxStudio.app/Contents/MacOS/StudioMCP
```

## Client-specific hints

**Cursor**
- Open Cursor Settings → MCP, or use the project's `.cursor/mcp.json` file.
- Paste the JSON config or use quick connect if Cursor is detected by Studio.

**Visual Studio Code + Claude Code**
- Use VS Code's settings or the workspace's `.vscode/mcp.json` for the server config.
- Install the Claude Code extension, sign in, and open the chat panel.

**Claude Desktop**
- Edit `claude_desktop_config.json` (location varies by OS) and add the `Roblox_Studio` entry.

**Codex CLI / Gemini CLI / Antigravity**
- Follow the tool's own MCP config convention; the `command`/`args` values above are what matter.

## Verify the connection

1. In Studio, open **Assistant → ⋯ → Manage MCP Servers**.
2. Look for the green indicator under **Enable Studio as MCP server** showing connected clients.
3. In your AI client, run:
   > Use the Roblox MCP to list what's in `game.Workspace`.

You may need to approve the first request or add the tool to an allowlist, depending on the client.

If no tools appear:
- Restart both Studio and the AI client.
- Check that the command path exists on disk.
- Validate your JSON config.
