-- PostgreSQL schema for Agent SDK testing app
-- Agent SDK Only - Messages API support removed

-- Conversations table with Agent SDK configuration
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Core SDK settings
    model VARCHAR(100) NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
    system_prompt TEXT,
    max_turns INTEGER DEFAULT 20,
    max_budget_usd DECIMAL(10, 4),
    max_thinking_tokens INTEGER,

    -- Permissions & Security
    permission_mode VARCHAR(50) DEFAULT 'acceptEdits',
    allow_dangerous_skip_permissions BOOLEAN DEFAULT FALSE,

    -- Tools
    allowed_tools TEXT[] DEFAULT ARRAY['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'BashOutput', 'KillShell', 'WebFetch', 'WebSearch', 'TodoWrite', 'Task'],
    disallowed_tools TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Workspace
    working_directory VARCHAR(500) DEFAULT '/app/workspace',
    additional_directories TEXT[] DEFAULT ARRAY[]::TEXT[],
    environment_vars JSONB DEFAULT '{}'::jsonb,
    executable VARCHAR(20) DEFAULT 'node',
    executable_args TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Session Management
    continue_session BOOLEAN DEFAULT FALSE,
    resume_session_id VARCHAR(255),
    resume_at_message_id VARCHAR(255),
    fork_session BOOLEAN DEFAULT FALSE,

    -- Advanced
    fallback_model VARCHAR(100),
    mcp_servers JSONB DEFAULT '{}'::jsonb,
    strict_mcp_config BOOLEAN DEFAULT FALSE,
    custom_agents JSONB DEFAULT '{}'::jsonb,
    hooks JSONB DEFAULT '{}'::jsonb,
    plugins JSONB DEFAULT '[]'::jsonb,

    -- Conversation history
    messages JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Configuration presets table with Agent SDK settings
CREATE TABLE IF NOT EXISTS presets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Core SDK settings
    model VARCHAR(100) NOT NULL DEFAULT 'claude-3-5-sonnet-20241022',
    system_prompt TEXT,
    max_turns INTEGER DEFAULT 20,
    max_budget_usd DECIMAL(10, 4),
    max_thinking_tokens INTEGER,

    -- Permissions & Security
    permission_mode VARCHAR(50) DEFAULT 'acceptEdits',
    allow_dangerous_skip_permissions BOOLEAN DEFAULT FALSE,

    -- Tools
    allowed_tools TEXT[] DEFAULT ARRAY['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'BashOutput', 'KillShell', 'WebFetch', 'WebSearch', 'TodoWrite', 'Task'],
    disallowed_tools TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Workspace
    working_directory VARCHAR(500) DEFAULT '/app/workspace',
    additional_directories TEXT[] DEFAULT ARRAY[]::TEXT[],
    environment_vars JSONB DEFAULT '{}'::jsonb,
    executable VARCHAR(20) DEFAULT 'node',
    executable_args TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Session Management
    continue_session BOOLEAN DEFAULT FALSE,
    resume_session_id VARCHAR(255),
    resume_at_message_id VARCHAR(255),
    fork_session BOOLEAN DEFAULT FALSE,

    -- Advanced
    fallback_model VARCHAR(100),
    mcp_servers JSONB DEFAULT '{}'::jsonb,
    strict_mcp_config BOOLEAN DEFAULT FALSE,
    custom_agents JSONB DEFAULT '{}'::jsonb,
    hooks JSONB DEFAULT '{}'::jsonb,
    plugins JSONB DEFAULT '[]'::jsonb
);

-- Usage analytics table (Agent SDK specific)
CREATE TABLE IF NOT EXISTS usage_logs (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,

    -- Agent SDK metrics
    model VARCHAR(100) NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    cache_creation_tokens INTEGER DEFAULT 0,
    cache_read_tokens INTEGER DEFAULT 0,

    -- Cost & Performance
    cost_usd DECIMAL(10, 6),
    latency_ms INTEGER,
    api_latency_ms INTEGER,

    -- Agent behavior
    num_turns INTEGER,
    stop_reason VARCHAR(50),
    permission_denials JSONB DEFAULT '[]'::jsonb,
    tools_used TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Error tracking
    error TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_model ON conversations(model);
CREATE INDEX IF NOT EXISTS idx_usage_logs_conversation_id ON usage_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_model ON usage_logs(model);
CREATE INDEX IF NOT EXISTS idx_presets_name ON presets(name);

-- Insert default Agent SDK presets
INSERT INTO presets (name, description, model, system_prompt, max_turns, allowed_tools, permission_mode) VALUES
    (
        'Full Agent Access',
        'All 18 built-in tools enabled with maximum autonomy',
        'claude-3-5-sonnet-20241022',
        'You are a helpful AI assistant with access to file operations, web browsing, and code execution.',
        20,
        ARRAY['Read', 'Write', 'Edit', 'Glob', 'Grep', 'NotebookEdit', 'Bash', 'BashOutput', 'KillShell', 'WebFetch', 'WebSearch', 'TodoWrite', 'Task', 'ListMcpResources', 'ReadMcpResource', 'ExitPlanMode', 'TimeMachine', 'MultipleChoiceQuestion'],
        'acceptEdits'
    ),
    (
        'Read-Only Agent',
        'Safe configuration for analysis and exploration without modifications',
        'claude-3-5-sonnet-20241022',
        'You are an AI assistant with read-only access. You can analyze files and code but cannot make modifications.',
        20,
        ARRAY['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch'],
        'default'
    ),
    (
        'Code Assistant',
        'Optimized for software development tasks',
        'claude-3-5-sonnet-20241022',
        'You are an expert software engineer assistant. Help with coding, debugging, and development tasks.',
        20,
        ARRAY['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'BashOutput', 'TodoWrite', 'Task'],
        'acceptEdits'
    ),
    (
        'Web Research Agent',
        'Focused on web browsing and information gathering',
        'claude-3-5-sonnet-20241022',
        'You are a research assistant. Gather information from the web and provide comprehensive summaries.',
        15,
        ARRAY['Read', 'Write', 'WebFetch', 'WebSearch', 'TodoWrite'],
        'default'
    ),
    (
        'Budget-Conscious',
        'Cost-optimized configuration with token and budget limits',
        'claude-3-5-haiku-20241022',
        'You are a helpful assistant operating under budget constraints. Be concise and efficient.',
        10,
        ARRAY['Read', 'Write', 'Edit', 'Grep', 'Glob'],
        'acceptEdits'
    )
ON CONFLICT (name) DO NOTHING;
