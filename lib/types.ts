// Anthropic SDK types
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

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface AgentConfig {
  model: 'claude-3-5-sonnet-20241022' | 'claude-3-5-haiku-20241022' | 'claude-3-opus-20240229';
  max_tokens: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  system?: string;
  tools?: Tool[];
  stop_sequences?: string[];
}

export interface AgentResponse {
  id: string;
  type: 'message';
  role: 'assistant';
  content: ContentBlock[];
  model: string;
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence' | 'tool_use' | null;
  stop_sequence: string | null;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export interface StreamEvent {
  type: 'message' | 'text' | 'content_block_delta' | 'done' | 'error';
  data?: any;
  latency?: number;
  timestamp?: string;
  error?: string;
}

// Database types
export interface Conversation {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  config: AgentConfig;
  messages: Message[];
}

export interface Preset {
  id: number;
  name: string;
  description: string | null;
  config: AgentConfig;
  created_at: string;
  updated_at: string;
}

export interface UsageLog {
  id: number;
  conversation_id: number | null;
  model: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number | null;
  cost_usd: number | null;
  stop_reason: string | null;
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
  rawResponse: AgentResponse | null;
  latency: number;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  cost: number;
  stopReason: string;
  timestamp: string;
  errors: string[];
}

export const DEFAULT_CONFIG: AgentConfig = {
  model: 'claude-3-5-sonnet-20241022',
  max_tokens: 1024,
  temperature: 0.7,
  top_p: 0.9,
  system: 'You are a helpful AI assistant.',
  tools: [],
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

export const SYSTEM_PROMPT_TEMPLATES = [
  {
    name: 'Default Assistant',
    prompt: 'You are a helpful AI assistant.',
  },
  {
    name: 'Code Assistant',
    prompt: 'You are an expert software engineer. Provide clear, concise, and well-documented code solutions.',
  },
  {
    name: 'Creative Writer',
    prompt: 'You are a creative writer. Write engaging, imaginative, and compelling content.',
  },
  {
    name: 'Data Analyst',
    prompt: 'You are a data analyst. Provide clear insights, identify patterns, and explain findings in an accessible way.',
  },
  {
    name: 'Technical Documenter',
    prompt: 'You are a technical writer. Create clear, comprehensive documentation with examples.',
  },
];
