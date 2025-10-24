/**
 * Type definitions for sequential thinking visualization
 */

/**
 * Represents a single thought in a sequential thinking process.
 * Maps to parameters of the MCP sequential-thinking tool.
 */
export interface ThoughtNode {
  /** Current thought step number in the sequence */
  thoughtNumber: number;

  /** The actual thought content/step */
  thought: string;

  /** Total estimated thoughts needed for completion */
  totalThoughts: number;

  /** Whether another thought step is needed after this one */
  nextThoughtNeeded: boolean;

  /** Whether this thought revises previous thinking */
  isRevision?: boolean;

  /** If this is a revision, which thought number is being reconsidered */
  revisesThought?: number;

  /** If branching, which thought number is the branching point */
  branchFromThought?: number;

  /** Identifier for the current branch (if any) */
  branchId?: string;

  /** If more thoughts are needed beyond the initial estimate */
  needsMoreThoughts?: boolean;

  /** Timestamp when this thought was created */
  timestamp?: string;
}

/**
 * Represents a complete sequential thinking session
 */
export interface ThoughtTree {
  /** Unique identifier for this thinking session */
  sessionId: string;

  /** All thoughts in chronological order */
  thoughts: ThoughtNode[];

  /** Organized branches (branchId -> thoughts in that branch) */
  branches: Map<string, ThoughtNode[]>;

  /** Session metadata */
  metadata: {
    /** When the session started */
    startTime: string;

    /** When the session ended (if completed) */
    endTime?: string;

    /** Current session status */
    status: 'active' | 'completed' | 'error';

    /** Initial problem or query that started the session */
    initialQuery?: string;
  };
}

/**
 * MCP connection states
 */
export enum ConnectionState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Error = 'error',
}

/**
 * Configuration for MCP client connection
 */
export interface MCPConnectionConfig {
  /** Command to start the MCP server */
  command: string;

  /** Arguments for the server command */
  args: string[];

  /** Environment variables for the server process */
  env?: Record<string, string>;

  /** Working directory for the server process */
  cwd?: string;
}

/**
 * Result from calling the sequential-thinking tool
 */
export interface SequentialThinkingResult {
  /** The thought number that was processed */
  thoughtNumber: number;

  /** Total thoughts currently estimated */
  totalThoughts: number;

  /** Whether another thought is needed */
  nextThoughtNeeded: boolean;

  /** Branches identified (if any) */
  branches?: string[];

  /** Length of thought history */
  thoughtHistoryLength: number;
}
