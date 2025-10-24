# MCP Sequential Thinking Visualization

A VS Code and Cursor extension to visualize and track the [@modelcontextprotocol/server-sequential-thinking](https://github.com/modelcontextprotocol/servers/tree/main/src/sequential-thinking) process in real-time.

## Features

🧠 **Real-time Thought Tracking** - Watch AI reasoning unfold as it happens

🌳 **Visual Thought Trees** - See the complete structure of sequential thinking processes

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

### Quick Start

1. **Connect to MCP Server**
   - Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
   - Run: `MCP Sequential Thinking: Connect to Server`
   - Wait for "✓ Connected" notification

2. **Start a Thinking Session**
   - Run: `MCP Sequential Thinking: Start New Session`
   - Enter your problem or query
   - Follow the interactive prompts to add thoughts

3. **View Your Thoughts**
   - Click the brain icon (🧠) in the activity bar
   - See your thoughts appear in the tree view
   - Click any thought to view details

### Available Commands

| Command                                           | Description                                   | Shortcut         |
| ------------------------------------------------- | --------------------------------------------- | ---------------- |
| `MCP Sequential Thinking: Connect to Server`      | Connect to the MCP sequential-thinking server | -                |
| `MCP Sequential Thinking: Disconnect from Server` | Disconnect from the server                    | -                |
| `MCP Sequential Thinking: Start New Session`      | Begin a new interactive thinking session      | -                |
| `MCP Sequential Thinking: Show Thought Details`   | View detailed information about a thought     | Click on thought |

### Creating Thoughts

When you start a session, you'll be guided through an interactive process:

1. **Enter your thought content** - Describe this step in your thinking
2. **Continue or finish** - Choose if more thoughts are needed
3. **Special thought types** (optional):
   - **Normal thought** - Standard sequential step
   - **Revision** - Correct or refine a previous thought
   - **Branch** - Explore an alternative approach

**Example Session:**

```
Query: "How should I implement user authentication?"

Thought 1: "First, I need to choose between session-based and token-based auth..."
Thought 2: "Token-based (JWT) is better for my API-first architecture..."
Thought 3: "I'll need: registration, login, token refresh, and logout endpoints..."
Thought 4: "Security considerations: password hashing, rate limiting, HTTPS only..."
```

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
- Node.js 18+ (for running the MCP server)
- npm or npx (for installing the MCP server package)

## Extension Settings

This extension contributes the following settings:

| Setting                                 | Type    | Default                                                      | Description                                                 |
| --------------------------------------- | ------- | ------------------------------------------------------------ | ----------------------------------------------------------- |
| `sequential-thinking-vis.serverCommand` | string  | `"npx"`                                                      | Command to start the MCP sequential-thinking server         |
| `sequential-thinking-vis.serverArgs`    | array   | `["-y", "@modelcontextprotocol/server-sequential-thinking"]` | Arguments for the MCP server command                        |
| `sequential-thinking-vis.autoConnect`   | boolean | `false`                                                      | Automatically connect to MCP server on extension activation |

### Example Configuration

Add to your `settings.json`:

```json
{
  "sequential-thinking-vis.autoConnect": true,
  "sequential-thinking-vis.serverCommand": "npx",
  "sequential-thinking-vis.serverArgs": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
}
```

## Troubleshooting

### Common Issues

**"Failed to connect to MCP server"**

- Ensure Node.js 18+ is installed: `node --version`
- Check if npx is available: `npx --version`
- View detailed logs: `View > Output` → "MCP Sequential Thinking"

**Commands not in Command Palette**

- Reload VS Code window: `Cmd+R` / `Ctrl+R`
- Reinstall the extension
- Check for conflicting extensions

**Tree view shows no thoughts**

- Make sure you've started a session
- Add at least one thought to see it in the tree
- Check Output panel for errors

For more help, see the [full documentation](docs/) or [open an issue](https://github.com/josephlamartina/sequential-thinking-vis/issues).

## Known Issues

- Sessions are not persisted between extension reloads
- Only one active session at a time (previous sessions are cleared)
- Observer Mode (watching real AI thinking) not yet implemented
- No export functionality yet

## Roadmap

### v0.1.0 (Next)

- 📦 Session persistence
- 💾 Export thought trees to markdown/JSON
- 📊 Thought metrics and analytics
- 🔍 Search and filter thoughts

### v0.2.0 (Future)

- 👀 Observer Mode: Watch AI thinking in real Cursor sessions
- 📈 Graph visualization of thought branches
- 🎨 Customizable themes and layouts
- 🔄 Session history and replay

### v0.3.0 (Future)

- 👥 Collaboration: Share thought trees with team
- 🔗 Integration with other MCP tools
- 📱 Timeline view of thinking process

## Release Notes

### 0.0.1 (Current - October 2025)

**Initial Release - Standalone Mode**

- ✅ MCP client integration with sequential-thinking server
- ✅ Interactive thinking session creation
- ✅ Tree view visualization in sidebar
- ✅ Webview for detailed thought inspection
- ✅ Support for revisions and branches
- ✅ Real-time thought updates
- ✅ Configurable server settings
- ✅ Connection management commands

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
