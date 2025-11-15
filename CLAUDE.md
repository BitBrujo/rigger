# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Rigger is a Claude Agent SDK testing application built with Next.js 16 and Express.js. It provides a comprehensive interface for testing the Claude Agent SDK with real-time streaming, debugging metrics, and persistence.

**Features:**
- **Agent SDK** (`@anthropic-ai/claude-agent-sdk`): Full agent capabilities with built-in tools, containerization, automatic cost calculation, and multi-turn conversations
- **Custom Tool Configuration**: Select and configure which tools the agent can use
- **Real-time Streaming**: Watch agent responses as they generate
- **Debug Metrics**: Token usage, costs, cache stats, and API responses

## Development Commands

### Frontend (Next.js)
```bash
npm run dev          # Start Next.js dev server (port 3334)
npm run build        # Build production bundle
npm run start        # Start production server (port 3334)
npm run lint         # Run ESLint
```

### Backend (Express)
```bash
cd backend
npm run dev          # Run with ts-node
npm run watch        # Run with auto-reload (ts-node-dev)
npm run build        # Compile TypeScript to dist/
npm run start        # Run compiled JavaScript
```

### Docker Services
```bash
docker-compose up -d              # Start PostgreSQL and backend
docker-compose logs -f backend    # View backend logs
docker-compose logs -f postgres   # View database logs
docker-compose down               # Stop services
docker-compose down -v            # Stop and remove volumes (reset database)
```

### Database
```bash
# Connect to PostgreSQL
docker exec -it rigger-postgres-1 psql -U agent_user -d agent_db

# Reset database (re-runs schema.sql)
docker-compose down -v && docker-compose up -d
```

## Architecture

### Two-Panel Layout Architecture

The application uses a resizable two-panel layout (`components/agent-tester.tsx`):
- **Left Panel (ConfigPanel)**: Comprehensive configuration including:
  - Agent configuration controls (model, temperature, system prompt)
  - Tool selection and configuration (ToolSelector component)
  - MCP server configuration
  - Custom agent definitions (subagents)
  - Hook configuration
  - Advanced settings (30+ Agent SDK parameters)
- **Right Panel (ChatInterface)**: Combined chat and debug interface with tabs:
  - Chat tab: Message history and input
  - Debug tab: Real-time metrics and raw API responses

All panels share state via Zustand store (`lib/store.ts`).

### State Management Flow

**Zustand Store (`lib/store.ts`)** is the single source of truth:
- `config`: Current agent configuration (model, temperature, tools, etc.)
- `messages`: Conversation history
- `debugInfo`: Latest API response metrics
- `isStreaming`, `streamingMode`: Streaming state
- `conversationId`: Current conversation for persistence

Components consume and update this store directly. No prop drilling.

### API Communication Pattern

**Frontend → Backend flow:**

1. **ChatInterface** collects user input and current config from store
2. **ConfigPanel** provides comprehensive configuration including tool selection, MCP servers, custom agents, and hooks
3. **ApiClient** (`lib/api-client.ts`) handles HTTP/SSE communication
4. Backend endpoints use Agent SDK:
   - **Streaming**: `POST /api/agent/stream` (primary mode)
   - **Batch**: `POST /api/agent/message` (fallback)
5. **ChatInterface** updates store with messages and displays in Chat tab
6. **Debug tab** in ChatInterface reactively displays metrics from store

### Backend Architecture

**Express Router Pattern** (`backend/src/routes/`):
- `agent.ts`: Agent SDK wrapper (batch and streaming endpoints with tool support)
- `conversations.ts`: CRUD for conversation history
- `presets.ts`: CRUD for configuration presets
- `analytics.ts`: Usage statistics and aggregations

**Database Abstraction:**
- `backend/db/client.ts`: pg Pool singleton
- `backend/db/schema.sql`: PostgreSQL schema (auto-initialized on first run)

**Cost Calculation:**
- Automatic via Agent SDK's built-in metrics
- No manual pricing calculation needed

### Agent SDK Tools

The application uses the Claude Agent SDK which provides 19 built-in tools:

**File Operations:** Read, Write, Edit, Glob, Grep
**Execution:** Bash, BashOutput, KillShell
**Web:** WebFetch, WebSearch
**Task Management:** TodoWrite, Task
**Agent System:** AskUserQuestion, ExitPlanMode, Skill, SlashCommand

Tools can be enabled/disabled via the Tool Selector in the Config Panel. Configuration is stored in `config.allowedTools` array and sent to the Agent SDK.

