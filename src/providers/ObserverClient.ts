/**
 * ObserverClient - TCP client for observing MCP thought stream
 *
 * Connects to the stream tapper's TCP socket to receive real-time
 * JSON-RPC messages and extract sequential thinking thoughts.
 */

import * as net from 'net';
import { EventEmitter } from 'events';
import { ThoughtEvent } from '../types/thoughts';
import { readPort } from '../mcp-server/config';

/**
 * ObserverClient connects to the tapper TCP socket and parses thought events
 *
 * Events:
 * - 'thought': (event: ThoughtEvent) => void - New thought observed
 * - 'connected': () => void - Connected to tapper
 * - 'disconnected': () => void - Disconnected from tapper
 * - 'error': (error: Error) => void - Connection or parsing error
 */
export class ObserverClient extends EventEmitter {
  private socket: net.Socket | null = null;
  private buffer: string = '';
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting: boolean = false;
  private shouldReconnect: boolean = true;

  constructor() {
    super();
  }

  /**
   * Connect to the tapper TCP socket
   * Reads port from config file, fails gracefully if not available
   */
  connect(): void {
    if (this.isConnecting || this.isConnected()) {
      console.log('[ObserverClient] Already connecting or connected');
      return;
    }

    console.log('[ObserverClient] Starting connection...');
    this.isConnecting = true;

    const port = readPort();
    console.log('[ObserverClient] Port from file:', port);

    if (!port) {
      console.log('[ObserverClient] No port found - tapper not available');
      this.isConnecting = false;
      this.emit('error', new Error('Tapper not available (port file not found)'));
      this.scheduleReconnect();
      return;
    }

    console.log(`[ObserverClient] Connecting to localhost:${port}`);
    this.socket = net.connect(port, '127.0.0.1');

    this.socket.on('connect', () => {
      console.log('[ObserverClient] ✓ Connected successfully!');
      this.isConnecting = false;
      this.emit('connected');

      // Enable TCP keepalive to prevent idle connection timeout
      if (this.socket) {
        this.socket.setKeepAlive(true, 60000); // Send keepalive probes every 60 seconds
        console.log('[ObserverClient] TCP keepalive enabled');
      }

      // Clear reconnect timer on successful connection
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    });

    this.socket.on('data', (chunk: Buffer) => {
      console.log(`[ObserverClient] Received ${chunk.length} bytes`);
      this.handleData(chunk);
    });

    this.socket.on('close', () => {
      console.log('[ObserverClient] Connection closed');
      this.isConnecting = false;
      this.socket = null;
      this.emit('disconnected');

      if (this.shouldReconnect) {
        this.scheduleReconnect();
      }
    });

    this.socket.on('error', (err: Error) => {
      console.log(`[ObserverClient] Connection error: ${err.message}`);
      this.isConnecting = false;
      this.socket = null;
      this.emit('error', err);
    });
  }

  /**
   * Disconnect from tapper
   */
  disconnect(): void {
    this.shouldReconnect = false;

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket !== null && !this.socket.destroyed;
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.disconnect();
    this.removeAllListeners();
  }

  /**
   * Handle incoming data from TCP socket
   * Buffers and parses newline-delimited JSON-RPC messages
   */
  private handleData(chunk: Buffer): void {
    const chunkStr = chunk.toString('utf-8');
    console.log(`[ObserverClient] Raw data: ${chunkStr.substring(0, 100)}...`);

    // Append to buffer
    this.buffer += chunkStr;
    console.log(`[ObserverClient] Buffer size: ${this.buffer.length} chars`);

    // Split by newlines (JSON-RPC messages are newline-delimited)
    const lines = this.buffer.split('\n');

    // Keep incomplete line in buffer
    this.buffer = lines.pop() || '';
    console.log(`[ObserverClient] Processing ${lines.length} complete lines`);

    // Process complete lines
    for (const line of lines) {
      if (line.trim().length === 0) {
        continue;
      }

      console.log(`[ObserverClient] Parsing line: ${line.substring(0, 100)}...`);
      try {
        const message = JSON.parse(line);
        console.log('[ObserverClient] ✓ JSON parsed successfully');
        this.handleMessage(message);
      } catch (error) {
        // Skip invalid JSON - log for debugging but don't crash
        console.warn('[ObserverClient] ✗ Invalid JSON:', line.substring(0, 100));
      }
    }
  }

  /**
   * Handle parsed JSON-RPC message
   * Extracts thought data from sequentialthinking tool calls
   */
  private handleMessage(message: unknown): void {
    // Type guard for JSON-RPC message structure
    if (typeof message !== 'object' || message === null) {
      return;
    }

    const msg = message as Record<string, unknown>;

    console.log('[ObserverClient] Received message:', JSON.stringify(msg).substring(0, 200));

    // Request: AI → Server (contains thought parameters)
    if (msg.method === 'tools/call') {
      const params = msg.params as Record<string, unknown> | undefined;
      const toolName = params?.name;
      console.log('[ObserverClient] Tool call:', toolName);

      if (toolName === 'sequentialthinking' && params) {
        const thoughtData = params.arguments;
        console.log('[ObserverClient] Found sequential-thinking call!');

        if (thoughtData && typeof thoughtData === 'object') {
          const event: ThoughtEvent = {
            type: 'request',
            data: thoughtData,
            timestamp: new Date().toISOString(),
          };

          console.log('[ObserverClient] Emitting thought event');
          this.emit('thought', event);
        }
      }
    }

    // Response: Server → AI (contains tool result)
    // Note: We primarily care about requests (the thought itself),
    // but responses could be used for additional metadata
    if (msg.result) {
      // Could emit response events here if needed
      // For now, we focus on request thoughts
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer || !this.shouldReconnect) {
      return;
    }

    // Try to reconnect every 5 seconds
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }
}
