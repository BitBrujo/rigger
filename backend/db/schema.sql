-- PostgreSQL schema for agent testing app

-- Conversations table
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    config JSONB NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Configuration presets table
CREATE TABLE IF NOT EXISTS presets (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    config JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage analytics table
CREATE TABLE IF NOT EXISTS usage_logs (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
    model VARCHAR(100) NOT NULL,
    input_tokens INTEGER NOT NULL,
    output_tokens INTEGER NOT NULL,
    latency_ms INTEGER,
    cost_usd DECIMAL(10, 6),
    stop_reason VARCHAR(50),
    error TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_conversation_id ON usage_logs(conversation_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_logs_model ON usage_logs(model);

-- Insert some default presets
INSERT INTO presets (name, description, config) VALUES
    ('Creative Writing', 'High temperature for creative tasks', '{"model": "claude-3-5-sonnet-20241022", "temperature": 1.0, "max_tokens": 2048, "top_p": 1.0}'),
    ('Code Assistant', 'Lower temperature for coding tasks', '{"model": "claude-3-5-sonnet-20241022", "temperature": 0.3, "max_tokens": 4096, "top_p": 0.9}'),
    ('Balanced', 'Balanced settings for general use', '{"model": "claude-3-5-sonnet-20241022", "temperature": 0.7, "max_tokens": 1024, "top_p": 0.95}')
ON CONFLICT (name) DO NOTHING;
