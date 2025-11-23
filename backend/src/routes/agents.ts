import { Router, Request, Response } from 'express';
import pool from '../../db/client';

const router = Router();

// Helper to load agent templates from the codebase
// Note: In production, you might want to cache these
function getAgentTemplates() {
  // These templates match lib/agent-templates.ts
  return {
    'code-reviewer': {
      description: 'Expert code review specialist. Use for quality, security, and maintainability reviews.',
      systemPrompt: `You are a code review specialist with expertise in security, performance, and best practices...`,
      allowedTools: ['Read', 'Grep', 'Glob'],
      model: 'sonnet',
      maxTurns: 15,
      category: 'code',
      isTemplate: true
    },
    'test-writer': {
      description: 'Unit test creation specialist. Use for writing comprehensive test suites.',
      systemPrompt: `You are a test automation specialist focused on creating comprehensive, maintainable test suites...`,
      allowedTools: ['Read', 'Write', 'Grep', 'Glob', 'Bash'],
      model: 'sonnet',
      maxTurns: 20,
      category: 'testing',
      isTemplate: true
    },
    'doc-writer': {
      description: 'Documentation generation specialist. Use for creating clear, comprehensive documentation.',
      systemPrompt: `You are a technical documentation specialist who creates clear, comprehensive, and user-friendly documentation...`,
      allowedTools: ['Read', 'Write', 'Grep', 'Glob'],
      model: 'sonnet',
      maxTurns: 15,
      category: 'documentation',
      isTemplate: true
    },
    'refactorer': {
      description: 'Code refactoring specialist. Use for improving code structure and maintainability.',
      systemPrompt: `You are a refactoring specialist focused on improving code quality without changing functionality...`,
      allowedTools: ['Read', 'Edit', 'Grep', 'Glob'],
      model: 'sonnet',
      maxTurns: 20,
      category: 'code',
      isTemplate: true
    },
    'researcher': {
      description: 'Code analysis and research specialist. Use for exploring codebases and gathering information.',
      systemPrompt: `You are a research specialist focused on analyzing codebases and gathering technical information...`,
      allowedTools: ['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch'],
      model: 'sonnet',
      maxTurns: 25,
      category: 'research',
      isTemplate: true
    }
  };
}

// GET /api/agents/templates - Get all available templates
router.get('/templates', (req: Request, res: Response) => {
  try {
    const templates = getAgentTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error fetching agent templates:', error);
    res.status(500).json({ error: 'Failed to fetch agent templates' });
  }
});

// GET /api/agents/templates/:name - Get specific template
router.get('/templates/:name', (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const templates = getAgentTemplates();

    if (!(name in templates)) {
      return res.status(404).json({ error: `Template '${name}' not found` });
    }

    res.json({ name, ...(templates as any)[name] });
  } catch (error) {
    console.error('Error fetching agent template:', error);
    res.status(500).json({ error: 'Failed to fetch agent template' });
  }
});

// GET /api/agents - List all agents (templates + user-created from conversations/presets)
router.get('/', async (req: Request, res: Response) => {
  try {
    const templates = getAgentTemplates();

    // Get user-created agents from most recent conversation or preset
    // Note: This returns a merged view of all unique agents across all conversations
    const result = await pool.query(`
      SELECT DISTINCT ON (agent_key)
        agent_key as name,
        agent_value as definition
      FROM (
        SELECT
          key as agent_key,
          value as agent_value
        FROM conversations,
        LATERAL jsonb_each(custom_agents)
        WHERE custom_agents IS NOT NULL AND custom_agents != '{}'::jsonb

        UNION ALL

        SELECT
          key as agent_key,
          value as agent_value
        FROM presets,
        LATERAL jsonb_each(custom_agents)
        WHERE custom_agents IS NOT NULL AND custom_agents != '{}'::jsonb
      ) all_agents
      ORDER BY agent_key
    `);

    // Merge templates with user agents (user agents take precedence)
    const userAgents: Record<string, any> = {};
    result.rows.forEach(row => {
      userAgents[row.name] = {
        ...row.definition,
        isTemplate: false,
        name: row.name
      };
    });

    const allAgents = {
      ...templates,
      ...userAgents
    };

    res.json(allAgents);
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

// GET /api/agents/:name - Get specific agent
router.get('/:name', async (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    // Check templates first
    const templates = getAgentTemplates();
    if (name in templates) {
      return res.json({ name, ...(templates as any)[name] });
    }

    // Check user-created agents
    const result = await pool.query(`
      SELECT
        key as name,
        value as definition
      FROM (
        SELECT
          key,
          value
        FROM conversations,
        LATERAL jsonb_each(custom_agents)
        WHERE custom_agents IS NOT NULL AND custom_agents != '{}'::jsonb

        UNION ALL

        SELECT
          key,
          value
        FROM presets,
        LATERAL jsonb_each(custom_agents)
        WHERE custom_agents IS NOT NULL AND custom_agents != '{}'::jsonb
      ) all_agents
      WHERE key = $1
      LIMIT 1
    `, [name]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: `Agent '${name}' not found` });
    }

    res.json({
      name: result.rows[0].name,
      ...result.rows[0].definition,
      isTemplate: false
    });
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});

// POST /api/agents/from-template/:templateName - Create agent from template
router.post('/from-template/:templateName', (req: Request, res: Response) => {
  try {
    const { templateName } = req.params;
    const { name, customizations } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Agent name is required' });
    }

    const templates = getAgentTemplates();
    if (!(templateName in templates)) {
      return res.status(404).json({ error: `Template '${templateName}' not found` });
    }

    // Create agent from template with customizations
    const agent = {
      ...(templates as any)[templateName],
      ...customizations,
      isTemplate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(201).json({ name, ...agent });
  } catch (error) {
    console.error('Error creating agent from template:', error);
    res.status(500).json({ error: 'Failed to create agent from template' });
  }
});

// POST /api/agents - Create new agent
// Note: This endpoint returns the agent definition for use in the UI
// Actual persistence happens through conversations/presets endpoints
router.post('/', (req: Request, res: Response) => {
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

    // Add metadata
    const agent = {
      ...definition,
      enabled: definition.enabled !== undefined ? definition.enabled : true, // Default to enabled
      isTemplate: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Return the agent (persistence happens through conversation/preset saves)
    res.status(201).json({ name, ...agent });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// PUT /api/agents/:name - Update agent
// Note: Returns updated definition for UI use
// Actual persistence happens through conversations/presets endpoints
router.put('/:name', (req: Request, res: Response) => {
  try {
    const { name } = req.params;
    const { definition } = req.body;

    if (!definition) {
      return res.status(400).json({ error: 'Agent definition is required' });
    }

    // Add updated timestamp
    const updatedAgent = {
      ...definition,
      updatedAt: new Date().toISOString()
    };

    res.json({ name, ...updatedAgent });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// DELETE /api/agents/:name - Delete agent
// Note: Returns success status
// Actual deletion happens through conversation/preset updates
router.delete('/:name', (req: Request, res: Response) => {
  try {
    const { name } = req.params;

    // Check if it's a template (can't delete templates)
    const templates = getAgentTemplates();
    if (name in templates) {
      return res.status(400).json({ error: 'Cannot delete built-in templates' });
    }

    // Return success (actual deletion happens through conversation/preset updates)
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
