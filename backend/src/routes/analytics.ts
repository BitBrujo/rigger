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

// Get step-by-step cost breakdown for a conversation
router.get('/steps/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;

    const result = await pool.query(`
      SELECT
        step_number,
        message_id,
        cost_usd,
        input_tokens,
        output_tokens,
        cache_creation_tokens,
        cache_read_tokens,
        array_length(tools_used, 1) as num_tools,
        tools_used,
        latency_ms,
        created_at as timestamp
      FROM usage_logs
      WHERE conversation_id = $1
      ORDER BY step_number ASC, created_at ASC
    `, [conversationId]);

    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching step breakdown:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get per-tool cost breakdown
router.get('/tools', async (req: Request, res: Response) => {
  try {
    const { conversationId, startDate, endDate } = req.query;

    let query = `
      SELECT
        tool_name,
        COUNT(*) as usage_count,
        SUM(duration_ms) as total_duration_ms,
        AVG(duration_ms) as avg_duration_ms,
        SUM(estimated_cost_usd) as total_estimated_cost_usd,
        AVG(estimated_cost_usd) as avg_estimated_cost_usd,
        SUM(COALESCE(estimated_input_tokens, 0) + COALESCE(estimated_output_tokens, 0)) as total_estimated_tokens
      FROM tool_usage_logs
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (conversationId) {
      query += ` AND usage_log_id IN (SELECT id FROM usage_logs WHERE conversation_id = $${paramIndex})`;
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

    query += ' GROUP BY tool_name ORDER BY total_estimated_cost_usd DESC NULLS LAST';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching tool breakdown:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export cost report as JSON
router.get('/export/:conversationId', async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const { format = 'json' } = req.query;

    // Get steps
    const stepsResult = await pool.query(`
      SELECT
        step_number,
        message_id,
        cost_usd,
        input_tokens,
        output_tokens,
        cache_creation_tokens,
        cache_read_tokens,
        array_length(tools_used, 1) as num_tools,
        tools_used,
        latency_ms,
        created_at as timestamp
      FROM usage_logs
      WHERE conversation_id = $1
      ORDER BY step_number ASC, created_at ASC
    `, [conversationId]);

    // Get tool breakdown
    const toolsResult = await pool.query(`
      SELECT
        tool_name,
        COUNT(*) as usage_count,
        SUM(duration_ms) as total_duration_ms,
        AVG(duration_ms) as avg_duration_ms,
        SUM(estimated_cost_usd) as total_estimated_cost_usd,
        AVG(estimated_cost_usd) as avg_estimated_cost_usd,
        SUM(COALESCE(estimated_input_tokens, 0) + COALESCE(estimated_output_tokens, 0)) as total_estimated_tokens
      FROM tool_usage_logs
      WHERE usage_log_id IN (SELECT id FROM usage_logs WHERE conversation_id = $1)
      GROUP BY tool_name
      ORDER BY total_estimated_cost_usd DESC NULLS LAST
    `, [conversationId]);

    // Calculate summary
    const totalCost = stepsResult.rows.reduce((sum, row) => sum + (parseFloat(row.cost_usd) || 0), 0);
    const totalTokens = stepsResult.rows.reduce((sum, row) =>
      sum + (row.input_tokens || 0) + (row.output_tokens || 0), 0);
    const numSteps = stepsResult.rows.length;
    const numToolUses = toolsResult.rows.reduce((sum, row) => sum + parseInt(row.usage_count || 0), 0);

    const startTime = stepsResult.rows[0]?.timestamp || new Date().toISOString();
    const endTime = stepsResult.rows[stepsResult.rows.length - 1]?.timestamp || new Date().toISOString();
    const durationMinutes = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000;

    const exportData = {
      conversation_id: parseInt(conversationId),
      export_date: new Date().toISOString(),
      total_cost: totalCost,
      total_tokens: totalTokens,
      steps: stepsResult.rows,
      tools: toolsResult.rows,
      summary: {
        start_time: startTime,
        end_time: endTime,
        duration_minutes: durationMinutes,
        num_steps: numSteps,
        num_tool_uses: numToolUses
      }
    };

    if (format === 'csv') {
      // Generate CSV for steps
      const csvLines = [
        'Step,Message ID,Cost (USD),Input Tokens,Output Tokens,Cache Creation,Cache Read,Tools Used,Latency (ms),Timestamp',
        ...stepsResult.rows.map(row =>
          `${row.step_number},${row.message_id},${row.cost_usd},${row.input_tokens},${row.output_tokens},${row.cache_creation_tokens},${row.cache_read_tokens},"${(row.tools_used || []).join(', ')}",${row.latency_ms},${row.timestamp}`
        )
      ];

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=conversation-${conversationId}-costs.csv`);
      res.send(csvLines.join('\n'));
    } else {
      res.json(exportData);
    }
  } catch (error: any) {
    console.error('Error exporting cost report:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
