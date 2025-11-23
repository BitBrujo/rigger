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

    -- Message tracking for deduplication
    message_id VARCHAR(255) UNIQUE,
    step_number INTEGER DEFAULT 1,
    parent_message_id VARCHAR(255),

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

-- Per-tool usage tracking for cost attribution
CREATE TABLE IF NOT EXISTS tool_usage_logs (
    id SERIAL PRIMARY KEY,
    usage_log_id INTEGER REFERENCES usage_logs(id) ON DELETE CASCADE,
    message_id VARCHAR(255),
    tool_name VARCHAR(100) NOT NULL,
    tool_use_id VARCHAR(255),

    -- Execution metrics
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_ms INTEGER,

    -- Cost estimation (proportional to step cost)
    estimated_input_tokens INTEGER,
    estimated_output_tokens INTEGER,
    estimated_cost_usd DECIMAL(10, 6),

    -- Tool-specific data
    input_data JSONB,
    output_data JSONB,
    error TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Todo lists table (global, not conversation-scoped)
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(500),
    tool_use_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual todo items
CREATE TABLE IF NOT EXISTS todo_items (
    id SERIAL PRIMARY KEY,
    todo_id INTEGER REFERENCES todos(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    active_form TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT todo_items_status_check CHECK (status IN ('pending', 'in_progress', 'completed'))
);

-- Custom Agents table for user-created subagents
CREATE TABLE IF NOT EXISTS custom_agents (
    name VARCHAR(255) PRIMARY KEY,
    description TEXT,
    system_prompt TEXT NOT NULL,

    -- Tool configuration
    allowed_tools TEXT[] DEFAULT ARRAY[]::TEXT[],
    disallowed_tools TEXT[] DEFAULT ARRAY[]::TEXT[],

    -- Model settings
    model VARCHAR(100),
    temperature DECIMAL(3, 2),
    max_turns INTEGER,
    max_budget_usd DECIMAL(10, 4),

    -- Category and metadata
    category VARCHAR(100),
    enabled BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Full definition as JSONB for flexibility
    definition JSONB NOT NULL
);

-- Uploaded files table for agent context
CREATE TABLE IF NOT EXISTS uploaded_files (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,  -- Unique filename with hash
    original_filename VARCHAR(255) NOT NULL,  -- User-provided filename
    file_path VARCHAR(500) NOT NULL,  -- Path in sandbox container
    mime_type VARCHAR(100),
    file_size_bytes BIGINT NOT NULL,

    -- Scoping
    is_global BOOLEAN DEFAULT FALSE,  -- Global vs conversation-specific
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,  -- NULL for global files

    -- Integration method
    integration_method VARCHAR(50) DEFAULT 'working-directory',  -- 'system-prompt', 'working-directory', 'both'

    -- Metadata
    enabled BOOLEAN DEFAULT TRUE,  -- Whether to include in agent context
    description TEXT,  -- User-provided description

    -- Extracted content (for small text files)
    content_preview TEXT,  -- First 1000 chars for display

    -- Tracking
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP,
    access_count INTEGER DEFAULT 0,

    -- Constraints
    CONSTRAINT uploaded_files_size_check CHECK (file_size_bytes <= 10485760),  -- 10MB max
    CONSTRAINT uploaded_files_integration_check CHECK (integration_method IN ('system-prompt', 'working-directory', 'both')),
    CONSTRAINT uploaded_files_scope_check CHECK (
        (is_global = TRUE AND conversation_id IS NULL) OR
        (is_global = FALSE AND conversation_id IS NOT NULL)
    )
);

-- Agent Sessions table for session-based UI
CREATE TABLE IF NOT EXISTS agent_sessions (
    id VARCHAR(255) PRIMARY KEY,
    sdk_session_id VARCHAR(255),  -- SDK session ID from Agent SDK
    pattern VARCHAR(50) DEFAULT 'ephemeral',
    status VARCHAR(50) NOT NULL DEFAULT 'initializing',
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE SET NULL,

    -- Configuration snapshot (full AgentSDKConfig)
    config JSONB NOT NULL,

    -- Lifecycle timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    completed_at TIMESTAMP,
    terminated_at TIMESTAMP,
    termination_reason VARCHAR(100),  -- 'user_requested', 'emergency_stop', 'budget_exceeded', 'error', 'idle_timeout'
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Resource tracking
    total_cost DECIMAL(10, 6) DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,
    total_cached_tokens INTEGER DEFAULT 0,
    num_turns INTEGER DEFAULT 0,
    tools_used TEXT[] DEFAULT ARRAY[]::TEXT[],
    current_tool VARCHAR(100),  -- Currently executing tool

    -- Messages in this session
    messages JSONB DEFAULT '[]'::jsonb,

    -- Session limits
    max_idle_time_ms BIGINT DEFAULT 300000,  -- 5 minutes default
    max_lifetime_ms BIGINT,
    max_budget_usd DECIMAL(10, 4),
    max_turns INTEGER,

    -- Metadata
    tags JSONB DEFAULT '{}'::jsonb,
    description TEXT,
    user_id VARCHAR(255),

    -- Abort control
    abort_requested BOOLEAN DEFAULT FALSE,
    force_kill_requested BOOLEAN DEFAULT FALSE,

    CONSTRAINT agent_sessions_pattern_check CHECK (pattern IN ('ephemeral', 'long-running', 'hybrid', 'single-container')),
    CONSTRAINT agent_sessions_status_check CHECK (status IN ('initializing', 'active', 'idle', 'stopping', 'completed', 'error', 'terminated'))
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_model ON conversations(model);
CREATE INDEX IF NOT EXISTS idx_usage_logs_conversation_id ON usage_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_model ON usage_logs(model);
CREATE INDEX IF NOT EXISTS idx_usage_logs_message_id ON usage_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_presets_name ON presets(name);
CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_usage_log_id ON tool_usage_logs(usage_log_id);
CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_tool_name ON tool_usage_logs(tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_usage_logs_message_id ON tool_usage_logs(message_id);
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_todos_tool_use_id ON todos(tool_use_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_todo_id ON todo_items(todo_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_status ON todo_items(status);
CREATE INDEX IF NOT EXISTS idx_custom_agents_name ON custom_agents(name);
CREATE INDEX IF NOT EXISTS idx_custom_agents_category ON custom_agents(category);
CREATE INDEX IF NOT EXISTS idx_custom_agents_enabled ON custom_agents(enabled);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_pattern ON agent_sessions(pattern);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_created_at ON agent_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_sdk_session_id ON agent_sessions(sdk_session_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_abort_requested ON agent_sessions(abort_requested) WHERE abort_requested = TRUE;
CREATE INDEX IF NOT EXISTS idx_agent_sessions_last_activity ON agent_sessions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_enabled ON uploaded_files(enabled);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_conversation_id ON uploaded_files(conversation_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_is_global ON uploaded_files(is_global);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploaded_at ON uploaded_files(uploaded_at DESC);

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
