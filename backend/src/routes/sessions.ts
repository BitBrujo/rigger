/**
 * Session Management Routes
 *
 * RESTful API for managing Agent SDK sessions across different hosting patterns
 */

import { Router, Request, Response } from 'express';
import { query } from '@anthropic-ai/claude-agent-sdk';
import sessionManager from '../services/session-manager';
import pool from '../../db/client';

const router = Router();

/**
 * Create a new session
 * POST /api/sessions
 *
 * Body: {
 *   pattern: 'ephemeral' | 'long-running' | 'hybrid' | 'single-container',
 *   config: AgentSDKConfig,
 *   conversationId?: number,
 *   maxIdleTimeMs?: number,
 *   maxLifetimeMs?: number,
 *   maxBudgetUsd?: number,
 *   maxTurns?: number,
 *   tags?: string[],
 *   description?: string
 * }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      pattern = 'ephemeral',
      config,
      conversationId,
      maxIdleTimeMs,
      maxLifetimeMs,
      maxBudgetUsd,
      maxTurns,
      tags,
      description,
      userId,
    } = req.body;

    // Validate pattern
    const validPatterns = ['ephemeral', 'long-running', 'hybrid', 'single-container'];
    if (!validPatterns.includes(pattern)) {
      return res.status(400).json({
        error: 'Invalid pattern',
        validPatterns,
      });
    }

    // Create session
    const session = sessionManager.createSession({
      pattern,
      config,
      conversationId,
      maxIdleTimeMs,
      maxLifetimeMs,
      maxBudgetUsd: maxBudgetUsd || config.maxBudgetUsd,
      maxTurns: maxTurns || config.maxTurns,
      tags,
      description,
      userId,
    });

    // Save to database
    await pool.query(
      `INSERT INTO agent_sessions (
        id, pattern, status, conversation_id, config,
        created_at, max_idle_time_ms, max_lifetime_ms, max_budget_usd, max_turns,
        tags, description, user_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        session.id,
        session.pattern,
        session.status,
        session.conversationId || null,
        JSON.stringify(session.config),
        session.createdAt,
        session.maxIdleTimeMs || null,
        session.maxLifetimeMs || null,
        session.maxBudgetUsd || null,
        session.maxTurns || null,
        session.tags ? JSON.stringify(session.tags) : null,
        session.description || null,
        session.userId || null,
      ]
    );

    res.status(201).json(session);
  } catch (error: any) {
    console.error('Session creation error:', error);
    res.status(500).json({
      error: 'Failed to create session',
      message: error.message,
    });
  }
});

/**
 * Get session by ID
 * GET /api/sessions/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const session = sessionManager.getSession(id);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        id,
      });
    }

    res.json(session);
  } catch (error: any) {
    console.error('Session retrieval error:', error);
    res.status(500).json({
      error: 'Failed to retrieve session',
      message: error.message,
    });
  }
});

/**
 * List sessions with filtering
 * GET /api/sessions
 *
 * Query params:
 * - pattern: 'ephemeral' | 'long-running' | 'hybrid' | 'single-container'
 * - status: 'initializing' | 'active' | 'idle' | 'completed' | 'error' | 'terminated'
 * - userId: string
 * - tags: comma-separated string
 * - page: number (default: 1)
 * - pageSize: number (default: 50)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      pattern,
      status,
      userId,
      tags,
      page = '1',
      pageSize = '50',
    } = req.query;

    const filters: any = {
      page: parseInt(page as string),
      pageSize: parseInt(pageSize as string),
    };

    if (pattern) filters.pattern = pattern;
    if (status) filters.status = status;
    if (userId) filters.userId = userId;
    if (tags) filters.tags = (tags as string).split(',');

    const result = sessionManager.listSessions(filters);

    res.json(result);
  } catch (error: any) {
    console.error('Session list error:', error);
    res.status(500).json({
      error: 'Failed to list sessions',
      message: error.message,
    });
  }
});

/**
 * Update session status/metadata
 * PATCH /api/sessions/:id
 *
 * Body: {
 *   status?: string,
 *   tags?: string[],
 *   description?: string
 * }
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const session = sessionManager.updateSession(id, updates);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        id,
      });
    }

    // Update database
    const dbUpdates: string[] = [];
    const dbValues: any[] = [];
    let paramIndex = 1;

    if (updates.status) {
      dbUpdates.push(`status = $${paramIndex++}`);
      dbValues.push(updates.status);
    }
    if (updates.tags) {
      dbUpdates.push(`tags = $${paramIndex++}`);
      dbValues.push(JSON.stringify(updates.tags));
    }
    if (updates.description) {
      dbUpdates.push(`description = $${paramIndex++}`);
      dbValues.push(updates.description);
    }

    if (dbUpdates.length > 0) {
      dbUpdates.push(`updated_at = $${paramIndex++}`);
      dbValues.push(new Date().toISOString());
      dbValues.push(id);

      await pool.query(
        `UPDATE agent_sessions SET ${dbUpdates.join(', ')} WHERE id = $${paramIndex}`,
        dbValues
      );
    }

    res.json(session);
  } catch (error: any) {
    console.error('Session update error:', error);
    res.status(500).json({
      error: 'Failed to update session',
      message: error.message,
    });
  }
});

/**
 * Terminate session
 * POST /api/sessions/:id/terminate
 *
 * Body: {
 *   reason?: 'user_requested' | 'idle_timeout' | 'budget_exceeded' | 'max_turns' | 'error'
 * }
 */