The application also supports:
- **MCP Servers**: Configure external Model Context Protocol servers
- **Custom Agents (Subagents)**: Define specialized agents with their own system prompts and tool configurations
- **Hooks**: Configure event-driven behaviors and integrations
- **Skills**: Specialized agent workflows from `.claude/skills/` directory

### Agent Skills

**Skills** are packaged instructions that extend Claude with specialized capabilities. Each skill is a directory in `.claude/skills/` containing a `SKILL.md` file with YAML frontmatter and markdown instructions.

**How Skills Work:**
1. Skills are loaded from `.claude/skills/` via `settingSources: ['project']` configuration
2. Claude automatically discovers skills at startup based on YAML descriptions
3. When a user request matches a skill's description, Claude invokes it
4. The skill provides step-by-step instructions for completing the task

**Built-in Example Skills:**
- **example-pdf-processing**: Extract text and metadata from PDF documents
- **example-code-review**: Comprehensive code review with security and best practices
- **example-data-transform**: Convert data between JSON, CSV, XML, YAML formats

**Managing Skills:**
1. **Config Panel** → **Skills Configuration** section
2. **Skills Manager** UI provides:
   - List all discovered skills
   - View skill descriptions and content
   - Create new skills with wizard
   - Edit existing SKILL.md files
   - Delete skills
3. **Tool Selector** → Enable "Skill" tool in Planning & Interaction category

**Creating Custom Skills:**
```bash
# Option 1: Use Skills Manager UI in Config Panel
# Option 2: Create manually
mkdir -p .claude/skills/my-skill
cat > .claude/skills/my-skill/SKILL.md << 'EOF'
---
description: Brief description of when to use this skill
---

# My Skill

## When to Use
- Trigger phrase 1
- Trigger phrase 2

## Workflow
1. Step one
2. Step two
3. ...

## Tools Used
- Read
- Write
- Bash
EOF
```

**Skill File Structure:**
```
.claude/skills/
├── my-skill/
│   └── SKILL.md           # Required: frontmatter + instructions
├── example-pdf-processing/
│   └── SKILL.md
└── README.md              # Documentation
```

**API Endpoints:**
- `GET /api/skills` - List all skills
- `GET /api/skills/:name` - Get specific skill
- `POST /api/skills` - Create new skill
- `PUT /api/skills/:name` - Update skill
- `DELETE /api/skills/:name` - Delete skill

**Configuration:**
- `settingSources`: Array of skill sources (default: `['project']`)
- Automatically loads skills from project's `.claude/skills/`
- Skills Manager component in Config Panel for full CRUD
- Stored in Zustand state: `availableSkills: SkillMetadata[]`

See `.claude/skills/README.md` for comprehensive Skills documentation and examples.

### Type System

**Shared Types** (`lib/types.ts`):
- `AgentSDKConfig`: Complete 30+ parameter configuration for Agent SDK (includes `settingSources`)
- `Message`: User/assistant message format with content blocks
- `SDKMessage`: Full SDK message types (Assistant, User, ResultSuccess, ResultError, etc.)
- `AgentDefinition`: Custom agent/subagent configuration
- `McpServerConfig`: MCP server connection settings
- `HookConfig`: Event hook configuration
- `SkillMetadata`: Skill definition with name, description, content, and path
- Database types: `Conversation`, `Preset`, `UsageLog`, `UsageStats`

Frontend and backend expect these types but backend doesn't import from `lib/types.ts` (Docker isolation). Keep types in sync manually.

### Streaming Implementation

**Server-Sent Events (SSE) flow:**

1. Backend (`agent.ts`):
   - Uses Agent SDK's `query()` function with async iteration
   - Streams agent responses including tool use and thinking
   - Wraps events in SSE format: `data: {JSON}\n\n`

2. Frontend (`chat-interface.tsx`):
   - `ApiClient.streamMessage()` uses Fetch API + ReadableStream
   - Parses `data:` lines and invokes callback per event
   - `handleStreamingRequest()` accumulates text and updates `streamingText` state
   - On `done`, commits full message to store

### Database Schema

Three tables with JSONB storage:

1. **conversations**: Stores entire conversation (config + messages as JSONB)
2. **presets**: Saved configurations with names
3. **usage_logs**: Per-request metrics (tokens, cost, latency)

JSONB allows flexible storage but queries require casting. Example:
```sql
SELECT config->>'model' FROM conversations WHERE id = $1
```

Schema auto-initializes via Docker volume mount in `docker-compose.yml`.

## Configuration

### Environment Variables

