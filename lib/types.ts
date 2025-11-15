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

// Skill Metadata (from SKILL.md frontmatter)
export interface SkillMetadata {
  name: string; // Directory name (unique identifier)
  description: string; // When to use this skill
  allowedTools?: string[]; // Optional tool restrictions (SDK apps use main allowedTools instead)
  content?: string; // Full SKILL.md content (loaded on demand)
  path?: string; // Filesystem path to skill directory
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

  // Skills Configuration
  settingSources?: string[]; // Directories to load Skills from (e.g., ['project', 'user'] or custom paths)
}

// Complete SDK Message Types (from TypeScript SDK Reference)

// Base types
export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number;
  cache_read_input_tokens?: number;
}

export interface PermissionDenial {
  tool_name: string;
  tool_use_id: string;
  tool_input: any;
}

// SDK Message Types
export type SDKMessage =
  | SDKAssistantMessage
  | SDKUserMessage
  | SDKResultMessage
  | SDKSystemMessage
  | SDKPartialAssistantMessage
  | SDKCompactBoundaryMessage
  | SDKToolProgressMessage
  | SDKHookResponseMessage
  | SDKStatusMessage;

export interface SDKAssistantMessage {
  type: 'assistant';
  uuid: string;
  session_id: string;
  message: {
    id: string;
    type: 'message';
    role: 'assistant';
    content: Array<{
      type: 'text' | 'tool_use';
      text?: string;
      id?: string;
      name?: string;
      input?: any;
    }>;
    model: string;
    stop_reason: string | null;
    usage: Usage;
  };
  parent_tool_use_id: string | null;
}

export interface SDKUserMessage {
  type: 'user';
  uuid?: string;
  session_id: string;
  message: {
    role: 'user';
    content: string | Array<{
      type: 'text' | 'image';
      text?: string;
      source?: any;
    }>;
  };
  parent_tool_use_id: string | null;
}

export interface SDKResultMessage {
  type: 'result';
  subtype: 'success' | 'error_max_turns' | 'error_during_execution';
  uuid: string;
  session_id: string;
  duration_ms: number;
  duration_api_ms: number;
  is_error: boolean;
  num_turns: number;
  result?: string;
  total_cost_usd: number;
  usage: Usage;
  permission_denials: PermissionDenial[];
}

export interface SDKSystemMessage {
  type: 'system';
  subtype: 'init' | 'hook_response';
  uuid: string;
  session_id: string;
  // Init fields
  apiKeySource?: string;
  cwd?: string;
  tools?: string[];
  mcp_servers?: Array<{
    name: string;
    status: string;
  }>;
  model?: string;
  permissionMode?: string;
  slash_commands?: string[];
  output_style?: string;
  agents?: string[];
  plugins?: Array<{
    name: string;
    version: string;
  }>;
  // Hook response fields
  hook_name?: string;
  hook_event?: string;
  stdout?: string;
  stderr?: string;
  exit_code?: number;
}

export interface SDKPartialAssistantMessage {
  type: 'stream_event';
  event: {
    type: string;
    index?: number;
    delta?: {
      type: 'text_delta' | 'input_json_delta';
      text?: string;
      partial_json?: string;
    };
    content_block?: {
      type: 'text' | 'tool_use';
      text?: string;
      id?: string;
      name?: string;
      input?: any;
    };
    message?: any;
    usage?: Usage;
  };
  parent_tool_use_id: string | null;
  uuid: string;
  session_id: string;
}

export interface SDKCompactBoundaryMessage {
  type: 'system';
  subtype: 'compact_boundary';
  uuid: string;
  session_id: string;
  compact_metadata: {
    trigger: 'manual' | 'auto';
    pre_tokens: number;
  };
}

export interface SDKToolProgressMessage {
  type: 'tool_progress';
  tool_use_id: string;
  tool_name: string;
  elapsed_time_seconds: number;
  parent_tool_use_id: string | null;
  uuid: string;
  session_id: string;
}

