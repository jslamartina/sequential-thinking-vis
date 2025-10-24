import * as vscode from 'vscode';

/**
 * This method is called when the extension is activated.
 * The extension is activated the very first time a command is executed.
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('MCP Sequential Thinking Visualization is now active!');

  // Register the Hello World command
  const helloWorldCommand = vscode.commands.registerCommand(
    'sequential-thinking-vis.helloWorld',
    () => {
      vscode.window.showInformationMessage('Hello from MCP Sequential Thinking Visualization!');
    }
  );

  context.subscriptions.push(helloWorldCommand);

  // TODO: Initialize MCP client connection
  // TODO: Register tree view provider for thought visualization
  // TODO: Register webview provider for detailed thought display
  // TODO: Set up real-time event listeners for MCP server
}

/**
 * This method is called when the extension is deactivated.
 */
export function deactivate() {
  console.log('MCP Sequential Thinking Visualization is deactivated.');
  // TODO: Clean up MCP client connections
}
