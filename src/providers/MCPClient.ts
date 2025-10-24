/**
 * MCP Client wrapper for connecting to the sequential-thinking MCP server
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';
import * as vscode from 'vscode';
import {
  ConnectionState,
  MCPConnectionConfig,
  ThoughtNode,
  ThoughtTree,
  SequentialThinkingResult,
} from '../types/thoughts';

/**
 * MCPClient manages connection to the sequential-thinking MCP server
 * and provides methods for calling the sequential-thinking tool.
 */
export class MCPClient extends EventEmitter {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private serverProcess: ChildProcess | null = null;
  private connectionState: ConnectionState = ConnectionState.Disconnected;
  private currentSession: ThoughtTree | null = null;
  private outputChannel: vscode.OutputChannel;
  private isTestMode: boolean = false;

  constructor(outputChannel?: vscode.OutputChannel, testMode: boolean = false) {
    super();
    this.outputChannel =
      outputChannel || vscode.window.createOutputChannel('MCP Sequential Thinking');
    this.isTestMode = testMode;
  }

  /**
   * Get the current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Get the current session
   */
  getCurrentSession(): ThoughtTree | null {
    return this.currentSession;
  }

  /**
   * Check if currently connected to MCP server
   */
  isConnected(): boolean {
    return this.connectionState === ConnectionState.Connected;
  }