export interface SDKHookResponseMessage {
  type: 'system';
  subtype: 'hook_response';
  uuid: string;
  session_id: string;
  hook_name: string;
  hook_event: string;
  stdout: string;
  stderr: string;
  exit_code?: number;
}

export interface SDKStatusMessage {
  type: 'status';
  status: 'thinking' | 'tool_executing' | 'waiting';
  message?: string;
  uuid: string;
  session_id: string;
}

// Tool Execution Tracking
export interface ToolExecution {
  id: string; // tool_use_id
  toolName: string;
  status: 'running' | 'completed' | 'failed';
  startTime: number;
  endTime?: number;
  elapsedSeconds?: number;
  input: any;
  output?: any;
  error?: string;
  parentToolUseId: string | null;
}

// Todo List Tracking
export interface TodoItem {
  id: number;
  content: string;
  activeForm?: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
}

export interface TodoList {
  id: number;
  title?: string;
  items: TodoItem[];
  toolUseId?: string;
  createdAt: string;
  updatedAt: string;
}

// Database Todo Types
export interface DBTodo {
  id: number;
  title: string | null;
  tool_use_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DBTodoItem {
  id: number;
  todo_id: number;
  content: string;
  active_form: string | null;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
}

// Permission System
export interface PermissionRequest {
  id: string; // tool_use_id
  toolName: string;
  input: any;
  timestamp: number;
  status: 'pending' | 'approved' | 'denied';
  suggestions?: PermissionUpdate[];
}

export interface PermissionUpdate {
  type: 'addRules' | 'replaceRules' | 'removeRules' | 'setMode' | 'addDirectories' | 'removeDirectories';
  rules?: PermissionRuleValue[];
  behavior?: 'allow' | 'deny' | 'ask';
  destination?: 'userSettings' | 'projectSettings' | 'localSettings' | 'session';
  mode?: string;
  directories?: string[];
}

export interface PermissionRuleValue {
  toolName: string;
  ruleContent?: string;
}

export interface PermissionResult {
  behavior: 'allow' | 'deny';
  message?: string;
  updatedInput?: any;
  updatedPermissions?: PermissionUpdate[];
  interrupt?: boolean;
}

// MCP Server Status
export interface McpServerStatus {
  name: string;
  status: 'connected' | 'failed' | 'connecting';
  error?: string;
  resources?: number;
  tools?: number;
}

// System Info (from SDKSystemMessage)
export interface SystemInfo {
  apiKeySource: string;
  cwd: string;
  tools: string[];
  mcpServers: Array<{
    name: string;
    status: string;
  }>;
  model: string;
  permissionMode: string;
  slashCommands?: string[];
  agents?: string[];
  plugins?: Array<{
    name: string;
    version: string;
  }>;
}

// Legacy stream event type (for backward compatibility)
export interface SDKStreamEvent {
  type: 'system' | 'user' | 'assistant' | 'result' | 'stream_event';
  data?: any;
  event?: any;
  message?: any;
  usage?: Usage;
  total_cost_usd?: number;
  num_turns?: number;
  is_error?: boolean;
  permission_denials?: PermissionDenial[];
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
  message_id: string | null; // UUID from SDK for deduplication
  step_number: number; // Step/turn number in multi-step conversations
  parent_message_id: string | null; // For tracking step relationships
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

export interface ToolUsageLog {
  id: number;
  usage_log_id: number;
  message_id: string;
  tool_name: string;
  tool_use_id: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_ms: number | null;
  estimated_input_tokens: number | null;
  estimated_output_tokens: number | null;
  estimated_cost_usd: number | null;
  input_data: any;
  output_data: any;
  error: string | null;
  created_at: string;
}

export interface StepCostBreakdown {
  step_number: number;
  message_id: string;
  cost_usd: number;
  input_tokens: number;
  output_tokens: number;
  cache_creation_tokens: number;
  cache_read_tokens: number;
  num_tools: number;
  tools_used: string[];
  latency_ms: number;
  timestamp: string;
}

export interface ToolCostBreakdown {
  tool_name: string;
  usage_count: number;
  total_duration_ms: number;
  avg_duration_ms: number;
  total_estimated_cost_usd: number;
  avg_estimated_cost_usd: number;
  total_estimated_tokens: number;
}

export interface CostExport {
  conversation_id: number | null;
  export_date: string;
  total_cost: number;
  total_tokens: number;
  steps: StepCostBreakdown[];
  tools: ToolCostBreakdown[];
  summary: {
    start_time: string;
    end_time: string;
    duration_minutes: number;
    num_steps: number;
    num_tool_uses: number;
  };
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
  messageId?: string; // SDK message UUID for deduplication tracking
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

// Session History
export interface SessionHistory {
  id: string;
  sessionId: string;
  startedAt: string;
  completedAt: string;
  numTurns: number;
  totalCost: number;
  totalTokens: number;
  toolsUsed: string[];
  status: 'active' | 'completed' | 'error';
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
  settingSources: ['project'], // Load Skills from project's .claude directory
};

// All 19 built-in Agent SDK tools (including Skill)
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
  'Skill', // Execute predefined skill workflows
] as const;

// Tool categories for grouped UI
export const TOOL_CATEGORIES = {
  'File Operations': ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'NotebookEdit'],
  'Execution': ['Bash', 'BashOutput', 'KillShell'],
  'Web': ['WebFetch', 'WebSearch'],
  'Task Management': ['TodoWrite', 'Task'],
  'MCP Integration': ['ListMcpResources', 'ReadMcpResource'],
  'Planning & Interaction': ['ExitPlanMode', 'TimeMachine', 'MultipleChoiceQuestion', 'Skill'],
} as const;

// Tool descriptions for tooltips
export const TOOL_DESCRIPTIONS: Record<string, string> = {
  // File Operations
  'Read': 'Read file contents from the filesystem',
  'Write': 'Write new files or overwrite existing ones',
  'Edit': 'Make targeted edits to existing files',
  'Glob': 'Find files using pattern matching (*.js, **/*.tsx)',
  'Grep': 'Search file contents using regex patterns',
  'NotebookEdit': 'Edit Jupyter notebook cells',

  // Execution
  'Bash': 'Execute bash commands in a persistent shell',
  'BashOutput': 'Retrieve output from background bash shells',
  'KillShell': 'Terminate a running background shell',

  // Web
  'WebFetch': 'Fetch and process content from URLs',
  'WebSearch': 'Search the web for information',

  // Task Management
  'TodoWrite': 'Create and manage task lists',
  'Task': 'Launch specialized sub-agents for complex tasks',

  // MCP Integration
  'ListMcpResources': 'List resources from MCP servers',
  'ReadMcpResource': 'Read specific resources from MCP servers',

  // Planning & Interaction
  'ExitPlanMode': 'Exit planning mode and present plan to user',
  'TimeMachine': 'View and restore previous file states',
  'MultipleChoiceQuestion': 'Ask user multiple choice questions',
  'Skill': 'Execute specialized skill workflows from .claude/skills/',
};

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

export const CLAUDE_CODE_PRESET_PROMPT = `You are Claude Code, an AI coding assistant powered by Anthropic's Claude API. Your purpose is to help developers write, debug, and improve code efficiently.

**Core Capabilities:**
- Write clean, well-documented code following best practices
- Debug complex issues with detailed analysis
- Refactor code for better performance and maintainability
- Explain technical concepts clearly
- Suggest architectural improvements
- Review code for potential issues

**Guidelines:**
- Always prefer existing code patterns and conventions in the project
- Write comprehensive comments for complex logic
- Consider edge cases and error handling
- Suggest tests when appropriate
- Be concise but thorough in explanations
- Ask clarifying questions when requirements are ambiguous

**Tool Usage:**
- Use Read tool to examine existing code before making changes
- Use Edit tool for surgical code modifications
- Use Write tool only for new files
- Use Grep/Glob to find patterns and files
- Use Bash for testing and verification
- Use WebSearch for latest documentation when needed

**Communication Style:**
- Be direct and professional
- Focus on solving problems, not validating feelings
- Provide honest technical feedback even if critical
- Explain trade-offs when multiple approaches exist`;

