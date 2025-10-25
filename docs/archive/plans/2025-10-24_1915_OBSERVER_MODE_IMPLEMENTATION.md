# Observer Mode Implementation Plan

**Date:** October 25, 2025  
**Status:** Planning  
**Goal:** Add real-time AI thinking observation via MCP stream tapping

---

## Overview

Enable the extension to watch real-time AI thinking as it happens with the sequential-thinking MCP server, visualizing it in VS Code without any impact on the AI tool's operation.

---

## Architecture

### High-Level Flow

```
┌─────────────────────────────────────────────────────────┐
│  AI Tool (Claude Desktop, Cursor AI, etc.)              │
│                                                          │
│  Configured to use our tapper instead of direct server  │
└─────────────┬────────────────────────────────────────────┘
              │
              │ stdin/stdout (JSON-RPC over stdio)
              │
┌─────────────▼────────────────────────────────────────────┐
│  Stream Tapper (Node.js script)                          │
│  Location: src/mcp-server/index.ts                       │
│                                                           │
│  - Transparent proxy (forwards all stdio)                │
│  - Broadcasts stdout to TCP socket                       │
│  - Writes port to config file                            │
│  - ~50 lines of code                                     │
└─────┬─────────────────────────────┬─────────────────────┘
      │                             │
      │ stdio                       │ TCP socket (localhost)
      │                             │
      ▼                             ▼
┌─────────────────────┐    ┌──────────────────────────────┐
│  Sequential Thinking│    │  VS Code Extension           │
│  MCP Server         │    │                              │
│  (official)         │    │  ObserverClient listens      │
└─────────────────────┘    │  - Buffers & parses messages │
                           │  - Extracts thought data     │
                           │  - Updates TreeView          │
                           └──────────────────────────────┘
```

---

## Design Decisions

### 1. **Stream Tapper Approach**

**Choice:** Option 5 - Stream Tapper (Transparent Proxy)

**Why:**

- ✅ Simple implementation (~50 lines)
- ✅ Completely transparent to AI tool
- ✅ Can't crash from parsing errors (no parsing in tapper)
- ✅ All logic in extension (easier to update)
- ✅ Upgradeable to full proxy later if needed

**Alternatives Considered:**

- ❌ Parse VS Code output logs - Not exposed by API
- ❌ Hook VS Code internals - No public API
- ❌ File-based logging - Messy, file growth issues
- ❌ Fork sequential-thinking - Maintenance burden

### 2. **Message Parsing Location**

**Choice:** Extension handles all message boundary logic

**Why:**

- ✅ Tapper stays bulletproof (dumb pipe)
- ✅ All smart code in one place
- ✅ Can update parsing without touching tapper
- ✅ Better debugging capabilities

### 3. **Cross-Platform IPC**

**Choice:** TCP socket on localhost with port discovery file

**Why:**

- ✅ Works on Windows, macOS, Linux
- ✅ Fast and reliable
- ✅ Local-only (127.0.0.1)
- ✅ OS handles port selection (no conflicts)

**Alternatives Considered:**

- ❌ Unix sockets - macOS/Linux only
- ❌ Named pipes - Platform-specific setup
- ❌ File watching - File I/O overhead

### 4. **Config File Location**

**Choice:** OS-specific application data directories

**Why:**

- ✅ Follows platform conventions
- ✅ No home directory clutter
- ✅ Easy to find for debugging
- ✅ User-specific (no permission issues)

**Paths:**

- macOS: `~/Library/Application Support/sequential-thinking-vis/observer-port.txt`
- Windows: `%APPDATA%\sequential-thinking-vis\observer-port.txt`
- Linux: `~/.config/sequential-thinking-vis/observer-port.txt`

### 5. **Auto-Detection of Observer Mode**

**Choice:** Automatically connect to tapper if available, no user action needed

**Why:**

- ✅ Simpler UX - no commands to remember
- ✅ Works automatically when AI tool uses tapper
- ✅ Falls back gracefully if tapper not running
- ✅ Still supports manual client mode for direct use
- ✅ No configuration needed

### 6. **Server Version Management**

**Choice:** Pin to major version, managed by extension author

**Why:**

- ✅ Users automatically get bug fixes (patch versions)
- ✅ Users automatically get new features (minor versions)
- ✅ Users protected from breaking changes (no major version updates)
- ✅ Extension author controls when to support new major versions
- ✅ Simple - no user configuration needed
- ✅ Predictable behavior

**Implementation:** Hardcoded constant in `src/mcp-server/config.ts`:

```typescript
export const SUPPORTED_SERVER_VERSION = '^1.0.0';
```

**Version Range Behavior:**

Using caret range (`^1.0.0`) means:

