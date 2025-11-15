/**
 * Session Manager Service
 *
 * Manages Agent SDK sessions with support for multiple hosting patterns:
 * - Ephemeral: One-off tasks that terminate on completion
 * - Long-Running: Persistent sessions for continuous operation
 * - Hybrid: Resumable sessions with state hydration
 * - Single-Container: Multiple agents in one container (for simulations)
 */

import { v4 as uuidv4 } from 'uuid';

// Note: These types mirror lib/types.ts but are duplicated for Docker isolation
interface SessionMetadata {
  id: string;
  sessionId: string;
  pattern: 'ephemeral' | 'long-running' | 'hybrid' | 'single-container';
  status: 'initializing' | 'active' | 'idle' | 'completed' | 'error' | 'terminated';
  conversationId?: number;
  config: any; // AgentSDKConfig

  createdAt: string;
  startedAt?: string;
  lastActivityAt?: string;
  completedAt?: string;
  terminatedAt?: string;

  totalCost: number;
  totalTokens: number;
  numTurns: number;
  toolsUsed: string[];

  maxIdleTimeMs?: number;
  maxLifetimeMs?: number;
  maxBudgetUsd?: number;
  maxTurns?: number;

  tags?: string[];
  description?: string;
  userId?: string;
}

class SessionManager {
  private sessions: Map<string, SessionMetadata> = new Map();
  private idleCheckInterval: NodeJS.Timeout | null = null;
  private readonly IDLE_CHECK_INTERVAL_MS = 60000; // Check every minute

  constructor() {
    this.startIdleMonitoring();
  }

  /**
   * Create a new session with specified pattern
   */
  createSession(request: {
    pattern: 'ephemeral' | 'long-running' | 'hybrid' | 'single-container';
    config: any;
    conversationId?: number;
    maxIdleTimeMs?: number;
    maxLifetimeMs?: number;
    maxBudgetUsd?: number;
    maxTurns?: number;
    tags?: string[];
    description?: string;
    userId?: string;
  }): SessionMetadata {
    const id = uuidv4();
    const session: SessionMetadata = {
      id,
      sessionId: '', // Will be set when SDK initializes
      pattern: request.pattern,
      status: 'initializing',
      conversationId: request.conversationId,
      config: request.config,

      createdAt: new Date().toISOString(),

      totalCost: 0,
      totalTokens: 0,
      numTurns: 0,
      toolsUsed: [],

      maxIdleTimeMs: request.maxIdleTimeMs,
      maxLifetimeMs: request.maxLifetimeMs,
      maxBudgetUsd: request.maxBudgetUsd,
      maxTurns: request.maxTurns,

      tags: request.tags,
      description: request.description,
      userId: request.userId,
    };

    this.sessions.set(id, session);
    console.log(`[SessionManager] Created ${request.pattern} session ${id}`);

    return session;
  }

  /**
   * Get session by ID
   */
  getSession(id: string): SessionMetadata | undefined {
    return this.sessions.get(id);
  }

  /**
   * Get session by SDK session ID
   */
  getSessionBySessionId(sessionId: string): SessionMetadata | undefined {
    for (const session of this.sessions.values()) {
      if (session.sessionId === sessionId) {
        return session;
      }
    }
    return undefined;
  }

  /**
   * Update session metadata
   */
  updateSession(id: string, updates: Partial<SessionMetadata>): SessionMetadata | undefined {
    const session = this.sessions.get(id);
    if (!session) {
      return undefined;
    }

    Object.assign(session, updates);

    // Update lastActivityAt on any update
    if (session.status === 'active') {
      session.lastActivityAt = new Date().toISOString();
    }

    this.sessions.set(id, session);
    return session;
  }

  /**
   * Mark session as started (SDK initialized)
   */
  startSession(id: string, sdkSessionId: string): SessionMetadata | undefined {
    return this.updateSession(id, {
      sessionId: sdkSessionId,
      status: 'active',
      startedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString(),
    });
  }

