# Sequential Thinking MCP Tool - Complete Guide

This guide explains how to use the `mcp_sequential-thinking_sequentialthinking` tool for complex problem-solving.

## Core Parameters

```typescript
interface SequentialThinkingParams {
  thought: string; // Current thinking step (required)
  nextThoughtNeeded: boolean; // Whether another thought is needed (required)
  thoughtNumber: number; // Current thought number, 1-based (required)
  totalThoughts: number; // Estimated total thoughts needed (required)

  // Optional: Revisions
  isRevision?: boolean; // Whether this revises previous thinking
  revisesThought?: number; // Which thought number is being reconsidered

  // Optional: Branching
  branchFromThought?: number; // Branching point thought number
  branchId?: string; // Branch identifier (e.g., "alternative-approach")

  // Optional: Adjustments
  needsMoreThoughts?: boolean; // If more thoughts needed than estimated
}
```

## Basic Linear Thinking

Use for straightforward multi-step problems:

```typescript
// Thought 1
mcp_sequential -
  thinking_sequentialthinking({
    thought: 'First, I need to understand the MCP connection lifecycle',
    thoughtNumber: 1,
    totalThoughts: 4,
    nextThoughtNeeded: true,
  });

// Thought 2
mcp_sequential -
  thinking_sequentialthinking({
    thought: 'The connection should retry with exponential backoff',
    thoughtNumber: 2,
    totalThoughts: 4,
    nextThoughtNeeded: true,
  });

// Thought 3
mcp_sequential -
  thinking_sequentialthinking({
    thought: "I'll implement this using EventEmitter for state updates",
    thoughtNumber: 3,
    totalThoughts: 4,
    nextThoughtNeeded: true,
  });

// Thought 4 (Final)
mcp_sequential -
  thinking_sequentialthinking({
    thought: 'This approach handles disconnections gracefully and notifies the UI',
    thoughtNumber: 4,
    totalThoughts: 4,
    nextThoughtNeeded: false, // ✅ Done!
  });
```

## Revising Previous Thoughts

When you realize earlier thinking was incorrect:

```typescript
// Original thought 3
mcp_sequential -
  thinking_sequentialthinking({
    thought: "I'll implement this using callbacks",
    thoughtNumber: 3,
    totalThoughts: 5,
    nextThoughtNeeded: true,
  });

// Thought 4 - Revision
mcp_sequential -
  thinking_sequentialthinking({
    thought:
      'Actually, callbacks create callback hell. EventEmitter is better for multiple state changes',
    thoughtNumber: 4,
    totalThoughts: 5,
    nextThoughtNeeded: true,
    isRevision: true, // ✅ Mark as revision
    revisesThought: 3, // ✅ Points back to thought 3
  });
```

## Branching for Alternatives

Explore multiple approaches in parallel:

```typescript
// Main thought path
mcp_sequential -
  thinking_sequentialthinking({
    thought: 'For tree updates, I could use polling or event-driven approach',
    thoughtNumber: 3,
    totalThoughts: 8,
    nextThoughtNeeded: true,
  });

// Branch A: Polling approach
mcp_sequential -
  thinking_sequentialthinking({
    thought: 'Polling would check every second. Simple but inefficient',
    thoughtNumber: 4,
    totalThoughts: 8,
    nextThoughtNeeded: true,
    branchFromThought: 3, // ✅ Branch point
    branchId: 'polling', // ✅ Branch identifier
  });

mcp_sequential -
  thinking_sequentialthinking({
    thought: 'Polling wastes CPU and has latency up to 1 second',
    thoughtNumber: 5,
    totalThoughts: 8,
    nextThoughtNeeded: true,
    branchId: 'polling', // ✅ Continue branch
  });

// Branch B: Event-driven approach
mcp_sequential -
  thinking_sequentialthinking({
    thought: 'Event-driven responds immediately when MCP emits tool calls',
    thoughtNumber: 6,
    totalThoughts: 8,
    nextThoughtNeeded: true,
    branchFromThought: 3, // ✅ Same branch point
    branchId: 'event-driven', // ✅ Different branch
  });

mcp_sequential -
  thinking_sequentialthinking({
    thought: "Event-driven is more efficient. I'll use this approach",
    thoughtNumber: 7,
    totalThoughts: 8,
    nextThoughtNeeded: true,
    branchId: 'event-driven', // ✅ Continue branch
  });

// Return to main path with decision
mcp_sequential -
  thinking_sequentialthinking({
    thought: 'Implementing event-driven approach with EventEmitter pattern',
    thoughtNumber: 8,
    totalThoughts: 8,
    nextThoughtNeeded: false, // ✅ Done, decision made
  });
```

## Adjusting Total Thoughts

