/**
 * Command to show detailed view of a thought
 */

import * as vscode from 'vscode';
import { ThoughtNode } from '../types/thoughts';

// Track open webview panel to reuse instead of creating duplicates
let currentPanel: vscode.WebviewPanel | null = null;

export async function showThoughtDetailsCommand(thought: ThoughtNode): Promise<void> {
  // Reuse existing panel if available
  if (currentPanel) {
    currentPanel.webview.html = getWebviewContent(thought);
    currentPanel.title = `Thought ${thought.thoughtNumber}/${thought.totalThoughts}`;
    currentPanel.reveal(vscode.ViewColumn.Beside);
    return;
  }

  // Create new panel if none exists
  currentPanel = vscode.window.createWebviewPanel(
    'thoughtDetails',
    `Thought ${thought.thoughtNumber}/${thought.totalThoughts}`,
    vscode.ViewColumn.Beside,
    {
      enableScripts: false,
    }
  );

  // Clear reference when panel is closed
  currentPanel.onDidDispose(() => {
    currentPanel = null;
  });

  currentPanel.webview.html = getWebviewContent(thought);
}

function getWebviewContent(thought: ThoughtNode): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thought ${thought.thoughtNumber}</title>
    <style>
        body {
            font-family: var(--vscode-font-family);
            padding: 20px;
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .header {
            border-bottom: 1px solid var(--vscode-panel-border);
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .thought-number {
            font-size: 14px;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 5px;
        }
        .thought-content {
            line-height: 1.6;
            white-space: pre-wrap;
            padding: 15px;
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 4px solid var(--vscode-textBlockQuote-border);
            margin: 15px 0;
        }
        .metadata {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 20px;
            padding: 15px;
            background-color: var(--vscode-editor-inactiveSelectionBackground);
            border-radius: 4px;
        }
        .metadata-item {
            display: flex;
            flex-direction: column;
        }
        .metadata-label {
            font-size: 11px;
            text-transform: uppercase;
            color: var(--vscode-descriptionForeground);
            margin-bottom: 4px;
        }
        .metadata-value {
            font-size: 14px;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 12px;
            margin-top: 10px;
        }
        .badge-revision {
            background-color: var(--vscode-charts-orange);
        }
        .badge-branch {
            background-color: var(--vscode-charts-blue);
        }
        .badge-final {
            background-color: var(--vscode-charts-green);
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="thought-number">
            Thought ${thought.thoughtNumber} of ${thought.totalThoughts}
        </div>
    </div>

    <div class="thought-content">
        ${escapeHtml(thought.thought)}
    </div>

    ${thought.isRevision ? `<span class="badge badge-revision">↻ Revises thought #${thought.revisesThought}</span>` : ''}
    ${thought.branchId ? `<span class="badge badge-branch">🌿 Branch: ${thought.branchId}${thought.branchFromThought ? ` (from #${thought.branchFromThought})` : ''}</span>` : ''}
    ${!thought.nextThoughtNeeded ? `<span class="badge badge-final">✓ Final thought</span>` : ''}

    <div class="metadata">
        <div class="metadata-item">
            <span class="metadata-label">Progress</span>
            <span class="metadata-value">${thought.thoughtNumber} / ${thought.totalThoughts}</span>
        </div>
        <div class="metadata-item">
            <span class="metadata-label">Next Thought Needed</span>
            <span class="metadata-value">${thought.nextThoughtNeeded ? 'Yes' : 'No'}</span>
        </div>
        ${
          thought.timestamp
            ? `
        <div class="metadata-item">
            <span class="metadata-label">Timestamp</span>
            <span class="metadata-value">${new Date(thought.timestamp).toLocaleString()}</span>
        </div>
        `
            : ''
        }
        ${
          thought.needsMoreThoughts
            ? `
        <div class="metadata-item">
            <span class="metadata-label">Adjustment</span>
            <span class="metadata-value">Extended estimate</span>
        </div>
        `
            : ''
        }
    </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
