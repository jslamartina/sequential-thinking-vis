#!/usr/bin/env node
/**
 * Stream Tapper - Transparent MCP stdio proxy with TCP broadcast
 *
 * This process acts as a transparent proxy between an AI tool (Claude Desktop,
 * Cursor, etc.) and the @modelcontextprotocol/server-sequential-thinking server.
 *
 * It forwards all stdio communication transparently while broadcasting the
 * stdout to TCP clients (VS Code extension) for real-time observation.
 *
 * Usage:
 *   node out/mcp-server/index.js
 *   (Configure this in Claude Desktop or Cursor MCP settings)
 *
 * Flow:
 *   AI Tool → stdin → Server
 *   Server → stdout → AI Tool (primary, must not fail)
 *                  └→ TCP clients (secondary, may fail safely)
 */

import * as net from 'net';
import * as fs from 'fs';
import { spawn } from 'child_process';
import { getServerPackageSpec, writePort, removePortFile, getPortFile } from './config.js';

// Track connected TCP clients
const sockets: net.Socket[] = [];

// Create TCP server for extension to connect to
const socketServer = net.createServer((socket) => {
  const clientInfo = `${socket.remoteAddress}:${socket.remotePort}`;
  console.error(`[Tapper] ✓ New observer client connected from ${clientInfo}`);
  console.error(`[Tapper] Total clients: ${sockets.length + 1}`);

  // Enable TCP keepalive to prevent idle connection timeout
  socket.setKeepAlive(true, 60000); // Send keepalive probes every 60 seconds
  console.error(`[Tapper] TCP keepalive enabled for ${clientInfo}`);

  sockets.push(socket);

  socket.on('close', () => {
    console.error(`[Tapper] Observer client disconnected: ${clientInfo}`);
    const index = sockets.indexOf(socket);
    if (index > -1) {
      sockets.splice(index, 1);
    }
    console.error(`[Tapper] Total clients: ${sockets.length}`);
  });

  socket.on('error', (err) => {
    console.error(`[Tapper] Socket error from ${clientInfo}: ${err.message}`);
    // Remove errored socket
    const index = sockets.indexOf(socket);
    if (index > -1) {
      sockets.splice(index, 1);
    }
  });
});

// Listen on random port (OS assigns available port)
socketServer.listen(0, '127.0.0.1', () => {
  const address = socketServer.address() as net.AddressInfo;
  const port = address.port;

  // Write port to config file for extension to discover
  try {
    console.error(`[Tapper] Attempting to write port file...`);
    writePort(port, process.pid);
    console.error(`[Tapper] Listening on localhost:${port}`);
    console.error(`[Tapper] PID: ${process.pid}`);

    // Verify the file was written
    const portFilePath = getPortFile();
    console.error(`[Tapper] Port file location: ${portFilePath}`);

    // Read it back to verify
    if (fs.existsSync(portFilePath)) {
      const content = fs.readFileSync(portFilePath, 'utf8');
      console.error(`[Tapper] Port file verified: ${content.replace(/\n/g, ' ')}`);
    } else {
      console.error(`[Tapper] WARNING: Port file does not exist after write!`);
    }
  } catch (error) {
    console.error(`[Tapper] Failed to write port file: ${error}`);
    process.exit(1);
  }
});

// Spawn sequential-thinking server via npx
const serverSpec = getServerPackageSpec();
console.error(`[Tapper] Starting ${serverSpec}`);

const server = spawn('npx', ['-y', serverSpec], {
  stdio: ['pipe', 'pipe', 'inherit'], // stdin, stdout, stderr
  env: process.env,
});

// Cleanup function (defined early so handlers can use it)
let isCleaningUp = false;
function cleanup(exitCode: number = 0): void {
  if (isCleaningUp) {
    return; // Prevent multiple cleanup calls
  }
  isCleaningUp = true;

  console.error('[Tapper] Shutting down...');
  console.error('[Tapper] Removing port file...');
  removePortFile();
  console.error('[Tapper] Killing server process...');
  server.kill();
  console.error('[Tapper] Closing TCP socket server...');
  socketServer.close();
  console.error('[Tapper] Cleanup complete');

  process.exit(exitCode);
}

server.on('error', (err) => {
  console.error(`[Tapper] Failed to start server: ${err.message}`);
  cleanup(1);
});

// Forward stdin from AI tool to server (and broadcast to observers)
process.stdin.on('data', (chunk: Buffer) => {
  const data = chunk.toString('utf-8');
  console.error(`[Tapper] Received ${chunk.length} bytes from AI tool (stdin)`);

  // Log if it looks like a JSON-RPC message
  if (data.includes('"method"') || data.includes('"params"')) {
    console.error(`[Tapper] JSON-RPC request: ${data.substring(0, 150)}...`);
  }

  // Forward to server (primary)
  try {
    server.stdin.write(chunk);
  } catch (error) {
    console.error(`[Tapper] CRITICAL: Failed to forward stdin to server: ${error}`);
  }

  // Broadcast to TCP clients (secondary) - this contains the thought parameters!
  console.error(`[Tapper] Broadcasting stdin to ${sockets.length} TCP client(s)`);
  for (const socket of sockets) {
    try {
      socket.write(chunk);
      console.error(`[Tapper] ✓ Broadcast stdin successful to client`);
    } catch (error) {
      console.error(`[Tapper] ✗ Failed to broadcast stdin to client: ${error}`);
    }
  }
});

// Detect when parent process disconnects (stdin closes)
process.stdin.on('end', () => {
  console.error('[Tapper] stdin closed - parent disconnected');
  cleanup(0);
});

process.stdin.on('close', () => {
  console.error('[Tapper] stdin closed (close event) - parent disconnected');
  cleanup(0);
});

// Forward server stdout to AI tool AND broadcast to TCP clients
server.stdout.on('data', (chunk: Buffer) => {
  const data = chunk.toString('utf-8');
  console.error(`[Tapper] Received ${chunk.length} bytes from server`);

  // Log if it looks like a JSON-RPC message
  if (data.includes('"method"') || data.includes('"result"')) {
    console.error(`[Tapper] JSON-RPC message: ${data.substring(0, 150)}...`);
  }

  // PRIMARY: Forward to AI tool (MUST NOT FAIL)
  try {
    process.stdout.write(chunk);
  } catch (error) {
    console.error(`[Tapper] CRITICAL: Failed to forward to AI tool: ${error}`);
    // Don't exit - try to keep going
  }

  // SECONDARY: Broadcast to TCP clients (MAY FAIL - don't block)
  console.error(`[Tapper] Broadcasting to ${sockets.length} TCP client(s)`);
  for (const socket of sockets) {
    try {
      socket.write(chunk);
      console.error(`[Tapper] ✓ Broadcast successful to client`);
    } catch (error) {
      console.error(`[Tapper] ✗ Failed to broadcast to client: ${error}`);
    }
  }
});

// Register cleanup handlers (these trigger before exit)
process.on('SIGINT', () => cleanup(0));
process.on('SIGTERM', () => cleanup(0));

// Forward server exit to our exit
server.on('exit', (code, signal) => {
  if (signal) {
    console.error(`[Tapper] Server killed by signal ${signal}`);
  } else {
    console.error(`[Tapper] Server exited with code ${code}`);
  }
  cleanup(code || 0);
});
