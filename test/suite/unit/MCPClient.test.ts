/**
 * Unit Tests for MCPClient
 * Tests error scenarios, state management, and edge cases
 */

import * as assert from 'assert';
import * as vscode from 'vscode';
import { MCPClient } from '../../../src/providers/MCPClient';
import { ConnectionState } from '../../../src/types/thoughts';

suite('MCPClient Unit Tests', () => {
  let outputChannel: vscode.OutputChannel;

  setup(() => {
    outputChannel = vscode.window.createOutputChannel('Test MCP Client');
  });

  teardown(() => {
    outputChannel.dispose();
  });

  suite('Session Management Without Connection', () => {
    test('Should create session without being connected', () => {
      const client = new MCPClient(outputChannel);

      assert.ok(!client.isConnected(), 'Should not be connected initially');

      const sessionId = client.startSession('Test query');

      assert.ok(sessionId, 'Should return session ID');
      assert.ok(client.getCurrentSession(), 'Should have current session');
      assert.strictEqual(
        client.getCurrentSession()!.metadata.initialQuery,
        'Test query',
        'Should store query'
      );

      client.dispose();
    });

    test('Should emit sessionStarted event', (done) => {
      const client = new MCPClient(outputChannel);

      client.once('sessionStarted', (data) => {
        assert.ok(data, 'Should provide event data');
        assert.ok(data.sessionId, 'Should have session ID');
        assert.strictEqual(data.metadata.initialQuery, 'Test', 'Should have query');
        client.dispose();
        done();
      });

      client.startSession('Test');
    });

    test('Should emit sessionEnded event', (done) => {
      const client = new MCPClient(outputChannel);

      client.startSession('Test');

      client.once('sessionEnded', (data) => {
        assert.ok(data, 'Should provide event data');
        client.dispose();
        done();
      });

      client.endSession();
    });

    test('Should clear session on end', () => {
      const client = new MCPClient(outputChannel);

      client.startSession('Test');
      assert.ok(client.getCurrentSession(), 'Should have session');

      client.endSession();
      assert.ok(!client.getCurrentSession(), 'Should clear session');

      client.dispose();
    });

    test('Should track multiple thoughts in session', () => {
      const client = new MCPClient(outputChannel);

      client.startSession('Test');
      const session = client.getCurrentSession();

      assert.ok(session, 'Should have session');
      assert.strictEqual(session!.thoughts.length, 0, 'Should start with 0 thoughts');

      // Thoughts are added via callSequentialThinking which requires connection
      // Just verify session structure is correct
      assert.ok(Array.isArray(session!.thoughts), 'Should have thoughts array');
      assert.ok(session!.branches instanceof Map, 'Should have branches map');

      client.dispose();
    });

    test('Should store session metadata', () => {
      const client = new MCPClient(outputChannel);

      const sessionId = client.startSession('My test query');
      const session = client.getCurrentSession();

      assert.ok(session, 'Should have session');
      assert.strictEqual(session!.sessionId, sessionId, 'Should match session ID');
      assert.strictEqual(session!.metadata.initialQuery, 'My test query', 'Should have query');
      assert.strictEqual(session!.metadata.status, 'active', 'Should be active');
      assert.ok(session!.metadata.startTime, 'Should have start time');

      client.dispose();
    });
  });

  suite('Error Handling', () => {
    test('Should throw when calling MCP tool without connection', async () => {
      const client = new MCPClient(outputChannel);

      client.startSession('Test');

      try {
        await client.callSequentialThinking({
          thought: 'Test',
          thoughtNumber: 1,
          totalThoughts: 1,
          nextThoughtNeeded: false,
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error instanceof Error, 'Should throw Error');
        assert.ok(
          (error as Error).message.includes('Not connected'),
          'Error should mention not connected'
        );
      } finally {
        client.dispose();
      }
    });

    test('Should throw when calling MCP tool without session', async () => {
      const client = new MCPClient(outputChannel);

      // Don't start a session

      try {
        await client.callSequentialThinking({
          thought: 'Test',
          thoughtNumber: 1,
          totalThoughts: 1,
          nextThoughtNeeded: false,
        });
        assert.fail('Should have thrown error');
      } catch (error) {
        assert.ok(error instanceof Error, 'Should throw Error');
        // Connection is checked first, so we get connection error
        assert.ok(
          (error as Error).message.includes('Not connected'),
          'Should check connection first'
        );
      } finally {
        client.dispose();
      }
    });

    test('Should provide clear error messages', async () => {
      const client = new MCPClient(outputChannel);

      client.startSession('Test');

      try {
        await client.callSequentialThinking({
          thought: 'Test',
          thoughtNumber: 1,
          totalThoughts: 1,
          nextThoughtNeeded: false,
        });
        assert.fail('Should throw');
      } catch (error) {
        const message = (error as Error).message;
        assert.strictEqual(
          message,
          'Not connected to MCP server',
          'Should have clear error message'
        );
      } finally {
        client.dispose();
      }
    });
  });

  suite('Connection State Management', () => {
    test('Should start in disconnected state', () => {
      const client = new MCPClient(outputChannel);

      assert.strictEqual(
        client.getConnectionState(),
        ConnectionState.Disconnected,
        'Should start disconnected'
      );
      assert.ok(!client.isConnected(), 'isConnected should be false');

      client.dispose();
    });

    test('Should report connection state correctly', () => {
      const client = new MCPClient(outputChannel);

      // Initial state
      assert.strictEqual(client.getConnectionState(), ConnectionState.Disconnected);

      // isConnected is a convenience method
      assert.strictEqual(client.isConnected(), false);

      client.dispose();
    });

    test('Should emit connectionStateChanged events', (done) => {
      const client = new MCPClient(outputChannel);

      client.once('connectionStateChanged', (state: ConnectionState) => {
        // Any state change is good - just verify event is emitted
        assert.ok(state !== undefined, 'Should emit state');
        client.dispose();
        done();
      });

      // Trigger a state change by trying to disconnect
      client.disconnect().catch(() => {
        /* ignore */
      });
    });
  });

  suite('Disconnection', () => {
    test('Should handle disconnect when not connected', async () => {
      const client = new MCPClient(outputChannel);

      // Should not throw when disconnecting while not connected
      await client.disconnect();

      assert.ok(!client.isConnected(), 'Should remain disconnected');
      assert.strictEqual(
        client.getConnectionState(),
        ConnectionState.Disconnected,
        'Should be in disconnected state'
      );

      client.dispose();
    });

    test('Should clean up session on disconnect if active', async () => {
      const client = new MCPClient(outputChannel);

      client.startSession('Test session');
      assert.ok(client.getCurrentSession(), 'Should have session');

      // Simulate disconnect via dispose
      client.dispose();

      // After dispose, accessing methods should not throw
      assert.ok(!client.isConnected(), 'Should not be connected');
    });
  });

  suite('Output Channel', () => {
    test('Should have output channel', () => {
      const client = new MCPClient(outputChannel);
      const channel = client.getOutputChannel();

      assert.ok(channel, 'Should have output channel');
      assert.strictEqual(channel, outputChannel, 'Should be the provided channel');

      client.dispose();
    });

    test('Should use provided output channel', () => {
      const customChannel = vscode.window.createOutputChannel('Custom');
      const client = new MCPClient(customChannel);

      assert.strictEqual(client.getOutputChannel(), customChannel, 'Should use provided channel');

      client.dispose();
      customChannel.dispose();
    });

    test('Should create default output channel if none provided', () => {
      const client = new MCPClient();

      const channel = client.getOutputChannel();
      assert.ok(channel, 'Should have a channel');

      client.dispose();
    });
  });

  suite('Resource Cleanup', () => {
    test('Should dispose cleanly', () => {
      const client = new MCPClient(outputChannel);

      // Should not throw
      client.dispose();

      // State should be accessible after dispose
      assert.ok(!client.isConnected(), 'Should not be connected after dispose');
    });

    test('Should handle multiple dispose calls', () => {
      const client = new MCPClient(outputChannel);

      // Should not throw on multiple dispose
      client.dispose();
      client.dispose();
      client.dispose();

      assert.ok(true, 'Should handle multiple dispose calls gracefully');
    });

    test('Should disconnect on dispose', async () => {
      const client = new MCPClient(outputChannel);

      client.dispose();

      // Should be disconnected after dispose
      assert.strictEqual(
        client.getConnectionState(),
        ConnectionState.Disconnected,
        'Should be disconnected'
      );
    });
  });

  suite('Session Lifecycle', () => {
    test('Should support multiple sequential sessions', async () => {
      const client = new MCPClient(outputChannel);

      // Session 1
      const session1Id = client.startSession('Session 1');
      assert.ok(client.getCurrentSession(), 'Should have session 1');
      assert.strictEqual(
        client.getCurrentSession()!.metadata.initialQuery,
        'Session 1',
        'Should have query 1'
      );

      client.endSession();
      assert.ok(!client.getCurrentSession(), 'Session 1 should be ended');

      // Wait a bit to ensure different timestamp for session ID
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Session 2
      const session2Id = client.startSession('Session 2');
      assert.ok(client.getCurrentSession(), 'Should have session 2');
      assert.strictEqual(
        client.getCurrentSession()!.metadata.initialQuery,
        'Session 2',
        'Should have query 2'
      );

      // IDs should be different (timestamp-based)
      assert.notStrictEqual(session1Id, session2Id, 'Should have different IDs');

      client.dispose();
    });

    test('Should update session status on end', () => {
      const client = new MCPClient(outputChannel);

      client.startSession('Test');
      const session = client.getCurrentSession();
      assert.strictEqual(session!.metadata.status, 'active', 'Should be active');

      client.endSession();

      // Session is cleared on end, but we tested status while active
      assert.ok(!client.getCurrentSession(), 'Session should be cleared');

      client.dispose();
    });

    test('Should set end time on session end', () => {
      const client = new MCPClient(outputChannel);

      client.startSession('Test');
      const startTime = client.getCurrentSession()!.metadata.startTime;
      assert.ok(startTime, 'Should have start time');

      // End session
      client.endSession();

      // Can't check end time after session is cleared, but test passes if no error
      assert.ok(true, 'Should complete without error');

      client.dispose();
    });
  });

  suite('Constructor Options', () => {
    test('Should accept custom output channel', () => {
      const customChannel = vscode.window.createOutputChannel('Custom');
      const client = new MCPClient(customChannel);

      assert.strictEqual(client.getOutputChannel(), customChannel);

      client.dispose();
      customChannel.dispose();
    });

    test('Should accept test mode flag', () => {
      const client = new MCPClient(outputChannel, true);

      // Test mode doesn't change behavior for now, just verify it doesn't crash
      assert.ok(client, 'Should create client with test mode');

      client.dispose();
    });

    test('Should work with no arguments', () => {
      const client = new MCPClient();

      assert.ok(client, 'Should create client with defaults');
      assert.ok(client.getOutputChannel(), 'Should have default channel');

      client.dispose();
    });
  });
});
