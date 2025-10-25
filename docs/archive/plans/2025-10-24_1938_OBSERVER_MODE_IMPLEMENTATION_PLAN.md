# Observer Mode Implementation Plan (Detailed)

**Date:** October 25, 2025  
**Status:** Implementation Ready  
**Author:** AI Assistant (via Sequential Thinking Analysis)

---

## Executive Summary

This document provides a detailed implementation plan for adding Observer Mode functionality to the Sequential Thinking Visualization VS Code extension. Based on thorough analysis using sequential thinking, this plan refines the original architecture document with specific implementation details, adjusted estimates, and risk mitigation strategies.

**Key Changes from Original Plan:**

- Added **Phase 0** for TreeProvider refactoring (critical prerequisite)
- **Observer-only architecture** - simplified from manual + observer to just observer mode
- Adjusted code estimates: **~350 lines** (was 295), **20 hours total** (was 6-10 in original)
- Enhanced error handling requirements
- Comprehensive testing strategy
- Cross-platform verification checklist

---

## Architecture Overview

### The Observer Pattern

```
┌──────────────────────────────────────────────────────────┐
│  AI Tool (Claude Desktop, Cursor, etc.)                  │
│  Uses tapper in MCP config instead of direct server      │
└────────────────┬─────────────────────────────────────────┘
                 │
                 │ JSON-RPC over stdio
                 ▼
┌──────────────────────────────────────────────────────────┐
│  Stream Tapper (src/mcp-server/index.ts)                 │
│                                                           │
│  1. Spawns sequential-thinking server                    │
│  2. Forwards all stdio transparently                     │
│  3. Broadcasts stdout to TCP socket                      │
│  4. Writes port to config file                           │
└────┬───────────────────────────┬─────────────────────────┘
     │                           │
     │ stdio                     │ TCP localhost:random_port
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

**Why This Works:**

- ✅ Zero impact on AI tool (transparent forwarding)
- ✅ Can't break AI tool (parsing errors isolated to extension)
- ✅ Works with any AI tool that uses MCP stdio
- ✅ Extension gets real-time thought stream

---

## Implementation Phases

### Phase 0: TreeProvider Refactoring ⚠️ CRITICAL FIRST STEP

**Why This Is Phase 0:**
The current TreeProvider is designed for manual sessions with MCPClient integration. We need to refactor it to support the observer-only mode where thoughts come from the ObserverClient instead of manual user input.

#### Changes Required

**Current Structure:**

```typescript
private currentSession: ThoughtTree | null = null;

getChildren(element?: ThoughtTreeItem) {
  if (!this.currentSession) {
    return Promise.resolve([]);
  }
  // Shows single session
}
```

**New Structure (Observer-Only):**

```typescript
private observerSession: ThoughtTree | null = null;

getChildren(element?: ThoughtTreeItem) {
  if (!this.observerSession) {
    // No active observer session - show empty state
    return Promise.resolve([]);
  }

  if (!element) {
    // Root: Show session header
    return Promise.resolve([this.getObserverSessionHeader()]);
  }

  if (element.type === 'session-header') {
    // Expand session: Show its thoughts
    return Promise.resolve(this.getThoughtsForSession());
  }

  return Promise.resolve([]);
}
```

#### Task 0.1: Refactor Data Model

**File:** `src/views/ThoughtTreeProvider.ts`  
**Lines Changed:** ~60  
**Breaking Changes:** Yes (removes MCPClient dependency)

**Steps:**

1. Remove MCPClient integration (move to observer-only)
2. Change `currentSession` to `observerSession: ThoughtTree | null`
3. Update `getChildren()` to show observer session header + thoughts
4. Remove manual session event listeners
5. Add methods:
   - `getObserverSessionHeader(): ThoughtTreeItem`
   - `getThoughtsForSession(): ThoughtTreeItem[]`
   - `addObservedThought(event: ThoughtEvent): void`
   - `clearObserverSession(): void`

#### Task 0.2: Update Session Display

**Tree View Before (Manual Mode):**

```
📝 Session: My problem (5 thoughts)
  ├─ 💬 [1/5] First thought...
  ├─ 💬 [2/5] Second thought...
  └─ ...
```

**Tree View After (Observer-Only Mode):**

```
🔴 Live AI Observer (23 thoughts)
  ├─ 💬 [1/23] AI is thinking about...
  ├─ 💬 [2/23] Breaking down the problem...
  ├─ 💬 [3/23] Considering approach A...
  └─ ...
```

**Icons:**

- Observer session: `🔴` or `record`
- Normal thoughts: `💬` or `comment`
- Revisions: `🔄` or `debug-restart`
- Branches: `🌿` or `git-branch`
- Final thoughts: `✓` or `check`

#### Task 0.3: Update Tests

**File:** `test/suite/unit/ThoughtTreeProvider.test.ts` (NEW)  
**Lines:** ~150

**Tests Needed:**

- Observer session renders correctly
- Session header is collapsible
- Clicking session header shows thoughts
- Can clear observer session
- Empty state shows when no observer active
- Thoughts display in order with correct icons

**Estimated Time:** 2-3 hours  
**Risk:** Medium (breaking change, removes manual mode)

---

### Phase 1: Core Infrastructure

#### Task 1.1: Config Module

**File:** `src/mcp-server/config.ts`  
**Lines:** ~100  
**Dependencies:** None

**Interface:**

```typescript
/**
 * Get the platform-specific configuration directory
 * macOS: ~/Library/Application Support/sequential-thinking-vis/
 * Windows: %APPDATA%\sequential-thinking-vis\
 * Linux: ~/.config/sequential-thinking-vis/
 */