  /**
   * Update session activity (on each message)
   */
  recordActivity(id: string, usage: {
    cost: number;
    tokens: number;
    turns: number;
    toolsUsed: string[];
  }): SessionMetadata | undefined {
    const session = this.sessions.get(id);
    if (!session) {
      return undefined;
    }

    return this.updateSession(id, {
      totalCost: session.totalCost + usage.cost,
      totalTokens: session.totalTokens + usage.tokens,
      numTurns: session.numTurns + usage.turns,
      toolsUsed: [...new Set([...session.toolsUsed, ...usage.toolsUsed])],
      lastActivityAt: new Date().toISOString(),
    });
  }

  /**
   * Complete session (normal termination)
   */
  completeSession(id: string): SessionMetadata | undefined {
    const session = this.sessions.get(id);
    if (!session) {
      return undefined;
    }

    const updated = this.updateSession(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });

    console.log(`[SessionManager] Completed session ${id} - Pattern: ${session.pattern}, Cost: $${session.totalCost}, Turns: ${session.numTurns}`);

    // Auto-cleanup ephemeral sessions after completion
    if (session.pattern === 'ephemeral') {
      setTimeout(() => this.deleteSession(id), 60000); // Clean up after 1 minute
    }

    return updated;
  }

  /**
   * Terminate session (forced/error)
   */
  terminateSession(id: string, reason?: string): SessionMetadata | undefined {
    const session = this.sessions.get(id);
    if (!session) {
      return undefined;
    }

    const updated = this.updateSession(id, {
      status: 'terminated',
      terminatedAt: new Date().toISOString(),
    });

    console.log(`[SessionManager] Terminated session ${id} - Reason: ${reason || 'unknown'}`);

    // Auto-cleanup terminated sessions
    if (session.pattern === 'ephemeral') {
      setTimeout(() => this.deleteSession(id), 60000);
    }

    return updated;
  }

  /**
   * Delete session from memory
   */
  deleteSession(id: string): boolean {
    const deleted = this.sessions.delete(id);
    if (deleted) {
      console.log(`[SessionManager] Deleted session ${id}`);
    }
    return deleted;
  }

  /**
   * List all sessions with filtering
   */
  listSessions(filters?: {
    pattern?: 'ephemeral' | 'long-running' | 'hybrid' | 'single-container';
    status?: string;
    userId?: string;
    tags?: string[];
    page?: number;
    pageSize?: number;
  }): {
    sessions: SessionMetadata[];
    total: number;
    page: number;
    pageSize: number;
  } {
    let sessions = Array.from(this.sessions.values());

    // Apply filters
    if (filters?.pattern) {
      sessions = sessions.filter(s => s.pattern === filters.pattern);
    }
    if (filters?.status) {
      sessions = sessions.filter(s => s.status === filters.status);
    }
    if (filters?.userId) {
      sessions = sessions.filter(s => s.userId === filters.userId);
    }
    if (filters?.tags && filters.tags.length > 0) {
      sessions = sessions.filter(s =>
        s.tags && filters.tags!.some(tag => s.tags!.includes(tag))
      );
    }

    // Pagination
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      sessions: sessions.slice(start, end),
      total: sessions.length,
      page,
      pageSize,
    };
  }

  /**
   * Get session statistics
   */
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    completedSessions: number;
    errorSessions: number;
    totalCost: number;
    totalTokens: number;
    avgSessionDuration: number;
    byPattern: Record<string, any>;
  } {
    const sessions = Array.from(this.sessions.values());

    const stats = {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.status === 'active').length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      errorSessions: sessions.filter(s => s.status === 'error').length,
      totalCost: sessions.reduce((sum, s) => sum + s.totalCost, 0),
      totalTokens: sessions.reduce((sum, s) => sum + s.totalTokens, 0),
      avgSessionDuration: 0,
      byPattern: {} as Record<string, any>,
    };

    // Calculate average duration
    const completedSessions = sessions.filter(s => s.completedAt && s.startedAt);
    if (completedSessions.length > 0) {
      const totalDuration = completedSessions.reduce((sum, s) => {
        const duration = new Date(s.completedAt!).getTime() - new Date(s.startedAt!).getTime();
        return sum + duration;
      }, 0);
      stats.avgSessionDuration = totalDuration / completedSessions.length;
    }

    // Stats by pattern
    const patterns = ['ephemeral', 'long-running', 'hybrid', 'single-container'];
    for (const pattern of patterns) {
      const patternSessions = sessions.filter(s => s.pattern === pattern);
      if (patternSessions.length > 0) {
        stats.byPattern[pattern] = {
          count: patternSessions.length,
          avgCost: patternSessions.reduce((sum, s) => sum + s.totalCost, 0) / patternSessions.length,
          avgTokens: patternSessions.reduce((sum, s) => sum + s.totalTokens, 0) / patternSessions.length,
          avgDuration: 0,
        };

        const completedPatternSessions = patternSessions.filter(s => s.completedAt && s.startedAt);
        if (completedPatternSessions.length > 0) {
          const totalDuration = completedPatternSessions.reduce((sum, s) => {
            const duration = new Date(s.completedAt!).getTime() - new Date(s.startedAt!).getTime();
            return sum + duration;
          }, 0);
          stats.byPattern[pattern].avgDuration = totalDuration / completedPatternSessions.length;
        }
      }
    }

    return stats;
  }

  /**
   * Check for idle sessions and auto-terminate
   */
  private checkIdleSessions(): void {
    const now = Date.now();

    for (const [id, session] of this.sessions.entries()) {
      // Skip non-active sessions
      if (session.status !== 'active') {
        continue;
      }

      // Check idle timeout
      if (session.maxIdleTimeMs && session.lastActivityAt) {
        const idleTime = now - new Date(session.lastActivityAt).getTime();
        if (idleTime > session.maxIdleTimeMs) {
          console.log(`[SessionManager] Auto-terminating idle session ${id} (idle for ${idleTime}ms)`);
          this.terminateSession(id, 'idle_timeout');
        }
      }

      // Check lifetime timeout
      if (session.maxLifetimeMs && session.startedAt) {
        const lifetime = now - new Date(session.startedAt).getTime();
        if (lifetime > session.maxLifetimeMs) {
          console.log(`[SessionManager] Auto-terminating session ${id} (lifetime exceeded: ${lifetime}ms)`);
          this.terminateSession(id, 'max_lifetime');
        }
      }

      // Check budget limit
      if (session.maxBudgetUsd && session.totalCost >= session.maxBudgetUsd) {
        console.log(`[SessionManager] Auto-terminating session ${id} (budget exceeded: $${session.totalCost})`);
        this.terminateSession(id, 'budget_exceeded');
      }

      // Check turn limit
      if (session.maxTurns && session.numTurns >= session.maxTurns) {
        console.log(`[SessionManager] Auto-terminating session ${id} (max turns exceeded: ${session.numTurns})`);
        this.terminateSession(id, 'max_turns');
      }
    }
  }

  /**
   * Start background idle monitoring
   */
  private startIdleMonitoring(): void {
    if (this.idleCheckInterval) {
      return;
    }

    this.idleCheckInterval = setInterval(() => {
      this.checkIdleSessions();
    }, this.IDLE_CHECK_INTERVAL_MS);

    console.log('[SessionManager] Started idle monitoring');
  }

  /**
   * Stop background idle monitoring
   */
  stopIdleMonitoring(): void {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
      console.log('[SessionManager] Stopped idle monitoring');
    }
  }

  /**
   * Cleanup all sessions (for shutdown)
   */
  cleanup(): void {
    this.stopIdleMonitoring();
    this.sessions.clear();
    console.log('[SessionManager] Cleaned up all sessions');
  }
}

// Singleton instance
const sessionManager = new SessionManager();

export default sessionManager;
