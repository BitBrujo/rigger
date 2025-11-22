/**
 * Session API Routes
 *
 * Endpoints for managing agent sessions:
 * - POST /api/sessions - Create new session
 * - GET /api/sessions - List sessions
 * - GET /api/sessions/:id - Get session details
 * - POST /api/sessions/:id/stop - Request graceful stop
 * - POST /api/sessions/:id/force-kill - Force kill session
 * - DELETE /api/sessions/:id - Delete session
 */

import { Router } from 'express';
import { sessionManager } from '../session-manager.js';

const router = Router();

/**
 * POST /api/sessions
 * Create a new session
 */
router.post('/', async (req, res) => {
  try {
    const { config, conversationId } = req.body;

    if (!config) {
      return res.status(400).json({ error: 'Config is required' });
    }

    const session = await sessionManager.createSession(config, conversationId || null);

    res.status(201).json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error('Error creating session:', error);
    res.status(500).json({
      error: 'Failed to create session',
      details: error.message,
    });
  }
});

/**
 * GET /api/sessions
 * List all sessions (with optional filters)
 */
router.get('/', async (req, res) => {
  try {
    const { status, conversationId, limit } = req.query;

    const sessions = await sessionManager.listSessions({
      status: status as any,
      conversationId: conversationId ? parseInt(conversationId as string) : undefined,
      limit: limit ? parseInt(limit as string) : 50,
    });

    res.json({
      success: true,
      sessions,
      count: sessions.length,
    });
  } catch (error: any) {
    console.error('Error listing sessions:', error);
    res.status(500).json({
      error: 'Failed to list sessions',
      details: error.message,
    });
  }
});

/**
 * GET /api/sessions/:id
 * Get session by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await sessionManager.getSession(id);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      session,
    });
  } catch (error: any) {
    console.error('Error getting session:', error);
    res.status(500).json({
      error: 'Failed to get session',
      details: error.message,
    });
  }
});

/**
 * POST /api/sessions/:id/stop
 * Request graceful stop of session
 */
router.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await sessionManager.getSession(id);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
      });
    }

    if (!['active', 'idle', 'initializing'].includes(session.status)) {
      return res.status(400).json({
        error: 'Session cannot be stopped',
        details: `Session is in ${session.status} state`,
      });
    }

    await sessionManager.requestStop(id);

    res.json({
      success: true,
      message: 'Stop requested. Session will terminate gracefully.',
      session: await sessionManager.getSession(id),
    });
  } catch (error: any) {
    console.error('Error stopping session:', error);
    res.status(500).json({
      error: 'Failed to stop session',
      details: error.message,
    });
  }
});

/**
 * POST /api/sessions/:id/force-kill
 * Force kill session immediately
 */
router.post('/:id/force-kill', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await sessionManager.getSession(id);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
      });
    }

    await sessionManager.requestForceKill(id);

    res.json({
      success: true,
      message: 'Session force killed',
      session: await sessionManager.getSession(id),
    });
  } catch (error: any) {
    console.error('Error force killing session:', error);
    res.status(500).json({
      error: 'Failed to force kill session',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/sessions/:id
 * Delete session from database
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await sessionManager.getSession(id);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
      });
    }

    // If session is active, stop it first
    if (['active', 'idle', 'initializing'].includes(session.status)) {
      await sessionManager.requestForceKill(id);
    }

    // Delete from database
    const pool = (await import('../../db/client.js')).default;
    await pool.query('DELETE FROM agent_sessions WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Session deleted',
    });
  } catch (error: any) {
    console.error('Error deleting session:', error);
    res.status(500).json({
      error: 'Failed to delete session',
      details: error.message,
    });
  }
});

/**
 * GET /api/sessions/:id/status
 * Get current session status (lightweight endpoint for polling)
 */
router.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await sessionManager.getSession(id);

    if (!session) {
      return res.status(404).json({
        error: 'Session not found',
      });
    }

    res.json({
      success: true,
      status: session.status,
      currentTool: session.currentTool,
      totalCost: session.totalCost,
      totalTokens: session.totalTokens,
      numTurns: session.numTurns,
      lastActivityAt: session.lastActivityAt,
      abortRequested: session.abortRequested,
      forceKillRequested: session.forceKillRequested,
    });
  } catch (error: any) {
    console.error('Error getting session status:', error);
    res.status(500).json({
      error: 'Failed to get session status',
      details: error.message,
    });
  }
});

export default router;
