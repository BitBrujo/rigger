/**
 * Session Manager
 *
 * Manages active agent sessions with abort control and lifecycle tracking.
 * Sessions are independent of conversations and can be created, resumed, stopped, and force-killed.
 */

import { randomUUID } from 'crypto';
import pool from '../db/client.js';

export type SessionStatus =
  | 'initializing'
  | 'active'
  | 'idle'
  | 'stopping'
  | 'completed'
  | 'error'
  | 'terminated';

export type TerminationReason =
  | 'user_requested'
  | 'emergency_stop'
  | 'budget_exceeded'
  | 'error'
  | 'idle_timeout'
  | 'max_turns_reached';

export interface SessionMetadata {
  id: string;
  sdkSessionId: string | null;
  status: SessionStatus;
  conversationId: number | null;
  config: any;
  createdAt: Date;
  startedAt: Date | null;
  lastActivityAt: Date | null;
  completedAt: Date | null;
  terminatedAt: Date | null;
  terminationReason: TerminationReason | null;
  totalCost: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCachedTokens: number;
  numTurns: number;
  toolsUsed: string[];
  currentTool: string | null;
  messages: any[];
  abortRequested: boolean;
  forceKillRequested: boolean;
}

interface ActiveSession {
  id: string;
  abortController: AbortController;
  status: SessionStatus;
  startedAt: Date;
  lastActivityAt: Date;
  config: any;
  currentTool: string | null;
  queryGenerator: AsyncGenerator<any, void, unknown> | null;
}

