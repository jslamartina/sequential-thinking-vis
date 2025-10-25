# Observer Mode Setup Guide

**Last Updated:** October 25, 2025

Observer Mode allows you to watch AI thinking in real-time as it happens in Claude Desktop, Cursor, or any MCP-compatible AI tool. This guide walks you through the one-time setup process.

## What is Observer Mode?

Observer Mode uses a "stream tapper" that sits between your AI tool and the sequential-thinking MCP server. It:

- ✅ **Transparently forwards** all communication (zero impact on AI performance)
- ✅ **Broadcasts** thought data to the VS Code extension via TCP
- ✅ **Auto-reconnects** if the connection is lost
- ✅ **Works with any** MCP-compatible AI tool

```
AI Tool → Stream Tapper → Sequential-Thinking Server
              ↓
         VS Code Extension (Observer)
```

---

## Prerequisites

Before setting up Observer Mode, ensure you have:

- ✅ Node.js 18+ installed ([download](https://nodejs.org/))
- ✅ This extension installed in VS Code/Cursor
- ✅ An AI tool that supports MCP (Claude Desktop, Cursor, etc.)
- ✅ Extension compiled (`npm run compile` if installed from source)

**Verify Node.js version:**

```bash
node --version
# Should output v18.0.0 or higher
```

---

## Step 1: Locate the Tapper Script

The stream tapper is compiled to:

```
<extension-install-path>/out/mcp-server/index.js
```

**Find your extension path:**

### For Claude Desktop Users

If you installed from source:

```bash
# Example path
/Users/yourusername/Projects/sequential-thinking-vis/out/mcp-server/index.js
```

If installed from marketplace:

```bash
# macOS/Linux
~/.vscode/extensions/josephlamartina.sequential-thinking-vis-*/out/mcp-server/index.js

# Windows
%USERPROFILE%\.vscode\extensions\josephlamartina.sequential-thinking-vis-*\out\mcp-server\index.js
```

### For Cursor Users

Similar paths but in `.cursor` directory instead of `.vscode`.

**💡 Tip:** Copy the full absolute path - you'll need it in the next step.

---

## Step 2: Configure Your AI Tool

### Option A: Claude Desktop

**1. Locate the configuration file:**

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

**2. Edit the configuration:**

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "node",
      "args": ["/absolute/path/to/sequential-thinking-vis/out/mcp-server/index.js"]
    }
  }
}
```

**3. Replace the path:**

Change `/absolute/path/to/` to your actual extension path from Step 1.

**4. Save and restart Claude Desktop.**

---

### Option B: Cursor

**1. Locate the configuration file:**

- **macOS/Linux:** `~/.cursor/mcp.json`
- **Windows:** `%USERPROFILE%\.cursor\mcp.json`

**2. Edit the configuration:**

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "node",
      "args": ["/absolute/path/to/sequential-thinking-vis/out/mcp-server/index.js"]
    }
  }
}
```

**3. Replace the path:**

Change `/absolute/path/to/` to your actual extension path from Step 1.

**4. Save and restart Cursor.**

---

### Option C: Other MCP-Compatible Tools

For other tools that support MCP:

1. Find the MCP configuration file (usually `mcp.json` or similar)
2. Add the sequential-thinking server with the tapper path
3. Use `node` as the command
4. Pass the absolute path to `out/mcp-server/index.js` as an argument
5. Restart the tool

---

## Step 3: Verify the Setup

