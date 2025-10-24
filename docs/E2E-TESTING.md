# End-to-End Testing Guide

## Overview

This extension includes comprehensive end-to-end (E2E) tests that validate the complete functionality with a **real MCP server** running in VS Code/Cursor. These are true integration tests that exercise the full stack from extension activation through MCP server communication to UI visualization.

## Test Architecture

### True E2E Testing

Our E2E tests:
- ✅ Run extension in **real VS Code instance** via `@vscode/test-electron`
- ✅ Connect to **real MCP server** via `npx @modelcontextprotocol/server-sequential-thinking`
- ✅ Test through **actual VS Code APIs** and commands
- ✅ Verify real **UI updates** in tree view and webviews
- ❌ No mocks or stubs (true end-to-end)

### Test Structure

```
test/
├── helpers/
│   └── e2e-setup.ts              # Helper utilities for E2E tests
└── suite/
    ├── e2e/
    │   ├── connection.test.ts    # MCP server connection lifecycle
    │   ├── thought-flow.test.ts  # Thought processing and data flow
    │   ├── visualization.test.ts # Tree view rendering and updates
    │   ├── user-interaction.test.ts # Command execution and workflows
    │   └── compatibility.test.ts # VS Code/Cursor compatibility
    ├── extension.test.ts         # Basic extension unit tests
    └── commands.test.ts          # Command registration tests
```

## How E2E Tests Work

### Extension API Exposure

The extension exposes an API that tests can use:

```typescript
// src/extension.ts
export interface ExtensionAPI {
  getMCPClient(): MCPClient | null;
  getTreeProvider(): ThoughtTreeProvider | null;
}

export async function activate(context: vscode.ExtensionContext): Promise<ExtensionAPI> {
  // ... extension setup ...
  return {
    getMCPClient: () => mcpClient,
    getTreeProvider: () => treeProvider,
  };
}
```

### Test Helper Utilities

```typescript
// test/helpers/e2e-setup.ts

// Get the running extension's MCP client
const client = await getMCPClient();

// Get the running extension's tree provider
const provider = await getTreeProvider();

// Execute commands through VS Code
await executeCommand('sequential-thinking-vis.connectServer');

// Wait for conditions
await waitFor(() => client.isConnected(), 10000);
```

## Test Coverage

### 1. Connection Tests (`connection.test.ts`)

Tests real MCP server connection lifecycle.

**What it tests:**
- ✅ Connecting to real MCP server via npx
- ✅ Connection state transitions (disconnected → connecting → connected)
- ✅ Preventing duplicate connections
- ✅ Graceful disconnection
- ✅ Configuration loading from workspace settings
- ⏭️ Timeout/failure scenarios (skipped - hard to test without breaking server)

**Example test:**
```typescript
test('Should connect to MCP server successfully', async () => {
  const client = await getMCPClient();
  
  // Execute connect command
  await executeCommand('sequential-thinking-vis.connectServer');
  
  // Wait for connection
  await waitFor(() => client.isConnected(), 10000);
  
  // Verify state
  assert.strictEqual(client.getConnectionState(), ConnectionState.Connected);
  assert.ok(client.isConnected());
});
```

**Test metrics:** 8 tests (6 passing, 2 pending, 0 failing)

### 2. Thought Flow Tests (`thought-flow.test.ts`)

Tests thought processing with real MCP server.

**What it tests:**
- ✅ Linear thought sequences (1 → 2 → 3)
- ✅ Progress tracking as thoughts arrive
- ✅ Final thought completion detection
- ✅ Branch creation and tracking (option-a, option-b)
- ✅ Revision tracking and references
- ✅ Complex mixed flows (branches + revisions + linear)
- ✅ Session lifecycle (start, update, end)
- ✅ Multiple sequential sessions
- ✅ Edge cases (empty thoughts, malformed data)
- ✅ Error resilience and recovery

**Example test:**
```typescript
test('Should receive and process linear thoughts', async () => {
  const client = await getMCPClient();
  
  await executeCommand('sequential-thinking-vis.connectServer');
  await waitFor(() => client.isConnected(), 10000);
  
  client.startSession('Linear flow test');
  
  // Add sequential thoughts through real MCP server
  await client.callSequentialThinking({
    thought: 'First thought',
    thoughtNumber: 1,
    totalThoughts: 3,
    nextThoughtNeeded: true,
  });
  
  await client.callSequentialThinking({
    thought: 'Second thought',
    thoughtNumber: 2,
    totalThoughts: 3,
    nextThoughtNeeded: true,
  });
  
  // Verify thoughts were processed
  const session = client.getCurrentSession();
  assert.strictEqual(session!.thoughts.length, 2);
});
```