router.post('/:id/terminate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason = 'user_requested' } = req.body;

    const session = sessionManager.terminateSession(id, reason);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        id,
      });
    }

    // Update database
    await pool.query(
      `UPDATE agent_sessions SET
        status = $1,
        terminated_at = $2,
        updated_at = $3
      WHERE id = $4`,
      [session.status, session.terminatedAt, new Date().toISOString(), id]
    );

    res.json({
      session,
      reason,
    });
  } catch (error: any) {
    console.error('Session termination error:', error);
    res.status(500).json({
      error: 'Failed to terminate session',
      message: error.message,
    });
  }
});

/**
 * Delete session
 * DELETE /api/sessions/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deleted = sessionManager.deleteSession(id);

    if (!deleted) {
      return res.status(404).json({
        error: 'Session not found',
        id,
      });
    }

    // Delete from database
    await pool.query('DELETE FROM agent_sessions WHERE id = $1', [id]);

    res.json({
      success: true,
      id,
    });
  } catch (error: any) {
    console.error('Session deletion error:', error);
    res.status(500).json({
      error: 'Failed to delete session',
      message: error.message,
    });
  }
});

/**
 * Get session statistics
 * GET /api/sessions/stats/summary
 */
router.get('/stats/summary', async (req: Request, res: Response) => {
  try {
    const stats = sessionManager.getStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Session stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve session stats',
      message: error.message,
    });
  }
});

/**
 * Execute message in a session (unified endpoint)
 * POST /api/sessions/:id/message
 *
 * This endpoint handles both ephemeral and persistent sessions.
 * For ephemeral sessions, it auto-completes after execution.
 * For long-running/hybrid sessions, it maintains state.
 *
 * Body: {
 *   prompt: string,
 *   streaming?: boolean
 * }
 */
router.post('/:id/message', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { prompt, streaming = true } = req.body;

    const session = sessionManager.getSession(id);
    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
        id,
      });
    }

    // Check if session is in a valid state
    if (session.status === 'completed' || session.status === 'terminated') {
      return res.status(400).json({
        error: 'Session is not active',
        status: session.status,
      });
    }

    // Prepare SDK options from session config
    const sdkOptions: any = {
      ...session.config,
      includePartialMessages: streaming,
    };

    // For hybrid sessions, resume from existing session
    if (session.pattern === 'hybrid' && session.sessionId) {
      sdkOptions.resume = session.sessionId;
    }

    // For long-running sessions, continue from existing session
    if (session.pattern === 'long-running' && session.sessionId) {
      sdkOptions.continue = true;
    }

    const startTime = Date.now();

    if (streaming) {
      // Streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      let sdkSessionId: string | null = null;
      let totalCost = 0;
      let totalTokens = 0;
      let numTurns = 0;
      const toolsUsed: string[] = [];

      for await (const msg of query({ prompt, options: sdkOptions })) {
        // Track SDK session ID
        if (msg.session_id) {
          sdkSessionId = msg.session_id;
        }

        // Track tools
        if (msg.type === 'stream_event' && msg.event?.type === 'content_block_start') {
          if (msg.event.content_block?.type === 'tool_use' && msg.event.content_block.name) {
            const toolName = msg.event.content_block.name;
            if (!toolsUsed.includes(toolName)) {
              toolsUsed.push(toolName);
            }
          }
        }

        // Track result
        if (msg.type === 'result') {
          totalCost = msg.total_cost_usd || 0;
          totalTokens = (msg.usage?.input_tokens || 0) + (msg.usage?.output_tokens || 0);
          numTurns = msg.num_turns || 1;
        }

        // Stream to client
        res.write(`data: ${JSON.stringify({
          type: msg.type,
          data: msg,
        })}\n\n`);
      }

      // Update session after completion
      if (sdkSessionId && session.status === 'initializing') {
        sessionManager.startSession(id, sdkSessionId);
      }

      sessionManager.recordActivity(id, {
        cost: totalCost,
        tokens: totalTokens,
        turns: numTurns,
        toolsUsed,
      });

      // Auto-complete ephemeral sessions
      if (session.pattern === 'ephemeral') {
        sessionManager.completeSession(id);
      }

      res.end();
    } else {
      // Batch response
      let finalResult: any = null;
      let assistantMessage: any = null;
      let sdkSessionId: string | null = null;
      const toolsUsed: string[] = [];

      for await (const msg of query({ prompt, options: sdkOptions })) {
        if (msg.session_id) {
          sdkSessionId = msg.session_id;
        }

        if (msg.type === 'assistant') {
          assistantMessage = msg;
          // Extract tools from content blocks
          if (msg.message?.content) {
            const content = Array.isArray(msg.message.content) ? msg.message.content : [msg.message.content];
            content.forEach((block: any) => {
              if (block.type === 'tool_use' && block.name && !toolsUsed.includes(block.name)) {
                toolsUsed.push(block.name);
              }
            });
          }
        } else if (msg.type === 'result') {
          finalResult = msg;
        }
      }

      // Update session
      if (sdkSessionId && session.status === 'initializing') {
        sessionManager.startSession(id, sdkSessionId);
      }

      if (finalResult) {
        sessionManager.recordActivity(id, {
          cost: finalResult.total_cost_usd || 0,
          tokens: (finalResult.usage?.input_tokens || 0) + (finalResult.usage?.output_tokens || 0),
          turns: finalResult.num_turns || 1,
          toolsUsed,
        });
      }

      // Auto-complete ephemeral sessions
      if (session.pattern === 'ephemeral') {
        sessionManager.completeSession(id);
      }

      res.json({
        response: assistantMessage?.message || null,
        result: finalResult,
        latency: Date.now() - startTime,
        session: sessionManager.getSession(id),
      });
    }
  } catch (error: any) {
    console.error('Session message error:', error);
    res.status(500).json({
      error: 'Failed to execute message',
      message: error.message,
    });
  }
});

export default router;