**1. Open VS Code (or Cursor if you're using it as the observer)**

**2. Open the Sequential Thinking sidebar:**

- Click the 🧠 brain icon in the activity bar
- Or: `View > Open View... > Sequential Thinking`

**3. Use your AI tool:**

Ask Claude Desktop or Cursor AI to use sequential thinking:

```
Use sequential thinking to explain how photosynthesis works.
```

**4. Watch for the observer session:**

You should see:

- "🔴 Live AI Observer" in the tree view
- Thoughts appearing in real-time as the AI thinks
- Automatic updates without any interaction

**5. Check the Output panel:**

`View > Output` → Select "MCP Sequential Thinking" from dropdown

You should see:

```
✓ Observer mode active - watching AI thinking
```

---

## Troubleshooting

### "Observer not available" or No Connection

**Check Node.js:**

```bash
node --version
```

**Verify the path in your AI tool's config:**

- Must be an **absolute path** (starts with `/` on macOS/Linux, `C:\` on Windows)
- Must point to the compiled `.js` file, not the `.ts` source
- Use forward slashes `/` even on Windows (or escaped backslashes `\\`)

**Check the tapper is running:**

On macOS/Linux:

```bash
cat ~/Library/Application\ Support/sequential-thinking-vis/observer-port.json
```

On Windows:

```powershell
type %APPDATA%\sequential-thinking-vis\observer-port.json
```

If the file doesn't exist, the tapper isn't running. Check your AI tool's logs.

---

### Tapper Fails to Start

**Check for port conflicts:**

The tapper uses a random available port, so conflicts are rare. However, if you see errors:

1. Check if any firewall is blocking localhost connections
2. Try restarting your AI tool
3. Check the AI tool's logs for error messages

**Check stderr output:**

The tapper logs to stderr (not captured by AI tools). You can test it manually:

```bash
node /path/to/out/mcp-server/index.js
```

You should see:

```
[Tapper] Starting @modelcontextprotocol/server-sequential-thinking@^1.0.0
[Tapper] Listening on localhost:54321
[Tapper] PID: 12345
```

Press `Ctrl+C` to stop the manual test.

---

### Extension Shows No Thoughts

**Ensure your AI tool is using the tapper:**

Check the AI tool's MCP configuration points to the tapper, not directly to the sequential-thinking server.

**Ask the AI to use sequential-thinking explicitly:**

Some AI tools don't use it automatically. Try:

```
Please use your sequential-thinking tool to analyze this problem: ...
```

**Check for errors in Output panel:**

`View > Output` → "MCP Sequential Thinking"

---

### Thoughts Appear with Delay

This is normal - the extension receives thoughts as the AI generates them. If the AI thinks slowly, thoughts will appear slowly. If the delay is longer than a few seconds:

1. Check your internet connection (if AI is cloud-based)
2. Verify the tapper isn't under heavy system load
3. Check for errors in the Output panel

---

## Advanced Configuration

### Custom Server Version

By default, the tapper uses `^1.0.0` of the sequential-thinking server. To use a specific version:

Edit `src/mcp-server/config.ts`:

```typescript
export const SUPPORTED_SERVER_VERSION = '^2.0.0'; // Change version
```

Then recompile:

```bash
npm run compile
```

---

### Multiple AI Tools

You can configure multiple AI tools to use the same tapper. Each will broadcast to the same VS Code extension. The extension shows the most recent thoughts from any tool.

---

### Development Mode

When testing or developing:

1. Use `npm run watch` to auto-recompile on changes
2. Restart your AI tool after recompiling
3. Use `node scripts/test-mcp-connection.js` to test without an AI tool

---

## Platform-Specific Notes

### macOS

- Configuration files may be hidden in Finder (use terminal)
- Use `Command+Shift+.` in Finder to show hidden files
- Permissions should work by default

### Windows

- Use forward slashes in paths: `C:/Users/...` or escaped backslashes: `C:\\Users\\...`
- Configuration files are in `%APPDATA%` (usually `C:\Users\YourName\AppData\Roaming`)
- If you see "Access Denied", run your AI tool as Administrator once

### Linux

- Configuration files are in `~/.config/` or `$XDG_CONFIG_HOME`
- Ensure Node.js is in your PATH
- Check file permissions if the tapper doesn't start

---

## Next Steps

✅ **Setup complete?** See [Observer Mode Usage Guide](OBSERVER-MODE-USAGE.md) for how to use Observer Mode effectively.

📖 **Want to understand how it works?** See [Observer Mode Architecture](OBSERVER-MODE-ARCHITECTURE.md) for technical details.

🐛 **Found a bug?** [Open an issue](https://github.com/josephlamartina/sequential-thinking-vis/issues) on GitHub.

---

**Enjoy watching AI think! 🔴🧠**
