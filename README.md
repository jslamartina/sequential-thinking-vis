# MCP Sequential Thinking Visualization

A VS Code and Cursor extension to visualize and track the [@modelcontextprotocol/server-sequential-thinking](https://github.com/modelcontextprotocol/servers/tree/main/src/sequential-thinking) process in real-time.

## Features

🔴 **Observer Mode** - Watch real AI thinking in Claude Desktop, Cursor, or other MCP clients

🧠 **Real-time Thought Tracking** - See AI reasoning unfold as it happens with zero setup

🌳 **Visual Thought Trees** - Complete structure of sequential thinking processes in your sidebar

🔀 **Branch Visualization** - Track parallel thinking paths and hypothesis exploration

📊 **Progress Metrics** - Monitor thought depth, branches, and revisions

⚡ **Live Updates** - Automatic refresh as new thoughts are generated

## Compatibility

This extension works seamlessly with both:

- ✅ **Visual Studio Code** (v1.85.0+)
- ✅ **Cursor** IDE

Since Cursor is built on VS Code, the extension uses the same API and provides identical functionality in both editors.

## Installation

### From Marketplace (Coming Soon)

1. Open VS Code or Cursor
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "MCP Sequential Thinking Visualization"
4. Click Install

### From Source

See [README-DEV.md](README-DEV.md) for development installation and setup instructions.

## Usage

### Quick Start 🔥

1. **Configure your AI tool** (one-time setup)
   - Update MCP config to use the extension's observer server
   - See [Setup Instructions](#observer-mode-setup) below

2. **Use your AI tool normally**
   - Ask Claude Desktop or Cursor AI to use sequential-thinking
   - The extension automatically visualizes thoughts in VS Code

3. **Watch in real-time**
   - Open Sequential Thinking view in sidebar (🧠 icon)
   - See "🔴 Live AI Observer" session with real-time thoughts
   - Click any thought to view details

**That's it!** No commands needed - just watch AI think.

### Viewing Thought Details

Click any thought in the tree to open a detailed view showing:

- Full thought content
- Progress (current/total thoughts)
- Timestamp
- Special properties (revisions, branches)
- Metadata

### Tree View Icons

- 💬 **Comment** - Normal thought
- 🔄 **Restart** - Revision of previous thought
- 🌿 **Branch** - Alternative thinking path
- ✓ **Check** - Final thought in session

## Requirements

- VS Code or Cursor v1.105.0 or higher
- Node.js 18+ (for running the observer server)
- An AI tool that supports MCP (Claude Desktop, Cursor, etc.)

## Observer Mode Setup

To watch real AI thinking, configure your AI tool to use the extension's observer server.

**📖 [Complete Setup Guide](docs/OBSERVER-MODE-SETUP.md)**

### Quick Setup

1. **Find your extension path:**

   ```bash
   # Example for source install
   /Users/yourusername/Projects/sequential-thinking-vis/out/mcp-server/index.js
   ```

2. **Configure your AI tool** (Claude Desktop or Cursor):

   Edit the MCP configuration file and add:

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

   **Config file locations:**
   - **Claude Desktop:** `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
   - **Cursor:** `~/.cursor/mcp.json`

3. **Restart your AI tool**

4. **Open Sequential Thinking sidebar in VS Code** (🧠 icon)

5. **Use your AI normally** - The extension automatically observes when the AI uses sequential-thinking!

**Need help?** See the [detailed setup guide](docs/OBSERVER-MODE-SETUP.md) for platform-specific instructions and troubleshooting.

**📚 Documentation:**

- [Setup Guide](docs/OBSERVER-MODE-SETUP.md) - Detailed configuration for all platforms
- [Usage Guide](docs/OBSERVER-MODE-USAGE.md) - Tips and patterns for effective observation
- [Architecture](docs/OBSERVER-MODE-ARCHITECTURE.md) - Technical details for developers

---

## Testing MCP Connection

You can verify the MCP connection is working correctly using the included test script:

```bash
node scripts/test-mcp-connection.js
```

This will:

- ✅ Connect to the MCP server
- ✅ List available tools
- ✅ Call the sequential-thinking tool
- ✅ Verify the response

Expected output:

```
🔌 Testing MCP connection to sequential-thinking server...
✅ Connected successfully!
📋 Listing available tools...
🧠 Testing sequential-thinking tool...
✅ Tool call successful!
🎉 All tests passed! MCP integration is working correctly.
```

For detailed MCP integration documentation, see [docs/MCP-INTEGRATION.md](docs/MCP-INTEGRATION.md).

## Troubleshooting

### Common Issues

**"Observer mode not available"**

- Ensure Node.js 18+ is installed: `node --version`
- Check AI tool MCP configuration is correct
- Verify path to `out/mcp-server/index.js` is absolute
- Restart your AI tool after configuration changes
- Test the connection: `node scripts/test-mcp-connection.js`
- View detailed logs: `View > Output` → "MCP Sequential Thinking"

**Tree view shows no thoughts**

- Make sure your AI tool is configured to use the tapper
- Ask your AI to use the sequential-thinking tool
- Check that the tapper server is running (look for port file in config dir)
- Check Output panel for errors

For more help, see the [full documentation](docs/) or [open an issue](https://github.com/josephlamartina/sequential-thinking-vis/issues).

## Known Issues

- Observer sessions are not persisted between extension reloads
- No export functionality yet (JSON/markdown export coming soon)
- Only one observer session at a time (most recent AI conversation)

## Roadmap

### v0.1.0 (Next Release)

- 📦 Session persistence
- 💾 Export thought trees to markdown/JSON
- 📊 Thought metrics and analytics
- 🔍 Search and filter thoughts

### v0.2.0 (Future)

- 🔍 Search and filter thoughts across sessions
- 📈 Graph visualization of thought branches (D3.js)
- 🎨 Customizable themes and layouts
- 🔄 Session history and replay
- 📊 Analytics dashboard

### v0.3.0 (Future)

- 👥 Collaboration: Share thought trees with team
- 🔗 Integration with other MCP tools
- 📱 Timeline view of thinking process
- 🌐 Remote observation capabilities

## Release Notes

### 0.0.2 (October 2025)

**Observer Mode Release**

- ✅ Stream tapper for transparent MCP proxying
- ✅ Auto-detection and connection to observer via port file
- ✅ Real-time visualization of AI thinking with TCP broadcast
- ✅ Support for multiple AI tools (Claude Desktop, Cursor)
- ✅ ObserverClient with auto-reconnection (5-second retry)
- ✅ Platform-specific configuration management (macOS, Windows, Linux)
- ✅ Clear observer session command
- ✅ Type-safe implementation with proper error handling

### 0.0.1 (October 2025)

**Initial Release**

- ✅ Tree view visualization in sidebar
- ✅ Thought details inspection
- ✅ Support for revisions and branches
- ✅ Real-time thought updates
- ✅ Cross-platform support (macOS, Windows, Linux)

## For Developers

Interested in contributing or building from source?

📖 **[Read the Developer Guide](README-DEV.md)**

Includes:

- Development setup and workflow
- Testing procedures
- Project architecture
- Contribution guidelines
- Build and release process

## Related

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Sequential Thinking Server](https://github.com/modelcontextprotocol/servers/tree/main/src/sequential-thinking)
- [VS Code Extension API](https://code.visualstudio.com/api)

## License

MIT

---

**Enjoy visualizing sequential thinking! 🧠✨**
