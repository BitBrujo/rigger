/**
 * Session Client
 *
 * API wrapper for session management operations
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

export type SessionStatus =
  | 'initializing'
  | 'active'
  | 'idle'
  | 'stopping'
  | 'completed'
  | 'error'
  | 'terminated';

export interface SessionMetadata {
  id: string;
  sdkSessionId: string | null;
  status: SessionStatus;
  conversationId: number | null;
  config: any;
  createdAt: string;
  startedAt: string | null;
  lastActivityAt: string | null;
  completedAt: string | null;
  terminatedAt: string | null;
  terminationReason: string | null;
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

export interface SessionStatusResponse {
  success: boolean;
  status: SessionStatus;
  currentTool: string | null;
  totalCost: number;
  totalTokens: number;
  numTurns: number;
  lastActivityAt: string | null;
  abortRequested: boolean;
  forceKillRequested: boolean;
}

export class SessionClient {
  /**
   * Create a new session
   */
  static async createSession(
    config: any,
    conversationId?: number | null
  ): Promise<SessionMetadata> {
    const response = await fetch(`${API_URL}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config, conversationId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create session');
    }

    const data = await response.json();
    return data.session;
  }

  /**
   * List all sessions
   */
  static async listSessions(filters?: {
    status?: SessionStatus;
    conversationId?: number;
    limit?: number;
  }): Promise<SessionMetadata[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.conversationId) params.append('conversationId', filters.conversationId.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const url = params.toString() ? `${API_URL}/sessions?${params.toString()}` : `${API_URL}/sessions`;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to list sessions');
    }

    const data = await response.json();
    return data.sessions;
  }

  /**
   * Get session by ID
   */
  static async getSession(id: string): Promise<SessionMetadata | null> {
    const response = await fetch(`${API_URL}/sessions/${id}`);

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get session');
    }

    const data = await response.json();
    return data.session;
  }

  /**
   * Get session status (lightweight polling endpoint)
   */
  static async getSessionStatus(id: string): Promise<SessionStatusResponse> {
    const response = await fetch(`${API_URL}/sessions/${id}/status`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get session status');
    }

    return await response.json();
  }

  /**
   * Request graceful stop
   */
  static async stopSession(id: string): Promise<SessionMetadata> {
    const response = await fetch(`${API_URL}/sessions/${id}/stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to stop session');
    }

    const data = await response.json();
    return data.session;
  }

  /**
   * Force kill session
   */
  static async forceKillSession(id: string): Promise<SessionMetadata> {
    const response = await fetch(`${API_URL}/sessions/${id}/force-kill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to force kill session');
    }

    const data = await response.json();
    return data.session;
  }

  /**
   * Delete session
   */
  static async deleteSession(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/sessions/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete session');
    }
  }
}