- ✅ `1.0.0` → `1.0.5` (patch updates) - Auto-updates
- ✅ `1.0.0` → `1.2.0` (minor updates) - Auto-updates
- ❌ `1.0.0` → `2.0.0` (major updates) - Blocked

**Upgrade Process:**

When sequential-thinking server releases v2.0.0:

1. Extension author tests compatibility
2. Updates `SUPPORTED_SERVER_VERSION = '^2.0.0'` in code
3. Releases new extension version
4. Users get v2.x.x after extension update

**Alternatives Considered:**

- ❌ Always use `@latest` - Users get breaking changes automatically
- ❌ User configuration - Too complex, users won't understand semver
- ❌ Pin exact version - Users miss bug fixes

---

## File Structure

```
src/
├── mcp-server/
│   ├── index.ts              # Stream tapper (NEW)
│   └── config.ts             # Cross-platform paths (NEW)
│
├── providers/
│   ├── MCPClient.ts          # Existing client mode
│   └── ObserverClient.ts     # New observer mode (NEW)
│
├── commands/
│   ├── connectServer.ts      # Existing
│   ├── disconnectServer.ts   # Existing
│   ├── startSession.ts       # Existing
│   └── showThoughtDetails.ts # Existing
│
└── extension.ts              # Update to auto-detect observer
```

---

## Implementation Tasks

### Phase 1: Core Infrastructure

#### Task 1.1: Config Module

**File:** `src/mcp-server/config.ts`  
**Lines:** ~80  
**Description:** Cross-platform configuration directory paths and version management

```typescript
export function getConfigDir(): string;
export function getPortFile(): string;
export function ensureConfigDir(): void;
export const SUPPORTED_SERVER_VERSION: string;
export function getServerPackageSpec(): string;
```

**Platform Support:**

- macOS: `~/Library/Application Support/sequential-thinking-vis/`
- Windows: `%APPDATA%\sequential-thinking-vis\`
- Linux: `~/.config/sequential-thinking-vis/`

**Version Management:**

Hardcoded major version pinning:

```typescript
export const SUPPORTED_SERVER_VERSION = '^1.0.0';

export function getServerPackageSpec(): string {
  return `@modelcontextprotocol/server-sequential-thinking@${SUPPORTED_SERVER_VERSION}`;
}
```

**Result:** Users get latest 1.x.x but never 2.x.x (breaking changes protected)

---

#### Task 1.2: Stream Tapper

**File:** `src/mcp-server/index.ts`  
**Lines:** ~50  
**Description:** Transparent stdio proxy with TCP broadcast

**Responsibilities:**

1. Start TCP server on localhost (random port)
2. Write port to config file
3. Spawn `@modelcontextprotocol/server-sequential-thinking`
4. Pipe stdin → child.stdin (transparent)
5. Pipe child.stdout → stdout (transparent)
6. Pipe child.stdout → all connected TCP sockets (broadcast)
7. Pipe child.stderr → stderr (transparent)
8. Cleanup port file on exit

**Key Code:**

```typescript
const socketServer = net.createServer((socket) => {
  sockets.push(socket);
  socket.on('close', () => {
    /* remove from array */
  });
});

socketServer.listen(0, '127.0.0.1', () => {
  const port = (socketServer.address() as net.AddressInfo).port;
  fs.writeFileSync(getPortFile(), String(port));
});

const server = spawn('npx', ['-y', '@modelcontextprotocol/server-sequential-thinking']);
process.stdin.pipe(server.stdin);
server.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  sockets.forEach((s) => s.write(chunk));
});
```

---

### Phase 2: Extension Observer Client

#### Task 2.1: ObserverClient

**File:** `src/providers/ObserverClient.ts`  
**Lines:** ~100  
**Description:** TCP client that parses JSON-RPC messages

**Responsibilities:**

1. Read port from config file
2. Connect to tapper TCP socket
3. Buffer incoming data
4. Split by newlines (JSON-RPC messages)
5. Parse JSON
6. Extract thought data from requests and responses
7. Emit events: `thought`, `connected`, `disconnected`, `error`

**Events:**

```typescript
{
  type: 'request' | 'response',
  data: ThoughtNode | ToolResult,
  timestamp: string
}
```

**Key Methods:**

```typescript
connect(): void
disconnect(): void
private processBuffer(): void
private handleMessage(message: any): void
```

**Message Parsing Logic:**

```typescript
// Buffer newline-delimited JSON-RPC
this.buffer += chunk.toString('utf-8');
const lines = this.buffer.split('\n');
this.buffer = lines.pop() || ''; // Keep incomplete line

