import { Router, Request, Response } from 'express';
import pool from '../../db/client';

const router = Router();

// GET /api/todos - List all todos (global)
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get all todos with their items
    const todosResult = await pool.query(
      `SELECT id, title, tool_use_id, created_at, updated_at
       FROM todos
       ORDER BY created_at DESC`
    );

    const todos = await Promise.all(
      todosResult.rows.map(async (todo) => {
        const itemsResult = await pool.query(
          `SELECT id, content, active_form, status, created_at
           FROM todo_items
           WHERE todo_id = $1
           ORDER BY created_at ASC`,
          [todo.id]
        );

        return {
          id: todo.id,
          title: todo.title,
          toolUseId: todo.tool_use_id,
          createdAt: todo.created_at,
          updatedAt: todo.updated_at,
          items: itemsResult.rows.map((item) => ({
            id: item.id,
            content: item.content,
            activeForm: item.active_form,
            status: item.status,
            createdAt: item.created_at,
          })),
        };
      })
    );

    res.json(todos);
  } catch (error) {
    console.error('Error fetching todos:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// GET /api/todos/:id - Get specific todo list
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const todoResult = await pool.query(
      'SELECT id, title, tool_use_id, created_at, updated_at FROM todos WHERE id = $1',
      [id]
    );

    if (todoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    const todo = todoResult.rows[0];

    const itemsResult = await pool.query(
      `SELECT id, content, active_form, status, created_at
       FROM todo_items
       WHERE todo_id = $1
       ORDER BY created_at ASC`,
      [id]
    );

    const response = {
      id: todo.id,
      title: todo.title,
      toolUseId: todo.tool_use_id,
      createdAt: todo.created_at,
      updatedAt: todo.updated_at,
      items: itemsResult.rows.map((item) => ({
        id: item.id,
        content: item.content,
        activeForm: item.active_form,
        status: item.status,
        createdAt: item.created_at,
      })),
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching todo:', error);
    res.status(500).json({ error: 'Failed to fetch todo' });
  }
});

// POST /api/todos - Create new todo list
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title, toolUseId, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert todo list
      const todoResult = await client.query(
        'INSERT INTO todos (title, tool_use_id) VALUES ($1, $2) RETURNING id, title, tool_use_id, created_at, updated_at',
        [title || null, toolUseId || null]
      );

      const todo = todoResult.rows[0];

      // Insert todo items
      const itemPromises = items.map((item: any) =>
        client.query(
          'INSERT INTO todo_items (todo_id, content, active_form, status) VALUES ($1, $2, $3, $4) RETURNING id, content, active_form, status, created_at',
          [todo.id, item.content, item.activeForm || null, item.status || 'pending']
        )
      );

      const itemResults = await Promise.all(itemPromises);

      await client.query('COMMIT');

      const response = {
        id: todo.id,
        title: todo.title,
        toolUseId: todo.tool_use_id,
        createdAt: todo.created_at,
        updatedAt: todo.updated_at,
        items: itemResults.map((result) => ({
          id: result.rows[0].id,
          content: result.rows[0].content,
          activeForm: result.rows[0].active_form,
          status: result.rows[0].status,
          createdAt: result.rows[0].created_at,
        })),
      };

      res.status(201).json(response);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error creating todo:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// DELETE /api/todos/:id - Delete todo list
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM todos WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    console.error('Error deleting todo:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

export default router;
