# Observer Mode Architecture

**Last Updated:** October 25, 2025

This document provides technical details about Observer Mode's architecture, implementation, and design decisions.

## Table of Contents

- [System Overview](#system-overview)
- [Components](#components)
- [Data Flow](#data-flow)
- [Implementation Details](#implementation-details)
- [Design Decisions](#design-decisions)
- [Extension Points](#extension-points)

---

## System Overview

Observer Mode implements a **transparent proxy pattern** for MCP (Model Context Protocol) communication:

```
┌──────────────────────────────────────────────────────────┐
│  AI Tool (Claude Desktop, Cursor, etc.)                  │
│  Configured to use stream tapper as MCP server           │
└────────────────┬─────────────────────────────────────────┘
                 │
                 │ JSON-RPC over stdio
                 ▼
┌──────────────────────────────────────────────────────────┐
│  Stream Tapper (src/mcp-server/index.ts)                 │
│                                                           │
│  1. Spawns sequential-thinking server (npx)              │
│  2. Forwards all stdio transparently (AI ↔ Server)       │
│  3. Broadcasts stdout to TCP socket (Server → Observer)  │
│  4. Writes port to config file for discovery             │
└────┬───────────────────────────┬─────────────────────────┘
     │                           │
     │ stdio                     │ TCP (localhost:random)
     ▼                           ▼
┌─────────────────┐    ┌──────────────────────────────────┐
│ Sequential      │    │  VS Code Extension               │
│ Thinking Server │    │                                  │
│ (official npm)  │    │  - ObserverClient connects       │
└─────────────────┘    │  - Parses JSON-RPC messages      │
                       │  - Extracts thought data         │
                       │  - Updates TreeView              │
                       └──────────────────────────────────┘
```

### Key Principles

1. **Zero Impact on AI Tool** - Tapper forwards stdio transparently; failures in observation don't affect AI
2. **Fail-Safe Architecture** - TCP broadcast errors are caught and ignored
3. **Auto-Discovery** - Extension finds tapper via port file (no hardcoded ports)
4. **Auto-Reconnection** - Extension reconnects if tapper restarts
5. **Platform-Independent** - Works on macOS, Windows, Linux

---

## Components

### 1. Config Module (`src/mcp-server/config.ts`)

**Purpose:** Manage platform-specific paths and port file I/O

**Key Functions:**

```typescript
getConfigDir(): string
// Returns platform-specific config directory:
// - macOS: ~/Library/Application Support/sequential-thinking-vis/
// - Windows: %APPDATA%\sequential-thinking-vis\
// - Linux: ~/.config/sequential-thinking-vis/

getPortFile(): string
// Returns full path to port file

readPort(): number | null
// Reads port from JSON file
// Returns null if file missing, invalid, or process dead (PID check)

writePort(port: number, pid: number): void
// Atomically writes port file with port, PID, timestamp

removePortFile(): void
// Cleanup on exit
```

**Port File Format:**

```json
{
  "port": 54321,
  "pid": 12345,
  "timestamp": "2025-10-25T10:30:00.000Z"
}
```

**Design Notes:**

- **Atomic writes** via temp file + rename (prevents race conditions)
- **PID validation** to detect stale files (handles crashes)
- **Platform detection** via `os.platform()` switch

---

### 2. Stream Tapper (`src/mcp-server/index.ts`)

**Purpose:** Transparent MCP proxy with TCP broadcast

**Architecture:**

```typescript
// TCP server for extension
const socketServer = net.createServer((socket) => {
  sockets.push(socket);
  // Handle disconnects, errors
});

// Listen on random port (OS assigns)
socketServer.listen(0, '127.0.0.1', () => {
  writePort(port, process.pid);
});

// Spawn sequential-thinking server
const server = spawn('npx', ['-y', serverSpec], {
  stdio: ['pipe', 'pipe', 'inherit'],
});

// Forward stdin: AI tool → server
process.stdin.pipe(server.stdin);

// Forward stdout: Server → AI tool + TCP clients
server.stdout.on('data', (chunk) => {
  process.stdout.write(chunk); // PRIMARY (must not fail)

  for (const socket of sockets) {
    // SECONDARY (may fail safely)
    try {
      socket.write(chunk);
    } catch {
      /* ignore */
    }
  }
});
```

**Critical Paths:**

1. **Primary Path (AI Tool ↔ Server):**
   - `process.stdin` → `server.stdin` (piped)
   - `server.stdout` → `process.stdout` (write in try-catch)
   - MUST be transparent and reliable

2. **Secondary Path (Server → Observers):**
   - `server.stdout` → TCP sockets (broadcast)
   - MAY fail without affecting primary path

**Error Handling:**

```typescript
// Primary path error (rare)
try {
  process.stdout.write(chunk);
} catch (error) {
  console.error('[Tapper] CRITICAL:', error);
  // Log but don't exit - try to continue
}

// Secondary path error (expected)
for (const socket of sockets) {
  try {
    socket.write(chunk);
  } catch {
    // Silent ignore - client will reconnect
  }
}
```

**Cleanup:**

```typescript
const cleanup = () => {
  removePortFile();
  server.kill();
  socketServer.close();
};

process.on('exit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
```

---

### 3. Observer Client (`src/providers/ObserverClient.ts`)

**Purpose:** TCP client that parses JSON-RPC and emits thought events

**Architecture:**

```typescript
class ObserverClient extends EventEmitter {
  private socket: net.Socket | null;
  private buffer: string; // Accumulates partial messages
  private reconnectTimer: NodeJS.Timeout | null;

  // Events emitted:
  // - 'thought': (event: ThoughtEvent) => void
  // - 'connected': () => void
  // - 'disconnected': () => void
  // - 'error': (error: Error) => void
}
```

**Connection Flow:**

```typescript
connect() {
  const port = readPort();  // From config module
  if (!port) {
    emit('error', 'Tapper not available');
    scheduleReconnect();
    return;
  }

  socket = net.connect(port, '127.0.0.1');

  socket.on('connect', () => emit('connected'));
  socket.on('data', (chunk) => handleData(chunk));
  socket.on('close', () => { emit('disconnected'); scheduleReconnect(); });
  socket.on('error', (err) => emit('error', err));
}

scheduleReconnect() {
  setTimeout(() => connect(), 5000);  // Retry every 5 seconds
}
```

**Message Parsing:**

JSON-RPC messages are **newline-delimited**:

```
{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n
{"jsonrpc":"2.0","id":1,"result":{"tools":[...]}}\n
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{...}}\n
```

**Buffering Logic:**

```typescript
private handleData(chunk: Buffer): void {
  this.buffer += chunk.toString('utf-8');

  const lines = this.buffer.split('\n');
  this.buffer = lines.pop() || '';  // Keep incomplete line

  for (const line of lines) {
    try {
      const message = JSON.parse(line);
      this.handleMessage(message);
    } catch {
      console.warn('Invalid JSON:', line.substring(0, 100));
    }
  }
}
```

**Thought Extraction:**

```typescript
private handleMessage(message: unknown): void {
  if (typeof message !== 'object' || message === null) return;

  const msg = message as Record<string, unknown>;

  // Extract from tool call requests
  if (msg.method === 'tools/call') {
    const params = msg.params as Record<string, unknown> | undefined;
    if (params?.name === 'sequentialthinking') {
      const thoughtData = params.arguments;

      this.emit('thought', {
        type: 'request',
        data: thoughtData,
        timestamp: new Date().toISOString()
      });
    }
  }
}
```

**Type Safety:**

- Uses `unknown` instead of `any`
- Type guards for safe property access
- Handles malformed messages gracefully

---

### 4. Tree Provider (`src/views/ThoughtTreeProvider.ts`)

**Purpose:** Render observer session in VS Code TreeView

**Refactored Architecture (Observer-Only):**

```typescript
class ThoughtTreeProvider implements vscode.TreeDataProvider<ThoughtTreeItem> {
  private observerSession: ThoughtTree | null = null;

  // Observer mode: no MCPClient dependency
  constructor() {}

  addObservedThought(event: ThoughtEvent): void {
    // Initialize session if needed
    if (!this.observerSession) {
      this.observerSession = {
        sessionId: `observer-${Date.now()}`,
        thoughts: [],
        branches: new Map(),
        metadata: { status: 'active', startTime: ..., initialQuery: 'Live AI Observer' }
      };
    }

    // Extract and add thought
    const data = event.data as Record<string, unknown>;
    const thought: ThoughtNode = {
      thought: data.thought as string || '',
      thoughtNumber: data.thoughtNumber as number || 0,
      ...
    };

    this.observerSession.thoughts.push(thought);
    this.refresh();
  }

  clearObserverSession(): void {
    this.observerSession = null;
    this.refresh();
  }
}
```

**Tree Structure:**

```
Root
 └─ ObserverSessionHeader (collapsible)
     ├─ Thought 1
     ├─ Thought 2
     └─ ...
```

---

### 5. Extension Integration (`src/extension.ts`)

**Purpose:** Wire everything together

**Activation Flow:**

```typescript
export async function activate(context: vscode.ExtensionContext) {
  // 1. Create tree provider (no dependencies)
  treeProvider = new ThoughtTreeProvider();

  // 2. Create observer client
  observerClient = new ObserverClient();

  // 3. Wire events
  observerClient.on('thought', (event) => {
    treeProvider.addObservedThought(event);
  });

  observerClient.on('connected', () => {
    outputChannel.appendLine('✓ Observer mode active');
    vscode.window.showInformationMessage('Observer mode active');
  });

  observerClient.on('disconnected', () => {
    outputChannel.appendLine('Observer disconnected');
  });

  observerClient.on('error', (err) => {
    outputChannel.appendLine(`Observer error: ${err.message}`);
  });

  // 4. Auto-connect (fails silently if tapper not running)
  observerClient.connect();

  // 5. Register disposables
  context.subscriptions.push({
    dispose: () => observerClient?.dispose(),
  });
}
```

---

## Data Flow

### Thought Generation Flow

```
1. User asks Claude: "Use sequential thinking to solve X"

2. Claude sends JSON-RPC request to tapper:
   {
     "method": "tools/call",
     "params": {
       "name": "sequentialthinking",
       "arguments": {
         "thought": "First, let's understand...",
         "thoughtNumber": 1,
         "totalThoughts": 5,
         "nextThoughtNeeded": true
       }
     }
   }

3. Tapper forwards to sequential-thinking server (stdio)

4. Tapper broadcasts to TCP socket (extension)

5. ObserverClient receives, parses, emits 'thought' event

6. TreeProvider receives event, adds to observerSession

7. TreeProvider fires onDidChangeTreeData

8. VS Code refreshes TreeView

9. User sees "💬 [1/5] First, let's understand..."
```

### Timing

- **Step 2→3:** < 1ms (stdio write)
- **Step 3→4:** < 1ms (TCP write)
- **Step 4→5:** < 5ms (TCP transmission + parsing)
- **Step 5→6:** < 1ms (event emission)
- **Step 6→8:** < 10ms (TreeView render)

**Total latency:** ~15-20ms from AI generating thought to user seeing it

---

## Design Decisions

### Why Not Direct MCP Client in Extension?

**Considered:** Extension connects directly to sequential-thinking server

**Rejected because:**

- ❌ AI tool and extension would compete for the server
- ❌ Only one MCP client can connect to a stdio server
- ❌ Would require AI tool to not use sequential-thinking

**Chosen Solution:** Tapper pattern allows both AI and extension to observe

---

### Why TCP Instead of Shared Memory?

**Considered:** Unix domain sockets or shared memory for IPC

**Rejected because:**

- ❌ Platform differences (Windows doesn't have Unix sockets)
- ❌ More complex implementation
- ❌ Harder to debug

**Chosen Solution:** TCP on localhost

- ✅ Cross-platform
- ✅ Simple and well-understood
- ✅ Easy to test (can use `nc` or `telnet`)
- ✅ Low overhead for localhost

---

### Why Random Port Instead of Fixed Port?

**Considered:** Fixed port like 8765

**Rejected because:**

- ❌ Port conflicts if multiple instances
- ❌ Requires user to configure firewall
- ❌ Security concerns (predictable port)

**Chosen Solution:** OS-assigned random port

- ✅ No conflicts
- ✅ Localhost-only (secure by default)
- ✅ Discovered via port file

---

### Why Newline-Delimited JSON?

**Considered:** Length-prefixed JSON or WebSocket protocol

**Rejected because:**

- ❌ More complex parsing
- ❌ Overkill for this use case
- ❌ JSON-RPC 2.0 doesn't specify message framing

**Chosen Solution:** Newline-delimited (ndjson)

- ✅ Simple to parse
- ✅ Matches MCP stdio convention
- ✅ Easy to debug (readable in logs)

---

### Why Auto-Reconnection?

**User Experience:** Tapper may restart if:

- AI tool is restarted
- User is developing/debugging
- System resource constraints

**Without auto-reconnection:**

- ❌ User must manually reconnect
- ❌ Missed thoughts during downtime

**With auto-reconnection (5-second retry):**

- ✅ Extension reconnects automatically
- ✅ User doesn't need to intervene
- ✅ No configuration needed

---

## Extension Points

### Adding New MCP Tool Support

Observer Mode is **tool-agnostic** - it works with any MCP tool that:

1. Supports stdio transport
2. Can be configured to run the tapper instead of direct server

**To add support for a new tool:**

1. Find the tool's MCP configuration file
2. Configure it to use `node path/to/tapper.js`
3. Restart the tool
4. Done!

---

### Adding Custom Thought Processing

To process thoughts beyond visualization:

```typescript
// In extension.ts
observerClient.on('thought', (event) => {
  // Custom processing
  if (isInterestingThought(event)) {
    logToCustomStore(event);
  }

  // Standard visualization
  treeProvider.addObservedThought(event);
});
```

---

### Adding New Transport Mechanisms

Current: TCP localhost

**Future possibilities:**

- WebSocket for remote observation
- HTTP/2 for bidirectional streaming
- gRPC for typed RPC

**Extension points:**

- Replace `ObserverClient` connection logic
- Keep event emission interface the same
- TreeProvider remains unchanged

---

## Performance Considerations

### Memory Usage

- **Tapper:** ~10MB (Node.js process)
- **Extension:** ~5MB baseline + ~1KB per thought
- **At 1000 thoughts:** ~15MB total

### CPU Usage

- **Tapper:** < 1% CPU (mostly idle)
- **Extension:** < 0.5% CPU during active observation
- **TreeView rendering:** Efficient (VS Code optimizes)

### Network

- **Bandwidth:** ~1KB per thought
- **Latency:** < 20ms localhost TCP
- **Throughput:** Can handle 100+ thoughts/sec (tested)

---

## Testing Strategy

### Unit Tests

- `config.test.ts` - Platform-specific paths, port file I/O
- `ObserverClient.test.ts` - TCP connection, message parsing, reconnection
- `ThoughtTreeProvider.test.ts` - Observer session management, tree rendering

### Integration Tests

- `tapper.test.ts` - Standalone tapper testing (spawn + connect)
- `observer-flow.test.ts` - Full flow: tapper → client → tree

### Manual Testing

- Real AI tool integration (Claude Desktop, Cursor)
- Cross-platform verification (macOS, Windows, Linux)
- Performance testing with large sessions (1000+ thoughts)

---

## Security Considerations

### Threat Model

**In Scope:**

- Local machine compromise
- Accidental exposure of thought data

**Out of Scope:**

- Remote attackers (localhost-only)
- AI tool compromise (trusted)

### Mitigations

1. **Localhost-only binding** - TCP socket only accepts 127.0.0.1
2. **No authentication needed** - Port file is local, process-owned
3. **Temporary data** - Thoughts not persisted to disk (yet)
4. **PID validation** - Prevents using stale port files

### Future Considerations

For remote observation (v0.3.0+):

- TLS for encryption
- Authentication tokens
- RBAC for team features

---

## Debugging

### Tapper Logs

Tapper logs to `stderr`:

```bash
node out/mcp-server/index.js
# [Tapper] Starting @modelcontextprotocol/server-sequential-thinking@^1.0.0
# [Tapper] Listening on localhost:54321
# [Tapper] PID: 12345
```

### Extension Logs

`View > Output` → "MCP Sequential Thinking"

```
✓ Observer mode active - watching AI thinking
Observer disconnected
Observer error: Connection refused
```

### Port File

```bash
# macOS
cat ~/Library/Application\ Support/sequential-thinking-vis/observer-port.json

# Windows
type %APPDATA%\sequential-thinking-vis\observer-port.json

# Linux
cat ~/.config/sequential-thinking-vis/observer-port.json
```

---

## Related Documentation

- [Observer Mode Setup Guide](OBSERVER-MODE-SETUP.md) - Configuration instructions
- [Observer Mode Usage Guide](OBSERVER-MODE-USAGE.md) - User guide
- [MCP Integration Guide](MCP-INTEGRATION.md) - MCP protocol details

---

**Last Updated:** October 25, 2025