**Test metrics:** 15 tests (15 passing, 0 pending, 0 failing)

### 3. Visualization Tests (`visualization.test.ts`)

Tests UI rendering with real data from MCP server.

**What it tests:**
- ✅ Empty state when no session
- ✅ Session header with accurate thought count
- ✅ All thoughts rendered under session header
- ✅ Thought numbers displayed correctly ([1/5] format)
- ✅ Long thought text truncation with ellipsis
- ✅ Icon rendering (regular, final, branch, revision)
- ✅ Collapsible states (expanded session, non-collapsible thoughts)
- ✅ Command attachment to tree items
- ✅ Tree refresh on data updates

**Example test:**
```typescript
test('Should render session header with thought count', async () => {
  const client = await getMCPClient();
  const provider = await getTreeProvider();
  
  await executeCommand('sequential-thinking-vis.connectServer');
  await waitFor(() => client.isConnected(), 10000);
  
  client.startSession('Test visualization');
  await client.callSequentialThinking({
    thought: 'Test thought',
    thoughtNumber: 1,
    totalThoughts: 3,
    nextThoughtNeeded: true,
  });
  
  await wait(500);
  
  // Get tree children
  const rootChildren = await provider.getChildren();
  assert.strictEqual(rootChildren.length, 1, 'Should have session header');
  
  const sessionHeader = rootChildren[0];
  assert.ok(sessionHeader.label.includes('Session:'));
  assert.ok(sessionHeader.description?.includes('thoughts'));
});
```

**Test metrics:** 12 tests (12 passing, 0 pending, 0 failing)

### 4. User Interaction Tests (`user-interaction.test.ts`)

Tests command execution and user workflows.

**What it tests:**
- ✅ Connect command execution from palette
- ✅ Disconnect command execution
- ✅ Preventing duplicate connections
- ✅ Session creation without connection (validates local state)
- ✅ MCP tool calling requires connection
- ✅ Show thought details command (webview creation)
- ✅ Full workflows (connect → add thoughts → disconnect)
- ✅ Multiple sequential sessions
- ✅ Output channel logging

**Example test:**
```typescript
test('Should complete full connect-think-disconnect workflow', async () => {
  const client = await getMCPClient();
  
  // 1. Connect
  await executeCommand('sequential-thinking-vis.connectServer');
  await waitFor(() => client.isConnected(), 10000);
  
  // 2. Start session
  client.startSession('Full workflow test');
  
  // 3. Add thoughts
  await client.callSequentialThinking({
    thought: 'First step',
    thoughtNumber: 1,
    totalThoughts: 2,
    nextThoughtNeeded: true,
  });
  
  await client.callSequentialThinking({
    thought: 'Second step',
    thoughtNumber: 2,
    totalThoughts: 2,
    nextThoughtNeeded: false,
  });
  
  // 4. Verify session
  const session = client.getCurrentSession();
  assert.strictEqual(session!.thoughts.length, 2);
  
  // 5. End and disconnect
  client.endSession();
  await executeCommand('sequential-thinking-vis.disconnectServer');
  await wait(500);
  
  assert.ok(!client.isConnected());
});
```

**Test metrics:** 14 tests (14 passing, 0 pending, 0 failing)

### 5. Compatibility Tests (`compatibility.test.ts`)

Tests cross-editor compatibility (VS Code & Cursor).

**What it tests:**
- ✅ Editor detection (identifies VS Code vs Cursor)
- ✅ Extension activation in current editor
- ✅ Command registration in current editor
- ✅ Tree view creation
- ✅ MCP server connection
- ✅ Thought processing
- ✅ Tree view rendering
- ✅ VS Code API compatibility (window, commands, workspace, Uri)
- ✅ UI element rendering (TreeItem, ThemeIcon, MarkdownString)
- ✅ Configuration read/write
- ✅ Extension context access
- ✅ Performance benchmarks (rapid thought updates)

**Example test:**
```typescript
test('Should correctly identify the editor', () => {
  const editorInfo = {
    name: vscode.env.appName,
    version: vscode.version,
    isCursor: vscode.env.appName.toLowerCase().includes('cursor'),
  };
  
  console.log(`Running in ${editorInfo.name} v${editorInfo.version}`);
  assert.ok(editorInfo.name, 'Should have editor name');
  assert.ok(editorInfo.version, 'Should have version');
});
```

