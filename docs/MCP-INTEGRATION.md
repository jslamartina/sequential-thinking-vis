# MCP Integration Guide

This extension visualizes real AI thinking by observing communication between AI tools and the `@modelcontextprotocol/server-sequential-thinking` MCP server.

## Overview

The extension includes a **transparent stream tapper** that sits between AI tools and the sequential-thinking server:

```
AI Tool → Extension Tapper → Sequential-Thinking Server
              ↓ (observes)
         VS Code Extension
```

**Key Features:**

- **Zero configuration** - Extension auto-connects when tapper is running
- **Non-invasive** - AI tool sees no difference in behavior
- **Real-time** - Thoughts appear in VS Code as AI generates them
- **Automatic** - No commands or manual steps needed

## Architecture

```
┌─────────────────────┐
│  VS Code Extension  │
│                     │
│  ┌───────────────┐  │
│  │  MCPClient    │  │
│  │  (EventEmitter)│ │
│  └───────┬───────┘  │
│          │          │
└──────────┼──────────┘
           │
           │ MCP Protocol (stdio)
           │
┌──────────▼──────────┐
│  Sequential Thinking│
│  MCP Server         │
│  (npx -y @model...) │
└─────────────────────┘
```

## Components

### Stream Tapper (`src/mcp-server/index.ts`)

A transparent proxy server that:

- Spawns the real sequential-thinking MCP server
- Forwards all stdin/stdout communication (completely transparent)
- Broadcasts stdout to VS Code extension via TCP socket
- Manages server lifecycle

### ObserverClient (`src/providers/ObserverClient.ts`)

Connects to the tapper and:

- Reads thought data from TCP socket
- Buffers and parses JSON-RPC messages
- Extracts thought information from requests/responses
- Emits events for UI updates

### ThoughtTreeProvider (`src/views/ThoughtTreeProvider.ts`)

Visualizes the thought tree in the VS Code sidebar:

- Listens to ObserverClient events
- Renders thoughts as tree items in real-time
- Shows thought metadata (revisions, branches, timestamps)
- Provides clickable thought details

---

## Setup

### 1. Configure Your AI Tool

Instead of connecting to the sequential-thinking server directly, configure your AI tool to use the extension's tapper:

**For Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "node",
      "args": ["/path/to/sequential-thinking-vis/out/mcp-server/index.js"]
    }
  }
}
```

**For Cursor** (`~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "node",
      "args": ["/path/to/sequential-thinking-vis/out/mcp-server/index.js"]
    }
  }
}
```

#### 2. Restart AI Tool

Restart Claude Desktop or Cursor to load the new configuration.

#### 3. Watch Automatically

The extension auto-detects the tapper and displays a "🔴 Live AI Observer" session with real-time thoughts as the AI thinks.

### How It Works

The tapper is a transparent proxy:

1. **AI tool** sends sequential-thinking requests to **tapper**
2. **Tapper** forwards requests to **real server** (no changes)
3. **Real server** processes and responds to **tapper**
4. **Tapper** forwards response to **AI tool** (transparent)
5. **Tapper** also broadcasts to **VS Code extension** via TCP socket
6. **Extension** parses and visualizes thoughts in tree view

**Key Benefits:**

- ✅ Zero impact on AI tool behavior
- ✅ Automatic - no commands needed
- ✅ Real-time - see thoughts as they happen
- ✅ Compatible with any MCP client

### Version Management

The tapper automatically uses the supported major version of the sequential-thinking server:

```typescript
// Hardcoded in src/mcp-server/config.ts
export const SUPPORTED_SERVER_VERSION = '^1.0.0';
```

This means:

- ✅ Users get automatic patch updates (1.0.0 → 1.0.5)
- ✅ Users get automatic minor updates (1.0.0 → 1.2.0)
- ❌ Users blocked from major updates (1.0.0 → 2.0.0) until extension is updated

When a new major version is released, the extension author tests compatibility and updates the version constant.

## Testing the Connection

Use the included test script:

```bash
node scripts/test-mcp-connection.js
```

This will:

1. Connect to the MCP server
2. List available tools
3. Call the sequential-thinking tool
4. Verify the response
5. Close the connection

Expected output:

```
🔌 Testing MCP connection to sequential-thinking server...
📡 Connecting to server...
✅ Connected successfully!
📋 Listing available tools...
Found 1 tool(s):
  - sequentialthinking: A detailed tool for dynamic and reflective...
🧠 Testing sequential-thinking tool...
✅ Tool call successful!
🎉 All tests passed! MCP integration is working correctly.
```

## Troubleshooting

### Connection Fails

**Problem**: "Failed to connect to MCP server"

**Solutions**:

1. Ensure `npx` is available:

   ```bash
   npx --version
   ```

2. Test the server directly:

   ```bash
   npx -y @modelcontextprotocol/server-sequential-thinking
   ```

3. Check the Output channel:
   - View → Output
   - Select "MCP Sequential Thinking" from dropdown

### Tool Not Found

**Problem**: "sequentialthinking tool not found"

**Solutions**:

1. Verify the server is up-to-date:

   ```bash
   npm info @modelcontextprotocol/server-sequential-thinking version
   ```

2. Clear npx cache:
   ```bash
   npx clear-npx-cache
   ```

### Session Not Starting

**Problem**: Session appears to start but no thoughts are recorded

**Solutions**:

1. Check connection state:

   ```typescript
   console.log(mcpClient.getConnectionState());
   ```

2. Ensure you're calling `startSession()` before `callSequentialThinking()`

3. Check for errors in the Output channel

## Advanced Usage

### Custom Server Configuration

You can use a custom MCP server (e.g., locally installed):

```json
{
  "sequential-thinking-vis.serverCommand": "node",
  "sequential-thinking-vis.serverArgs": ["/path/to/local/server/index.js"]
}
```

### Programmatic Usage

If you're building on top of this extension:

```typescript
import { MCPClient } from './providers/MCPClient';

const client = new MCPClient();

// Connect
await client.connect();

// Start session
const sessionId = client.startSession('My problem');

// Add thoughts
await client.callSequentialThinking({
  thought: 'Step 1...',
  thoughtNumber: 1,
  totalThoughts: 3,
  nextThoughtNeeded: true,
});

await client.callSequentialThinking({
  thought: 'Step 2...',
  thoughtNumber: 2,
  totalThoughts: 3,
  nextThoughtNeeded: true,
});

// End session
client.endSession();

// Disconnect
await client.disconnect();
```

## Resources

- [Model Context Protocol](https://modelcontextprotocol.io/) - Official MCP documentation
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/sdk) - MCP SDK on GitHub
- [@modelcontextprotocol/server-sequential-thinking](https://www.npmjs.com/package/@modelcontextprotocol/server-sequential-thinking) - Sequential Thinking server on npm

## Contributing

To improve the MCP integration:

1. Check the [MCP SDK documentation](https://modelcontextprotocol.io/docs/sdk/typescript)
2. Review the `MCPClient` implementation
3. Add tests in `test/suite/unit/MCPClient.test.ts`
4. Test with the test script: `node scripts/test-mcp-connection.js`
5. Submit a pull request

## License

MIT
