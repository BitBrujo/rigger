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
        name: 'Block Dangerous Bash Commands',
        tool: 'Bash',
        pattern: '^(rm|dd|mkfs|format)',
        action: 'block',
        message: 'Dangerous bash command blocked for safety',
        enabled: true
      }
    }
  },
  {
    name: 'Warn on File Deletions',
    description: 'Show warning before deleting files',
    category: 'safety',
    hooks: {
      pre_tool_use: {
        name: 'Warn on File Deletions',
        tool: 'Bash',
        pattern: 'rm -rf',
        action: 'warn',
        message: 'About to delete files recursively',
        enabled: true
      }
    }
  },
  {
    name: 'Budget Alert at 80%',
    description: 'Warn when reaching 80% of budget, stop at 100%',
    category: 'budget',
    hooks: {
      on_budget_threshold: {
        name: 'Budget Alert at 80%',
        threshold: 0.8,
        action: 'warn',
        message: 'Budget 80% consumed',
        enabled: true
      },
      on_budget_exceeded: {
        name: 'Budget Limit Reached',
        action: 'stop',
        message: 'Budget limit reached',
        enabled: true
      }
    }
  },
  {
    name: 'Log All Tool Usage',
    description: 'Log every tool execution for debugging',
    category: 'logging',
    hooks: {
      pre_tool_use: {
        name: 'Pre-Tool Log',
        action: 'log',
        message: 'Tool executed: {{tool}}',
        enabled: true
      },
      post_tool_use: {
        name: 'Post-Tool Log',
        action: 'log',
        message: 'Tool completed: {{tool}}',
        enabled: true
      }
    }
  },
  {
    name: 'Require Approval for Web Access',
    description: 'Ask for permission before fetching web content',
    category: 'safety',
    hooks: {
      pre_tool_use: {
        name: 'Require Approval for Web Access',
        tool: 'WebFetch',
        action: 'warn',
        message: 'About to fetch: {{url}}',
        enabled: true
      }
    }
  },
  {
    name: 'Plan Before Execute',
    description: 'Require planning phase before any file operations',
    category: 'workflow',
    hooks: {
      pre_tool_use: {
        name: 'Plan Before Execute',
        tool: '(Write|Edit|Bash)',
        action: 'warn',
        message: 'About to modify files/execute commands',
        require_plan: true,
        enabled: true
      }
    }
  },
  {
    name: 'Stop on Turn Limit',
    description: 'Automatically stop when reaching max turns',
    category: 'workflow',
    hooks: {
      on_turn_end: {
        name: 'Turn End Log',
        action: 'log',
        message: 'Turn {{turn_number}} completed',
        enabled: true
      },
      on_max_turns: {
        name: 'Stop on Max Turns',
        action: 'stop',
        message: 'Maximum turns reached',
        enabled: true
      }
    }
  },
  {
    name: 'Block System File Access',
    description: 'Prevent reading/writing system configuration files',
    category: 'safety',
    hooks: {
      pre_tool_use: {
        name: 'Block System File Access',
        tool: '(Read|Write|Edit)',
        pattern: '(/etc/|/sys/|/proc/|/dev/)',
        action: 'block',
        message: 'System file access blocked',
        enabled: true
      }
    }
  },
  {
    name: 'Verbose Debugging',
    description: 'Log detailed information about every turn and tool use',
    category: 'logging',
    hooks: {
      on_turn_start: {
        name: 'Turn Start Log',
        action: 'log',
        message: 'Starting turn {{turn_number}}',
        enabled: true
      },
      pre_tool_use: {
        name: 'Pre-Tool Verbose Log',
        action: 'log',
        message: 'Calling {{tool}} with params: {{params}}',
        enabled: true
      },
      post_tool_use: {
        name: 'Post-Tool Verbose Log',
        action: 'log',
        message: '{{tool}} returned: {{result}}',
        enabled: true
      },
      on_turn_end: {
        name: 'Turn End Verbose Log',
        action: 'log',
        message: 'Turn {{turn_number}} complete. Cost: ${{turn_cost}}',
        enabled: true
      }
    }
  },
  {
    name: 'Cost-Conscious Mode',
    description: 'Warn on expensive operations and track spending',
    category: 'budget',
    hooks: {
      on_turn_start: {
        name: 'Cost Tracking Log',
        action: 'log',
        message: 'Total cost so far: ${{accumulated_cost}}',
        enabled: true
      },
      on_budget_threshold: {
        name: 'Budget 50% Warning',
        threshold: 0.5,
        action: 'warn',
        message: 'Half of budget consumed',
        enabled: true
      },
      on_budget_threshold_90: {
        name: 'Budget 90% Warning',
        threshold: 0.9,
        action: 'warn',
        message: 'Approaching budget limit (90%)',
        enabled: true
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