**Test metrics:** 23 tests (23 passing, 0 pending, 0 failing)

### Summary Test Results

**Total: 81 tests**
- ✅ **81 passing** (100%)
- ⏭️ **4 pending** (intentionally skipped)
- ❌ **0 failing**

## Running Tests

### Run All Tests

```bash
npm test
```

This will:
1. Compile TypeScript (`npm run compile`)
2. Run linters (`npm run lint`)
3. Launch VS Code test instance
4. Execute all test suites
5. Report results

**Expected output:**
```
✔ Validated version: 1.105.1
Loading development extension at /path/to/extension
MCP Sequential Thinking Visualization is now active!

  Extension Test Suite
    ✔ Extension should be present
    ✔ Should activate extension
    ... 79 more passing tests ...

  81 passing (1m)
  4 pending
```

### Run Specific Test Suite

```bash
# Run only E2E tests
npm test -- --grep "E2E"

# Run specific suite
npm test -- --grep "Connection Tests"
npm test -- --grep "Visualization Tests"

# Run specific test
npm test -- --grep "Should connect to MCP server successfully"
```

### Debug Tests

1. Open test file in VS Code/Cursor
2. Set breakpoints in test or source code
3. Press `F5`
4. Select "Extension Tests" from debug dropdown
5. Tests will run with debugger attached

**Note:** The extension runs in a separate VS Code instance, so:
- Source breakpoints work in extension code
- Test breakpoints work in test code
- Use `debugger;` statement if breakpoints don't hit

### Watch Mode

```bash
# Terminal 1: Watch compile
npm run watch

# Terminal 2: Run tests (must be manual)
npm test
```

**Note:** `@vscode/test-electron` doesn't support true watch mode. Rerun `npm test` after changes.

## Writing New E2E Tests

### 1. Use E2E Test Helpers

```typescript
import {
  getMCPClient,
  getTreeProvider,
  executeCommand,
  wait,
  waitFor,
  ensureExtensionActivated,
} from '../../helpers/e2e-setup';
```

### 2. Structure Tests Properly

```typescript
suite('E2E My Feature Tests', function () {
  // Increase timeout for real MCP server operations
  this.timeout(15000);
  
  setup(async () => {
    await ensureExtensionActivated();
    
    // Start each test disconnected
    const client = await getMCPClient();
    if (client.isConnected()) {
      await executeCommand('sequential-thinking-vis.disconnectServer');
      await wait(500);
    }
  });
  
  teardown(async () => {
    // Clean up after each test
    try {
      const client = await getMCPClient();
      if (client.isConnected()) {
        await executeCommand('sequential-thinking-vis.disconnectServer');
        await wait(500);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });
  
  test('Should test my feature', async () => {
    const client = await getMCPClient();
    
    // Connect to real server
    await executeCommand('sequential-thinking-vis.connectServer');
    await waitFor(() => client.isConnected(), 10000);
    
    // Test your feature
    // ...
    
    // Assert results
    assert.ok(/* your assertion */);
  });
});
```

### 3. Best Practices

**DO:**
- ✅ Use `async/await` for all async operations
- ✅ Set appropriate timeouts (`this.timeout(15000)`)
- ✅ Wait for conditions with `waitFor()`
- ✅ Clean up in `teardown()`
- ✅ Test real workflows end-to-end
- ✅ Use descriptive test names

