/**
 * Command to disconnect from the MCP server
 */

import * as vscode from 'vscode';
import { MCPClient } from '../providers/MCPClient';

export async function disconnectServerCommand(mcpClient: MCPClient): Promise<void> {
  try {
    await mcpClient.disconnect();
    vscode.window.showInformationMessage('✓ Disconnected from MCP server');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Error disconnecting: ${errorMessage}`);
  }
}
