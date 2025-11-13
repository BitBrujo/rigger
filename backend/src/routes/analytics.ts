import { Router, Request, Response } from 'express';
import pool from '../../db/client';

const router = Router();

// Get usage analytics
router.get('/', async (req: Request, res: Response) => {
  try {
    const { conversationId, startDate, endDate, model } = req.query;

    let query = 'SELECT * FROM usage_logs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (conversationId) {
      query += ` AND conversation_id = $${paramIndex}`;
      params.push(conversationId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    if (model) {
      query += ` AND model = $${paramIndex}`;
      params.push(model);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC LIMIT 1000';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get aggregated statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { conversationId, startDate, endDate } = req.query;

    let query = `
      SELECT
        model,
        COUNT(*) as request_count,
        SUM(input_tokens) as total_input_tokens,
        SUM(output_tokens) as total_output_tokens,
        SUM(input_tokens + output_tokens) as total_tokens,
        AVG(latency_ms) as avg_latency_ms,
        SUM(cost_usd) as total_cost_usd,
        COUNT(CASE WHEN error IS NOT NULL THEN 1 END) as error_count
      FROM usage_logs
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (conversationId) {
      query += ` AND conversation_id = $${paramIndex}`;
      params.push(conversationId);
      paramIndex++;
    }

    if (startDate) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    query += ' GROUP BY model ORDER BY model';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get token usage over time
router.get('/timeline', async (req: Request, res: Response) => {
  try {
    const { interval = 'hour' } = req.query;

    let dateFormat = 'YYYY-MM-DD HH24:00:00';
    if (interval === 'day') {
      dateFormat = 'YYYY-MM-DD';
    } else if (interval === 'minute') {
      dateFormat = 'YYYY-MM-DD HH24:MI:00';
    }

    const result = await pool.query(`
      SELECT
        TO_CHAR(created_at, $1) as time_bucket,
        model,
        COUNT(*) as request_count,
        SUM(input_tokens) as input_tokens,
        SUM(output_tokens) as output_tokens,
        AVG(latency_ms) as avg_latency
      FROM usage_logs
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY time_bucket, model
      ORDER BY time_bucket DESC
    `, [dateFormat]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