// Parse complete lines
lines.forEach((line) => {
  const message = JSON.parse(line);

  // Request: AI → Server
  if (message.method === 'tools/call') {
    emit('thought', { type: 'request', data: message.params.arguments });
  }

  // Response: Server → AI
  if (message.result) {
    emit('thought', { type: 'response', data: message.result });
  }
});
```

---

### Phase 3: Extension Integration

#### Task 3.1: Extension Updates

**File:** `src/extension.ts`  
**Changes:** +25 lines  
**Description:** Auto-detect and connect to observer

**Changes:**

1. Create `ObserverClient` instance on activation
2. Attempt to connect to tapper (fail silently if not available)
3. Wire observer events to tree provider
4. Handle observer client lifecycle

```typescript
// Add to extension
let observerClient: ObserverClient | null = null;

// Auto-detect and connect observer
observerClient = new ObserverClient();
observerClient.on('thought', (event) => {
  treeProvider.addObservedThought(event);
});

// Try to connect (non-blocking, fails silently if tapper not running)
observerClient.connect().catch(() => {
  // Tapper not available, that's okay
  outputChannel.appendLine('Observer mode not available (tapper not running)');
});

observerClient.on('connected', () => {
  outputChannel.appendLine('✓ Observer mode active');
});
```

---

#### Task 3.2: TreeProvider Updates

**File:** `src/views/ThoughtTreeProvider.ts`  
**Changes:** +40 lines  
**Description:** Support observer sessions

**Changes:**

1. Add `observerSession` property
2. Implement `addObservedThought()` method
3. Auto-create "🔴 Live Observer" session
4. Render observer sessions in tree

```typescript
private observerSession: ThoughtTree | null = null;

addObservedThought(event: ThoughtEvent) {
  if (!this.observerSession) {
    this.observerSession = {
      sessionId: 'observer-live',
      thoughts: [],
      branches: new Map(),
      metadata: {
        startTime: new Date().toISOString(),
        status: 'active',
        initialQuery: '🔴 Live AI Observer'
      }
    };
  }

  this.observerSession.thoughts.push({
    ...event.data,
    timestamp: event.timestamp
  });

  this.refresh();
}
```

**Tree View Display:**

```
📝 Session: How to implement auth (3 thoughts)  ← Manual session
  ├─ 💬 [1/3] First thought...
  └─ ...

🔴 Live AI Observer (15 thoughts)  ← Observer session
  ├─ 💬 [1/15] AI is thinking about...
  ├─ 💬 [2/15] Next step is...
  └─ ...
```

---

#### Task 3.3: Package.json Updates

**File:** `package.json`  
**Changes:** None  
**Description:** No changes needed - observer auto-activates

---

## User Setup Guide

### One-Time Configuration

#### Step 1: Configure AI Tool

**For Claude Desktop:**

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "node",
      "args": ["/Users/josephlamartina/Projects/sequential-thinking-vis/out/mcp-server/index.js"]
    }
  }
}
```

**For Cursor:**

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "node",
      "args": ["/Users/josephlamartina/Projects/sequential-thinking-vis/out/mcp-server/index.js"]
    }
  }
}
```

#### Step 2: Restart AI Tool

Restart Claude Desktop or Cursor to load the new MCP configuration.

#### Step 3: Open VS Code

Observer mode activates automatically when:

- The extension loads
- The tapper is running (AI tool configured correctly)

No user action needed!

---

## Usage Patterns

### Mode A: Client Mode (Manual Sessions)

**Use case:** Manually think through problems

**Steps:**

1. Click "Connect to Server"
2. Click "Start New Session"
3. Enter thoughts interactively
4. View in tree

**Session appears as:**

```
📝 Session: My problem (5 thoughts)
```

---

### Mode B: Observer Mode (Watch AI)

**Use case:** Watch real-time AI thinking

**Steps:**

1. Configure AI tool to use tapper (one-time setup)
2. Use AI tool normally with sequential-thinking
3. Thoughts appear automatically in VS Code in real-time

**Session appears as:**

```
🔴 Live AI Observer (23 thoughts)
```

**Note:** Activates automatically when tapper is running, no commands needed

---

### Mode C: Both Simultaneously

**Use case:** Compare manual vs AI thinking

Both sessions visible in tree:

```
📝 Session: My manual thinking (3 thoughts)
🔴 Live AI Observer (15 thoughts)
```

---

## Testing Strategy

### Unit Tests

#### Test 1: Config Module

```typescript
describe('Config Module', () => {
  it('should return platform-specific config dir');
  it('should create config dir if missing');
  it('should return port file path');
});
```

#### Test 2: ObserverClient

```typescript
describe('ObserverClient', () => {
  it('should connect to tapper socket');
  it('should parse newline-delimited JSON');
  it('should emit thought events for requests');
  it('should emit thought events for responses');
  it('should handle chunked messages');
  it('should handle disconnect gracefully');
});
```

---

### Integration Tests

#### Test 3: Tapper Standalone

```bash
# Start tapper manually
node out/mcp-server/index.js

