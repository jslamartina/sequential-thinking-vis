import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('YOUR_PUBLISHER_ID.sequential-thinking-vis'));
  });

  test('Should activate extension', async () => {
    const ext = vscode.extensions.getExtension('YOUR_PUBLISHER_ID.sequential-thinking-vis');
    await ext?.activate();
    assert.ok(ext?.isActive);
  });

  test('Should register hello world command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('sequential-thinking-vis.helloWorld'));
  });
});
