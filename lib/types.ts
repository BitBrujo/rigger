// Agent SDK Only Types
// Messages API support removed

// Message types
export interface Message {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: any;
  tool_use_id?: string;
  content?: string | any[];
}

// MCP Server Configuration
export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

// Custom Agent Definition
export interface AgentDefinition {
  systemPrompt?: string;
  allowedTools?: string[];
  disallowedTools?: string[];
}

// Hook Configuration
export interface HookConfig {
  event: string;
  pattern: string | Record<string, any>;
}

// Agent SDK Configuration (30+ parameters)
export interface AgentSDKConfig {
  // Core Settings
  model: 'claude-3-5-sonnet-20241022' | 'claude-3-5-haiku-20241022' | 'claude-3-opus-20240229' | string;
  systemPrompt?: string;

  // Agent Behavior
  maxTurns: number;
  maxBudgetUsd?: number;
  maxThinkingTokens?: number | null;

  // Permissions & Security
  permissionMode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan';
  allowDangerouslySkipPermissions?: boolean;

  // Tools (18 built-in tools available)
  allowedTools: string[];
  disallowedTools?: string[];

  // Workspace
  workingDirectory: string;
  additionalDirectories?: string[];
  env?: Record<string, string>;
  executable?: 'bun' | 'deno' | 'node';
  executableArgs?: string[];

  // Session Management
  continueSession?: boolean;
  resumeSessionId?: string;
  resumeAtMessageId?: string;
  forkSession?: boolean;

  // Advanced
  fallbackModel?: string;
  mcpServers?: Record<string, McpServerConfig>;
  strictMcpConfig?: boolean;
  customAgents?: Record<string, AgentDefinition>;
  hooks?: Record<string, any>;
  plugins?: any[];
}

// Stream event types from Agent SDK
export interface SDKStreamEvent {
  type: 'system' | 'user' | 'assistant' | 'result' | 'stream_event';
  data?: any;
  event?: any;
  message?: any;
  usage?: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
  total_cost_usd?: number;
  num_turns?: number;
  is_error?: boolean;
  permission_denials?: Array<{
    tool_name: string;
    tool_use_id: string;
    tool_input: any;
  }>;
  session_id?: string;
  subtype?: string;
}

// Database types
export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;

  // Core SDK settings
  model: string;
  system_prompt?: string;
  max_turns: number;
  max_budget_usd?: number;
  max_thinking_tokens?: number;

  // Permissions & Security
  permission_mode: string;
  allow_dangerous_skip_permissions: boolean;

  // Tools
  allowed_tools: string[];
  disallowed_tools: string[];

  // Workspace
  working_directory: string;
  additional_directories: string[];
  environment_vars: Record<string, string>;
  executable: string;
  executable_args: string[];

  // Session Management
  continue_session: boolean;
  resume_session_id?: string;
  resume_at_message_id?: string;
  fork_session: boolean;

  // Advanced
  fallback_model?: string;
  mcp_servers: Record<string, McpServerConfig>;
  strict_mcp_config: boolean;
  custom_agents: Record<string, AgentDefinition>;
  hooks: Record<string, any>;
  plugins: any[];

  // Conversation history
  messages: Message[];
}

export interface Preset {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;

  // Core SDK settings
  model: string;
  system_prompt?: string;
  max_turns: number;
  max_budget_usd?: number;
  max_thinking_tokens?: number;

  // Permissions & Security
  permission_mode: string;
  allow_dangerous_skip_permissions: boolean;

  // Tools
  allowed_tools: string[];
  disallowed_tools: string[];

  // Workspace
  working_directory: string;
  additional_directories: string[];
  environment_vars: Record<string, string>;
  executable: string;
  executable_args: string[];

  // Session Management
  continue_session: boolean;
  resume_session_id?: string;
  resume_at_message_id?: string;
  fork_session: boolean;

  // Advanced
  fallback_model?: string;
  mcp_servers: Record<string, McpServerConfig>;
  strict_mcp_config: boolean;
  custom_agents: Record<string, AgentDefinition>;
  hooks: Record<string, any>;
  plugins: any[];
}

export interface UsageLog {
  id: number;
  conversation_id: number | null;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  cost_usd: number | null;
  latency_ms: number | null;
  api_latency_ms: number | null;
  num_turns: number | null;
  stop_reason: string | null;
  permission_denials: any[];
  tools_used: string[];
  error: string | null;
  created_at: string;
}

export interface UsageStats {
  model: string;
  request_count: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  avg_latency_ms: number;
  total_cost_usd: number;
  error_count: number;
}