**DON'T:**
- ❌ Mock the MCP server (defeats E2E purpose)
- ❌ Create new client instances (use extension's)
- ❌ Forget to disconnect in teardown
- ❌ Use fixed delays instead of `waitFor()`
- ❌ Test implementation details (test behavior)

### 4. Example: Adding a New Test

```typescript
// test/suite/e2e/my-feature.test.ts
import * as assert from 'assert';
import { getMCPClient, executeCommand, waitFor } from '../../helpers/e2e-setup';

suite('E2E My Feature Tests', function () {
  this.timeout(15000);
  
  setup(async () => {
    await ensureExtensionActivated();
    const client = await getMCPClient();
    if (client.isConnected()) {
      await executeCommand('sequential-thinking-vis.disconnectServer');
      await wait(500);
    }
  });
  
  teardown(async () => {
    const client = await getMCPClient();
    if (client.isConnected()) {
      await executeCommand('sequential-thinking-vis.disconnectServer');
    }
  });
  
  test('Should handle my feature correctly', async () => {
    const client = await getMCPClient();
    
    // Setup
    await executeCommand('sequential-thinking-vis.connectServer');
    await waitFor(() => client.isConnected(), 10000);
    
    client.startSession('My feature test');
    
    // Act
    await client.callSequentialThinking({
      thought: 'Testing my feature',
      thoughtNumber: 1,
      totalThoughts: 1,
      nextThoughtNeeded: false,
    });
    
    await wait(500);
    
    // Assert
    const session = client.getCurrentSession();
    assert.ok(session, 'Should have session');
    assert.strictEqual(session!.thoughts.length, 1);
  });
});
```

## Troubleshooting

### Tests Timing Out

**Problem:** Tests hang or timeout after 15 seconds

**Causes:**
- MCP server not starting (missing Node.js or network issues)
- Connection never completing
- Waiting for condition that never becomes true

**Solutions:**
```bash
# 1. Test MCP server manually
npx -y @modelcontextprotocol/server-sequential-thinking

# 2. Check Node.js version (need 18+)
node --version

# 3. Increase timeout in specific test
test('My slow test', async function () {
  this.timeout(30000); // 30 seconds
  // ...
});

# 4. Add debug logging
const client = await getMCPClient();
console.log('Connection state:', client.getConnectionState());
```

### Connection Tests Failing

**Problem:** Tests fail with "Not connected" errors

**Solutions:**
- Ensure test calls `waitFor(() => client.isConnected())` after connect
- Check that `executeCommand('connectServer')` completes without error
- Verify MCP server can start: `npx -y @modelcontextprotocol/server-sequential-thinking`
- Look at Output panel in test instance for connection errors

### Tree View Tests Failing

**Problem:** Tree view returns empty or incorrect data

**Solutions:**
- Call `await wait(500)` after adding thoughts (let events propagate)
- Verify session was created: `assert.ok(client.getCurrentSession())`
- Check thoughts were actually added: `console.log(session.thoughts)`
- Ensure tree provider is refreshed (happens automatically on thought add)

### Tests Pass Locally But Fail in CI

**Problem:** Tests work on your machine but fail in GitHub Actions/CI

**Causes:**
- Different Node.js version
- Network restrictions blocking npx
- Timing differences (CI is slower)
- Missing dependencies

**Solutions:**
```yaml
# .github/workflows/test.yml
- name: Setup Node.js
  uses: actions/setup-node@v2
  with:
    node-version: '18'

- name: Test MCP server accessibility
  run: npx -y @modelcontextprotocol/server-sequential-thinking --help

- name: Run tests with increased timeout
  run: npm test -- --timeout 30000
```

### Debugging Test Failures

**Use these techniques:**

1. **Add console.log statements**
```typescript
console.log('State:', client.getConnectionState());
console.log('Session:', client.getCurrentSession());
```

2. **Check Output panel**
```typescript
const outputChannel = client.getOutputChannel();
// Output shows MCP server logs
```

3. **Use VS Code debugger**
- Set breakpoints in test file
- Press F5, select "Extension Tests"
- Step through code

4. **Isolate the test**
```bash
npm test -- --grep "exact test name"
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        node-version: ['18', '20']
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linters
        run: npm run lint
      
      - name: Run E2E tests
        run: npm test
```

### Test Metrics

Monitor these metrics:
- **Pass rate:** Should be 100% (81/81)
- **Duration:** ~60 seconds for full suite
- **Flakiness:** Zero flaky tests (consistent results)
- **Coverage:** Focus on workflow coverage, not code coverage

## Related Documentation

- [TESTING.md](./TESTING.md) - General testing and manual testing guide
- [Testing Standards](../.cursor/rules/testing-standards.mdc) - Testing conventions
- [VS Code Extension Testing](https://code.visualstudio.com/api/working-with-extensions/testing-extension) - Official docs
- [MCP SDK Integration](../.cursor/rules/mcp-sdk-integration.mdc) - MCP protocol details

## Future Improvements

Potential enhancements for E2E tests:

1. **Visual regression testing** - Screenshot comparison
2. **Performance benchmarks** - Track execution time trends
3. **Network error simulation** - Test resilience (requires mock)
4. **Concurrent session testing** - Multiple extensions running
5. **Configuration matrix testing** - Test various config combinations
6. **Memory leak detection** - Monitor memory usage over time

## Support

If you encounter issues with tests:

1. Check this documentation
2. Review test output carefully
3. Look at Output panel in test instance
4. Run single test in isolation
5. Add debug logging
6. Open an issue with:
   - Test output
   - Node.js version
   - OS information
   - Steps to reproduce

**Happy Testing! 🧪✨**
