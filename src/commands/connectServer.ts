/**
 * Command to connect to the MCP sequential-thinking server
 */

import * as vscode from 'vscode';
import { MCPClient } from '../providers/MCPClient';

export async function connectServerCommand(mcpClient: MCPClient): Promise<void> {
  try {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: 'Connecting to MCP Sequential Thinking Server',
        cancellable: false,
      },
      async () => {
        await mcpClient.connect();
      }
    );

    vscode.window.showInformationMessage('✓ Connected to MCP Sequential Thinking Server');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Failed to connect to MCP server: ${errorMessage}`);
  }
}
