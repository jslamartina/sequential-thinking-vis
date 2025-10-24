# Testing Guide

Comprehensive testing guide for the MCP Sequential Thinking Visualization extension.

> 🔧 **Developer Setup**: See [README-DEV.md](../README-DEV.md) for development environment setup  
> 📖 **User Guide**: See [README.md](../README.md) for basic usage instructions

## Table of Contents

1. [Quick Start](#quick-start)
2. [Manual Testing](#manual-testing)
3. [Testing Scenarios](#testing-scenarios)
4. [Troubleshooting](#troubleshooting)
5. [Automated Testing](#automated-testing)

## Quick Start

### Prerequisites

- Node.js 18+ installed
- VS Code or Cursor IDE
- Project dependencies installed (`npm install`)
- Code compiled (`npm run compile`)

### 5-Minute Test

```bash
1. Press F5 in VS Code/Cursor
2. In Extension Development Host:
   - Cmd+Shift+P → "MCP Sequential Thinking: Connect to Server"
   - Cmd+Shift+P → "MCP Sequential Thinking: Start New Session"
   - Enter: "Test session"
   - Thought 1: "First test thought"
   - Select: "Yes" (more thoughts needed)
   - Select: "None" (not special)
   - Thought 2: "Second test thought"
   - Select: "No" (complete)
3. Verify tree view shows 2 thoughts
4. Click a thought to view details
✅ Success!
```

## Manual Testing

### 1. Extension Activation

**Test:** Extension loads and activates correctly

**Steps:**

1. Press F5 to launch Extension Development Host
2. Check Extension Host window opens
3. Look for brain icon (🧠) in activity bar

**Expected:**

- Extension Development Host window opens
- No error notifications
- Brain icon appears in activity bar
- Console shows "Extension activated" in Output panel

**Verify:**

- `View > Output` → Select "MCP Sequential Thinking"
- Should see: "Extension activated"

---

### 2. MCP Server Connection

**Test:** Can connect to MCP server successfully

**Steps:**

1. Open Command Palette (`Cmd+Shift+P`)
2. Type "MCP Sequential"
3. Select "MCP Sequential Thinking: Connect to Server"
4. Wait for progress notification

**Expected:**

- Progress notification shows "Connecting to MCP Sequential Thinking Server"
- Success notification: "✓ Connected to MCP Sequential Thinking Server"
- Output panel shows:
  ```
  Connecting to MCP server...
  Starting MCP server: npx -y @modelcontextprotocol/server-sequential-thinking
  ✓ Connected to MCP server
  Available tools: sequentialthinking
  ```

**Common Issues:**

- If connection fails, check Node.js version: `node --version` (need 18+)
- Try manually: `npx -y @modelcontextprotocol/server-sequential-thinking`

---

### 3. Session Creation

**Test:** Can create a new thinking session

**Steps:**

1. Ensure connected to server
2. Command Palette → "MCP Sequential Thinking: Start New Session"
3. Enter query: "How to build a REST API"
4. Enter first thought
5. Choose to continue
6. Enter second thought
7. Choose to finish

**Expected:**

- Input box prompts for query
- Input box prompts for each thought
- Quick pick for continuation choice
- Success message on completion
- Thoughts appear in tree view

**Verify Tree View:**

- Click brain icon in activity bar
- Should see:
  ```
  Session: How to build a REST API (2 thoughts)
  ├─ [1/2] First thought preview...
  └─ [2/2] Second thought preview...
  ```

---

### 4. Thought Details Webview

**Test:** Can view detailed thought information

**Steps:**

1. Complete a session with at least one thought
2. Click on a thought in the tree view

**Expected:**

- Webview panel opens on the right
- Shows:
  - Thought number (e.g., "Thought 1 of 2")
  - Full thought content
  - Progress bar/indicator
  - Timestamp
  - Metadata section

**Verify:**

- Content is properly escaped (no XSS)
- VS Code theme colors applied
- Badges show for special types

---

### 5. Thought Revisions

**Test:** Can create revision thoughts

**Steps:**

1. Start new session
2. Add thought 1
3. Add thought 2
4. For thought 3, select "This revises a previous thought"
5. Enter "1" as thought to revise
6. Complete session

**Expected:**

- Thought 3 shows revision icon (🔄)
- Tooltip shows "Revises #1"
- Webview shows revision badge
- Output panel logs revision

**Verify Tree View:**

```
├─ [1/3] Original thought
├─ [2/3] Second thought
└─ [3/3] Revised thinking... ↻ Revises #1
```

---

### 6. Thought Branches

**Test:** Can create branching thoughts

**Steps:**

1. Start new session
2. Add thoughts 1 and 2
3. For thought 3, select "This creates a branch"
4. Enter branch ID: "option-a"
5. Enter branching point: "2"
6. Continue with more thoughts

**Expected:**

- Thought 3 shows branch icon (🌿)
- Tooltip shows "Branch: option-a (from #2)"
- Webview shows branch badge
- Tree view shows branch identifier

---

### 7. Dynamic Thought Estimation

**Test:** Can adjust total thoughts estimate

**Steps:**

1. Start session with initial estimate
2. Add several thoughts
3. Select "Need more thoughts than estimated"
4. Enter new total (e.g., 10 instead of 5)
5. Continue session

**Expected:**

- Progress updates (e.g., 5/10 instead of 5/5)
- No errors or crashes
- Tree view shows updated total
- Can complete beyond original estimate

---

### 8. Session Completion

**Test:** Session ends properly

**Steps:**

1. Start session
2. Add thoughts
3. For final thought, select "No" (no more needed)

**Expected:**

- Success notification: "✓ Sequential thinking session completed!"
- Output panel shows:
  ```
  === Ended session: session-xxx ===
  Total thoughts: N
  ```
- Tree view shows complete session

---

### 9. Multiple Sessions

**Test:** Can create multiple sessions sequentially

**Steps:**

1. Complete session 1
2. Start session 2 with different query
3. Add thoughts to session 2

**Expected:**

- Session 1 data is cleared (current limitation)
- Session 2 appears in tree view
- No crashes or data corruption
- Output panel shows both session logs

---

### 10. Disconnection

**Test:** Can disconnect from server

**Steps:**

1. Connect to server
2. Command Palette → "MCP Sequential Thinking: Disconnect from Server"

**Expected:**

- Success notification: "✓ Disconnected from MCP server"
- Output panel shows "Disconnecting..." and "✓ Disconnected"
- Can reconnect without issues

---

## Testing Scenarios

### Scenario A: Simple Linear Thinking

**Goal:** Test basic sequential thought flow

```
Query: "How do I deploy a Node.js app?"
Thought 1: "First, choose a hosting platform (Heroku, AWS, DigitalOcean)"
Thought 2: "Heroku is simplest for getting started"
Thought 3: "Install Heroku CLI and create account"
Thought 4: "Add Procfile and configure package.json"
Thought 5: "Push to Heroku with git push heroku main"
```

**Verify:** All 5 thoughts appear in order with correct progress

---

### Scenario B: Thinking with Revision

**Goal:** Test revision functionality

```
Query: "Choose database for my app"
Thought 1: "MongoDB would be good for flexibility"
Thought 2: "Wait, I need transactions - PostgreSQL is better" (REVISES #1)
Thought 3: "Set up PostgreSQL with connection pooling"
```

**Verify:** Thought 2 shows as revision of thought 1

---

### Scenario C: Branching Approaches

**Goal:** Test branch exploration

```
Query: "Solve performance issue in my API"
Thought 1: "API is slow, need to investigate"
Thought 2: "Two approaches: caching or database optimization"
Thought 3: "Option A: Add Redis caching" (BRANCH: option-a, FROM: 2)
Thought 4: "This would reduce DB hits significantly"
Thought 5: "Option B: Add database indexes" (BRANCH: option-b, FROM: 2)
Thought 6: "This would speed up queries directly"
Thought 7: "Combining both approaches is best" (MERGES branches)
```

**Verify:** Branches are identifiable in tree view and webview

---

### Scenario D: Extended Thinking

**Goal:** Test dynamic estimate adjustment

```
Query: "Design microservices architecture"
Initial estimate: 5 thoughts
After thought 5: "Need more thoughts than estimated" → 10
After thought 10: "Need more thoughts than estimated" → 15
Complete at thought 15
```

**Verify:** Progress updates correctly, no crashes with extended sessions

---

### Scenario E: Empty/Edge Cases

**Test edge cases and error handling:**

1. **Empty thought:** Try submitting empty thought content
   - **Expected:** Validation error "Thought cannot be empty"

2. **Cancel session:** Start session, then cancel input
   - **Expected:** Prompt to end session

3. **Invalid revision number:** Try to revise thought 10 when only 3 exist
   - **Expected:** Validation error

4. **Invalid branch point:** Try to branch from thought 0 or negative
   - **Expected:** Validation error

5. **Very long thought:** Enter 10,000 character thought
   - **Expected:** Handles gracefully, may truncate preview

---

## Troubleshooting

### Connection Issues

**Problem:** "Failed to connect to MCP server"

**Diagnosis:**

```bash
# 1. Check Node.js version
node --version  # Need 18+

# 2. Test npx
npx --version

# 3. Try running server manually
npx -y @modelcontextprotocol/server-sequential-thinking

# 4. Check network/proxy settings
echo $HTTP_PROXY
```

**Solutions:**

- Update Node.js to 18+
- Clear npm cache: `npm cache clean --force`
- Try with sudo/admin if permissions issue
- Check Output panel for detailed error

---

### Commands Not Appearing

**Problem:** Can't find "MCP Sequential Thinking" commands

**Solutions:**

1. Reload Extension Development Host: `Cmd+R` / `Ctrl+R`
2. Check compilation succeeded: `npm run compile`
3. Restart debugging: Stop and F5 again
4. Check `package.json` has correct command definitions
5. Look for activation errors in Output panel

---

### Tree View Empty

**Problem:** Tree view shows no thoughts

**Solutions:**

1. Make sure you started a session
2. Check you completed at least one thought
3. Look for errors in Output panel
4. Try refreshing: Click away and back to Sequential Thinking view
5. Check console for JavaScript errors: `Help > Toggle Developer Tools`

---

### Webview Not Opening

**Problem:** Clicking thought doesn't open details

**Solutions:**

1. Make sure you clicked the thought, not the session header
2. Check Developer Tools console for errors
3. Verify webview panel didn't open in background
4. Try right-click → "Show Thought Details" (if context menu added)

---

### Performance Issues

**Problem:** Extension is slow with many thoughts

**Current Limitations:**

- Tree refreshes on every thought (no debouncing yet)
- No virtualization for large lists
- All thoughts kept in memory

**Workarounds:**

- Keep sessions under 50 thoughts
- End session and start new one if needed
- Monitor memory in Developer Tools

---

## Automated Testing

### Unit Tests

```bash
npm test
```

**Current Test Coverage:**

- Extension activation
- Command registration
- (More tests coming in future versions)

### Integration Tests

```bash
# Coming in v0.1.0
npm run test:integration
```

### Linting

```bash
npm run lint
npm run lint:code -- --fix
```

### Format Check

```bash
npm run format:check
npm run format  # Auto-fix
```

---

## Test Checklist

Use this checklist for comprehensive testing before releases:

- [ ] Extension activates without errors
- [ ] All commands appear in Command Palette
- [ ] Can connect to MCP server
- [ ] Can start new session
- [ ] Can add normal thoughts
- [ ] Can add revision thoughts
- [ ] Can add branch thoughts
- [ ] Progress tracking works
- [ ] Tree view updates in real-time
- [ ] Tree view shows correct icons
- [ ] Webview opens on click
- [ ] Webview displays all thought data
- [ ] Can complete session
- [ ] Can disconnect from server
- [ ] Output panel shows logs
- [ ] No memory leaks with multiple sessions
- [ ] No errors in Developer Tools console
- [ ] All lints pass
- [ ] All tests pass

---

## Reporting Issues

When reporting issues, include:

1. **VS Code/Cursor version:** `Help > About`
2. **Extension version:** Check `package.json`
3. **Node.js version:** `node --version`
4. **Steps to reproduce**
5. **Output panel logs:** Copy from "MCP Sequential Thinking"
6. **Console errors:** From Developer Tools
7. **Screenshots:** If UI issue

Submit issues at: [GitHub Issues](https://github.com/josephlamartina/sequential-thinking-vis/issues)

---

## Testing Best Practices

1. **Always test in clean Extension Development Host**
   - Stop and restart between test runs
   - Don't test in your main VS Code window

2. **Check logs frequently**
   - Output panel shows detailed info
   - Console shows JavaScript errors
   - Both are valuable for debugging

3. **Test edge cases**
   - Empty inputs
   - Very long inputs
   - Rapid clicks
   - Network issues

4. **Test user workflows**
   - Think like an end user
   - Follow natural paths
   - Try to break things

5. **Document issues clearly**
   - Steps to reproduce
   - Expected vs actual
   - Environment details

---

**Happy Testing! 🧪✨**
