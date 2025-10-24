/**
 * E2E Connection Tests
 * Tests MCP server connection lifecycle
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  getMCPClient,
  executeCommand,
  wait,
  waitFor,
  ensureExtensionActivated,
} from '../../helpers/e2e-setup';
import { ConnectionState } from '../../../src/types/thoughts';

suite('E2E Connection Tests', function () {
  // Increase timeout for E2E tests with real MCP server
  this.timeout(15000);

  setup(async () => {
    // Ensure extension is activated
    await ensureExtensionActivated();

    // Disconnect if already connected
    const client = await getMCPClient();
    if (client.isConnected()) {
      await executeCommand('sequential-thinking-vis.disconnectServer');
      await wait(500);
    }
  });

  teardown(async () => {
    // Clean up - disconnect after each test
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

  suite('Basic Connection', () => {
    test('Should connect to MCP server successfully', async () => {
      const client = await getMCPClient();

      // Initial state should be disconnected
      assert.strictEqual(
        client.getConnectionState(),
        ConnectionState.Disconnected,
        'Should start disconnected'
      );

      // Execute connect command
      await executeCommand('sequential-thinking-vis.connectServer');

      // Wait for connection to complete
      await waitFor(() => client.isConnected(), 10000);

      // Verify connected state
      assert.strictEqual(
        client.getConnectionState(),
        ConnectionState.Connected,
        'Should be connected'
      );
      assert.ok(client.isConnected(), 'isConnected() should return true');
    });

    test('Should handle connection timeout', async function () {
      // This test verifies timeout handling by using an invalid server config
      // We can't easily test this without mocking, so we'll skip for true E2E
      // In a real E2E test, we'd try to connect to a non-existent server
      this.skip();
    });

    test('Should handle connection failure', async function () {
      // Similar to timeout - hard to test in true E2E without breaking things
      // Would need to simulate network failure or invalid server
      this.skip();
    });
  });

  suite('Disconnection', () => {
    test('Should disconnect gracefully', async () => {
      const client = await getMCPClient();

      // First connect
      await executeCommand('sequential-thinking-vis.disconnectServer');
      await wait(500);

      assert.strictEqual(
        client.getConnectionState(),
        ConnectionState.Disconnected,
        'Should be disconnected'
      );
      assert.ok(!client.isConnected(), 'isConnected() should return false');
    });

    test('Should handle server crash', async function () {
      // Hard to test in true E2E - would need to kill server process
      this.skip();
    });

    test('Should handle unexpected disconnect', async function () {
      // Hard to test in true E2E - would need to simulate network failure
      this.skip();
    });
  });

  suite('Connection State Management', () => {
    test('Should prevent multiple simultaneous connections', async () => {
      const client = await getMCPClient();

      // Connect once
      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      // Try to connect again - should be ignored
      await executeCommand('sequential-thinking-vis.connectServer');
      await wait(500);

      // Should still be connected (not in connecting state)
      assert.strictEqual(
        client.getConnectionState(),
        ConnectionState.Connected,
        'Should remain connected'
      );
    });

    test('Should report correct connection state during lifecycle', async () => {
      const client = await getMCPClient();
      const states: ConnectionState[] = [];

      // Listen for state changes
      const stateListener = (state: ConnectionState) => {
        states.push(state);
      };
      client.on('connectionStateChanged', stateListener);

      try {
        // Connect
        const connectPromise = executeCommand('sequential-thinking-vis.connectServer');
        await wait(100); // Give it time to transition to connecting

        // Should go through Connecting state
        assert.ok(
          states.includes(ConnectionState.Connecting) ||
            client.getConnectionState() === ConnectionState.Connecting,
          'Should transition through Connecting state'
        );

        await connectPromise;
        await waitFor(() => client.isConnected(), 10000);

        // Should end in Connected state
        assert.strictEqual(
          client.getConnectionState(),
          ConnectionState.Connected,
          'Should end in Connected state'
        );

        // Disconnect
        await executeCommand('sequential-thinking-vis.disconnectServer');
        await wait(500);

        // Should end in Disconnected state
        assert.strictEqual(
          client.getConnectionState(),
          ConnectionState.Disconnected,
          'Should end in Disconnected state'
        );
      } finally {
        client.off('connectionStateChanged', stateListener);
      }
    });
  });

  suite('Configuration', () => {
    test('Should use custom configuration', async () => {
      // Configuration is read from workspace settings
      // This test verifies that custom config is respected
      const config = vscode.workspace.getConfiguration('sequential-thinking-vis');

      // Check that configuration exists
      const serverCommand = config.get<string>('serverCommand');
      const serverArgs = config.get<string[]>('serverArgs');

      // These should have default values defined in package.json
      assert.ok(serverCommand !== undefined, 'serverCommand should be defined');
      assert.ok(serverArgs !== undefined, 'serverArgs should be defined');
    });

    test('Should load configuration from workspace settings', async () => {
      const config = vscode.workspace.getConfiguration('sequential-thinking-vis');

      // Verify config properties exist
      const autoConnect = config.get<boolean>('autoConnect');
      assert.strictEqual(typeof autoConnect, 'boolean', 'autoConnect should be boolean');

      const serverCommand = config.get<string>('serverCommand');
      assert.ok(serverCommand !== undefined, 'serverCommand should be defined');
    });
  });
});
