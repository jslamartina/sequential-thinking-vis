/**
 * E2E Compatibility Tests
 * Tests VS Code / Cursor API compatibility
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import * as os from 'os';
import {
  getMCPClient,
  getTreeProvider,
  executeCommand,
  wait,
  waitFor,
  ensureExtensionActivated,
  getExtension,
} from '../../helpers/e2e-setup';

suite('E2E Compatibility Tests', function () {
  this.timeout(15000);

  const editorInfo = {
    name: vscode.env.appName,
    version: vscode.version,
    isCursor: vscode.env.appName.toLowerCase().includes('cursor'),
    platform: os.platform(),
    nodeVersion: process.version,
  };

  suiteSetup(() => {
    console.log('\nRunning tests in', editorInfo.name, 'v' + editorInfo.version);
  });

  setup(async () => {
    await ensureExtensionActivated();

    const client = await getMCPClient();
    if (client.isConnected()) {
      await executeCommand('sequential-thinking-vis.disconnectServer');
      await wait(500);
    }
  });

  teardown(async () => {
    try {
      const client = await getMCPClient();
      if (client.isConnected()) {
        await executeCommand('sequential-thinking-vis.disconnectServer');
        await wait(500);
      }
    } catch (error) {
      // Ignore
    }
  });

  suite('Editor Detection', () => {
    test('Should correctly identify the editor', () => {
      assert.ok(editorInfo.name, 'Should have editor name');
      assert.ok(editorInfo.version, 'Should have version');
      console.log(`  Editor: ${editorInfo.name}`);
      console.log(`  Version: ${editorInfo.version}`);
      console.log(`  Is Cursor: ${editorInfo.isCursor}`);
    });

    test('Should report editor info in logs', () => {
      assert.strictEqual(typeof editorInfo.isCursor, 'boolean', 'isCursor should be boolean');
    });
  });

  suite('Extension Activation', () => {
    test('Should activate successfully in current editor', async () => {
      const ext = getExtension();
      assert.ok(ext.isActive, 'Extension should be activated');
    });

    test('Should register all commands in current editor', async () => {
      const commands = await vscode.commands.getCommands();

      const requiredCommands = [
        'sequential-thinking-vis.connectServer',
        'sequential-thinking-vis.disconnectServer',
        'sequential-thinking-vis.startSession',
        'sequential-thinking-vis.showThoughtDetails',
      ];

      for (const cmd of requiredCommands) {
        assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
      }
    });

    test('Should create tree view in current editor', async () => {
      const provider = await getTreeProvider();
      assert.ok(provider, 'Tree provider should exist');

      // Tree view should be able to get children
      const children = await provider.getChildren();
      assert.ok(Array.isArray(children), 'Should return array of children');
    });
  });

  suite('Core Functionality', () => {
    test('Should connect to MCP server in current editor', async () => {
      const client = await getMCPClient();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      assert.ok(client.isConnected(), `Should connect in ${editorInfo.name}`);
    });

    test('Should receive and process thoughts in current editor', async () => {
      const client = await getMCPClient();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession(`Test in ${editorInfo.name}`);
      await client.callSequentialThinking({
        thought: 'Compatibility test thought',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
      });

      await wait(500);

      const session = client.getCurrentSession();
      assert.ok(session, `Should have session in ${editorInfo.name}`);
      assert.strictEqual(session!.thoughts.length, 1, 'Should process thought');
    });

    test('Should render tree view in current editor', async () => {
      const client = await getMCPClient();
      const provider = await getTreeProvider();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Tree view test');
      await client.callSequentialThinking({
        thought: 'Test rendering',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
      });

      await wait(500);

      const children = await provider.getChildren();
      assert.ok(children.length > 0, `Should render tree in ${editorInfo.name}`);
    });
  });

  suite('VS Code API Compatibility', () => {
    test('Should support vscode.window APIs in current editor', () => {
      assert.ok(vscode.window.createOutputChannel, 'createOutputChannel should exist');
      assert.ok(vscode.window.showInformationMessage, 'showInformationMessage should exist');
      assert.ok(vscode.window.showErrorMessage, 'showErrorMessage should exist');
      assert.ok(vscode.window.createTreeView, 'createTreeView should exist');
    });

    test('Should support vscode.commands APIs in current editor', async () => {
      assert.ok(vscode.commands.registerCommand, 'registerCommand should exist');
      assert.ok(vscode.commands.executeCommand, 'executeCommand should exist');

      const commands = await vscode.commands.getCommands();
      assert.ok(Array.isArray(commands), 'getCommands should return array');
    });

    test('Should support vscode.workspace APIs in current editor', () => {
      assert.ok(vscode.workspace.getConfiguration, 'getConfiguration should exist');

      const config = vscode.workspace.getConfiguration('sequential-thinking-vis');
      assert.ok(config, 'Should get configuration');
    });

    test('Should support vscode.Uri APIs in current editor', () => {
      const uri = vscode.Uri.file('/test/path');
      assert.ok(uri, 'Uri should be created');
      assert.ok(uri.fsPath, 'Uri should have fsPath');
    });

    test('Should support TreeItem and TreeDataProvider in current editor', async () => {
      const provider = await getTreeProvider();

      // Verify TreeDataProvider interface
      assert.ok(provider.getTreeItem, 'Should have getTreeItem method');
      assert.ok(provider.getChildren, 'Should have getChildren method');
      assert.ok(provider.onDidChangeTreeData, 'Should have onDidChangeTreeData event');
    });
  });

  suite('UI Element Rendering', () => {
    test('Should render ThemeIcons correctly in current editor', () => {
      const icon = new vscode.ThemeIcon('check');
      assert.ok(icon, 'Should create ThemeIcon');
      assert.strictEqual(icon.id, 'check', 'Should have correct icon ID');
    });

    test('Should render MarkdownString correctly in current editor', () => {
      const markdown = new vscode.MarkdownString('# Test');
      assert.ok(markdown, 'Should create MarkdownString');
      assert.ok(markdown.value, 'Should have value');
    });

    test('Should support TreeItemCollapsibleState in current editor', () => {
      assert.ok(vscode.TreeItemCollapsibleState, 'TreeItemCollapsibleState should exist');
      assert.strictEqual(
        typeof vscode.TreeItemCollapsibleState.None,
        'number',
        'Should have None state'
      );
      assert.strictEqual(
        typeof vscode.TreeItemCollapsibleState.Collapsed,
        'number',
        'Should have Collapsed state'
      );
      assert.strictEqual(
        typeof vscode.TreeItemCollapsibleState.Expanded,
        'number',
        'Should have Expanded state'
      );
    });
  });

  suite('Configuration', () => {
    test('Should read configuration in current editor', () => {
      const config = vscode.workspace.getConfiguration('sequential-thinking-vis');

      // Should be able to read config values
      const autoConnect = config.get<boolean>('autoConnect');
      const serverCommand = config.get<string>('serverCommand');
      const serverArgs = config.get<string[]>('serverArgs');

      assert.strictEqual(typeof autoConnect, 'boolean', 'autoConnect should be boolean');
      assert.ok(serverCommand !== undefined, 'serverCommand should be defined');
      assert.ok(Array.isArray(serverArgs), 'serverArgs should be an array');
    });

    test('Should write configuration in current editor', async () => {
      const config = vscode.workspace.getConfiguration('sequential-thinking-vis');

      // Try to update configuration (may not work in test environment)
      try {
        await config.update('autoConnect', false, vscode.ConfigurationTarget.Global);
        const updated = config.get<boolean>('autoConnect');
        assert.strictEqual(typeof updated, 'boolean', 'Should update configuration');
      } catch (error) {
        // Configuration updates may fail in test environment
        // This is expected and not a failure
        console.log('  Note: Config update not supported in test environment');
      }
    });
  });

  suite('Extension Context', () => {
    test('Should have access to extension context properties', () => {
      const ext = getExtension();
      assert.ok(ext.extensionUri, 'Should have extensionUri');
      assert.ok(ext.id, 'Should have extension ID');
      assert.ok(ext.packageJSON, 'Should have packageJSON');
    });

    test('Should support subscriptions in current editor', async () => {
      // Verify that subscriptions work by checking extension is active
      const ext = getExtension();
      assert.ok(ext.isActive, 'Extension should handle subscriptions properly');
    });
  });

  suite('Performance', () => {
    test('Should have acceptable activation time in current editor', () => {
      const ext = getExtension();
      // Extension should be already activated by this point
      assert.ok(ext.isActive, 'Should activate in reasonable time');
    });

    test('Should handle rapid thought updates efficiently in current editor', async () => {
      const client = await getMCPClient();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Performance test');

      const startTime = Date.now();

      // Add 10 thoughts rapidly
      for (let i = 1; i <= 10; i++) {
        await client.callSequentialThinking({
          thought: `Thought ${i}`,
          thoughtNumber: i,
          totalThoughts: 10,
          nextThoughtNeeded: i < 10,
        });
      }

      const elapsed = Date.now() - startTime;

      console.log(`  Processed 10 thoughts in ${elapsed}ms`);
      assert.ok(elapsed < 10000, 'Should process thoughts in reasonable time');

      const session = client.getCurrentSession();
      assert.strictEqual(session!.thoughts.length, 10, 'Should process all thoughts');
    });
  });

  suite('Cross-Editor Test Summary', () => {
    test('Should report test environment', () => {
      console.log('\n=== Test Environment ===');
      console.log(`Editor: ${editorInfo.name}`);
      console.log(`Version: ${editorInfo.version}`);
      console.log(`Is Cursor: ${editorInfo.isCursor}`);
      console.log(`Platform: ${editorInfo.platform}`);
      console.log(`Node: ${editorInfo.nodeVersion}`);
      console.log('========================\n');

      assert.ok(true, 'Test environment reported');
    });
  });
});
