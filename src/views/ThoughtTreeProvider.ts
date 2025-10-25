/**
 * TreeView provider for displaying sequential thinking thoughts in observer mode
 */

import * as vscode from 'vscode';
import { ThoughtNode, ThoughtTree, ThoughtEvent } from '../types/thoughts';

/**
 * ThoughtTreeProvider manages the tree view display of observed sequential thoughts
 * Observer-only mode: displays real-time thoughts from ObserverClient
 */
export class ThoughtTreeProvider implements vscode.TreeDataProvider<ThoughtTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ThoughtTreeItem | undefined | null | void> =
    new vscode.EventEmitter<ThoughtTreeItem | undefined | null | void>();

  readonly onDidChangeTreeData: vscode.Event<ThoughtTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private observerSession: ThoughtTree | null = null;

  constructor() {
    // Observer-only mode: no MCPClient dependency
  }

  /**
   * Add a thought observed from the stream
   */
  addObservedThought(event: ThoughtEvent): void {
    console.log('[ThoughtTreeProvider] addObservedThought() called');
    console.log('[ThoughtTreeProvider] Event:', JSON.stringify(event).substring(0, 200));

    // Initialize observer session if not exists
    if (!this.observerSession) {
      console.log('[ThoughtTreeProvider] Creating new observer session');
      this.observerSession = {
        sessionId: `observer-${Date.now()}`,
        thoughts: [],
        branches: new Map(),
        metadata: {
          startTime: new Date().toISOString(),
          status: 'active',
          initialQuery: 'Live AI Observer',
        },
      };
    }

    // Extract thought from event data
    const thoughtData = event.data;
    if (!thoughtData || typeof thoughtData !== 'object') {
      console.log('[ThoughtTreeProvider] Invalid thought data');
      return;
    }

    // Cast to record for property access
    const data = thoughtData as Record<string, unknown>;
    console.log('[ThoughtTreeProvider] Thought data keys:', Object.keys(data));

    // Create thought node
    const thought: ThoughtNode = {
      thought: (data.thought as string) || '',
      thoughtNumber: (data.thoughtNumber as number) || 0,
      totalThoughts: (data.totalThoughts as number) || 0,
      nextThoughtNeeded: (data.nextThoughtNeeded as boolean) !== false,
      isRevision: data.isRevision as boolean | undefined,
      revisesThought: data.revisesThought as number | undefined,
      branchFromThought: data.branchFromThought as number | undefined,
      branchId: data.branchId as string | undefined,
      needsMoreThoughts: data.needsMoreThoughts as boolean | undefined,
      timestamp: event.timestamp,
    };

    console.log(
      `[ThoughtTreeProvider] Created thought node #${thought.thoughtNumber}: ${thought.thought.substring(0, 50)}...`
    );

    // Add to thoughts list
    this.observerSession.thoughts.push(thought);
    console.log(
      `[ThoughtTreeProvider] Total thoughts now: ${this.observerSession.thoughts.length}`
    );

    // Organize by branch if applicable
    if (thought.branchId) {
      const branchThoughts = this.observerSession.branches.get(thought.branchId) || [];
      branchThoughts.push(thought);
      this.observerSession.branches.set(thought.branchId, branchThoughts);
      console.log(`[ThoughtTreeProvider] Added to branch: ${thought.branchId}`);
    }

    // Refresh tree view
    console.log('[ThoughtTreeProvider] Calling refresh()');
    this.refresh();
  }

  /**
   * Clear the observer session
   */
  clearObserverSession(): void {
    this.observerSession = null;
    this.refresh();
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Get tree item for display
   */
  getTreeItem(element: ThoughtTreeItem): vscode.TreeItem {
    return element;
  }

  /**
   * Get children for tree hierarchy
   */
  getChildren(element?: ThoughtTreeItem): Thenable<ThoughtTreeItem[]> {
    if (!this.observerSession) {
      // No active observer session - show empty state
      return Promise.resolve([]);
    }

    if (!element) {
      // Root: Show observer session header
      return Promise.resolve([this.getObserverSessionHeader()]);
    }

    if (element.type === 'session-header') {
      // Expand session: Show its thoughts
      return Promise.resolve(this.getThoughtsForSession());
    }

    // Thoughts don't have children
    return Promise.resolve([]);
  }

  /**
   * Get the observer session header item
   */
  private getObserverSessionHeader(): ThoughtTreeItem {
    const thoughtCount = this.observerSession?.thoughts.length || 0;
    const label = `🔴 Live AI Observer (${thoughtCount} thoughts)`;

    const item = new ThoughtTreeItem(
      label,
      '',
      vscode.TreeItemCollapsibleState.Expanded,
      null,
      'session-header'
    );

    item.iconPath = new vscode.ThemeIcon('record');
    item.tooltip = 'Real-time AI thinking session';
    item.contextValue = 'session-observer';

    return item;
  }

  /**
   * Get thought items for the observer session
   */
  private getThoughtsForSession(): ThoughtTreeItem[] {
    if (!this.observerSession) {
      return [];
    }

    return this.observerSession.thoughts.map((thought) => this.createThoughtItem(thought));
  }

  /**
   * Create a tree item for a thought node
   */
  private createThoughtItem(thought: ThoughtNode): ThoughtTreeItem {
    const preview = this.getThoughtPreview(thought.thought);
    const label = `[${thought.thoughtNumber}/${thought.totalThoughts}] ${preview}`;

    const item = new ThoughtTreeItem(
      label,
      '',
      vscode.TreeItemCollapsibleState.None,
      thought,
      'thought'
    );

    // Set icon based on thought type
    if (thought.isRevision) {
      item.iconPath = new vscode.ThemeIcon('debug-restart');
      item.description = `↻ Revises #${thought.revisesThought}`;
    } else if (thought.branchId) {
      item.iconPath = new vscode.ThemeIcon('git-branch');
      item.description = `Branch: ${thought.branchId}`;
    } else if (!thought.nextThoughtNeeded) {
      item.iconPath = new vscode.ThemeIcon('check');
      item.description = 'Final thought';
    } else {
      item.iconPath = new vscode.ThemeIcon('comment');
    }

    // Add tooltip with full thought content
    item.tooltip = this.createThoughtTooltip(thought);

    // Make item clickable to show details
    item.command = {
      command: 'sequential-thinking-vis.showThoughtDetails',
      title: 'Show Thought Details',
      arguments: [thought],
    };

    return item;
  }

  /**
   * Get a preview of the thought content (first line or 60 chars)
   */
  private getThoughtPreview(thought: string): string {
    const firstLine = thought.split('\n')[0];
    return firstLine.length > 60 ? firstLine.substring(0, 57) + '...' : firstLine;
  }

  /**
   * Create a markdown tooltip for the thought
   */
  private createThoughtTooltip(thought: ThoughtNode): vscode.MarkdownString {
    const markdown = new vscode.MarkdownString();
    markdown.isTrusted = true;

    markdown.appendMarkdown(`### Thought ${thought.thoughtNumber}\n\n`);
    markdown.appendMarkdown(`${thought.thought}\n\n`);
    markdown.appendMarkdown(`---\n\n`);
    markdown.appendMarkdown(`**Progress:** ${thought.thoughtNumber}/${thought.totalThoughts}\n\n`);

    if (thought.isRevision) {
      markdown.appendMarkdown(`**Type:** Revision of thought #${thought.revisesThought}\n\n`);
    }

    if (thought.branchId) {
      markdown.appendMarkdown(`**Branch:** ${thought.branchId}\n\n`);
      if (thought.branchFromThought) {
        markdown.appendMarkdown(`**Branched from:** #${thought.branchFromThought}\n\n`);
      }
    }

    if (thought.timestamp) {
      const date = new Date(thought.timestamp);
      markdown.appendMarkdown(`**Time:** ${date.toLocaleTimeString()}\n\n`);
    }

    return markdown;
  }
}

/**
 * Tree item representing a thought or session header in the tree view
 */
export class ThoughtTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly thought: ThoughtNode | null,
    public readonly type: 'session-header' | 'thought' = 'thought'
  ) {
    super(label, collapsibleState);
    this.description = description;
  }
}
