/**
 * MCP Sequential Thinking Visualization Extension
 * Main entry point for the VS Code extension
 */

import * as vscode from 'vscode';
import { MCPClient } from './providers/MCPClient';
import { ThoughtTreeProvider } from './views/ThoughtTreeProvider';
import { connectServerCommand } from './commands/connectServer';
import { disconnectServerCommand } from './commands/disconnectServer';
import { startSessionCommand } from './commands/startSession';
import { showThoughtDetailsCommand } from './commands/showThoughtDetails';

// Global MCP client instance
let mcpClient: MCPClient | null = null;

/**
 * This method is called when the extension is activated.
 */
export async function activate(context: vscode.ExtensionContext) {
  try {
    console.log('MCP Sequential Thinking Visualization is now active!');

    // Initialize MCP client
    mcpClient = new MCPClient();
    context.subscriptions.push(mcpClient);

    // Create tree view provider
    const treeProvider = new ThoughtTreeProvider(mcpClient);

    // Register tree view
    const treeView = vscode.window.createTreeView('sequentialThinkingView', {
      treeDataProvider: treeProvider,
      showCollapseAll: true,
    });
    context.subscriptions.push(treeView);

    // Register commands
    context.subscriptions.push(
      vscode.commands.registerCommand('sequential-thinking-vis.connectServer', () =>
        connectServerCommand(mcpClient!)
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('sequential-thinking-vis.disconnectServer', () =>
        disconnectServerCommand(mcpClient!)
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand('sequential-thinking-vis.startSession', () =>
        startSessionCommand(mcpClient!)
      )
    );

    context.subscriptions.push(
      vscode.commands.registerCommand(
        'sequential-thinking-vis.showThoughtDetails',
        showThoughtDetailsCommand
      )
    );

    // Show output channel
    mcpClient.getOutputChannel().appendLine('Extension activated');

    // Auto-connect if configured
    const config = vscode.workspace.getConfiguration('sequential-thinking-vis');
    const autoConnect = config.get<boolean>('autoConnect', false);

    if (autoConnect) {
      mcpClient.getOutputChannel().appendLine('Auto-connect enabled');
      try {
        await connectServerCommand(mcpClient);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        mcpClient.getOutputChannel().appendLine(`Auto-connect failed: ${errorMessage}`);
      }
    }

    vscode.window.showInformationMessage('MCP Sequential Thinking Visualization activated!');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Extension activation failed:', error);
    vscode.window.showErrorMessage(
      `MCP Sequential Thinking extension failed to activate: ${errorMessage}`
    );
    throw error;
  }
}

/**
 * This method is called when the extension is deactivated.
 */
export async function deactivate() {
  console.log('MCP Sequential Thinking Visualization is deactivated.');

  // Clean up MCP client
  if (mcpClient) {
    await mcpClient.disconnect();
    mcpClient = null;
  }
}