  /**
   * Connect to the MCP sequential-thinking server
   */
  async connect(config?: MCPConnectionConfig): Promise<void> {
    if (this.connectionState === ConnectionState.Connected) {
      this.outputChannel.appendLine('Already connected to MCP server');
      return;
    }

    this.setConnectionState(ConnectionState.Connecting);
    this.outputChannel.appendLine('Connecting to MCP server...');

    try {
      // Use provided config or default
      const serverConfig = config || this.getDefaultConfig();

      this.outputChannel.appendLine(
        `Starting MCP server: ${serverConfig.command} ${serverConfig.args.join(' ')}`
      );

      // Spawn the MCP server process
      const env: Record<string, string> = {};
      for (const [key, value] of Object.entries(process.env)) {
        if (value !== undefined) {
          env[key] = value;
        }
      }
      if (serverConfig.env) {
        Object.assign(env, serverConfig.env);
      }

      this.serverProcess = spawn(serverConfig.command, serverConfig.args, {
        env,
        cwd: serverConfig.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      // Log server stderr for debugging
      this.serverProcess.stderr?.on('data', (data) => {
        this.outputChannel.appendLine(`[Server stderr]: ${data.toString()}`);
      });

      // Handle server process exit
      this.serverProcess.on('exit', (code, signal) => {
        this.outputChannel.appendLine(`MCP server exited with code ${code}, signal ${signal}`);
        this.handleDisconnect();
      });

      // Create stdio transport
      this.transport = new StdioClientTransport({
        command: serverConfig.command,
        args: serverConfig.args,
        env,
      });

      // Create MCP client
      this.client = new Client(
        {
          name: 'sequential-thinking-vis',
          version: '0.0.1',
        },
        {
          capabilities: {},
        }
      );

      // Connect client to transport
      await this.client.connect(this.transport);

      this.setConnectionState(ConnectionState.Connected);
      this.outputChannel.appendLine('✓ Connected to MCP server');

      // Log available tools
      const tools = await this.client.listTools();
      this.outputChannel.appendLine(
        `Available tools: ${tools.tools.map((t) => t.name).join(', ')}`
      );
    } catch (error) {
      this.setConnectionState(ConnectionState.Error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`✗ Connection failed: ${errorMessage}`);
      vscode.window.showErrorMessage(`Failed to connect to MCP server: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Disconnect from the MCP server
   */
  async disconnect(): Promise<void> {
    this.outputChannel.appendLine('Disconnecting from MCP server...');

    try {
      if (this.client) {
        await this.client.close();
        this.client = null;
      }

      if (this.transport) {
        await this.transport.close();
        this.transport = null;
      }

      if (this.serverProcess) {
        this.serverProcess.kill();
        this.serverProcess = null;
      }

      this.handleDisconnect();
      this.outputChannel.appendLine('✓ Disconnected');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`Error during disconnect: ${errorMessage}`);
    }
  }

  /**
   * Start a new sequential thinking session
   */
  startSession(initialQuery: string): string {
    const sessionId = `session-${Date.now()}`;
    this.currentSession = {
      sessionId,
      thoughts: [],
      branches: new Map(),
      metadata: {
        startTime: new Date().toISOString(),
        status: 'active',
        initialQuery,
      },
    };

    this.outputChannel.appendLine(`\n=== Started new session: ${sessionId} ===`);
    this.outputChannel.appendLine(`Query: ${initialQuery}\n`);

    this.emit('sessionStarted', this.currentSession);
    return sessionId;
  }

  /**
   * End the current session
   */
  endSession(): void {
    if (this.currentSession) {
      this.currentSession.metadata.endTime = new Date().toISOString();
      this.currentSession.metadata.status = 'completed';

      this.outputChannel.appendLine(`\n=== Ended session: ${this.currentSession.sessionId} ===`);
      this.outputChannel.appendLine(`Total thoughts: ${this.currentSession.thoughts.length}\n`);

      this.emit('sessionEnded', this.currentSession);
      this.currentSession = null;
    }
  }

  /**
   * Call the sequential-thinking tool with the provided thought
   */
  async callSequentialThinking(
    thoughtNode: Omit<ThoughtNode, 'timestamp'>
  ): Promise<SequentialThinkingResult> {
    if (!this.client) {
      throw new Error('Not connected to MCP server');
    }

    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.outputChannel.appendLine(
      `[Thought ${thoughtNode.thoughtNumber}] ${thoughtNode.thought.substring(0, 100)}...`
    );

    try {
      // Call the sequential-thinking tool
      const result = await this.client.callTool({
        name: 'sequentialthinking',
        arguments: {
          thought: thoughtNode.thought,
          thoughtNumber: thoughtNode.thoughtNumber,
          totalThoughts: thoughtNode.totalThoughts,
          nextThoughtNeeded: thoughtNode.nextThoughtNeeded,
          ...(thoughtNode.isRevision && { isRevision: thoughtNode.isRevision }),
          ...(thoughtNode.revisesThought && {
            revisesThought: thoughtNode.revisesThought,
          }),
          ...(thoughtNode.branchFromThought && {
            branchFromThought: thoughtNode.branchFromThought,
          }),
          ...(thoughtNode.branchId && { branchId: thoughtNode.branchId }),
          ...(thoughtNode.needsMoreThoughts && {
            needsMoreThoughts: thoughtNode.needsMoreThoughts,
          }),
        },
      });

      // Parse the result
      const content = (result.content as Array<{ type: string; text?: string }>)[0];
      const resultData =
        content.type === 'text' && content.text
          ? JSON.parse(content.text)
          : ({} as SequentialThinkingResult);

      // Add thought to session
      const completeThought: ThoughtNode = {
        ...thoughtNode,
        timestamp: new Date().toISOString(),
      };

      this.currentSession.thoughts.push(completeThought);

      // Track branches
      if (thoughtNode.branchId) {
        if (!this.currentSession.branches.has(thoughtNode.branchId)) {
          this.currentSession.branches.set(thoughtNode.branchId, []);
        }
        this.currentSession.branches.get(thoughtNode.branchId)!.push(completeThought);
      }

      // Emit event for UI updates
      this.emit('thoughtAdded', completeThought);

      return resultData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.outputChannel.appendLine(`✗ Error calling tool: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Get the output channel for this client
   */
  getOutputChannel(): vscode.OutputChannel {
    return this.outputChannel;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.disconnect();
    this.outputChannel.dispose();
  }

  private getDefaultConfig(): MCPConnectionConfig {
    return {
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-sequential-thinking'],
      cwd: process.cwd(),
    };
  }

  private setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.emit('connectionStateChanged', state);
  }

  private handleDisconnect(): void {
    this.client = null;
    this.transport = null;
    this.serverProcess = null;
    this.setConnectionState(ConnectionState.Disconnected);

    // End current session if any
    if (this.currentSession && this.currentSession.metadata.status === 'active') {
      this.currentSession.metadata.status = 'error';
      this.currentSession.metadata.endTime = new Date().toISOString();
      this.emit('sessionEnded', this.currentSession);
    }
  }
}
