# Observer Mode Usage Guide

**Last Updated:** October 25, 2025

This guide covers how to effectively use Observer Mode to watch and understand AI thinking in real-time.

## Quick Start

Observer Mode is **zero-interaction** by design. Once configured:

1. **Use your AI tool normally** (Claude Desktop, Cursor, etc.)
2. **Ask it to use sequential-thinking** (most tools do this automatically)
3. **Watch in VS Code** - Open the Sequential Thinking sidebar (🧠 icon)

That's it! No buttons to click, no commands to run - just watch AI think.

---

## The Observer Interface

### Tree View Layout

When an AI tool uses sequential-thinking, you'll see:

```
🔴 Live AI Observer (23 thoughts)
  ├─ 💬 [1/25] Understanding the problem...
  ├─ 💬 [2/25] Breaking down the requirements...
  ├─ 💬 [3/25] Identifying key constraints...
  ├─ 🔄 [4/25] ↻ Revises #2 - Actually, I need to...
  ├─ 💬 [5/25] Considering approach A...
  ├─ 🌿 [6/25] Branch: alternative-approach
  └─ ...
```

**Session Header:**

- **🔴 Live AI Observer** - Red dot indicates active observation
- **(23 thoughts)** - Running count of observed thoughts

**Individual Thoughts:**

- **[1/25]** - Current thought number / Total estimated thoughts
- **Preview** - First line of the thought (60 chars max)
- **Icons** - Visual indicators for thought type (see below)

---

### Thought Icons

| Icon | Meaning        | Description                                       |
| ---- | -------------- | ------------------------------------------------- |
| 💬   | Normal Thought | Regular sequential thinking step                  |
| 🔄   | Revision       | AI is correcting or refining a previous thought   |
| 🌿   | Branch         | Exploring an alternative approach in parallel     |
| ✓    | Final Thought  | The last thought in the sequence (no more needed) |

---

### Viewing Thought Details

**Click any thought** to open a detailed panel showing:

- **Full Content** - Complete thought text (not just preview)
- **Progress** - X/Y thoughts (e.g., "5/25")
- **Timestamp** - When the thought was observed
- **Type Information** - Revision of #X, Branch ID, etc.
- **Metadata** - Additional properties if present

**Example detail view:**

```
Thought 5

Breaking down the requirements into smaller components:
1. User authentication
2. Data validation
3. Error handling
4. Response formatting

Progress: 5/25
Time: 10:30:45 AM
```

---

## Real-Time Features

### Automatic Updates

- **No refresh needed** - Thoughts appear instantly as the AI generates them
- **Progress updates** - Total thought count adjusts dynamically
- **Live session** - The tree view updates in real-time

### Persistence

- **Session persists** during the conversation
- **Accumulates thoughts** - All thoughts from the current AI session are kept
- **Clears on command** - Use "Clear Observer Session" to start fresh (see below)

---

## Managing Sessions

### Clearing Observer Data

When you want to start fresh:

**Option 1: Command Palette**

1. Open Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Type "Clear Observer"
3. Select "MCP Sequential Thinking: Clear Observer Session"
4. Confirm when prompted

**Option 2: Tree View Button**

1. Open Sequential Thinking sidebar
2. Click the "Clear All" button (🗑️ icon) in the view title bar
3. Confirm when prompted

**Note:** This only clears the visualization - it doesn't affect the AI's conversation or memory.

---

### Multiple Sessions

Currently, Observer Mode shows **one active session** at a time:

- **Most recent wins** - If multiple AI tools use sequential-thinking, you see the latest thoughts
- **Session ID** - Each new thinking session gets a unique ID
- **Clears on demand** - Use "Clear Observer Session" to reset

**Future:** Multiple simultaneous sessions (v0.2.0)

---

## Understanding the Thought Flow

### Normal Sequential Thinking

Most AI thinking follows a linear pattern:

```
[1/5] Understand the problem
[2/5] Break it down
[3/5] Analyze options
[4/5] Choose solution
[5/5] Final answer ✓
```

### Revisions

When AI corrects itself:

```
[1/5] Initial thought...
[2/5] Building on that...
[3/5] ↻ Revises #2 - Wait, I was wrong about...
[4/5] Correct approach is...
```

**Look for:**

- 🔄 icon
- "Revises #X" in description
- Tooltip shows which thought is being revised

### Branches

When AI explores multiple paths:

```
[1/5] Consider two approaches...
[2/5] Branch: approach-a - If we do A...
[3/5] Branch: approach-a - Then we can...
[4/5] Branch: approach-b - If we do B instead...
[5/5] Comparing: A is better because...
```

**Look for:**

- 🌿 icon
- "Branch: [branch-id]" in description
- Grouped branches in the tree

### Dynamic Estimation

AI can adjust the total thought count mid-session:

```
[1/5] Start thinking...
[2/5] This is complex...
[3/8] ← Total increased from 5 to 8
[4/8] Need more steps...
```

This is **normal** - it means the AI realized the problem needs more thinking.

---

## Use Cases

### Debugging AI Reasoning

**Problem:** AI gave a wrong answer

**Solution:** Watch the thought process to see where it went wrong

1. Ask AI to use sequential-thinking
2. Observe each thought step
3. Identify the faulty reasoning
4. Guide AI back on track

**Example:**