**Frontend (`.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Backend (`backend/.env`):**
```
DATABASE_URL=postgresql://agent_user:agent_pass@postgres:5432/agent_db
ANTHROPIC_API_KEY=your_key_here
NODE_ENV=development
PORT=3001
```

**Note:** `ANTHROPIC_API_KEY` must be set in `backend/.env` or docker-compose will fail to start backend service.

## Key Design Decisions

### Why Zustand instead of React Context?
- Simpler API for global state
- No provider wrapping needed
- Built-in dev tools support

### Why Separate Frontend/Backend Instead of Next.js API Routes?
- Docker isolation for backend
- Easier to scale backend independently
- PostgreSQL connection pooling separate from Next.js

### Why JSONB for messages/config?
- Flexible schema (config options change frequently)
- Avoids complex joins for conversation retrieval
- PostgreSQL JSONB has good indexing and query support

### Why Agent SDK over Messages API?
- Built-in tool support (no manual implementation needed)
- Automatic cost calculation and token tracking
- Multi-turn conversation handling
- Simplified agent development workflow

## shadcn/ui Components

Uses Radix UI primitives with Tailwind styling. Components in `components/ui/` are managed by shadcn CLI. To add new components:

```bash
npx shadcn@latest add <component-name>
```

Existing components: button, input, textarea, select, slider, switch, badge, card, tabs, separator, scroll-area, tooltip, alert, dropdown-menu, dialog, resizable.

## Common Patterns

### Adding New Agent Configuration Parameter

1. Add to `AgentConfig` type in `lib/types.ts`
2. Update `DEFAULT_CONFIG` constant
3. Add control in `components/config-panel.tsx`
4. Update backend `agent.ts` to pass to Anthropic SDK
5. Ensure parameter is optional (Anthropic SDK has defaults)

### Adding New API Endpoint

1. Create route in `backend/src/routes/`
2. Import and mount in `backend/src/server.ts`
3. Add client method in `lib/api-client.ts`
4. Call from component with proper error handling

### Adding Database Table

1. Add CREATE TABLE to `backend/db/schema.sql`
2. Reset database: `docker-compose down -v && docker-compose up -d`
3. Add TypeScript interface to `lib/types.ts`
4. Create CRUD routes in `backend/src/routes/`

## Troubleshooting

### Backend can't connect to Anthropic
- Check `ANTHROPIC_API_KEY` in `backend/.env`
- Verify key has correct permissions
- Check backend logs: `docker-compose logs backend`

### Frontend shows "Failed to fetch"
- Ensure backend is running: `curl http://localhost:3001/health`
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- CORS is enabled in backend for all origins (development mode)

### Database connection errors
- Wait for health check: `docker-compose logs postgres | grep "ready"`
- PostgreSQL takes ~10 seconds to initialize on first run
- If persistent, reset: `docker-compose down -v && docker-compose up -d`

### Streaming not working
- Streaming requires SSE support (not all proxies support it)
- Check browser console for EventSource errors
- Fallback to batch mode if issues persist

## Important Files

- `lib/store.ts`: Global state management (Zustand) including Skills state
- `lib/types.ts`: Shared TypeScript interfaces (30+ Agent SDK parameters, SkillMetadata)
- `lib/api-client.ts`: Backend API wrapper (includes Skills API methods)
- `lib/hook-templates.ts`: Pre-built hook configurations for various integrations
- `backend/src/routes/agent.ts`: Agent SDK integration and tool configuration (handles settingSources)
- `backend/src/routes/skills.ts`: Skills CRUD API (list, get, create, update, delete)
- `backend/db/schema.sql`: Database schema
- `components/agent-tester.tsx`: Main two-panel layout container
- `components/config-panel.tsx`: Comprehensive configuration UI with collapsible sections (includes Skills Manager)
- `components/tool-selector.tsx`: Tool selection component (includes Skill tool)
- `components/skills-manager.tsx`: Skills management UI (discovery, creation, editing)
- `components/chat-interface.tsx`: Tabbed interface with Chat and Debug views
- `components/debug-panel.tsx`: Debug metrics display (embedded in ChatInterface)
- `.claude/skills/README.md`: Comprehensive Skills documentation
- `.claude/skills/example-*/SKILL.md`: Example skill definitions
- `docker-compose.yml`: Service orchestration

## Testing the Application

1. Start services: `docker-compose up -d && npm run dev`
2. Visit http://localhost:3334
3. Configure agent in left panel (model, temperature, system prompt)
4. Select tools in tools panel
5. Send test message in center panel
6. Verify metrics in right panel (tokens, cost, latency)
7. Save preset and reload to verify database persistence
8. Toggle streaming mode and compare response behavior
9. Check backend logs for errors: `docker-compose logs -f backend`
