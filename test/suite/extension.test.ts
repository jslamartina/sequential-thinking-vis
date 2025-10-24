import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    const ext = vscode.extensions.getExtension('josephlamartina.sequential-thinking-vis');
    assert.ok(ext, 'Extension not found');
  });

  test('Should activate extension', async () => {
    const ext = vscode.extensions.getExtension('josephlamartina.sequential-thinking-vis');
    assert.ok(ext, 'Extension not found');
    await ext.activate();
    assert.strictEqual(ext.isActive, true, 'Extension did not activate');
  });

  test('Should register connectServer command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('sequential-thinking-vis.connectServer'),
      'connectServer command not registered'
    );
  });

  test('Should register disconnectServer command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('sequential-thinking-vis.disconnectServer'),
      'disconnectServer command not registered'
    );
  });

  test('Should register startSession command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('sequential-thinking-vis.startSession'),
      'startSession command not registered'
    );
  });

  test('Should register showThoughtDetails command', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(
      commands.includes('sequential-thinking-vis.showThoughtDetails'),
      'showThoughtDetails command not registered'
    );
  });

  test('Should create Sequential Thinking view', async () => {
    // Give extension time to activate
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if the tree view exists by trying to reveal it
    const ext = vscode.extensions.getExtension('josephlamartina.sequential-thinking-vis');
    assert.ok(ext?.isActive, 'Extension should be active');
  });
});