# In another terminal, test stdio passthrough
echo '{"jsonrpc":"2.0","method":"tools/list"}' | node out/mcp-server/index.js

# Should forward to sequential-thinking and return response
```

#### Test 4: Tapper + Extension

```typescript
describe('Observer Mode E2E', () => {
  it('should write port file on tapper start');
  it('should allow extension to connect');
  it('should receive thought data in extension');
  it('should update tree view in real-time');
});
```

---

### Manual Testing

#### Test 5: Real AI Usage

1. Configure Claude Desktop with tapper
2. Enable observer mode in extension
3. Ask Claude to use sequential-thinking
4. Verify thoughts appear in VS Code in real-time
5. Check for correct thought numbers, content, metadata

---

## Error Handling

### Scenario 1: Tapper Not Running

**Problem:** Extension can't find port file

**Solution:**

```typescript
if (!fs.existsSync(portFile)) {
  vscode.window.showWarningMessage('Observer not available. Is the AI tool using the tapper?');
  return;
}
```

---

### Scenario 2: Connection Failed

**Problem:** Can't connect to TCP socket

**Solution:**

```typescript
socket.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    vscode.window.showErrorMessage('Tapper not responding. Try restarting AI tool.');
  }
});
```

---

### Scenario 3: Invalid JSON

**Problem:** Corrupted or partial JSON in stream

**Solution:**

```typescript
try {
  const message = JSON.parse(line);
  handleMessage(message);
} catch (e) {
  // Skip invalid JSON, log for debugging
  console.warn('Skipped invalid JSON:', line.substring(0, 50));
}
```

---

### Scenario 4: Multiple Tappers

**Problem:** User has multiple AI tools running

**Solution:**

- Last started tapper wins (overwrites port file)
- Extension connects to most recent
- Future: Support multiple connections with session IDs

---

## Code Size Estimate

| Component            | Lines    | Complexity     |
| -------------------- | -------- | -------------- |
| `config.ts`          | ~80      | Low            |
| `index.ts` (tapper)  | ~50      | Low            |
| `ObserverClient.ts`  | ~100     | Medium         |
| Extension updates    | ~25      | Low            |
| TreeProvider updates | ~40      | Low            |
| **Total**            | **~295** | **Low-Medium** |

---

## Timeline Estimate

- **Phase 1** (Core Infrastructure): 1-2 hours
- **Phase 2** (Observer Client): 2-3 hours
- **Phase 3** (Integration): 1-2 hours
- **Testing**: 1-2 hours
- **Documentation**: 1 hour

**Total:** 6-10 hours

---

## Success Criteria

- ✅ Tapper forwards all stdio transparently (AI tool works normally)
- ✅ Extension receives thought data in real-time
- ✅ Tree view updates automatically as AI thinks
- ✅ No performance impact on AI tool
- ✅ Works on macOS, Windows, Linux
- ✅ Both client and observer modes work simultaneously
- ✅ Graceful error handling when tapper unavailable

---

## Future Enhancements

### Phase 2 Features

- **Session recording**: Save observed sessions to disk
- **Session replay**: Replay saved thinking sessions
- **Thought search**: Search across all observed thoughts
- **Metrics**: Track thinking patterns, branch frequency, revision rates

### Phase 3 Features

- **Multiple observers**: Support multiple AI tools simultaneously
- **Remote observation**: Observe AI thinking on remote machines
- **Collaborative viewing**: Share observation sessions with team
- **Graph visualization**: D3.js visualization of thought branches

---

## Open Questions

1. **Auto-enable observer?**
   - Option A: User enables manually (more control)
   - Option B: Auto-enable if tapper detected (convenience)
   - **Recommendation:** Manual enable, but remember preference

2. **Session management?**
   - Option A: One "Live Observer" session that accumulates
   - Option B: New session per AI conversation
   - **Recommendation:** Single session, add "Clear" button

3. **Performance?**
   - How many thoughts before tree view becomes slow?
   - Should we limit display to last N thoughts?
   - **Recommendation:** Monitor and add pagination if needed

4. **Packaging?**
   - Option A: Tapper bundled with extension
   - Option B: Separate npm package
   - **Recommendation:** Bundle for now, extract later if needed

---

## Related Documentation

- [MCP Integration Guide](../MCP-INTEGRATION.md)
- [Testing Standards](../../TESTING.md)
- [VS Code Extension Patterns](.cursor/rules/vscode-extension-patterns.mdc)
- [MCP SDK Documentation](https://modelcontextprotocol.io/docs/sdk/typescript)

---

## Status

- [x] Architecture designed
- [x] Design decisions documented
- [ ] Implementation started
- [ ] Unit tests written
- [ ] Integration tests written
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Ready for release
