import { Router, Request, Response } from 'express';
import pool from '../../db/client';

const router = Router();

// Get all conversations
router.get('/', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      'SELECT id, title, created_at, updated_at, config FROM conversations ORDER BY updated_at DESC'
    );
    res.json(result.rows);
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a single conversation
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM conversations WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new conversation
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, config, messages } = req.body;
    const result = await pool.query(
      `INSERT INTO conversations (title, config, messages)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [title || 'New Conversation', config, JSON.stringify(messages || [])]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update a conversation
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, config, messages } = req.body;

    const result = await pool.query(
      `UPDATE conversations
       SET title = COALESCE($1, title),
           config = COALESCE($2, config),
           messages = COALESCE($3, messages),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [title, config, messages ? JSON.stringify(messages) : null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    console.error('Error updating conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a conversation
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'DELETE FROM conversations WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted', id: result.rows[0].id });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