export function getConfigDir(): string;

/**
 * Get the full path to the port file
 */
export function getPortFile(): string;

/**
 * Ensure config directory exists (create if needed)
 */
export function ensureConfigDir(): void;

/**
 * Read port from port file (returns null if not found or invalid)
 */
export function readPort(): number | null;

/**
 * Write port to port file atomically
 */
export function writePort(port: number, pid: number): void;

/**
 * Remove port file (cleanup on exit)
 */
export function removePortFile(): void;

/**
 * Hardcoded server version (caret range for auto-updates)
 */
export const SUPPORTED_SERVER_VERSION = '^1.0.0';

/**
 * Get the npm package specifier for npx
 */
export function getServerPackageSpec(): string;
```

**Implementation Details:**

**Port File Format:**

```json
{
  "port": 54321,
  "pid": 12345,
  "timestamp": "2025-10-25T10:30:00.000Z"
}
```

**Why Include PID:**

- Extension can verify tapper is still running
- Stale port files can be detected and ignored
- On Windows, can use `process.kill(pid, 0)` to check without killing

**Platform-Specific Paths:**

```typescript
export function getConfigDir(): string {
  const home = os.homedir();

  switch (os.platform()) {
    case 'darwin':
      return path.join(home, 'Library/Application Support/sequential-thinking-vis');
    case 'win32':
      return path.join(
        process.env.APPDATA || path.join(home, 'AppData/Roaming'),
        'sequential-thinking-vis'
      );
    case 'linux':
      return path.join(
        process.env.XDG_CONFIG_HOME || path.join(home, '.config'),
        'sequential-thinking-vis'
      );
    default:
      return path.join(home, '.sequential-thinking-vis');
  }
}
```

**Atomic Write:**

```typescript
export function writePort(port: number, pid: number): void {
  ensureConfigDir();
  const portFile = getPortFile();
  const data = JSON.stringify({
    port,
    pid,
    timestamp: new Date().toISOString(),
  });

  // Write to temp file, then rename (atomic on POSIX)
  const tempFile = portFile + '.tmp';
  fs.writeFileSync(tempFile, data, 'utf8');
  fs.renameSync(tempFile, portFile);
}
```

**Estimated Time:** 1 hour  
**Risk:** Low

---

#### Task 1.2: Stream Tapper

**File:** `src/mcp-server/index.ts`  
**Lines:** ~70  
**Dependencies:** config.ts, Node built-ins (net, child_process)

**Implementation:**

```typescript
#!/usr/bin/env node
/**
 * Stream Tapper - Transparent MCP stdio proxy with TCP broadcast
 *
 * Usage:
 *   node out/mcp-server/index.js
 *
 * This process:
 * 1. Starts TCP server on localhost (random port)
 * 2. Writes port to config file
 * 3. Spawns @modelcontextprotocol/server-sequential-thinking
 * 4. Forwards all stdio transparently
 * 5. Broadcasts stdout to connected TCP clients
 */

import * as net from 'net';
import { spawn } from 'child_process';
import { getServerPackageSpec, writePort, removePortFile } from './config.js';

const sockets: net.Socket[] = [];

// TCP server for extension to connect to
const socketServer = net.createServer((socket) => {
  sockets.push(socket);

  socket.on('close', () => {
    const index = sockets.indexOf(socket);
    if (index > -1) {
      sockets.splice(index, 1);
    }
  });

  socket.on('error', (err) => {
    // Silently remove errored sockets
    const index = sockets.indexOf(socket);
    if (index > -1) {
      sockets.splice(index, 1);
    }
  });
});

// Listen on random port (OS assigns)
socketServer.listen(0, '127.0.0.1', () => {
  const address = socketServer.address() as net.AddressInfo;
  const port = address.port;

  // Write port to config file for extension to discover
  writePort(port, process.pid);

  console.error(`[Tapper] Listening on localhost:${port}`);
});

// Spawn sequential-thinking server
const serverSpec = getServerPackageSpec();
console.error(`[Tapper] Starting ${serverSpec}`);

const server = spawn('npx', ['-y', serverSpec], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: process.env,
});

// Forward stdin to server (AI tool → server)
process.stdin.pipe(server.stdin);

// Forward server stdout to process stdout AND TCP clients
server.stdout.on('data', (chunk) => {
  // Forward to AI tool (MUST NOT FAIL)
  process.stdout.write(chunk);

  // Broadcast to TCP clients (MAY FAIL - don't block)
  sockets.forEach((socket) => {
    try {
      socket.write(chunk);
    } catch (err) {
      // Ignore write errors - extension will reconnect
    }
  });
});

// Cleanup on exit
const cleanup = () => {
  removePortFile();
  server.kill();
  socketServer.close();
};