When problem is more complex than initially estimated:

```typescript
// Initial estimate
mcp_sequential -
  thinking_sequentialthinking({
    thought: 'I need to implement TreeView provider',
    thoughtNumber: 1,
    totalThoughts: 3, // Initial estimate
    nextThoughtNeeded: true,
  });

mcp_sequential -
  thinking_sequentialthinking({
    thought: 'Actually, this needs data modeling, provider, refresh logic, and commands',
    thoughtNumber: 2,
    totalThoughts: 6, // ✅ Adjusted estimate
    nextThoughtNeeded: true,
    needsMoreThoughts: true, // ✅ Signal adjustment
  });

// Continue with new estimate...
mcp_sequential -
  thinking_sequentialthinking({
    thought: "First, I'll define the ThoughtNode interface",
    thoughtNumber: 3,
    totalThoughts: 6,
    nextThoughtNeeded: true,
  });
```

## Complex Example: Architecture Decision

```typescript
// 1. Initial analysis
mcp_sequential -
  thinking_sequentialthinking({
    thought: 'Need to visualize sequential thinking. Options: TreeView, Webview, or both',
    thoughtNumber: 1,
    totalThoughts: 10,
    nextThoughtNeeded: true,
  });

// 2. TreeView branch
mcp_sequential -
  thinking_sequentialthinking({
    thought: 'TreeView: Native VS Code UI, familiar, limited customization',
    thoughtNumber: 2,
    totalThoughts: 10,
    nextThoughtNeeded: true,
    branchFromThought: 1,
    branchId: 'treeview-only',
  });

mcp_sequential -
  thinking_sequentialthinking({
    thought: "TreeView can't show connections between revisions or branches visually",
    thoughtNumber: 3,
    totalThoughts: 10,
    nextThoughtNeeded: true,
    branchId: 'treeview-only',
  });

// 3. Webview branch
mcp_sequential -
  thinking_sequentialthinking({
    thought: 'Webview: Full customization, can draw graphs, but more complex',
    thoughtNumber: 4,
    totalThoughts: 10,
    nextThoughtNeeded: true,
    branchFromThought: 1,
    branchId: 'webview-only',
  });

mcp_sequential -
  thinking_sequentialthinking({
    thought: 'Webview allows D3.js or similar for interactive graph visualization',
    thoughtNumber: 5,
    totalThoughts: 10,
    nextThoughtNeeded: true,
    branchId: 'webview-only',
  });

// 4. Hybrid approach
mcp_sequential -
  thinking_sequentialthinking({
    thought: 'What if I use both? TreeView for quick navigation, Webview for details',
    thoughtNumber: 6,
    totalThoughts: 10,
    nextThoughtNeeded: true,
    branchFromThought: 1,
    branchId: 'hybrid',
  });

mcp_sequential -
  thinking_sequentialthinking({
    thought: 'Hybrid provides best of both: fast access + rich visualization',
    thoughtNumber: 7,
    totalThoughts: 10,
    nextThoughtNeeded: true,
    branchId: 'hybrid',
  });

// 5. Revising earlier TreeView analysis
mcp_sequential -
  thinking_sequentialthinking({
    thought: 'Actually, TreeView CAN show revisions using icons and descriptions',
    thoughtNumber: 8,
    totalThoughts: 10,
    nextThoughtNeeded: true,
    isRevision: true,
    revisesThought: 3,
  });

// 6. Final decision
mcp_sequential -
  thinking_sequentialthinking({
    thought: 'Start with TreeView for MVP. Add Webview later if needed',
    thoughtNumber: 9,
    totalThoughts: 10,
    nextThoughtNeeded: true,
  });

mcp_sequential -
  thinking_sequentialthinking({
    thought: 'Decision: TreeView with EventEmitter updates, defer Webview to v2',
    thoughtNumber: 10,
    totalThoughts: 10,
    nextThoughtNeeded: false,
  });
```

## Best Practices

### Progressive Refinement

- Start with rough estimates, adjust as you learn
- Don't worry about exact `totalThoughts` upfront
- Use `needsMoreThoughts` when expanding scope

### Meaningful Thoughts

- Each thought should advance understanding
- Avoid repetition unless explicitly revising
- Include reasoning, not just conclusions

### Branch Management

- Use clear `branchId` names (e.g., "option-a", "refactor-approach")
- Return to main path after exploring branches
- Explicitly state which branch you're choosing

### Revisions

- Mark revisions when significantly changing direction
- Point back to the specific thought being reconsidered
- Explain why the original thinking was incorrect

### Know When to Stop

- Set `nextThoughtNeeded: false` when satisfied
- Don't overthink simple decisions
- Move to implementation when plan is clear
