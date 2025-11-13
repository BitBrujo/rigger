import { Router, Request, Response } from 'express';
import pool from '../../db/client';

const router = Router();

// Get all presets
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT * FROM presets ORDER BY name ASC'
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching presets:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single preset
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM presets WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching preset:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new preset
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description, config } = req.body;

    if (!name || !config) {
      return res.status(400).json({ error: 'Name and config are required' });
    }

    const result = await pool.query(
      `INSERT INTO presets (name, description, config)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, description || null, config]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating preset:', error);
    if (error.code === '23505') {
      // Unique constraint violation
      return res.status(409).json({ error: 'A preset with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Update a preset
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, config } = req.body;

    const result = await pool.query(
      `UPDATE presets
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           config = COALESCE($3, config),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [name, description, config, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating preset:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'A preset with this name already exists' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Delete a preset
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM presets WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Preset not found' });
    }

    res.json({ message: 'Preset deleted', id: result.rows[0].id });
  } catch (error: any) {
    console.error('Error deleting preset:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
