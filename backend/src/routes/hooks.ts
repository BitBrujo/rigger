import { Router, Request, Response } from 'express';
import pool from '../../db/client';

const router = Router();

// GET /api/hooks - List all hooks
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM hooks ORDER BY created_at DESC'
    );

    // Transform rows to hook object format
    const hooks: Record<string, any> = {};
    result.rows.forEach((row) => {
      hooks[row.id] = {
        name: row.name,
        description: row.description,
        trigger: row.trigger,
        action: row.action,
        enabled: row.enabled,
        ...row.config,
      };
    });

    res.json(hooks);
  } catch (error: any) {
    console.error('Error fetching hooks:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hooks/:id - Get specific hook
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM hooks WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hook not found' });
    }

    const row = result.rows[0];
    const hook = {
      name: row.name,
      description: row.description,
      trigger: row.trigger,
      action: row.action,
      enabled: row.enabled,
      ...row.config,
    };

    res.json(hook);
  } catch (error: any) {
    console.error('Error fetching hook:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/hooks - Create new hook
router.post('/', async (req: Request, res: Response) => {
  try {
    const { id, name, description, trigger, action, enabled, ...config } = req.body;

    if (!name || !trigger || !action) {
      return res.status(400).json({
        error: 'name, trigger, and action are required'
      });
    }

    const hookId = id || `hook_${Date.now()}`;

    const result = await pool.query(
      `INSERT INTO hooks (id, name, description, trigger, action, enabled, config)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        hookId,
        name,
        description || null,
        trigger,
        JSON.stringify(action),
        enabled !== undefined ? enabled : true,
        JSON.stringify(config),
      ]
    );

    const row = result.rows[0];
    const hook = {
      name: row.name,
      description: row.description,
      trigger: row.trigger,
      action: row.action,
      enabled: row.enabled,
      ...row.config,
    };

    res.status(201).json(hook);
  } catch (error: any) {
    console.error('Error creating hook:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A hook with this ID already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/hooks/:id - Update hook
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, trigger, action, enabled, ...config } = req.body;

    // Build update query dynamically based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (trigger !== undefined) {
      updates.push(`trigger = $${paramIndex++}`);
      values.push(trigger);
    }
    if (action !== undefined) {
      updates.push(`action = $${paramIndex++}`);
      values.push(JSON.stringify(action));
    }
    if (enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(enabled);
    }
    if (Object.keys(config).length > 0) {
      updates.push(`config = $${paramIndex++}`);
      values.push(JSON.stringify(config));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE hooks
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hook not found' });
    }

    const row = result.rows[0];
    const hook = {
      name: row.name,
      description: row.description,
      trigger: row.trigger,
      action: row.action,
      enabled: row.enabled,
      ...row.config,
    };

    res.json(hook);
  } catch (error: any) {
    console.error('Error updating hook:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/hooks/:id - Delete hook
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM hooks WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Hook not found' });
    }

    res.json({ message: 'Hook deleted', id: result.rows[0].id });
  } catch (error: any) {
    console.error('Error deleting hook:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