process.on('exit', cleanup);
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Forward server exit
server.on('exit', (code) => {
  process.exit(code || 0);
});
```

**Critical Requirements:**

1. **Transparent Forwarding:**
   - `process.stdout.write(chunk)` MUST succeed
   - No buffering or delays allowed
   - Socket broadcast failures must not affect forwarding

2. **Non-Blocking Socket Writes:**
   - Wrap `socket.write()` in try-catch
   - Silently drop failed writes
   - Extension will reconnect if needed

3. **Graceful Cleanup:**
   - Remove port file on exit
   - Kill child process
   - Close TCP server

**Testing:**

```bash
# Test 1: Echo test (transparency check)
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node out/mcp-server/index.js

# Test 2: Port file created
cat ~/Library/Application\ Support/sequential-thinking-vis/observer-port.txt

# Test 3: TCP connection
nc localhost $(cat ~/Library/Application\ Support/sequential-thinking-vis/observer-port.txt | jq -r .port)
```

**Estimated Time:** 2 hours  
**Risk:** Medium (critical path for AI tool, must be bulletproof)

---

### Phase 2: Extension Observer Client

#### Task 2.1: ObserverClient Implementation

**File:** `src/providers/ObserverClient.ts`  
**Lines:** ~120  
**Dependencies:** config.ts, net, events

**Interface:**

```typescript
import { EventEmitter } from 'events';

export interface ThoughtEvent {
  type: 'request' | 'response';
  data: any; // ThoughtNode or SequentialThinkingResult
  timestamp: string;
}

export class ObserverClient extends EventEmitter {
  private socket: net.Socket | null = null;
  private buffer: string = '';
  private reconnectTimer: NodeJS.Timeout | null = null;

  /**
   * Events:
   * - 'thought': (event: ThoughtEvent) => void
   * - 'connected': () => void
   * - 'disconnected': () => void
   * - 'error': (error: Error) => void
   */

  constructor();

  /**
   * Connect to the tapper TCP socket
   * Reads port from config file, fails silently if not available
   */
  connect(): void;

  /**
   * Disconnect from tapper
   */
  disconnect(): void;

  /**
   * Check if connected
   */
  isConnected(): boolean;