class SessionManager {
  private activeSessions: Map<string, ActiveSession> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup job for idle sessions
    this.startCleanupJob();
  }

  /**
   * Create a new session
   */
  async createSession(config: any, conversationId: number | null = null): Promise<SessionMetadata> {
    const id = randomUUID();
    const now = new Date();

    const result = await pool.query(
      `INSERT INTO agent_sessions (
        id, status, config, conversation_id, created_at, last_activity_at
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [id, 'initializing', JSON.stringify(config), conversationId, now, now]
    );

    const session: ActiveSession = {
      id,
      abortController: new AbortController(),
      status: 'initializing',
      startedAt: now,
      lastActivityAt: now,
      config,
      currentTool: null,
      queryGenerator: null,
    };

    this.activeSessions.set(id, session);

    return this.dbRowToMetadata(result.rows[0]);
  }

  /**
   * Get session by ID
   */
  async getSession(id: string): Promise<SessionMetadata | null> {
    const result = await pool.query(
      'SELECT * FROM agent_sessions WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.dbRowToMetadata(result.rows[0]);
  }

  /**
   * List all sessions (optionally filtered by status)
   */
  async listSessions(
    filters: {
      status?: SessionStatus;
      conversationId?: number;
      limit?: number;
    } = {}
  ): Promise<SessionMetadata[]> {
    let query = 'SELECT * FROM agent_sessions WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.status) {
      query += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.conversationId) {
      query += ` AND conversation_id = $${paramIndex++}`;
      params.push(filters.conversationId);
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(filters.limit);
    }

    const result = await pool.query(query, params);
    return result.rows.map(row => this.dbRowToMetadata(row));
  }

  /**
   * Update session status
   */
  async updateStatus(id: string, status: SessionStatus): Promise<void> {
    const now = new Date();

    await pool.query(
      `UPDATE agent_sessions
       SET status = $1, last_activity_at = $2, updated_at = $3
       WHERE id = $4`,
      [status, now, now, id]
    );

    const active = this.activeSessions.get(id);
    if (active) {
      active.status = status;
      active.lastActivityAt = now;
    }
  }

  /**
   * Update session metrics (tokens, cost, turns)
   */
  async updateMetrics(id: string, metrics: {
    inputTokens?: number;
    outputTokens?: number;
    cachedTokens?: number;
    cost?: number;
    turns?: number;
    toolsUsed?: string[];
  }): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    let totalTokensIncrement = 0;

    if (metrics.inputTokens !== undefined) {
      updates.push(`total_input_tokens = total_input_tokens + $${paramIndex++}`);
      params.push(metrics.inputTokens);
      totalTokensIncrement += metrics.inputTokens;
    }

    if (metrics.outputTokens !== undefined) {
      updates.push(`total_output_tokens = total_output_tokens + $${paramIndex++}`);
      params.push(metrics.outputTokens);
      totalTokensIncrement += metrics.outputTokens;
    }

    // Update total_tokens once with the sum of input and output tokens
    if (totalTokensIncrement > 0) {
      updates.push(`total_tokens = total_tokens + $${paramIndex++}`);
      params.push(totalTokensIncrement);
    }

    if (metrics.cachedTokens !== undefined) {
      updates.push(`total_cached_tokens = total_cached_tokens + $${paramIndex++}`);
      params.push(metrics.cachedTokens);
    }

    if (metrics.cost !== undefined) {
      updates.push(`total_cost = total_cost + $${paramIndex++}`);
      params.push(metrics.cost);
    }

    if (metrics.turns !== undefined) {
      updates.push(`num_turns = num_turns + $${paramIndex++}`);
      params.push(metrics.turns);
    }

    if (metrics.toolsUsed && metrics.toolsUsed.length > 0) {
      updates.push(`tools_used = array_cat(tools_used, $${paramIndex++}::text[])`);
      params.push(metrics.toolsUsed);
    }

    if (updates.length === 0) {
      return;
    }

    params.push(id);
    await pool.query(
      `UPDATE agent_sessions SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex}`,
      params
    );
  }

  /**
   * Set current tool being executed
   */
  async setCurrentTool(id: string, toolName: string | null): Promise<void> {
    await pool.query(
      'UPDATE agent_sessions SET current_tool = $1, last_activity_at = NOW() WHERE id = $2',
      [toolName, id]
    );

    const active = this.activeSessions.get(id);
    if (active) {
      active.currentTool = toolName;
      active.lastActivityAt = new Date();
    }
  }

  /**
   * Add message to session
   */
  async addMessage(id: string, message: any): Promise<void> {
    await pool.query(
      `UPDATE agent_sessions
       SET messages = messages || $1::jsonb,
           last_activity_at = NOW(),
           updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(message), id]
    );
  }

  /**
   * Request graceful stop
   */
  async requestStop(id: string): Promise<void> {
    await pool.query(
      'UPDATE agent_sessions SET abort_requested = TRUE, status = $1, updated_at = NOW() WHERE id = $2',
      ['stopping', id]
    );

    const active = this.activeSessions.get(id);
    if (active) {
      active.status = 'stopping';
      active.abortController.abort();
    }
  }

  /**
   * Request force kill (immediate termination)
   */
  async requestForceKill(id: string): Promise<void> {
    await pool.query(
      `UPDATE agent_sessions
       SET force_kill_requested = TRUE,
           abort_requested = TRUE,
           status = $1,
           terminated_at = NOW(),
           termination_reason = $2,
           updated_at = NOW()
       WHERE id = $3`,
      ['terminated', 'emergency_stop', id]
    );

    const active = this.activeSessions.get(id);
    if (active) {
      active.status = 'terminated';
      active.abortController.abort();
      // Additional cleanup: kill any child processes, close MCP servers, etc.
      this.forceCleanup(id);
    }
  }

  /**
   * Complete session successfully
   */
  async completeSession(id: string): Promise<void> {
    await pool.query(
      `UPDATE agent_sessions
       SET status = $1, completed_at = NOW(), updated_at = NOW()
       WHERE id = $2`,
      ['completed', id]
    );

    this.activeSessions.delete(id);
  }

  /**
   * Mark session as error
   */
  async errorSession(id: string, errorMessage: string): Promise<void> {
    await pool.query(
      `UPDATE agent_sessions
       SET status = $1,
           termination_reason = $2,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = $3`,
      ['error', 'error', id]
    );

    this.activeSessions.delete(id);
  }

  /**
   * Get abort signal for a session
   */
  getAbortSignal(id: string): AbortSignal | null {
    const active = this.activeSessions.get(id);
    return active?.abortController.signal ?? null;
  }

  /**
   * Register query generator for potential cleanup
   */
  setQueryGenerator(id: string, generator: AsyncGenerator<any, void, unknown>): void {
    const active = this.activeSessions.get(id);
    if (active) {
      active.queryGenerator = generator;
    }
  }

  /**
   * Check if session has abort requested
   */
  async isAbortRequested(id: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT abort_requested FROM agent_sessions WHERE id = $1',
      [id]
    );
    return result.rows[0]?.abort_requested ?? false;
  }

  /**
   * Force cleanup of session resources
   */
  private forceCleanup(id: string): void {
    const active = this.activeSessions.get(id);
    if (!active) return;

    // If query generator exists, attempt to force close it
    if (active.queryGenerator) {
      try {
        active.queryGenerator.return();
      } catch (error) {
        console.error(`Error closing query generator for session ${id}:`, error);
      }
    }

    // TODO: Additional cleanup:
    // - Kill any running bash shells
    // - Close MCP server connections
    // - Clean up temp files
    // - etc.

    this.activeSessions.delete(id);
  }

  /**
   * Cleanup job for idle sessions
   */
  private startCleanupJob(): void {
    this.cleanupInterval = setInterval(async () => {
      const idleSessions = await pool.query(
        `SELECT id FROM agent_sessions
         WHERE status = 'idle'
         AND last_activity_at < NOW() - INTERVAL '5 minutes'`
      );

      for (const row of idleSessions.rows) {
        await this.completeSession(row.id);
      }
    }, 60000); // Run every minute
  }

  /**
   * Shutdown session manager
   */
  shutdown(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Abort all active sessions
    for (const [id, session] of this.activeSessions.entries()) {
      session.abortController.abort();
      this.forceCleanup(id);
    }
  }

  /**
   * Convert database row to SessionMetadata
   */
  private dbRowToMetadata(row: any): SessionMetadata {
    return {
      id: row.id,
      sdkSessionId: row.sdk_session_id,
      status: row.status,
      conversationId: row.conversation_id,
      config: row.config,
      createdAt: row.created_at,
      startedAt: row.started_at,
      lastActivityAt: row.last_activity_at,
      completedAt: row.completed_at,
      terminatedAt: row.terminated_at,
      terminationReason: row.termination_reason,
      totalCost: parseFloat(row.total_cost || 0),
      totalTokens: row.total_tokens || 0,
      totalInputTokens: row.total_input_tokens || 0,
      totalOutputTokens: row.total_output_tokens || 0,
      totalCachedTokens: row.total_cached_tokens || 0,
      numTurns: row.num_turns || 0,
      toolsUsed: row.tools_used || [],
      currentTool: row.current_tool,
      messages: row.messages || [],
      abortRequested: row.abort_requested || false,
      forceKillRequested: row.force_kill_requested || false,
    };
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

// Cleanup on process exit
process.on('SIGINT', () => {
  sessionManager.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  sessionManager.shutdown();
  process.exit(0);
});
