/**
 * E2E Test Setup Helpers
 * Helpers for testing the extension running in VS Code
 */

import * as vscode from 'vscode';
import type { ExtensionAPI } from '../../src/extension';
import { MCPClient } from '../../src/providers/MCPClient';
import { ThoughtTreeProvider } from '../../src/views/ThoughtTreeProvider';

/**
 * Get the extension instance
 */
export function getExtension() {
  const ext = vscode.extensions.getExtension<ExtensionAPI>(
    'josephlamartina.sequential-thinking-vis'
  );
  if (!ext) {
    throw new Error('Extension not found');
  }
  return ext;
}

/**
 * Ensure extension is activated and get its API
 */
export async function ensureExtensionActivated(): Promise<ExtensionAPI> {
  const ext = getExtension();
  if (!ext.isActive) {
    await ext.activate();
  }
  return ext.exports;
}

/**
 * Get the extension's MCP Client
 */
export async function getMCPClient(): Promise<MCPClient> {
  const api = await ensureExtensionActivated();
  const client = api.getMCPClient();
  if (!client) {
    throw new Error('MCP Client not available');
  }
  return client;
}

/**
 * Get the extension's Tree Provider
 */
export async function getTreeProvider(): Promise<ThoughtTreeProvider> {
  const api = await ensureExtensionActivated();
  const provider = api.getTreeProvider();
  if (!provider) {
    throw new Error('Tree Provider not available');
  }
  return provider;
}

/**
 * Execute a command and wait for it to complete
 */
export async function executeCommand(command: string, ...args: any[]): Promise<any> {
  return await vscode.commands.executeCommand(command, ...args);
}

/**
 * Wait for a condition to be true
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  while (true) {
    const result = await Promise.resolve(condition());
    if (result) {
      return;
    }
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Wait for specified milliseconds
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if a command is registered
 */
export async function isCommandRegistered(command: string): Promise<boolean> {
  const commands = await vscode.commands.getCommands();
  return commands.includes(command);
}

/**
 * Get the tree view for sequential thinking
 */
export function getTreeView() {
  // The tree view is registered by the extension
  // We can't directly access it, but we can verify it exists through commands
  return {
    async exists(): Promise<boolean> {
      const commands = await vscode.commands.getCommands();
      return commands.some((cmd) => cmd.startsWith('sequential-thinking-vis.'));
    },
  };
}