// UI State types
export interface DebugInfo {
  latency: number;
  tokens: {
    input: number;
    output: number;
    total: number;
    cacheCreation?: number;
    cacheRead?: number;
  };
  cost: number;
  stopReason: string;
  timestamp: string;
  errors: string[];
  numTurns?: number;
  apiLatency?: number;
  permissionDenials?: Array<{
    tool_name: string;
    tool_use_id: string;
    tool_input: any;
  }>;
  sessionId?: string;
  toolsUsed?: string[];
}

// Default configuration for Agent SDK
export const DEFAULT_SDK_CONFIG: AgentSDKConfig = {
  model: 'claude-3-5-sonnet-20241022',
  systemPrompt: 'You are a helpful AI assistant with access to file operations, web browsing, and code execution.',
  maxTurns: 20,
  permissionMode: 'acceptEdits',
  allowDangerouslySkipPermissions: false,
  allowedTools: [
    'Read',
    'Write',
    'Edit',
    'Glob',
    'Grep',
    'Bash',
    'BashOutput',
    'KillShell',
    'WebFetch',
    'WebSearch',
    'TodoWrite',
    'Task',
  ],
  disallowedTools: [],
  workingDirectory: '/app/workspace',
  additionalDirectories: [],
  env: {},
  executable: 'node',
  executableArgs: [],
  continueSession: false,
  forkSession: false,
  mcpServers: {},
  strictMcpConfig: false,
  customAgents: {},
  hooks: {},
  plugins: [],
};

// All 18 built-in Agent SDK tools
export const ALL_SDK_TOOLS = [
  // File Operations
  'Read',
  'Write',
  'Edit',
  'Glob',
  'Grep',
  'NotebookEdit',

  // Execution
  'Bash',
  'BashOutput',
  'KillShell',

  // Web
  'WebFetch',
  'WebSearch',

  // Task Management
  'TodoWrite',
  'Task',

  // MCP Integration
  'ListMcpResources',
  'ReadMcpResource',

  // Planning & Interaction
  'ExitPlanMode',
  'TimeMachine',
  'MultipleChoiceQuestion',
] as const;

// Tool categories for grouped UI
export const TOOL_CATEGORIES = {
  'File Operations': ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'NotebookEdit'],
  'Execution': ['Bash', 'BashOutput', 'KillShell'],
  'Web': ['WebFetch', 'WebSearch'],
  'Task Management': ['TodoWrite', 'Task'],
  'MCP Integration': ['ListMcpResources', 'ReadMcpResource'],
  'Planning & Interaction': ['ExitPlanMode', 'TimeMachine', 'MultipleChoiceQuestion'],
} as const;

export const MODEL_OPTIONS = [
  {
    value: 'claude-3-5-sonnet-20241022',
    label: 'Claude 3.5 Sonnet',
    description: 'Most capable model, best for complex tasks',
  },
  {
    value: 'claude-3-5-haiku-20241022',
    label: 'Claude 3.5 Haiku',
    description: 'Fastest model, great for simple tasks',
  },
  {
    value: 'claude-3-opus-20240229',
    label: 'Claude 3 Opus',
    description: 'Previous generation, very capable',
  },
] as const;

export const PERMISSION_MODE_OPTIONS = [
  {
    value: 'default' as const,
    label: 'Default',
    description: 'Prompt user for permission on sensitive operations',
  },
  {
    value: 'acceptEdits' as const,
    label: 'Accept Edits',
    description: 'Automatically accept file edit operations',
  },
  {
    value: 'bypassPermissions' as const,
    label: 'Bypass Permissions',
    description: 'Skip all permission checks (use with caution)',
  },
  {
    value: 'plan' as const,
    label: 'Plan Mode',
    description: 'Planning mode without execution',
  },
] as const;

export const EXECUTABLE_OPTIONS = [
  {
    value: 'node' as const,
    label: 'Node.js',
    description: 'Use Node.js runtime',
  },
  {
    value: 'bun' as const,
    label: 'Bun',
    description: 'Use Bun runtime (faster)',
  },
  {
    value: 'deno' as const,
    label: 'Deno',
    description: 'Use Deno runtime',
  },
] as const;

export const SYSTEM_PROMPT_TEMPLATES = [
  {
    name: 'Full Agent',
    prompt: 'You are a helpful AI assistant with access to file operations, web browsing, and code execution.',
  },
  {
    name: 'Code Assistant',
    prompt: 'You are an expert software engineer assistant. Help with coding, debugging, and development tasks. You have access to file reading/writing and code execution.',
  },
  {
    name: 'Research Agent',
    prompt: 'You are a research assistant. Gather information from the web and files, analyze data, and provide comprehensive summaries.',
  },
  {
    name: 'DevOps Agent',
    prompt: 'You are a DevOps expert. Help with system administration, deployment, monitoring, and infrastructure tasks.',
  },
  {
    name: 'Data Analyst',
    prompt: 'You are a data analyst. Read and analyze data files, identify patterns, create visualizations, and explain findings.',
  },
];
