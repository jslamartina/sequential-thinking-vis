/**
 * TreeView provider for displaying sequential thinking thoughts
 */

import * as vscode from 'vscode';
import { ThoughtNode, ThoughtTree } from '../types/thoughts';
import { MCPClient } from '../providers/MCPClient';

/**
 * ThoughtTreeProvider manages the tree view display of sequential thoughts
 */
export class ThoughtTreeProvider implements vscode.TreeDataProvider<ThoughtTreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ThoughtTreeItem | undefined | null | void> =
    new vscode.EventEmitter<ThoughtTreeItem | undefined | null | void>();

  readonly onDidChangeTreeData: vscode.Event<ThoughtTreeItem | undefined | null | void> =
    this._onDidChangeTreeData.event;

  private currentSession: ThoughtTree | null = null;

  constructor(private mcpClient: MCPClient) {
    // Listen for thought updates from MCP client
    this.mcpClient.on('thoughtAdded', () => {
      this.refresh();
    });

    this.mcpClient.on('sessionStarted', (session: ThoughtTree) => {
      this.currentSession = session;
      this.refresh();
    });

    this.mcpClient.on('sessionEnded', () => {
      this.refresh();
    });
  }

  /**
   * Refresh the tree view
   */
  refresh(): void {
    this.currentSession = this.mcpClient.getCurrentSession();
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
    if (!this.currentSession) {
      // No active session - show empty state
      return Promise.resolve([]);
    }

    if (!element) {
      // Root level - show session info and all thoughts
      const items: ThoughtTreeItem[] = [];

      // Add session header
      const sessionHeader = new ThoughtTreeItem(
        `Session: ${this.currentSession.metadata.initialQuery || 'Untitled'}`,
        '',
        vscode.TreeItemCollapsibleState.Expanded,
        null
      );
      sessionHeader.description = `${this.currentSession.thoughts.length} thoughts`;
      sessionHeader.iconPath = new vscode.ThemeIcon('debug-start');
      items.push(sessionHeader);

      return Promise.resolve(items);
    }

    // If it's the session header, show all thoughts
    if (!element.thought) {
      const thoughtItems = this.currentSession.thoughts.map((thought) =>
        this.createThoughtItem(thought)
      );
      return Promise.resolve(thoughtItems);
    }

    // Individual thoughts don't have children in this flat structure
    return Promise.resolve([]);
  }

  /**
   * Create a tree item for a thought node
   */
  private createThoughtItem(thought: ThoughtNode): ThoughtTreeItem {
    const preview = this.getThoughtPreview(thought.thought);
    const label = `[${thought.thoughtNumber}/${thought.totalThoughts}] ${preview}`;

    const item = new ThoughtTreeItem(label, '', vscode.TreeItemCollapsibleState.None, thought);

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
 * Tree item representing a thought in the tree view
 */
export class ThoughtTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public description: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly thought: ThoughtNode | null
  ) {
    super(label, collapsibleState);
    this.description = description;
  }
}