  /**
   * Cleanup resources
   */
  dispose(): void;
}
```

**Implementation Details:**

**Connection Logic:**

```typescript
connect(): void {
  const port = readPort();
  if (!port) {
    this.emit('error', new Error('Tapper not available (port file not found)'));
    this.scheduleReconnect();
    return;
  }

  this.socket = net.connect(port, '127.0.0.1');

  this.socket.on('connect', () => {
    this.emit('connected');
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  });

  this.socket.on('data', (chunk) => {
    this.handleData(chunk);
  });

  this.socket.on('close', () => {
    this.emit('disconnected');
    this.scheduleReconnect();
  });

  this.socket.on('error', (err) => {
    this.emit('error', err);
  });
}
```

**Message Parsing:**

```typescript
private handleData(chunk: Buffer): void {
  // Append to buffer
  this.buffer += chunk.toString('utf-8');

  // Split by newlines (JSON-RPC message delimiter)
  const lines = this.buffer.split('\n');

  // Keep incomplete line in buffer
  this.buffer = lines.pop() || '';

  // Process complete lines
  for (const line of lines) {
    if (line.trim().length === 0) continue;

    try {
      const message = JSON.parse(line);
      this.handleMessage(message);
    } catch (err) {
      // Skip invalid JSON - log for debugging
      console.warn('[ObserverClient] Invalid JSON:', line.substring(0, 100));
    }
  }
}
```

**Thought Extraction:**

```typescript
private handleMessage(message: any): void {
  // Request: AI → Server (contains thought parameters)
  if (message.method === 'tools/call') {
    const toolName = message.params?.name;
    if (toolName === 'sequentialthinking') {
      this.emit('thought', {
        type: 'request',
        data: message.params.arguments,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Response: Server → AI (contains tool result)
  if (message.result) {
    this.emit('thought', {
      type: 'response',
      data: message.result,
      timestamp: new Date().toISOString()
    });
  }
}
```

**Auto-Reconnect:**

```typescript
private scheduleReconnect(): void {
  if (this.reconnectTimer) return;

  // Try to reconnect every 5 seconds
  this.reconnectTimer = setTimeout(() => {
    this.reconnectTimer = null;
    this.connect();
  }, 5000);
}
```

**Estimated Time:** 3 hours  
**Risk:** Medium (message parsing needs careful testing)

---

### Phase 3: Extension Integration

#### Task 3.1: Extension.ts Updates

**File:** `src/extension.ts`  
**Changes:** +30 lines

**Add Observer Client:**

```typescript
import { ObserverClient } from './providers/ObserverClient';

let observerClient: ObserverClient | null = null;

export function activate(context: vscode.ExtensionContext) {
  // ... existing activation code ...

  // Initialize observer client
  observerClient = new ObserverClient();

  // Wire observer events to tree provider
  observerClient.on('thought', (event) => {
    treeProvider.addObservedThought(event);
  });

  observerClient.on('connected', () => {
    outputChannel.appendLine('✓ Observer mode active - watching AI thinking');
    vscode.window.showInformationMessage('Observer mode active');
  });

  observerClient.on('disconnected', () => {
    outputChannel.appendLine('Observer mode disconnected');
  });

  observerClient.on('error', (err) => {
    outputChannel.appendLine(`Observer error: ${err.message}`);
  });

  // Auto-connect (fails silently if tapper not running)
  observerClient.connect();

  // Add to disposables
  context.subscriptions.push({
    dispose: () => {
      observerClient?.dispose();
    },
  });
}
```

**Estimated Time:** 1 hour  
**Risk:** Low

---

#### Task 3.2: TreeProvider Observer Support

**File:** `src/views/ThoughtTreeProvider.ts`  
**Changes:** Already completed in Phase 0 refactoring

**The observer support is built into the Phase 0 refactor, so this task merges with Phase 0.**

Key methods added in Phase 0:

- `addObservedThought(event: ThoughtEvent): void` - Adds thoughts from observer stream
- `clearObserverSession(): void` - Clears all observed thoughts
- `getObserverSessionHeader(): ThoughtTreeItem` - Creates session header
- `getThoughtsForSession(): ThoughtTreeItem[]` - Returns thought tree items

**Estimated Time:** Included in Phase 0  
**Risk:** Low

---

#### Task 3.3: Commands

**Optional:** Add commands for observer control

**File:** `src/commands/clearObserver.ts` (NEW)  
**Lines:** ~30

```typescript
export async function clearObserver(treeProvider: ThoughtTreeProvider) {
  const answer = await vscode.window.showWarningMessage(
    'Clear observer session? This will remove all observed thoughts.',
    'Clear',
    'Cancel'
  );

  if (answer === 'Clear') {
    treeProvider.clearObserverSession();
    vscode.window.showInformationMessage('Observer session cleared');
  }
}
```

**Register in package.json:**

```json
{
  "contributes": {
    "commands": [
      {
        "command": "sequential-thinking-vis.clearObserver",
        "title": "Clear Observer Session",
        "category": "MCP Sequential Thinking"
      }
    ],
    "menus": {
      "view/item/context": [
        {
          "command": "sequential-thinking-vis.clearObserver",
          "when": "viewItem == session-observer",
          "group": "inline"
        }
      ]
    }
  }
}
```

**Estimated Time:** 30 minutes  
**Risk:** Low

---

## Testing Strategy

### Unit Tests

#### Test Suite 1: Config Module

**File:** `test/suite/unit/config.test.ts`

```typescript
suite('Config Module', () => {
  test('should return platform-specific config dir', () => {
    const dir = getConfigDir();
    if (os.platform() === 'darwin') {
      assert.ok(dir.includes('Library/Application Support'));
    }
  });

  test('should create config dir if missing', () => {
    ensureConfigDir();
    assert.ok(fs.existsSync(getConfigDir()));
  });

  test('should write and read port atomically', () => {
    writePort(12345, process.pid);
    const port = readPort();
    assert.strictEqual(port, 12345);
  });

  test('should return null for missing port file', () => {
    removePortFile();
    const port = readPort();
    assert.strictEqual(port, null);
  });
});
```

#### Test Suite 2: ObserverClient

**File:** `test/suite/unit/ObserverClient.test.ts`

```typescript
suite('ObserverClient', () => {
  let mockTcpServer: net.Server;
  let testPort: number;

  setup((done) => {
    // Create mock TCP server
    mockTcpServer = net.createServer();
    mockTcpServer.listen(0, '127.0.0.1', () => {
      testPort = (mockTcpServer.address() as net.AddressInfo).port;
      writePort(testPort, process.pid);
      done();
    });
  });

  teardown(() => {
    mockTcpServer.close();
    removePortFile();
  });

  test('should connect to TCP socket', (done) => {
    const client = new ObserverClient();

    client.once('connected', () => {
      assert.ok(client.isConnected());
      client.dispose();
      done();
    });

    client.connect();
  });

  test('should parse newline-delimited JSON', (done) => {
    const client = new ObserverClient();

    mockTcpServer.once('connection', (socket) => {
      // Send test message
      socket.write(
        '{"method":"tools/call","params":{"name":"sequentialthinking","arguments":{"thought":"test","thoughtNumber":1,"totalThoughts":1,"nextThoughtNeeded":false}}}\n'
      );
    });

    client.once('thought', (event) => {
      assert.strictEqual(event.type, 'request');
      assert.strictEqual(event.data.thought, 'test');
      client.dispose();
      done();
    });

    client.connect();
  });

  test('should handle chunked messages', (done) => {
    const client = new ObserverClient();

    mockTcpServer.once('connection', (socket) => {
      // Send message in chunks
      socket.write('{"method":"tools/call","params":');
      setTimeout(() => {
        socket.write('{"name":"sequentialthinking","arguments":');
        setTimeout(() => {
          socket.write(
            '{"thought":"test","thoughtNumber":1,"totalThoughts":1,"nextThoughtNeeded":false}}}\n'
          );
        }, 10);
      }, 10);
    });

    client.once('thought', (event) => {
      assert.ok(event.data.thought);
      client.dispose();
      done();
    });

    client.connect();
  });

  test('should skip invalid JSON', (done) => {
    const client = new ObserverClient();

    mockTcpServer.once('connection', (socket) => {
      // Send invalid then valid
      socket.write('invalid json\n');
      socket.write(
        '{"method":"tools/call","params":{"name":"sequentialthinking","arguments":{"thought":"test","thoughtNumber":1,"totalThoughts":1,"nextThoughtNeeded":false}}}\n'
      );
    });

    client.once('thought', (event) => {
      // Should receive valid message despite invalid one
      assert.strictEqual(event.data.thought, 'test');
      client.dispose();
      done();
    });

    client.connect();
  });
});
```

#### Test Suite 3: TreeProvider Observer Session

**File:** `test/suite/unit/ThoughtTreeProvider.test.ts`

```typescript
suite('ThoughtTreeProvider - Observer Mode', () => {
  test('should display observer session', async () => {
    const provider = new ThoughtTreeProvider();

    // Add observer thought
    provider.addObservedThought({
      type: 'request',
      data: {
        thought: 'Observed thought',
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true,
      },
      timestamp: new Date().toISOString(),
    });

    const children = await provider.getChildren();
    assert.strictEqual(children.length, 1); // One session header
    assert.ok(children[0].label.includes('Live AI Observer'));
  });

  test('should show thoughts under session header', async () => {
    const provider = new ThoughtTreeProvider();

    provider.addObservedThought({
      type: 'request',
      data: { thought: 'First', thoughtNumber: 1, totalThoughts: 2, nextThoughtNeeded: true },
      timestamp: new Date().toISOString(),
    });

    provider.addObservedThought({
      type: 'request',
      data: { thought: 'Second', thoughtNumber: 2, totalThoughts: 2, nextThoughtNeeded: false },
      timestamp: new Date().toISOString(),
    });

    const sessionHeader = (await provider.getChildren())[0];
    const thoughts = await provider.getChildren(sessionHeader);

    assert.strictEqual(thoughts.length, 2);
    assert.ok(thoughts[0].label.includes('First'));
    assert.ok(thoughts[1].label.includes('Second'));
  });

  test('should clear observer session', async () => {
    const provider = new ThoughtTreeProvider();

    provider.addObservedThought({
      type: 'request',
      data: { thought: 'Test', thoughtNumber: 1, totalThoughts: 1, nextThoughtNeeded: false },
      timestamp: new Date().toISOString(),
    });

    assert.ok((await provider.getChildren()).length > 0, 'Should have session');

    provider.clearObserverSession();

    assert.strictEqual((await provider.getChildren()).length, 0, 'Should have no session');
  });

  test('should show empty state when no observer active', async () => {
    const provider = new ThoughtTreeProvider();

    const children = await provider.getChildren();
    assert.strictEqual(children.length, 0);
  });
});
```

### Integration Tests

#### Test Suite 4: Tapper Standalone

**File:** `test/suite/e2e/tapper.test.ts`

```typescript
suite('Tapper E2E', () => {
  test('should start and write port file', async () => {
    const tapper = spawn('node', ['out/mcp-server/index.js']);

    await sleep(1000);

    const port = readPort();
    assert.ok(port);
    assert.ok(port > 0);

    tapper.kill();
    removePortFile();
  });

  test('should forward stdio transparently', async () => {
    const tapper = spawn('node', ['out/mcp-server/index.js'], {
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    await sleep(1000);

    // Send request
    tapper.stdin.write('{"jsonrpc":"2.0","id":1,"method":"tools/list"}\n');

    // Read response
    const response = await readLineFromStream(tapper.stdout);
    const parsed = JSON.parse(response);

    assert.strictEqual(parsed.id, 1);
    assert.ok(parsed.result);

    tapper.kill();
  });

  test('should broadcast to TCP clients', async () => {
    const tapper = spawn('node', ['out/mcp-server/index.js'], {
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    await sleep(1000);

    const port = readPort();
    const socket = net.connect(port, '127.0.0.1');

    // Send request via stdin
    tapper.stdin.write('{"jsonrpc":"2.0","id":2,"method":"tools/list"}\n');

    // Receive response via TCP
    const response = await readLineFromStream(socket);
    const parsed = JSON.parse(response);

    assert.strictEqual(parsed.id, 2);

    socket.destroy();
    tapper.kill();
  });
});
```

#### Test Suite 5: Full Observer Flow

**File:** `test/suite/e2e/observer-flow.test.ts`

```typescript
suite('Observer Mode E2E', () => {
  let tapper: ChildProcess;
  let extension: vscode.Extension<any>;

  suiteSetup(async () => {
    // Start tapper
    tapper = spawn('node', ['out/mcp-server/index.js']);
    await sleep(1000);

    // Activate extension
    extension = vscode.extensions.getExtension('josephlamartina.sequential-thinking-vis')!;
    await extension.activate();
  });

  suiteTeardown(() => {
    tapper.kill();
    removePortFile();
  });

  test('should connect observer automatically', async () => {
    await sleep(2000); // Allow auto-connection

    // Verify tree view shows observer session (no thoughts yet)
    const treeView = vscode.window.createTreeView('sequential-thinking-thoughts', {
      treeDataProvider: getTreeProvider(),
    });

    // Extension should have connected
    // (Check via output channel or tree state)
  });

  test('should receive and display observed thoughts', async () => {
    // Simulate AI calling sequential-thinking
    const port = readPort();
    const socket = net.connect(port, '127.0.0.1');

    // Inject thought via tapper stdin (simulating AI tool)
    const request = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'sequentialthinking',
        arguments: {
          thought: 'Test thought from AI',
          thoughtNumber: 1,
          totalThoughts: 3,
          nextThoughtNeeded: true,
        },
      },
    };

    // Write to tapper (would normally come from AI tool)
    // This requires access to tapper's stdin - use helper script

    // Wait for tree update
    await sleep(500);

    // Verify thought appears in tree
    const provider = getTreeProvider();
    const sessions = await provider.getChildren();

    const observerSession = sessions.find((s) => s.label.includes('Observer'));
    assert.ok(observerSession);

    const thoughts = await provider.getChildren(observerSession);
    assert.strictEqual(thoughts.length, 1);
    assert.ok(thoughts[0].label.includes('Test thought'));

    socket.destroy();
  });
});
```

### Manual Testing

#### Checklist for Real-World Testing

**Prerequisites:**

- [ ] Extension compiled: `npm run compile`
- [ ] Claude Desktop or Cursor installed
- [ ] MCP configuration edited

**Test 1: Tapper Standalone**

```bash
# Terminal 1: Start tapper manually
node out/mcp-server/index.js

# Terminal 2: Verify port file
cat ~/Library/Application\ Support/sequential-thinking-vis/observer-port.txt

# Terminal 3: Connect and test
nc localhost <port>
{"jsonrpc":"2.0","id":1,"method":"tools/list"}
# Expect: Response with tools list
```

**Test 2: AI Tool Integration**

- [ ] Configure Claude Desktop to use tapper
- [ ] Restart Claude Desktop
- [ ] Open VS Code extension
- [ ] Verify "Observer mode active" message
- [ ] In Claude, ask: "Use sequential thinking to solve: What is 2+2?"
- [ ] Verify thoughts appear in VS Code tree view in real-time
- [ ] Check thought content matches Claude's thinking
- [ ] Verify thought numbers increment correctly
- [ ] Test with branching (ask complex question requiring exploration)

**Test 3: Error Handling**

- [ ] Start extension without tapper running
  - Expected: Extension activates, no error messages
  - Expected: "Observer not available" in output channel
- [ ] Start tapper after extension running
  - Expected: Auto-reconnects within 5 seconds
  - Expected: "Observer mode active" appears
- [ ] Kill tapper while observing
  - Expected: "Observer disconnected" message
  - Expected: Existing thoughts remain visible
- [ ] Restart tapper
  - Expected: Auto-reconnects
  - Expected: New observer session starts

**Test 4: Observer Session Management**

- [ ] Start observer (tapper running)
- [ ] Use AI tool to generate thoughts
- [ ] Verify observer session appears with thoughts
- [ ] Use "Clear Observer Session" command
- [ ] Verify session is cleared
- [ ] Use AI tool again
- [ ] Verify new observer session starts

**Test 5: Performance**

- [ ] Use AI tool for complex question (expect 50+ thoughts)
- [ ] Verify tree view remains responsive
- [ ] Check memory usage (should be < 100MB)
- [ ] Verify no lag in AI tool's responses

**Test 6: Cross-Platform**

- [ ] Test on macOS
- [ ] Test on Windows
- [ ] Test on Linux
- [ ] Verify config paths are correct
- [ ] Verify port discovery works
- [ ] Verify TCP connections work

---

## Risk Analysis and Mitigation

### Risk Matrix

| Risk                     | Probability | Impact | Mitigation                                               | Status           |
| ------------------------ | ----------- | ------ | -------------------------------------------------------- | ---------------- |
| Tapper causes AI lag     | Medium      | High   | Non-blocking socket writes, error handling               | ✅ Designed      |
| Message parsing fails    | Medium      | Medium | Robust error handling, skip invalid messages             | ✅ Designed      |
| Port conflicts           | Low         | Medium | OS-assigned ports, include PID for validation            | ✅ Designed      |
| Cross-platform issues    | Medium      | High   | Use Node.js built-ins, test on all platforms             | ⏳ Needs testing |
| TreeProvider performance | Low         | Medium | Consider pagination if > 1000 thoughts                   | ⏳ Monitor       |
| npx reliability          | Low         | High   | Use `-y` flag for auto-accept, fallback to local install | ✅ Designed      |
| Stale port files         | Medium      | Low    | Include timestamp and PID, validate on read              | ✅ Designed      |

### Critical Path Items

**Must Have for V1:**

1. ✅ Transparent stdio forwarding (zero AI tool impact)
2. ✅ Robust message parsing (handles chunked/invalid JSON)
3. ✅ Auto-reconnection (graceful handling of disconnects)
4. ✅ Multiple session support in TreeView
5. ⏳ Cross-platform compatibility (test all OSes)

**Nice to Have for V1:**

- Session recording/export
- Observer session history
- Thought search
- Performance metrics

**Future Enhancements:**

- Multiple AI tools simultaneously
- Remote observation (network-based)
- Graph visualization of branches
- Collaborative viewing

---

## Documentation Updates

### User Documentation

#### Setup Guide

**File:** `docs/OBSERVER-MODE-SETUP.md` (NEW)

**Contents:**

1. What is Observer Mode?
2. Installation prerequisites
3. Step-by-step AI tool configuration
   - Claude Desktop
   - Cursor
   - Other MCP-compatible tools
4. Verifying setup
5. Troubleshooting

#### Usage Guide

**File:** `docs/OBSERVER-MODE-USAGE.md` (NEW)

**Contents:**

1. Starting observer mode
2. Viewing live thoughts
3. Managing sessions
4. Clearing observer data
5. Performance considerations

### Developer Documentation

#### Architecture Document

**File:** `docs/OBSERVER-MODE-ARCHITECTURE.md` (NEW)

**Contents:**

1. System design
2. Component interaction
3. Message flow diagrams
4. Extension points
5. Testing strategy

### README Updates

**File:** `README.md`

**Add Section:**

```markdown
## Observer Mode 🔴

Watch real-time AI thinking as it happens! Configure your AI tool (Claude Desktop, Cursor, etc.) to use our stream tapper, and see sequential thinking visualized in real-time.

[Setup Guide](docs/OBSERVER-MODE-SETUP.md) | [Usage Guide](docs/OBSERVER-MODE-USAGE.md)
```

### CHANGELOG Updates

**File:** `CHANGELOG.md`

```markdown
## [Unreleased]

### Added

- **Observer Mode**: Real-time visualization of AI thinking via stream tapper
- Stream tapper proxy for transparent MCP monitoring
- Observer session visualization in Tree View
- Auto-reconnection for observer connections
- Platform-specific configuration management
- `clearObserver` command for clearing observed thoughts

### Changed

- TreeProvider refactored to observer-only mode (removed manual session support)
- Extension auto-connects to observer when tapper detected

### Technical

- New `ObserverClient` class for TCP stream monitoring
- New `config` module for cross-platform paths
- Enhanced TreeView with session headers
```

---

## Timeline and Estimates

### Revised Estimates

| Phase              | Task                          | Hours | Dependencies   |
| ------------------ | ----------------------------- | ----- | -------------- |
| **Phase 0**        | TreeProvider Refactoring      | 3     | None           |
|                    | - Remove MCPClient dependency | 1     |                |
|                    | - Observer-only data model    | 1     |                |
|                    | - Test updates                | 1     |                |
| **Phase 1**        | Config Module                 | 1     | None           |
|                    | Stream Tapper                 | 2     | Config         |
|                    | Testing (unit)                | 1     | Both           |
| **Phase 2**        | ObserverClient                | 3     | Config         |
|                    | Testing (unit)                | 1     | ObserverClient |
| **Phase 3**        | Extension Integration         | 1     | All above      |
|                    | Commands (clear observer)     | 0.5   | Integration    |
|                    | Testing (integration)         | 1.5   | All            |
| **Documentation**  | Setup guides                  | 1     | Phase 3        |
|                    | Architecture docs             | 0.5   | Phase 3        |
|                    | README/CHANGELOG              | 0.5   | All            |
| **Manual Testing** | Cross-platform testing        | 2     | All            |
|                    | Real AI tool testing          | 1     | All            |

**Total: 20 hours** (was 10 hours in original estimate, reduced from 22 with observer-only simplification)

**Breakdown:**

- **Phase 0 (Refactoring):** 3 hours
- **Phase 1 (Infrastructure):** 4 hours
- **Phase 2 (Observer Client):** 4 hours
- **Phase 3 (Integration):** 3 hours
- **Documentation:** 2 hours
- **Testing:** 4 hours

**Realistic Timeline:**

- **Week 1, Days 1-2:** Phase 0 (TreeProvider refactoring to observer-only)
- **Week 1, Days 3-5:** Phase 1 (Config + Tapper infrastructure)
- **Week 2, Days 1-3:** Phase 2 (ObserverClient implementation)
- **Week 2, Days 4-5:** Phase 3 (Extension integration)
- **Week 3:** Testing (unit, integration, e2e, cross-platform)
- **Week 4:** Documentation, polish, manual testing with real AI tools

---

## Success Criteria

### Functional Requirements

- [x] Architecture designed ✅
- [ ] Phase 0: TreeProvider refactored to observer-only mode
- [ ] Phase 1: Tapper forwards stdio transparently (verified with echo test)
- [ ] Phase 1: Config module manages platform-specific paths
- [ ] Phase 2: ObserverClient parses JSON-RPC correctly
- [ ] Phase 2: ObserverClient auto-reconnects on disconnect
- [ ] Phase 3: Extension auto-connects to observer on startup
- [ ] Phase 3: Thoughts appear in tree view in real-time
- [ ] Phase 3: Clear observer command works correctly

### Non-Functional Requirements

- [ ] **Zero impact on AI tool:** Response time unchanged with tapper
- [ ] **Robust parsing:** Handles chunked, malformed, and edge-case JSON
- [ ] **Cross-platform:** Works on macOS, Windows, Linux
- [ ] **Graceful degradation:** Extension works without observer
- [ ] **Performance:** Tree view responsive with 500+ thoughts
- [ ] **Auto-recovery:** Reconnects after tapper restart

### Quality Requirements

- [ ] **Code coverage:** >80% for new code
- [ ] **Documentation:** Complete user and developer guides
- [ ] **Testing:** All unit and integration tests pass
- [ ] **Manual testing:** Real-world validation with Claude/Cursor
- [ ] **Code review:** Passes quality standards checklist

---

## Next Steps

1. **Review this plan** with stakeholders
2. **Approve Phase 0** breaking changes (TreeProvider refactoring)
3. **Create feature branch:** `feat/observer-mode`
4. **Set up project board** with tasks from this plan
5. **Begin Phase 0** implementation
6. **Schedule cross-platform testing** (identify Windows/Linux machines)

---

## Questions and Decisions

### Open Questions

_None at this time - all major decisions have been made._

### Resolved Decisions

| Decision                  | Option Chosen                        | Rationale                                        |
| ------------------------- | ------------------------------------ | ------------------------------------------------ |
| Extension Mode            | **Observer-only**                    | Focus on watching AI think, not manual sessions  |
| TreeProvider Architecture | Single observer session              | Simpler implementation, matches current behavior |
| IPC Method                | TCP socket (localhost)               | Cross-platform, fast, reliable                   |
| Port Discovery            | File with JSON (port + PID)          | Atomic writes, validation support                |
| Message Parsing           | Extension (not tapper)               | Keeps tapper simple and bulletproof              |
| Auto-Connection           | Yes (with retry)                     | Better UX, fails gracefully                      |
| Server Version            | Pinned major (^1.0.0)                | Balance updates and stability                    |
| Session Persistence       | **Not in V1**                        | Future enhancement after basic functionality     |
| Multiple Observers        | **Not in V1** (single tapper)        | One port file = one tapper; add session IDs v2   |
| Thought Limit             | Monitor, paginate if needed          | Not a V1 blocker; handle if performance issues   |
| Observer Mode Toggle      | **Auto-enable** when tapper detected | Always on if available; best UX                  |
| npx vs Global Install     | npx default, allow `npm install -g`  | Convenience while supporting both methods        |
| Session Management        | Single live session + clear command  | Accumulate thoughts, manual clear when needed    |

---

## Appendix

### A. Platform-Specific Details

#### macOS

- Config dir: `~/Library/Application Support/sequential-thinking-vis/`
- Permissions: Usually no issues
- TCP: Loopback always available
- Testing: Primary development platform

#### Windows

- Config dir: `%APPDATA%\sequential-thinking-vis\`
- Permissions: May need UAC for port file
- TCP: Check firewall rules (localhost should be allowed)
- Testing: Requires Windows VM or machine

#### Linux

- Config dir: `~/.config/sequential-thinking-vis/`
- Permissions: Usually no issues
- TCP: Loopback always available
- Testing: Can use Docker or WSL

### B. Dependencies

**Runtime Dependencies:**

- `@modelcontextprotocol/sdk` (existing)
- Node.js built-ins: `net`, `child_process`, `fs`, `os`, `path`

**No New npm Packages Required!** ✅

**External Dependencies:**

- `@modelcontextprotocol/server-sequential-thinking` (via npx)
- AI tool with MCP support (Claude Desktop, Cursor, etc.)

### C. File Size Estimates

```
src/mcp-server/
  config.ts          ~100 lines (NEW)
  index.ts           ~70 lines (NEW - tapper)

src/providers/
  ObserverClient.ts  ~120 lines (NEW)

src/views/
  ThoughtTreeProvider.ts  ~60 lines changed (observer-only refactor)

src/commands/
  clearObserver.ts   ~30 lines (NEW - optional)

src/extension.ts     ~30 lines added (observer integration)

test/suite/unit/
  config.test.ts             ~80 lines (NEW)
  ObserverClient.test.ts     ~150 lines (NEW)
  ThoughtTreeProvider.test.ts ~100 lines (NEW)

test/suite/e2e/
  tapper.test.ts            ~120 lines (NEW)
  observer-flow.test.ts     ~80 lines (NEW)

docs/
  OBSERVER-MODE-SETUP.md        ~200 lines (NEW)
  OBSERVER-MODE-USAGE.md        ~150 lines (NEW)
  OBSERVER-MODE-ARCHITECTURE.md ~250 lines (NEW)

Total New/Changed Lines: ~1,540
Total New Files: ~11
Total Changed Files: 2 (ThoughtTreeProvider.ts, extension.ts)
```

### D. References

- [Model Context Protocol Specification](https://modelcontextprotocol.io/docs)
- [VS Code Extension API - TreeView](https://code.visualstudio.com/api/extension-guides/tree-view)
- [Node.js Net Module](https://nodejs.org/api/net.html)
- [JSON-RPC 2.0 Specification](https://www.jsonrpc.org/specification)

---

## Document Changelog

| Date       | Version | Changes                                                                    |
| ---------- | ------- | -------------------------------------------------------------------------- |
| 2025-10-25 | 1.0     | Initial detailed implementation plan based on sequential thinking analysis |

---

**Status:** ✅ Ready for Implementation  
**Approval Required:** Phase 0 breaking changes  
**Next Review:** After Phase 0 completion
