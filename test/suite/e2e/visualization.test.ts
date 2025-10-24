/**
 * E2E Visualization Tests
 * Tests the tree view rendering with real MCP server
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  getMCPClient,
  getTreeProvider,
  executeCommand,
  wait,
  waitFor,
  ensureExtensionActivated,
} from '../../helpers/e2e-setup';

suite('E2E Visualization Tests', function () {
  this.timeout(15000);

  setup(async () => {
    await ensureExtensionActivated();

    // Ensure we start disconnected
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
      // Ignore cleanup errors
    }
  });

  suite('Tree Structure', () => {
    test('Should render empty state when no session', async () => {
      const provider = await getTreeProvider();
      const children = await provider.getChildren();
      assert.strictEqual(children.length, 0, 'Should have no children when no session');
    });

    test('Should render session header with thought count', async () => {
      const client = await getMCPClient();
      const provider = await getTreeProvider();

      // Connect and start a session
      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      // Start a session
      const sessionId = client.startSession('Test visualization');
      assert.ok(sessionId, 'Session should be created');

      // Add a thought through the MCP client
      await client.callSequentialThinking({
        thought: 'This is a test thought for visualization',
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true,
      });

      await wait(500);

      // Get root children
      const rootChildren = await provider.getChildren();
      assert.strictEqual(rootChildren.length, 1, 'Should have session header');

      const sessionHeader = rootChildren[0];
      assert.ok(sessionHeader.label.toString().includes('Session:'), 'Should have session label');
      assert.ok(sessionHeader.description?.includes('thoughts'), 'Should show thought count');
    });

    test('Should render all thoughts under session header', async () => {
      const client = await getMCPClient();
      const provider = await getTreeProvider();

      // Connect and start session
      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Multiple thoughts test');

      // Add multiple thoughts
      await client.callSequentialThinking({
        thought: 'First thought',
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true,
      });

      await client.callSequentialThinking({
        thought: 'Second thought',
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false,
      });

      await wait(500);

      const rootChildren = await provider.getChildren();
      const sessionHeader = rootChildren[0];
      const thoughts = await provider.getChildren(sessionHeader);

      assert.strictEqual(thoughts.length, 2, 'Should render all thoughts');
    });

    test('Should show thought numbers in labels', async () => {
      const client = await getMCPClient();
      const provider = await getTreeProvider();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Thought labels test');

      await client.callSequentialThinking({
        thought: 'Test thought',
        thoughtNumber: 1,
        totalThoughts: 5,
        nextThoughtNeeded: true,
      });

      await wait(500);

      const rootChildren = await provider.getChildren();
      const thoughts = await provider.getChildren(rootChildren[0]);

      const label = thoughts[0].label.toString();
      assert.ok(label.includes('[1/5]'), 'Should show thought number in format [N/total]');
    });

    test('Should truncate long thought previews', async () => {
      const client = await getMCPClient();
      const provider = await getTreeProvider();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Long thought test');

      const longThought = 'A'.repeat(100); // 100 character thought
      await client.callSequentialThinking({
        thought: longThought,
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
      });

      await wait(500);

      const rootChildren = await provider.getChildren();
      const thoughts = await provider.getChildren(rootChildren[0]);

      const label = thoughts[0].label.toString();
      // Should be truncated to around 60 chars (plus thought number prefix)
      assert.ok(label.length < 80, 'Long thoughts should be truncated');
      assert.ok(label.includes('...'), 'Truncated thoughts should have ellipsis');
    });
  });

  suite('Icon Rendering', () => {
    test('Should use standard icon for regular thoughts', async () => {
      const client = await getMCPClient();
      const provider = await getTreeProvider();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Icon test');

      await client.callSequentialThinking({
        thought: 'Regular thought',
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true,
      });

      await wait(500);

      const rootChildren = await provider.getChildren();
      const thoughts = await provider.getChildren(rootChildren[0]);

      assert.ok(thoughts[0].iconPath, 'Should have an icon');
    });

    test('Should use check icon for final thought', async () => {
      const client = await getMCPClient();
      const provider = await getTreeProvider();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Final thought test');

      await client.callSequentialThinking({
        thought: 'Final thought',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false, // Final thought
      });

      await wait(500);

      const rootChildren = await provider.getChildren();
      const thoughts = await provider.getChildren(rootChildren[0]);

      assert.ok(thoughts[0].description?.includes('Final'), 'Should mark as final thought');
    });

    test('Should use branch icon for branched thoughts', async () => {
      const client = await getMCPClient();
      const provider = await getTreeProvider();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Branch test');

      // Add base thought
      await client.callSequentialThinking({
        thought: 'Base thought',
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true,
      });

      // Add branched thought
      await client.callSequentialThinking({
        thought: 'Branched thought',
        thoughtNumber: 2,
        totalThoughts: 3,
        nextThoughtNeeded: true,
        branchId: 'option-a',
        branchFromThought: 1,
      });

      await wait(500);

      const rootChildren = await provider.getChildren();
      const thoughts = await provider.getChildren(rootChildren[0]);

      const branchedThought = thoughts[1];
      assert.ok(branchedThought.description?.includes('Branch'), 'Should show branch information');
    });

    test('Should use revision icon for revised thoughts', async () => {
      const client = await getMCPClient();
      const provider = await getTreeProvider();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Revision test');

      // Add original thought
      await client.callSequentialThinking({
        thought: 'Original thought',
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true,
      });

      // Add revision
      await client.callSequentialThinking({
        thought: 'Revised thought',
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false,
        isRevision: true,
        revisesThought: 1,
      });

      await wait(500);

      const rootChildren = await provider.getChildren();
      const thoughts = await provider.getChildren(rootChildren[0]);

      const revision = thoughts[1];
      assert.ok(revision.description?.includes('Revises'), 'Should show revision information');
    });
  });

  suite('Collapsible States', () => {
    test('Should render session header as expanded by default', async () => {
      const client = await getMCPClient();
      const provider = await getTreeProvider();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Collapsible test');
      await client.callSequentialThinking({
        thought: 'Test',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
      });

      await wait(500);

      const rootChildren = await provider.getChildren();
      assert.strictEqual(
        rootChildren[0].collapsibleState,
        vscode.TreeItemCollapsibleState.Expanded,
        'Session header should be expanded'
      );
    });

    test('Should render individual thoughts as non-collapsible', async () => {
      const client = await getMCPClient();
      const provider = await getTreeProvider();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Non-collapsible test');
      await client.callSequentialThinking({
        thought: 'Test',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
      });

      await wait(500);

      const rootChildren = await provider.getChildren();
      const thoughts = await provider.getChildren(rootChildren[0]);

      assert.strictEqual(
        thoughts[0].collapsibleState,
        vscode.TreeItemCollapsibleState.None,
        'Individual thoughts should not be collapsible'
      );
    });
  });

  suite('Command Integration', () => {
    test('Should attach command to thought items', async () => {
      const client = await getMCPClient();
      const provider = await getTreeProvider();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Command test');
      await client.callSequentialThinking({
        thought: 'Test thought',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
      });

      await wait(500);

      const rootChildren = await provider.getChildren();
      const thoughts = await provider.getChildren(rootChildren[0]);

      assert.ok(thoughts[0].command, 'Should have a command attached');
      assert.strictEqual(
        thoughts[0].command!.command,
        'sequential-thinking-vis.showThoughtDetails',
        'Should attach showThoughtDetails command'
      );
    });
  });
});
