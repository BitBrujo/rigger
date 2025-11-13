export interface HookTemplate {
  name: string;
  description: string;
  category: 'safety' | 'budget' | 'logging' | 'workflow';
  hooks: Record<string, any>;
}

export const HOOK_TEMPLATES: HookTemplate[] = [
  {
    name: 'Block Dangerous Bash Commands',
    description: 'Prevent execution of potentially dangerous bash commands (rm, dd, format)',
    category: 'safety',
    hooks: {
      pre_tool_use: {
        tool: 'Bash',
        pattern: '^(rm|dd|mkfs|format)',
        action: 'block',
        message: 'Dangerous bash command blocked for safety'
      }
    }
  },
  {
    name: 'Warn on File Deletions',
    description: 'Show warning before deleting files',
    category: 'safety',
    hooks: {
      pre_tool_use: {
        tool: 'Bash',
        pattern: 'rm -rf',
        action: 'warn',
        message: 'About to delete files recursively'
      }
    }
  },
  {
    name: 'Budget Alert at 80%',
    description: 'Warn when reaching 80% of budget, stop at 100%',
    category: 'budget',
    hooks: {
      on_budget_threshold: {
        threshold: 0.8,
        action: 'warn',
        message: 'Budget 80% consumed'
      },
      on_budget_exceeded: {
        action: 'stop',
        message: 'Budget limit reached'
      }
    }
  },
  {
    name: 'Log All Tool Usage',
    description: 'Log every tool execution for debugging',
    category: 'logging',
    hooks: {
      pre_tool_use: {
        action: 'log',
        message: 'Tool executed: {{tool}}'
      },
      post_tool_use: {
        action: 'log',
        message: 'Tool completed: {{tool}}'
      }
    }
  },
  {
    name: 'Require Approval for Web Access',
    description: 'Ask for permission before fetching web content',
    category: 'safety',
    hooks: {
      pre_tool_use: {
        tool: 'WebFetch',
        action: 'warn',
        message: 'About to fetch: {{url}}'
      }
    }
  },
  {
    name: 'Plan Before Execute',
    description: 'Require planning phase before any file operations',
    category: 'workflow',
    hooks: {
      pre_tool_use: {
        tool: '(Write|Edit|Bash)',
        action: 'warn',
        message: 'About to modify files/execute commands',
        require_plan: true
      }
    }
  },
  {
    name: 'Stop on Turn Limit',
    description: 'Automatically stop when reaching max turns',
    category: 'workflow',
    hooks: {
      on_turn_end: {
        action: 'log',
        message: 'Turn {{turn_number}} completed'
      },
      on_max_turns: {
        action: 'stop',
        message: 'Maximum turns reached'
      }
    }
  },
  {
    name: 'Block System File Access',
    description: 'Prevent reading/writing system configuration files',
    category: 'safety',
    hooks: {
      pre_tool_use: {
        tool: '(Read|Write|Edit)',
        pattern: '(/etc/|/sys/|/proc/|/dev/)',
        action: 'block',
        message: 'System file access blocked'
      }
    }
  },
  {
    name: 'Verbose Debugging',
    description: 'Log detailed information about every turn and tool use',
    category: 'logging',
    hooks: {
      on_turn_start: {
        action: 'log',
        message: 'Starting turn {{turn_number}}'
      },
      pre_tool_use: {
        action: 'log',
        message: 'Calling {{tool}} with params: {{params}}'
      },
      post_tool_use: {
        action: 'log',
        message: '{{tool}} returned: {{result}}'
      },
      on_turn_end: {
        action: 'log',
        message: 'Turn {{turn_number}} complete. Cost: ${{turn_cost}}'
      }
    }
  },
  {
    name: 'Cost-Conscious Mode',
    description: 'Warn on expensive operations and track spending',
    category: 'budget',
    hooks: {
      on_turn_start: {
        action: 'log',
        message: 'Total cost so far: ${{accumulated_cost}}'
      },
      on_budget_threshold: {
        threshold: 0.5,
        action: 'warn',
        message: 'Half of budget consumed'
      },
      on_budget_threshold_90: {
        threshold: 0.9,
        action: 'warn',
        message: 'Approaching budget limit (90%)'
      }
    }
  }
];

export const HOOK_CATEGORIES = [
  { value: 'all', label: 'All Templates' },
  { value: 'safety', label: 'Safety & Security' },
  { value: 'budget', label: 'Budget Management' },
  { value: 'logging', label: 'Logging & Debugging' },
  { value: 'workflow', label: 'Workflow Control' }
] as const;
