# Claude Agent SDK Tester

A Next.js application for testing and debugging the Claude Agent SDK with real-time streaming support.

## Features

- **Agent SDK Integration**: Full-featured Claude Agent SDK with 18 built-in tools
- **Model Selection**: Test Claude 3.5 Sonnet, Haiku, and Opus
- **Tool Configuration**: Enable/disable specific tools through the UI
- **Advanced Configuration**: 30+ Agent SDK parameters including:
  - Permission modes (default, acceptEdits, bypassPermissions, plan)
  - Session management (continue, resume, fork)
  - Workspace settings and additional directories
  - Max budget, max thinking tokens, max turns
  - MCP server integration
  - Custom agent definitions (subagents)
  - Hook configuration
- **System Prompts**: Template library with custom prompt editing and Claude Code preset
- **Streaming Support**: Real-time SSE streaming with fallback to batch mode
- **Debug Panel**: Real-time metrics, token usage, costs, cache stats, and API responses
- **Persistence**: Save conversations, configuration presets, and usage analytics
- **Two-Panel Layout**: Comprehensive Config (left), Chat + Debug tabs (right)

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, shadcn/ui, Tailwind CSS 4
- **Backend**: Express.js, Node.js (Docker)
- **Database**: PostgreSQL (Docker)
- **SDK**: `@anthropic-ai/claude-agent-sdk` (Agent SDK with tools & containerization)
- **State**: Zustand

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Anthropic API key

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd jigger
```

2. **Install frontend dependencies**

```bash
npm install
```

3. **Install backend dependencies**

```bash
cd backend
npm install
cd ..
```

4. **Set up environment variables**

Frontend (.env.local):
```bash
cp .env.local.example .env.local
```

Backend (backend/.env):
```bash
cp backend/.env.example backend/.env
# Edit backend/.env and add your ANTHROPIC_API_KEY
```

5. **Start the services**

```bash
# Start PostgreSQL and backend with Docker
docker-compose up -d

# In a separate terminal, start the Next.js dev server
npm run dev
```

6. **Open the app**

Visit [http://localhost:3334](http://localhost:3334)

## Usage

### Configuration Panel (Left)

Comprehensive configuration with collapsible sections:

#### Core Settings
- **Model Selection**: Choose between Claude 3.5 Sonnet, Haiku, or Opus
- **Max Turns**: Control multi-turn conversation limit
- **Max Thinking Tokens**: Set extended thinking token budget
- **System Prompt**: Use templates (including Claude Code preset) or write custom prompts

#### Tool Configuration
- **Tool Selector**: Enable/disable individual tools from 18 available tools
- **Categories**: File operations, execution, web, task management, and agent system tools
- **Quick Actions**: Enable all or disable all tools

#### Advanced Configuration (30+ parameters)
- **Permission Mode**: default, acceptEdits, bypassPermissions, or plan mode
- **Workspace Settings**: Working directory and additional directories
- **Executable Settings**: Choose bun, deno, or node with custom args
- **Environment Variables**: Configure runtime environment
- **Max Budget**: Set spending limit in USD
- **Fallback Model**: Configure fallback model

#### MCP Servers
- **Add MCP Servers**: Configure external Model Context Protocol servers
- **Command & Args**: Set server command and arguments
- **Environment Variables**: Server-specific environment configuration

#### Custom Agents (Subagents)
- **Define Subagents**: Create specialized agents with custom configurations
- **System Prompts**: Per-agent system prompts
- **Tool Control**: Allowed and disallowed tools per agent

#### Hooks
- **Event Hooks**: Configure event-driven behaviors
- **Templates**: Pre-built hooks for common integrations (Discord, Slack, GitHub, etc.)
- **Categories**: Communication, development, monitoring, automation

#### Presets
- **Save/Load**: Persist entire configuration as named presets

### Chat Interface (Right - Chat Tab)

- **Streaming Mode**: Real-time SSE streaming (primary mode)
- **Message History**: View conversation with role indicators
- **Export**: Download conversation as JSON
- **Clear**: Reset conversation

### Debug Panel (Right - Debug Tab)

- **Key Metrics**: Latency, cost, token usage (input/output/cache)
- **Stop Reason**: Why the model stopped generating
- **Cache Statistics**: Cache creation and read tokens
- **Raw Response**: View complete API response in JSON
- **Error Logs**: Debug API errors

## API Endpoints

### Agent (SDK)

- `POST /api/agent/message` - Send batch message using Agent SDK
- `POST /api/agent/stream` - Send streaming message using Agent SDK (SSE)

### Conversations

- `GET /api/conversations` - List all conversations
- `GET /api/conversations/:id` - Get specific conversation
- `POST /api/conversations` - Create new conversation
- `PUT /api/conversations/:id` - Update conversation
- `DELETE /api/conversations/:id` - Delete conversation

### Presets

- `GET /api/presets` - List all presets
- `GET /api/presets/:id` - Get specific preset
- `POST /api/presets` - Create new preset
- `PUT /api/presets/:id` - Update preset
- `DELETE /api/presets/:id` - Delete preset

### Analytics

- `GET /api/analytics` - Get usage logs
- `GET /api/analytics/stats` - Get aggregated statistics
- `GET /api/analytics/timeline` - Get token usage over time

## Database Schema

### conversations
- Stores conversation history and configuration
- Includes messages, config, and metadata

### presets
- Saved configuration presets
- Includes name, description, and config JSON

### usage_logs
- Tracks API usage per request
- Includes tokens, costs, latency, and errors

## Development

### Frontend Development

```bash
npm run dev
```

### Backend Development

```bash
cd backend
npm run watch
```

### Docker Services

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Reset database
docker-compose down -v
docker-compose up -d
```

