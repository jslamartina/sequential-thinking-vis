# Developer Guide

Development documentation for the MCP Sequential Thinking Visualization extension.

> 📖 **User Documentation**: See [README.md](README.md) for user-facing features and installation  
> 🧪 **Detailed Testing**: See [docs/TESTING.md](docs/TESTING.md) for comprehensive test procedures

## Table of Contents

- [Setup](#setup)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Building](#building)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## Setup

### Prerequisites

- Node.js 18+
- npm 9+
- VS Code or Cursor IDE
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/josephlamartina/sequential-thinking-vis.git
cd sequential-thinking-vis

# Install dependencies
npm install

# Compile TypeScript
npm run compile
```

## Development Workflow

### Compile

```bash
npm run compile
```

### Watch Mode

For continuous compilation during development:

```bash
npm run watch
```

### Lint

```bash
# Run all linters
npm run lint

# Lint TypeScript code only
npm run lint:code

# Auto-fix linting issues
npm run lint:code -- --fix
```

### Format

```bash
# Format all files
npm run format

# Check formatting without changes
npm run format:check
```

### Run Tests

```bash
npm test
```

## Testing

### Quick Test (5 minutes)

1. Press `F5` to launch Extension Development Host
2. In the new window:
   - `Cmd+Shift+P` → "MCP Sequential Thinking: Connect to Server"
   - `Cmd+Shift+P` → "MCP Sequential Thinking: Start New Session"
   - Enter test query and add 2-3 thoughts
3. Verify tree view updates
4. Click a thought to view details

### Comprehensive Testing

See [docs/TESTING.md](docs/TESTING.md) for detailed test procedures, scenarios, and troubleshooting.

### Manual Testing Steps

1. **Launch Extension Development Host**

   ```bash
   # Press F5 in VS Code/Cursor
   ```

2. **Connect to MCP Server**
   - Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
   - Run: `MCP Sequential Thinking: Connect to Server`
   - Wait for success notification

3. **Start a Session**
   - Run: `MCP Sequential Thinking: Start New Session`
   - Enter a query
   - Follow prompts to add thoughts

4. **View Results**
   - Check tree view in sidebar (brain icon)
   - Click thoughts to view details
   - Check Output panel for logs

### View Logs

1. Open Output panel: `View > Output` or `Cmd+Shift+U`
2. Select "MCP Sequential Thinking" from dropdown
3. See connection logs, thought processing, and errors

### Debug

- Set breakpoints in TypeScript source files
- Press `F5` to start debugging
- Breakpoints will be hit in Extension Development Host
- Use VS Code debugger controls (Continue, Step Over, etc.)

## Troubleshooting

### Connection Fails

**Problem:** "Failed to connect to MCP server"

**Solutions:**

```bash
# Check Node.js version
node --version  # Need 18+

# Test npx
npx --version

# Try running server manually
npx -y @modelcontextprotocol/server-sequential-thinking

# Check for errors
# Look in Output panel: "MCP Sequential Thinking"
```

### Commands Not Appearing

**Solutions:**

- Reload Extension Development Host: `Cmd+R` / `Ctrl+R`
- Re-compile: `npm run compile`
- Restart debugging (Stop and `F5` again)
- Check `package.json` command definitions
- Check Output panel for activation errors

### Tree View Empty

**Solutions:**

- Ensure you started a session
- Check you completed at least one thought
- Look for errors in Output panel
- Refresh view: Click away and back to Sequential Thinking
- Check Developer Tools console: `Help > Toggle Developer Tools`

### Webview Not Opening

**Solutions:**

- Click on a thought, not the session header
- Check Developer Tools console for errors
- Look for webview panel in background tabs
- Check Output panel for errors

### TypeScript Errors

```bash
# Re-compile
npm run compile

# Check for errors
npm run lint:code

# Clean and rebuild
rm -rf out/
npm run compile
```

### Extension Not Activating

**Check:**

1. Look for errors in Output panel
2. Check Developer Tools console
3. Verify `package.json` has correct `activationEvents`
4. Ensure extension compiled successfully
5. Try reloading window

## Building

### Development Build

```bash
npm run compile
```

### Production Build

```bash
npm run vscode:prepublish
```

### Package Extension

```bash
# Create .vsix package
npm run package

# Output: sequential-thinking-vis-0.0.1.vsix
```

### Install Packaged Extension

```bash
# In VS Code/Cursor
code --install-extension sequential-thinking-vis-0.0.1.vsix
```

## Project Structure

```
sequential-thinking-vis/
├── src/
│   ├── extension.ts              # Main entry point
│   ├── types/
│   │   └── thoughts.ts           # Type definitions
│   ├── providers/
│   │   └── MCPClient.ts          # MCP client wrapper
│   ├── views/
│   │   └── ThoughtTreeProvider.ts # Tree view provider
│   └── commands/
│       ├── connectServer.ts      # Connect command
│       ├── disconnectServer.ts   # Disconnect command
│       ├── startSession.ts       # Session command
│       └── showThoughtDetails.ts # Details command
├── test/
│   ├── runTest.ts                # Test runner
│   └── suite/
│       ├── index.ts              # Test suite config
│       └── extension.test.ts     # Extension tests
├── resources/
│   └── icons/
│       └── brain.svg             # Activity bar icon
├── docs/
│   ├── TESTING.md                # Testing guide
│   ├── sequential-thinking-guide.md
│   └── archive/
│       ├── plans/                # Development plans
│       └── thought_trees/        # Archived thought trees
├── out/                          # Compiled JavaScript (generated)
├── .vscode/
│   ├── launch.json               # Debug configuration
│   └── tasks.json                # Build tasks
├── .cursor/
│   ├── mcp.json                  # MCP configuration
│   └── rules/                    # Code standards
├── package.json                  # Extension manifest
├── tsconfig.json                 # TypeScript config
├── .eslintrc.json               # ESLint config
├── .prettierrc                   # Prettier config
└── README.md                     # User documentation
```

### Key Files

- **`src/extension.ts`** - Extension activation and command registration
- **`src/providers/MCPClient.ts`** - MCP server connection and tool calling
- **`src/views/ThoughtTreeProvider.ts`** - Tree view data provider
- **`src/types/thoughts.ts`** - TypeScript interfaces
- **`package.json`** - Extension manifest with commands, views, settings
- **`tsconfig.json`** - TypeScript compiler options (strict mode)

## Code Quality

### Standards

- TypeScript strict mode enabled
- ESLint with `@typescript-eslint` rules
- Prettier for formatting
- 2-space indentation
- Single quotes for strings
- No `any` types without justification

### Pre-commit Checklist

Before committing:

- [ ] `npm run compile` succeeds
- [ ] `npm run lint` passes
- [ ] `npm run format:check` passes
- [ ] `npm test` all tests pass
- [ ] No `console.log()` debugging statements
- [ ] No commented-out code
- [ ] Updated documentation if needed

### Code Review

When reviewing PRs, check:

- [ ] TypeScript types are explicit
- [ ] Error handling is present
- [ ] User-friendly error messages
- [ ] Code follows project patterns
- [ ] Tests added for new features
- [ ] Documentation updated

## Architecture

### Design Patterns

**MCP Client (Event-Driven)**

- Singleton instance via `ExtensionContext`
- EventEmitter for UI updates
- Connection lifecycle management
- Output channel for logging

**Tree View Provider**

- Implements `vscode.TreeDataProvider<ThoughtNode>`
- Listens to MCPClient events
- Refreshes on thought additions
- Provides icons and tooltips

**Commands**

- Registered in `package.json`
- Handlers in `src/commands/`
- Use VS Code progress notifications
- Input validation and error handling

**Webview**

- Opens on thought click
- HTML with VS Code theme variables
- Content Security Policy enabled
- XSS protection via HTML escaping

### Data Flow

```
User Command
    ↓
Command Handler (src/commands/)
    ↓
MCPClient.callSequentialThinking()
    ↓
MCP Server (subprocess)
    ↓
Result parsed and stored
    ↓
Event emitted: 'thoughtAdded'
    ↓
ThoughtTreeProvider.refresh()
    ↓
Tree View updates in sidebar
```

### Connection Lifecycle

```
1. User runs "Connect to Server"
2. MCPClient spawns subprocess: npx -y @modelcontextprotocol/server-sequential-thinking
3. StdioClientTransport created
4. Client connects to transport
5. Server lists available tools
6. Connection state → 'connected'
7. Event emitted: 'connectionStateChanged'
```

## Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes
4. Run tests and linting
5. Commit with descriptive message
6. Push and create Pull Request

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `chore`: Build process or tooling changes

**Examples:**

```
feat(views): add thought tree visualization

Implement TreeDataProvider for displaying sequential thinking
process in VS Code sidebar. Includes collapsible nodes and
real-time updates.

Closes #12
```

### Branch Naming

- `feat/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test improvements

Example: `feat/thought-tree-provider`

## Release Process

### Version Bump

```bash
# Patch version (0.0.1 → 0.0.2)
npm version patch

# Minor version (0.0.1 → 0.1.0)
npm version minor

# Major version (0.0.1 → 1.0.0)
npm version major
```

### Update Documentation

1. Update `CHANGELOG.md` with changes
2. Update `README.md` if features changed
3. Update version in `package.json`
4. Commit changes

### Package and Test

```bash
# Build production
npm run vscode:prepublish

# Package extension
npm run package

# Test .vsix file
code --install-extension sequential-thinking-vis-X.X.X.vsix
```

### Publish

```bash
# Login to marketplace (first time only)
npx vsce login josephlamartina

# Publish
npx vsce publish
```

## Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)
- [Sequential Thinking Server](https://github.com/modelcontextprotocol/servers/tree/main/src/sequential-thinking)
- [TreeView API](https://code.visualstudio.com/api/extension-guides/tree-view)
- [Webview API](https://code.visualstudio.com/api/extension-guides/webview)

## Getting Help

- Check [docs/TESTING.md](docs/TESTING.md) for testing issues
- Check Output panel: "MCP Sequential Thinking"
- Check Developer Tools console
- Search existing GitHub issues
- Create new issue with details

## License

MIT - See [LICENSE](LICENSE) file
