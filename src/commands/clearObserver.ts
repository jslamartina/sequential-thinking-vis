/**
 * Clear Observer Session Command
 *
 * Allows users to clear all observed thoughts from the tree view.
 */

import * as vscode from 'vscode';
import { ThoughtTreeProvider } from '../views/ThoughtTreeProvider';

/**
 * Clear the observer session after user confirmation
 */
export async function clearObserverCommand(treeProvider: ThoughtTreeProvider): Promise<void> {
  const answer = await vscode.window.showWarningMessage(
    'Clear observer session? This will remove all observed thoughts.',
    'Clear',
    'Cancel'
  );

  if (answer === 'Clear') {
    treeProvider.clearObserverSession();
    vscode.window.showInformationMessage('Observer session cleared');
  }
}