```
[3/10] Calculating: 2 + 2 = 5  ← Found the error!
```

You can then prompt: "I think your calculation in step 3 was wrong"

---

### Learning from AI

**Problem:** Want to understand how AI approaches problems

**Solution:** Watch the thinking process in real-time

1. Ask AI to solve a problem using sequential-thinking
2. Observe the step-by-step reasoning
3. Learn the thinking patterns
4. Apply similar approaches yourself

---

### Comparing Approaches

**Problem:** Want AI to explore multiple solutions

**Solution:** Watch branch visualization

1. Ask AI: "Use sequential-thinking to compare approach A vs B"
2. Watch as AI creates branches for each approach
3. See the comparison thought
4. Understand the trade-offs

---

### Progress Monitoring

**Problem:** Long-running AI tasks feel like a black box

**Solution:** Watch progress in real-time

1. Submit complex query
2. Watch thought counter: [5/30] ... [15/30] ... [29/30]
3. See exactly where AI is in the process
4. Estimate remaining time

---

## Tips and Best Practices

### Getting Better Observations

**✅ DO:**

- Ask AI to "use sequential-thinking" explicitly if it doesn't automatically
- Use complex problems (simple ones may not need sequential thinking)
- Keep the Sequential Thinking sidebar open
- Check the Output panel if thoughts don't appear

**❌ DON'T:**

- Expect every AI response to use sequential-thinking (only needed for complex reasoning)
- Worry if thought count changes (dynamic estimation is normal)
- Clear sessions too frequently (accumulation helps understand the full reasoning)

---

### Performance Considerations

Observer Mode is designed to be **lightweight** and **non-intrusive**:

- ✅ **Zero impact on AI** - Tapper doesn't slow down the AI tool
- ✅ **Efficient parsing** - Only processes sequential-thinking messages
- ✅ **Minimal memory** - Tree view handles thousands of thoughts efficiently

**If you experience slowness:**

1. Check if your AI tool itself is slow (not the extension)
2. Clear very large sessions (100+ thoughts)
3. Check Output panel for errors

---

### Keyboard Shortcuts

Currently, Observer Mode has no custom keyboard shortcuts. You can:

- **Focus sidebar:** `Ctrl+Shift+E` then navigate to Sequential Thinking
- **Command Palette:** `Ctrl+Shift+P` then type "Sequential Thinking"

**Future:** Configurable shortcuts (v0.2.0)

---

## Common Patterns

### Pattern: Problem Decomposition

```
[1/10] Understanding the overall problem
[2/10] Breaking into subproblems
[3/10] Analyzing subproblem 1
[4/10] Analyzing subproblem 2
[5/10] Synthesizing solutions
```

### Pattern: Hypothesis Testing

```
[1/8] Forming hypothesis
[2/8] Testing with example 1
[3/8] Testing with example 2
[4/8] ↻ Revises #1 - Hypothesis was wrong
[5/8] New hypothesis
```

### Pattern: Iterative Refinement

```
[1/15] Draft solution v1
[2/15] Reviewing v1
[3/15] ↻ Revises #1 - Improved solution v2
[4/15] Reviewing v2
[5/15] ↻ Revises #3 - Final solution v3 ✓
```

---

## Integration with AI Tools

### Claude Desktop

- **Activation:** Automatic when needed
- **Frequency:** Most complex queries trigger sequential-thinking
- **Observation:** Real-time, every thought

### Cursor

- **Activation:** May need explicit prompt: "use sequential thinking"
- **Frequency:** Depends on problem complexity
- **Observation:** Real-time, integrated with Cursor's AI

### Other MCP Tools

Observer Mode works with any MCP-compatible AI tool that uses the sequential-thinking server. Behavior depends on the tool's implementation.

---

## Troubleshooting

### No Thoughts Appearing

**Check:**

1. Is the Sequential Thinking sidebar open?
2. Did the AI actually use sequential-thinking? (Try asking explicitly)
3. Is the tapper running? (Check Output panel)
4. Is the AI tool configured correctly? (See [Setup Guide](OBSERVER-MODE-SETUP.md))

---

### Thoughts Cut Off or Incomplete

**Issue:** Preview text is truncated

**Solution:** Click the thought to view full content in the detail panel

---

### Old Thoughts Not Clearing

**Issue:** Previous session thoughts still visible

**Solution:** Use "Clear Observer Session" command (see [Managing Sessions](#managing-sessions))

---

### Duplicate Thoughts

**Issue:** Same thought appears multiple times

**Cause:** Rare race condition or AI retrying a thought

**Solution:** This is harmless - just visual duplication. Clear session if it bothers you.

---

## What's Next?

**Upcoming Features (v0.1.0):**

- 💾 **Export sessions** to markdown/JSON
- 📊 **Thought metrics** (time per thought, revision rate, branch count)
- 🔍 **Search thoughts** within sessions
- 📈 **Session history** (review past thinking sessions)

**Upcoming Features (v0.2.0):**

- 👥 **Multiple sessions** simultaneously
- 📱 **Timeline view** of thinking process
- 🎨 **Graph visualization** of branches
- 🌐 **Remote observation** (watch AI on different machines)

---

## Feedback

Have suggestions for Observer Mode? [Open an issue](https://github.com/josephlamartina/sequential-thinking-vis/issues) on GitHub!

---

**Enjoy watching AI think! 🔴🧠**
