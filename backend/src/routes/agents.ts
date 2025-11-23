import { Router, Request, Response } from 'express';
import pool from '../../db/client';

const router = Router();

// GET /api/agents - List all agents from database
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get all agents from custom_agents table
    const result = await pool.query(`
      SELECT name, definition, enabled, created_at, updated_at
      FROM custom_agents
      ORDER BY name
    `);

    // Convert to object format for compatibility
    const agents: Record<string, any> = {};
    result.rows.forEach(row => {
      agents[row.name] = {
        ...row.definition,
        enabled: row.enabled,
        isTemplate: false,
        name: row.name,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
    });

    res.json(agents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// GET /api/agents/:name - Get specific agent from database
router.get('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    // Get agent from database
    const result = await pool.query(`
      SELECT name, definition, enabled, created_at, updated_at
      FROM custom_agents
      WHERE name = $1
    `, [name]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Agent '${name}' not found` });
    }

    const row = result.rows[0];
    res.json({
      name: row.name,
      ...row.definition,
      enabled: row.enabled,
      isTemplate: false,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// POST /api/agents - Create new agent
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, definition } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Agent name is required' });
    }

    if (!definition) {
      return res.status(400).json({ error: 'Agent definition is required' });
    }

    // Validate definition has required fields
    if (!definition.systemPrompt && !definition.prompt) {
      return res.status(400).json({ error: 'Either systemPrompt or prompt is required' });
    }

    // Extract fields for structured columns
    const systemPrompt = definition.systemPrompt || definition.prompt;
    const description = definition.description || null;
    const allowedTools = definition.allowedTools || [];
    const disallowedTools = definition.disallowedTools || [];
    const model = definition.model || null;
    const temperature = definition.temperature || null;
    const maxTurns = definition.maxTurns || null;
    const maxBudgetUsd = definition.maxBudgetUsd || null;
    const category = definition.category || null;
    const enabled = definition.enabled !== undefined ? definition.enabled : true;

    // Insert into database
    const result = await pool.query(`
      INSERT INTO custom_agents
        (name, description, system_prompt, allowed_tools, disallowed_tools,
         model, temperature, max_turns, max_budget_usd, category, enabled, definition)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING name, definition, enabled, created_at, updated_at
    `, [
      name,
      description,
      systemPrompt,
      allowedTools,
      disallowedTools,
      model,
      temperature,
      maxTurns,
      maxBudgetUsd,
      category,
      enabled,
      JSON.stringify(definition)
    ]);

    const row = result.rows[0];
    res.status(201).json({
      name: row.name,
      ...row.definition,
      enabled: row.enabled,
      isTemplate: false,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (error: any) {
    console.error('Error creating agent:', error);
    if (error.code === '23505') { // unique_violation
      return res.status(400).json({ error: `Agent '${req.body.name}' already exists` });
    }
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// PUT /api/agents/:name - Update agent
router.put('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { definition } = req.body;

    if (!definition) {
      return res.status(400).json({ error: 'Agent definition is required' });
    }

    // Extract fields for structured columns
    const systemPrompt = definition.systemPrompt || definition.prompt;
    const description = definition.description || null;
    const allowedTools = definition.allowedTools || [];
    const disallowedTools = definition.disallowedTools || [];
    const model = definition.model || null;
    const temperature = definition.temperature || null;
    const maxTurns = definition.maxTurns || null;
    const maxBudgetUsd = definition.maxBudgetUsd || null;
    const category = definition.category || null;
    const enabled = definition.enabled !== undefined ? definition.enabled : true;

    // Update in database
    const result = await pool.query(`
      UPDATE custom_agents
      SET
        description = $2,
        system_prompt = $3,
        allowed_tools = $4,
        disallowed_tools = $5,
        model = $6,
        temperature = $7,
        max_turns = $8,
        max_budget_usd = $9,
        category = $10,
        enabled = $11,
        definition = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE name = $1
      RETURNING name, definition, enabled, created_at, updated_at
    `, [
      name,
      description,
      systemPrompt,
      allowedTools,
      disallowedTools,
      model,
      temperature,
      maxTurns,
      maxBudgetUsd,
      category,
      enabled,
      JSON.stringify(definition)
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Agent '${name}' not found` });
    }

    const row = result.rows[0];
    res.json({
      name: row.name,
      ...row.definition,
      enabled: row.enabled,
      isTemplate: false,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// DELETE /api/agents/:name - Delete agent
router.delete('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    // Delete from database
    const result = await pool.query(`
      DELETE FROM custom_agents
      WHERE name = $1
      RETURNING name
    `, [name]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Agent '${name}' not found` });
    }

    res.json({ success: true, name });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// POST /api/agents/validate - Validate agent definition
router.post('/validate', (req: Request, res: Response) => {
  try {
    const { name, definition } = req.body;
    const errors: string[] = [];

    // Validate name
    if (!name || name.trim() === '') {
      errors.push('Agent name is required');
    } else if (!/^[a-z0-9-]+$/.test(name)) {
      errors.push('Agent name must contain only lowercase letters, numbers, and hyphens');
    }

    // Validate definition
    if (!definition) {
      errors.push('Agent definition is required');
    } else {
      // Check for system prompt
      if (!definition.systemPrompt && !definition.prompt) {
        errors.push('Either systemPrompt or prompt is required');
      }

      // Validate tool names if provided
      const allTools = [
        'Read', 'Write', 'Edit', 'Glob', 'Grep', 'NotebookEdit',
        'Bash', 'BashOutput', 'KillShell',
        'WebFetch', 'WebSearch',
        'TodoWrite', 'Task',
        'ListMcpResources', 'ReadMcpResource',
        'ExitPlanMode', 'TimeMachine', 'MultipleChoiceQuestion', 'Skill'
      ];

      if (definition.allowedTools) {
        definition.allowedTools.forEach((tool: string) => {
          if (!allTools.includes(tool)) {
            errors.push(`Invalid tool name: ${tool}`);
          }
        });
      }

      if (definition.tools) {
        definition.tools.forEach((tool: string) => {
          if (!allTools.includes(tool)) {
            errors.push(`Invalid tool name: ${tool}`);
          }
        });
      }

      // Validate model if provided
      if (definition.model) {
        const validModels = ['sonnet', 'haiku', 'opus', 'inherit'];
        if (!validModels.includes(definition.model) &&
            !definition.model.startsWith('claude-')) {
          errors.push(`Invalid model: ${definition.model}`);
        }
      }

      // Validate maxTurns if provided
      if (definition.maxTurns !== undefined) {
        if (typeof definition.maxTurns !== 'number' || definition.maxTurns < 1 || definition.maxTurns > 100) {
          errors.push('maxTurns must be a number between 1 and 100');
        }
      }

      // Validate maxBudgetUsd if provided
      if (definition.maxBudgetUsd !== undefined) {
        if (typeof definition.maxBudgetUsd !== 'number' || definition.maxBudgetUsd < 0) {
          errors.push('maxBudgetUsd must be a positive number');
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ valid: false, errors });
    }

    res.json({ valid: true, errors: [] });
  } catch (error) {
    console.error('Error validating agent:', error);
    res.status(500).json({ error: 'Failed to validate agent' });
  }
});

export default router;
