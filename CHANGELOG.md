# Change Log

All notable changes to the "MCP Sequential Thinking Visualization" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

**Observer Mode - Watch Real AI Thinking 🔴**
- Stream tapper for transparent MCP stdio proxying
- TCP-based observation of JSON-RPC messages
- Real-time thought extraction from AI ↔ Server communication
- ObserverClient with auto-reconnection (5-second retry)
- Platform-specific configuration management (macOS, Windows, Linux)
- Observer session visualization in Tree View
- `clearObserver` command to clear observed thoughts
- Support for multiple AI tools (Claude Desktop, Cursor, etc.)

**New Components**
- `src/mcp-server/config.ts` - Platform-specific config paths and port file management
- `src/mcp-server/index.ts` - Stream tapper for transparent proxying + TCP broadcast
- `src/providers/ObserverClient.ts` - TCP client with JSON-RPC parsing and event emission
- `src/commands/clearObserver.ts` - Command to clear observer session

**Documentation**
- Observer Mode setup guide (docs/OBSERVER-MODE-SETUP.md)
- Observer Mode usage guide (docs/OBSERVER-MODE-USAGE.md)
- Observer Mode architecture documentation (docs/OBSERVER-MODE-ARCHITECTURE.md)

### Changed
- TreeProvider refactored to observer-only mode (removed MCPClient dependency)
- Extension auto-connects to observer when tapper detected
- Live observer session displayed as "🔴 Live AI Observer" in tree view

### Fixed
- Extension activation timing (switched from `onView` to `onStartupFinished`)
- Missing icon property in view definition
- VS Code version compatibility (downgraded from ^1.105.0 to ^1.95.0 for Cursor compatibility)
- Main entry point path corrected from `./out/extension.js` to `./out/src/extension.js`
- Type definition version alignment (@types/vscode now matches engine version)
- Added error handling with try-catch in activation function

### Technical
- Type-safe implementation with `unknown` instead of `any`
- Proper error handling in catch blocks
- Newline-delimited JSON-RPC message parsing with buffering
- Atomic port file writes for race condition prevention
- PID validation to detect stale port files

### Testing
- Comprehensive automated test suite (13 tests)
- Extension lifecycle tests (7 tests)
- Command execution tests (6 tests)
- Configuration validation tests
- Thought tree debugging session documentation

### Planned for v0.1.0
- Session persistence between reloads
- Export thought trees to Markdown/JSON
- Thought metrics and analytics dashboard
- Search and filter thoughts
- Session history view

### Planned for v0.2.0+
- Graph visualization of thought branches
- Timeline view of thinking process
- Customizable themes and layouts
- Collaboration features
- Multiple simultaneous observer sessions

## [0.0.1] - 2025-10-24

### Added

**MCP Integration**
- Full MCP client implementation with `@modelcontextprotocol/sdk`
- Connection to `@modelcontextprotocol/server-sequential-thinking`
- Stdio transport for subprocess communication
- Connection lifecycle management (connect, disconnect, reconnect)
- Configurable server command and arguments

**Commands**
- `MCP Sequential Thinking: Connect to Server` - Establish MCP server connection
- `MCP Sequential Thinking: Disconnect from Server` - Close connection
- `MCP Sequential Thinking: Start New Session` - Begin interactive thinking session
- `MCP Sequential Thinking: Show Thought Details` - View detailed thought information

**UI Components**
- Tree view in sidebar with brain icon
- Real-time thought tree visualization
- Hierarchical display of thoughts with progress indicators
- Icons for thought types (normal, revision, branch, final)
- Rich tooltips with thought metadata

**Webview**
- Detailed thought inspection panel
- HTML view with VS Code theme integration
- Displays full thought content, progress, and metadata
- Badges for special thought types

**Interactive Sessions**
- Guided prompts for creating thoughts
- Support for normal sequential thoughts
- Support for revision thoughts (correcting previous thinking)
- Support for branch thoughts (exploring alternatives)
- Dynamic thought estimation adjustment
- Real-time progress tracking

**Data Models**
- TypeScript interfaces for ThoughtNode, ThoughtTree
- Connection state management
- Session metadata tracking
- Timestamp recording

**Configuration**
- `sequential-thinking-vis.serverCommand` - Customize server command
- `sequential-thinking-vis.serverArgs` - Customize server arguments
- `sequential-thinking-vis.autoConnect` - Auto-connect on activation

**Documentation**
- Comprehensive README with usage guide
- Detailed testing guide (docs/TESTING.md)
- Sequential thinking guide
- Thought tree archives with visualizations
- Code quality standards and rules

**Development**
- TypeScript strict mode
- ESLint with Prettier integration
- Automated formatting and linting
- Build and watch scripts
- Extension packaging setup

### Architecture

**Standalone Mode Implementation**
- Extension runs its own MCP server subprocess
- User creates thinking sessions via commands
- Interactive prompt-based thought creation
- Self-contained for testing and demonstration

**Event-Driven Updates**
- EventEmitter pattern for real-time UI updates
- Tree view refreshes on thought additions
- Output channel logging for debugging

**VS Code Integration**
- Activity bar icon for easy access
- Command palette integration
- TreeView API for hierarchical display
- Webview API for rich content display
- Configuration API for user settings

---

**Note**: This is a development version. The extension is actively being built and features are being added incrementally.

