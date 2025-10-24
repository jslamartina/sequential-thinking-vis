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
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "MCP Sequential Thinking Visualization"
4. Click Install

### Development Installation
1. Clone this repository
2. Run `npm install`
3. Run `npm run compile`
4. Press F5 to launch Extension Development Host

## Usage

### Basic Commands

- **MCP Sequential Thinking: Hello World** - Test command to verify extension is working

### Future Features (In Development)

- Thought tree view in sidebar
- Interactive thought graph visualization
- Real-time MCP server connection
- Thought history and replay
- Export thought trees as markdown or images

## Requirements

- VS Code or Cursor v1.85.0 or higher
- (Optional) MCP server with sequential-thinking capability

## Extension Settings

This extension contributes the following settings:

_Settings will be added as features are implemented_

## Development

### Setup
```bash
npm install
```

### Compile
```bash
npm run compile
```

### Watch Mode
```bash
npm run watch
```

### Run Tests
```bash
npm test
```

### Debug
Press `F5` in VS Code/Cursor to launch the extension in debug mode

## Project Structure

```
sequential-thinking-vis/
├── src/
│   ├── extension.ts          # Main extension entry point
│   ├── commands/             # Command implementations
│   ├── views/                # Tree/webview providers
│   ├── providers/            # Data providers
│   └── utils/                # Utility functions
├── test/
│   └── suite/                # Test suite
├── resources/
│   └── icons/                # Extension icons
└── out/                      # Compiled output
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Known Issues

This is an early development version. Features are being actively developed.

## Release Notes

### 0.0.1 (Initial Development)

- ✅ Basic extension scaffolding
- ✅ Project structure setup
- ✅ Build and test infrastructure
- 🚧 MCP integration (in progress)
- 🚧 Thought visualization (planned)

## Related

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP Sequential Thinking Server](https://github.com/modelcontextprotocol/servers/tree/main/src/sequential-thinking)
- [VS Code Extension API](https://code.visualstudio.com/api)

## License

MIT

---

**Enjoy visualizing sequential thinking! 🧠✨**