## Project Structure

```
/jigger
├── app/                      # Next.js app directory
│   ├── page.tsx             # Main page
│   └── globals.css          # Global styles (Tailwind CSS 4)
├── components/              # React components
│   ├── agent-tester.tsx    # Main two-panel layout container
│   ├── config-panel.tsx    # Comprehensive config (tools, MCP, agents, hooks)
│   ├── tool-selector.tsx   # Tool selection component
│   ├── chat-interface.tsx  # Tabbed Chat + Debug interface
│   ├── debug-panel.tsx     # Debug metrics display
│   └── ui/                 # shadcn/ui components
├── lib/                    # Utilities
│   ├── types.ts           # TypeScript types (30+ SDK parameters)
│   ├── api-client.ts      # API wrapper
│   ├── store.ts           # Zustand state
│   ├── hook-templates.ts  # Pre-built hook configs
│   └── utils.ts           # Helpers
├── backend/               # Express backend
│   ├── src/
│   │   ├── server.ts     # Main server
│   │   └── routes/       # API routes (agent, conversations, presets, analytics)
│   └── db/               # Database
│       ├── schema.sql    # Schema
│       └── client.ts     # PG client
├── workspace/             # Agent SDK workspace volume
└── docker-compose.yml    # Docker services
```

## Configuration Options

### Model Options

- **claude-3-5-sonnet-20241022**: Most capable, best for complex tasks
- **claude-3-5-haiku-20241022**: Fastest, great for simple tasks
- **claude-3-opus-20240229**: Previous generation, very capable

### Available Tools (18 Built-in)

- **File Operations**: Read, Write, Edit, Glob, Grep
- **Execution**: Bash, BashOutput, KillShell
- **Web**: WebFetch, WebSearch
- **Task Management**: TodoWrite, Task
- **Agent System**: AskUserQuestion, ExitPlanMode, Skill, SlashCommand

### System Prompt Templates

- Default Assistant
- Code Assistant
- Creative Writer
- Data Analyst
- Technical Documenter
- Research Assistant

## Troubleshooting

### Backend won't start

- Check if PostgreSQL is running: `docker-compose ps`
- Verify ANTHROPIC_API_KEY in backend/.env
- Check logs: `docker-compose logs backend`

### Frontend can't connect to backend

- Verify NEXT_PUBLIC_API_URL in .env.local
- Check backend is running on port 3001
- Try: `curl http://localhost:3001/health`

### Database connection errors

- Reset database: `docker-compose down -v && docker-compose up -d`
- Check DATABASE_URL in backend/.env
- Wait for PostgreSQL health check: `docker-compose logs postgres`

## Notes

- The application uses the Agent SDK's built-in tool system with 18 available tools
- Cost calculation is automatic via SDK metrics
- The workspace directory is mounted for agent file operations
- PostgreSQL database persists conversations and usage logs
- Supports 30+ Agent SDK configuration parameters
- MCP server integration allows extending with custom tools
- Custom agents (subagents) enable specialized task handling
- Hooks provide event-driven integrations with external services

## License

MIT
