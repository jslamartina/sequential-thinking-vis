/**
 * Configuration module for MCP stream tapper
 * Handles platform-specific paths and port file management
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Supported version of @modelcontextprotocol/server-sequential-thinking
 * Using caret range for automatic minor/patch updates
 */
export const SUPPORTED_SERVER_VERSION = '^0.6.0';

/**
 * Port file name
 */
const PORT_FILE_NAME = 'observer-port.json';

/**
 * Get the platform-specific configuration directory
 * - macOS: ~/Library/Application Support/sequential-thinking-vis/
 * - Windows: %APPDATA%\sequential-thinking-vis\
 * - Linux: ~/.config/sequential-thinking-vis/
 * - Other: ~/.sequential-thinking-vis/
 */
export function getConfigDir(): string {
  const home = os.homedir();

  switch (os.platform()) {
    case 'darwin':
      return path.join(home, 'Library/Application Support/sequential-thinking-vis');
    case 'win32':
      return path.join(
        process.env.APPDATA || path.join(home, 'AppData/Roaming'),
        'sequential-thinking-vis'
      );
    case 'linux':
      return path.join(
        process.env.XDG_CONFIG_HOME || path.join(home, '.config'),
        'sequential-thinking-vis'
      );
    default:
      return path.join(home, '.sequential-thinking-vis');
  }
}

/**
 * Get the full path to the port file
 */
export function getPortFile(): string {
  return path.join(getConfigDir(), PORT_FILE_NAME);
}

/**
 * Ensure configuration directory exists (create if needed)
 * @throws {Error} If directory cannot be created
 */
export function ensureConfigDir(): void {
  const configDir = getConfigDir();
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
}

/**
 * Port file data structure
 */
interface PortFileData {
  port: number;
  pid: number;
  timestamp: string;
}

/**
 * Read port from port file
 * @returns Port number if valid, null if file not found or invalid
 */
export function readPort(): number | null {
  const portFile = getPortFile();
  console.log(`[config] readPort() called, portFile: ${portFile}`);

  try {
    if (!fs.existsSync(portFile)) {
      console.log('[config] Port file does not exist');
      return null;
    }

    console.log('[config] Port file exists, reading...');
    const content = fs.readFileSync(portFile, 'utf8');
    console.log(`[config] Port file content: ${content}`);
    const data: PortFileData = JSON.parse(content);

    // Validate structure
    if (typeof data.port !== 'number' || data.port <= 0) {
      console.log('[config] Invalid port structure');
      return null;
    }

    console.log(`[config] Port: ${data.port}, PID: ${data.pid}`);

    // Validate PID (check if process is still running)
    if (typeof data.pid === 'number') {
      try {
        // Check if process exists (doesn't kill it)
        process.kill(data.pid, 0);
        console.log(`[config] ✓ PID ${data.pid} is alive`);
      } catch (error) {
        // Process doesn't exist, port file is stale
        console.log(`[config] ✗ PID ${data.pid} is not running: ${error}`);
        return null;
      }
    }

    console.log(`[config] Returning port: ${data.port}`);
    return data.port;
  } catch (error) {
    // Invalid JSON or read error
    console.log(`[config] Error reading port file: ${error}`);
    return null;
  }
}

/**
 * Write port to port file atomically
 * @param port - TCP port number
 * @param pid - Process ID of the tapper
 * @throws {Error} If write fails
 */
export function writePort(port: number, pid: number): void {
  ensureConfigDir();
  const portFile = getPortFile();

  const data: PortFileData = {
    port,
    pid,
    timestamp: new Date().toISOString(),
  };

  const content = JSON.stringify(data, null, 2);

  // Atomic write: write to temp file, then rename
  const tempFile = portFile + '.tmp';
  fs.writeFileSync(tempFile, content, 'utf8');
  fs.renameSync(tempFile, portFile);
}

/**
 * Remove port file (cleanup on exit)
 */
export function removePortFile(): void {
  const portFile = getPortFile();
  try {
    if (fs.existsSync(portFile)) {
      fs.unlinkSync(portFile);
    }
  } catch {
    // Ignore errors during cleanup
  }
}

/**
 * Get the npm package specifier for npx
 * @returns Package specifier with version constraint
 */
export function getServerPackageSpec(): string {
  return `@modelcontextprotocol/server-sequential-thinking@${SUPPORTED_SERVER_VERSION}`;
}
