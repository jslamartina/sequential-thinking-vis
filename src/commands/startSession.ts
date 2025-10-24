/**
 * Command to start a new sequential thinking session
 */

import * as vscode from 'vscode';
import { MCPClient } from '../providers/MCPClient';
import { ConnectionState } from '../types/thoughts';

export async function startSessionCommand(mcpClient: MCPClient): Promise<void> {
  // Check connection
  if (mcpClient.getConnectionState() !== ConnectionState.Connected) {
    const connect = await vscode.window.showWarningMessage(
      'Not connected to MCP server. Would you like to connect now?',
      'Connect',
      'Cancel'
    );

    if (connect === 'Connect') {
      try {
        await mcpClient.connect();
      } catch {
        vscode.window.showErrorMessage('Failed to connect to MCP server');
        return;
      }
    } else {
      return;
    }
  }

  // Get initial query/problem from user
  const initialQuery = await vscode.window.showInputBox({
    prompt: 'What problem would you like to think through?',
    placeHolder: 'e.g., How to implement authentication in my app',
    ignoreFocusOut: true,
  });

  if (!initialQuery) {
    return;
  }

  // Start the session
  mcpClient.startSession(initialQuery);

  vscode.window.showInformationMessage(`Started sequential thinking session: "${initialQuery}"`);

  // Begin the thinking loop
  await thinkingLoop(mcpClient);
}

/**
 * Interactive loop that prompts for thoughts until complete
 */
async function thinkingLoop(mcpClient: MCPClient): Promise<void> {
  let thoughtNumber = 1;
  let totalThoughts = 5; // Initial estimate
  let continueThinking = true;

  try {
    while (continueThinking) {
      // Prompt for thought content
      const thought = await vscode.window.showInputBox({
        prompt: `Thought ${thoughtNumber}/${totalThoughts}: Enter your thought`,
        placeHolder: 'Describe this step in your thinking process...',
        ignoreFocusOut: true,
        validateInput: (value) => {
          if (!value || value.trim().length === 0) {
            return 'Thought cannot be empty';
          }
          return null;
        },
      });

      if (!thought) {
        // User cancelled - ask if they want to end session
        const endSession = await vscode.window.showWarningMessage(
          'End this thinking session?',
          'Yes',
          'No'
        );
        if (endSession === 'Yes') {
          mcpClient.endSession();
        }
        return;
      }

      // Ask if more thoughts are needed
      const needMore = await vscode.window.showQuickPick(
        ['Yes', 'No', 'Need more thoughts than estimated'],
        {
          placeHolder: `Is another thought needed after this one? (${thoughtNumber}/${totalThoughts})`,
          ignoreFocusOut: true,
        }
      );

      if (!needMore) {
        return; // User cancelled
      }

      const nextThoughtNeeded = needMore === 'Yes' || needMore.startsWith('Need');
      const needsMoreThoughts = needMore.startsWith('Need');

      // Optional: Ask about revision or branching
      const specialAction = await vscode.window.showQuickPick(
        ['None', 'This revises a previous thought', 'This creates a branch'],
        {
          placeHolder: 'Is this a special type of thought?',
          ignoreFocusOut: true,
        }
      );

      let isRevision = false;
      let revisesThought: number | undefined;
      let branchId: string | undefined;
      let branchFromThought: number | undefined;

      if (specialAction === 'This revises a previous thought') {
        isRevision = true;
        const thoughtNumInput = await vscode.window.showInputBox({
          prompt: 'Which thought number does this revise?',
          validateInput: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 1 || num >= thoughtNumber) {
              return 'Enter a valid thought number';
            }
            return null;
          },
        });
        revisesThought = thoughtNumInput ? parseInt(thoughtNumInput) : undefined;
      } else if (specialAction === 'This creates a branch') {
        branchId = await vscode.window.showInputBox({
          prompt: 'Enter a branch identifier (e.g., "option-a", "approach-1")',
          placeHolder: 'option-a',
        });
        const branchFromInput = await vscode.window.showInputBox({
          prompt: 'Branch from which thought number?',
          validateInput: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num < 1 || num >= thoughtNumber) {
              return 'Enter a valid thought number';
            }
            return null;
          },
        });
        branchFromThought = branchFromInput ? parseInt(branchFromInput) : undefined;
      }

      // Update total if needed
      if (needsMoreThoughts) {
        const newTotal = await vscode.window.showInputBox({
          prompt: 'What is the new estimate for total thoughts?',
          value: String(totalThoughts + 5),
          validateInput: (value) => {
            const num = parseInt(value);
            if (isNaN(num) || num <= thoughtNumber) {
              return 'Must be greater than current thought number';
            }
            return null;
          },
        });
        if (newTotal) {
          totalThoughts = parseInt(newTotal);
        }
      }

      // Call the MCP tool
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `Processing thought ${thoughtNumber}...`,
          cancellable: false,
        },
        async () => {
          await mcpClient.callSequentialThinking({
            thought,
            thoughtNumber,
            totalThoughts,
            nextThoughtNeeded,
            ...(isRevision && { isRevision, revisesThought }),
            ...(branchId && { branchId, branchFromThought }),
            ...(needsMoreThoughts && { needsMoreThoughts }),
          });
        }
      );

      // Continue or end
      if (!nextThoughtNeeded) {
        mcpClient.endSession();
        vscode.window.showInformationMessage('✓ Sequential thinking session completed!');
        continueThinking = false;
      } else {
        thoughtNumber++;
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    vscode.window.showErrorMessage(`Error in thinking loop: ${errorMessage}`);
    mcpClient.endSession();
  }
}
