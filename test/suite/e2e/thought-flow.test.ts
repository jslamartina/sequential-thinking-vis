/**
 * E2E Thought Flow Tests
 * Tests thought processing and flow patterns with real MCP server
 */

import * as assert from 'assert';
import {
  getMCPClient,
  executeCommand,
  wait,
  waitFor,
  ensureExtensionActivated,
} from '../../helpers/e2e-setup';

suite('E2E Thought Flow Tests', function () {
  this.timeout(15000);

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

  suite('Linear Thought Flow', () => {
    test('Should receive and process linear thoughts', async () => {
      const client = await getMCPClient();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Linear flow test');

      // Add sequential thoughts
      await client.callSequentialThinking({
        thought: 'First thought',
        thoughtNumber: 1,
        totalThoughts: 3,
        nextThoughtNeeded: true,
      });

      await client.callSequentialThinking({
        thought: 'Second thought',
        thoughtNumber: 2,
        totalThoughts: 3,
        nextThoughtNeeded: true,
      });

      await client.callSequentialThinking({
        thought: 'Third thought',
        thoughtNumber: 3,
        totalThoughts: 3,
        nextThoughtNeeded: false,
      });

      await wait(500);

      const session = client.getCurrentSession();
      assert.ok(session, 'Should have active session');
      assert.strictEqual(session!.thoughts.length, 3, 'Should have 3 thoughts');
      assert.strictEqual(session!.thoughts[0].thoughtNumber, 1, 'First thought should be #1');
      assert.strictEqual(session!.thoughts[2].thoughtNumber, 3, 'Last thought should be #3');
    });

    test('Should update progress as thoughts arrive', async () => {
      const client = await getMCPClient();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Progress test');

      let thoughtCount = 0;
      client.on('thoughtAdded', () => {
        thoughtCount++;
      });

      // Add thoughts one by one
      await client.callSequentialThinking({
        thought: 'Thought 1',
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true,
      });

      await wait(200);
      assert.strictEqual(thoughtCount, 1, 'Should have 1 thought after first add');

      await client.callSequentialThinking({
        thought: 'Thought 2',
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false,
      });

      await wait(200);
      assert.strictEqual(thoughtCount, 2, 'Should have 2 thoughts after second add');
    });

    test('Should handle final thought completion', async () => {
      const client = await getMCPClient();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Final thought test');

      await client.callSequentialThinking({
        thought: 'Final thought',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false, // This is the final thought
      });

      await wait(500);

      const session = client.getCurrentSession();
      const finalThought = session!.thoughts[0];

      assert.strictEqual(finalThought.nextThoughtNeeded, false, 'Should mark as final');
      assert.strictEqual(
        finalThought.thoughtNumber,
        finalThought.totalThoughts,
        'Should be complete'
      );
    });
  });

  suite('Branched Thought Flow', () => {
    test('Should track multiple branches', async () => {
      const client = await getMCPClient();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Branch tracking test');

      // Base thought
      await client.callSequentialThinking({
        thought: 'Base thought',
        thoughtNumber: 1,
        totalThoughts: 4,
        nextThoughtNeeded: true,
      });

      // Branch A
      await client.callSequentialThinking({
        thought: 'Branch A thought',
        thoughtNumber: 2,
        totalThoughts: 4,
        nextThoughtNeeded: true,
        branchId: 'branch-a',
        branchFromThought: 1,
      });

      // Branch B
      await client.callSequentialThinking({
        thought: 'Branch B thought',
        thoughtNumber: 3,
        totalThoughts: 4,
        nextThoughtNeeded: true,
        branchId: 'branch-b',
        branchFromThought: 1,
      });

      await wait(500);

      const session = client.getCurrentSession();
      assert.ok(session, 'Should have session');
      assert.ok(session!.branches.has('branch-a'), 'Should track branch A');
      assert.ok(session!.branches.has('branch-b'), 'Should track branch B');
    });

    test('Should maintain branch relationships', async () => {
      const client = await getMCPClient();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Branch relationships test');

      await client.callSequentialThinking({
        thought: 'Base',
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true,
      });

      await client.callSequentialThinking({
        thought: 'Branched',
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false,
        branchId: 'test-branch',
        branchFromThought: 1,
      });

      await wait(500);

      const session = client.getCurrentSession();
      const branchedThought = session!.thoughts[1];

      assert.strictEqual(branchedThought.branchId, 'test-branch', 'Should have branch ID');
      assert.strictEqual(branchedThought.branchFromThought, 1, 'Should reference parent thought');
    });
  });

  suite('Revised Thought Flow', () => {
    test('Should track revisions', async () => {
      const client = await getMCPClient();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Revision tracking test');

      // Original thought
      await client.callSequentialThinking({
        thought: 'Original thought',
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true,
      });

      // Revision
      await client.callSequentialThinking({
        thought: 'Revised thought',
        thoughtNumber: 2,
        totalThoughts: 2,
        nextThoughtNeeded: false,
        isRevision: true,
        revisesThought: 1,
      });

      await wait(500);

      const session = client.getCurrentSession();
      const revision = session!.thoughts[1];

      assert.strictEqual(revision.isRevision, true, 'Should be marked as revision');
      assert.strictEqual(revision.revisesThought, 1, 'Should reference revised thought');
    });

    test('Should adjust total thoughts on revision', async () => {
      const client = await getMCPClient();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Total adjustment test');

      await client.callSequentialThinking({
        thought: 'Initial thought',
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true,
      });

      // Revision that changes total
      await client.callSequentialThinking({
        thought: 'Revision expanding scope',
        thoughtNumber: 2,
        totalThoughts: 4, // Increased total
        nextThoughtNeeded: true,
        isRevision: true,
        revisesThought: 1,
        needsMoreThoughts: true,
      });

      await wait(500);

      const session = client.getCurrentSession();
      const revision = session!.thoughts[1];

      assert.strictEqual(revision.totalThoughts, 4, 'Should update total thoughts');
      assert.strictEqual(revision.needsMoreThoughts, true, 'Should indicate more thoughts needed');
    });
  });

  suite('Complex Mixed Flow', () => {
    test('Should handle complex scenarios with branches and revisions', async () => {
      const client = await getMCPClient();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Complex flow test');

      // Base
      await client.callSequentialThinking({
        thought: 'Base analysis',
        thoughtNumber: 1,
        totalThoughts: 5,
        nextThoughtNeeded: true,
      });

      // Branch A
      await client.callSequentialThinking({
        thought: 'Approach A',
        thoughtNumber: 2,
        totalThoughts: 5,
        nextThoughtNeeded: true,
        branchId: 'approach-a',
        branchFromThought: 1,
      });

      // Revision of Branch A
      await client.callSequentialThinking({
        thought: 'Revised Approach A',
        thoughtNumber: 3,
        totalThoughts: 5,
        nextThoughtNeeded: true,
        branchId: 'approach-a',
        isRevision: true,
        revisesThought: 2,
      });

      // Branch B
      await client.callSequentialThinking({
        thought: 'Approach B',
        thoughtNumber: 4,
        totalThoughts: 5,
        nextThoughtNeeded: true,
        branchId: 'approach-b',
        branchFromThought: 1,
      });

      // Final decision
      await client.callSequentialThinking({
        thought: 'Final decision',
        thoughtNumber: 5,
        totalThoughts: 5,
        nextThoughtNeeded: false,
      });

      await wait(500);

      const session = client.getCurrentSession();
      assert.strictEqual(session!.thoughts.length, 5, 'Should have all thoughts');
      assert.strictEqual(session!.branches.size, 2, 'Should track both branches');

      const hasRevision = session!.thoughts.some((t) => t.isRevision);
      assert.ok(hasRevision, 'Should include revision');

      const hasBranches = session!.thoughts.some((t) => t.branchId);
      assert.ok(hasBranches, 'Should include branches');
    });
  });

  suite('Session Management', () => {
    test('Should handle session start event', async () => {
      const client = await getMCPClient();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      let sessionStarted = false;
      client.once('sessionStarted', () => {
        sessionStarted = true;
      });

      client.startSession('Event test');

      await wait(200);
      assert.ok(sessionStarted, 'Should emit sessionStarted event');
    });

    test('Should handle session end event', async () => {
      const client = await getMCPClient();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('End event test');

      let sessionEnded = false;
      client.once('sessionEnded', () => {
        sessionEnded = true;
      });

      client.endSession();

      await wait(200);
      assert.ok(sessionEnded, 'Should emit sessionEnded event');
    });

    test('Should support multiple sequential sessions', async () => {
      const client = await getMCPClient();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      // Session 1
      const session1Id = client.startSession('Session 1');
      await client.callSequentialThinking({
        thought: 'Thought from session 1',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
      });
      client.endSession();

      await wait(200);

      // Session 2
      const session2Id = client.startSession('Session 2');
      await client.callSequentialThinking({
        thought: 'Thought from session 2',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
      });

      await wait(200);

      assert.notStrictEqual(session1Id, session2Id, 'Should have different session IDs');
      assert.ok(client.getCurrentSession(), 'Second session should be active');
    });
  });

  suite('Error Handling', () => {
    test('Should handle malformed thought data', async () => {
      // In a real E2E test, we can't easily send malformed data through the real MCP server
      // This test verifies the extension doesn't crash with edge cases
      const client = await getMCPClient();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Error handling test');

      // Try with minimal valid thought
      await client.callSequentialThinking({
        thought: '',
        thoughtNumber: 1,
        totalThoughts: 1,
        nextThoughtNeeded: false,
      });

      await wait(500);

      // Should still have a session (didn't crash)
      assert.ok(client.getCurrentSession(), 'Should maintain session after edge case');
    });

    test('Should continue after individual thought error', async () => {
      const client = await getMCPClient();

      await executeCommand('sequential-thinking-vis.connectServer');
      await waitFor(() => client.isConnected(), 10000);

      client.startSession('Recovery test');

      // Add valid thought
      await client.callSequentialThinking({
        thought: 'Valid thought',
        thoughtNumber: 1,
        totalThoughts: 2,
        nextThoughtNeeded: true,
      });

      // Try to add another (might fail for various reasons)
      try {
        await client.callSequentialThinking({
          thought: 'Another thought',
          thoughtNumber: 2,
          totalThoughts: 2,
          nextThoughtNeeded: false,
        });
      } catch (error) {
        // Expected - testing recovery
      }

      await wait(500);

      // Should still be connected and have session
      assert.ok(client.isConnected(), 'Should remain connected after error');
      assert.ok(client.getCurrentSession(), 'Should maintain session after error');
    });
  });
});
