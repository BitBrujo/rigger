# CLAUDE.md

**Developer guidance for AI assistants working on this codebase.**

## Project Overview

**Rigger** is a visual testing interface for the Claude Agent SDK with full web-based configuration, monitoring, and workflow management.

### Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Zustand
- **Backend**: Express.js, TypeScript, Docker
- **Database**: PostgreSQL with JSONB
- **Agent SDK**: `@anthropic-ai/claude-agent-sdk`
- **Real-time**: Server-Sent Events (SSE)

### Core Features
- 19 Agent SDK tools (file, bash, web, planning)
- Session management with two-tier emergency stop
- MCP servers integration
- Skills system (packaged workflows)
- Subagents with custom prompts
- Event-driven hooks
- Configuration presets with import/export
- Usage analytics and cost tracking

## Quick Reference

```bash
# Development
docker-compose up -d    # Backend + DB
npm run dev             # Frontend

# Database
docker exec -it rigger-postgres-1 psql -U agent_user -d agent_db
docker-compose down -v && docker-compose up -d  # Reset

# Logs
docker-compose logs -f backend
```

**Ports**: Frontend (3334), Backend (3333), Database (5335)

## Architecture

### Three-Panel Layout

```
┌─────────┬──────────────────┬─────────────┐
│ Sidebar │  Center Content  │ Chat Panel  │
│  Nav    │  (Active Tab)    │ (4 tabs)    │
│         │                  │             │
│ 10 tabs │  Tab-specific    │ Chat/Debug  │
│         │  configuration   │ Tools/Todo  │
└─────────┴──────────────────┴─────────────┘
```

**File**: `components/agent-tester.tsx`

### Navigation Tabs (10)

1. **Sessions** - Active monitoring, emergency stop controls
2. **Configuration** - Import/export configs, manage presets
3. **Basic Config** - Model, temperature, system prompt
4. **Tools** - 19 SDK tools with checkboxes
5. **MCP Servers** - External protocol servers
6. **Skills** - Packaged workflows from `.claude/skills/`
7. **Subagents** - Specialized agents with custom prompts
8. **Hooks** - Event-driven automation
9. **Files** - Upload files for agent context (max 10MB)
10. **Advanced** - 30+ SDK parameters

**Config**: `lib/navigation-config.ts`

### State Management (Zustand)

**Store**: `lib/store.ts` - Single source of truth

Key state:
- `config: AgentSDKConfig` - Full agent configuration
- `messages: Message[]` - Conversation history
- `activeSessionId` - Current execution session
- `activeTab` - Navigation state
- `uploadedFiles` - File context
- `availableSkills` - Discovered skills

**Usage**:
```typescript
import { useAgentStore } from '@/lib/store';

const config = useAgentStore((state) => state.config);
const setConfig = useAgentStore((state) => state.setConfig);
```

### Request Flow

1. User input → `ChatInterface`
2. State prep → Zustand store
3. API request → `POST /api/agent/stream` with `{ message, config, sessionId }`
4. Session creation/resumption → Auto-created or resumed
5. Backend processing → `buildSdkOptions()` → Agent SDK `query()`
6. Streaming response → SSE events (`text`, `tool_use`, `thinking`, `done`)
7. Frontend update → Real-time UI updates
8. Completion → Metrics logged, session → idle
9. Persistence → Auto-save to database

**Files**: `lib/api-client.ts`, `backend/src/routes/agent.ts`

## Backend Architecture

### Routes (`backend/src/routes/`)

**`agent.ts`** - Agent SDK integration
- `POST /api/agent/stream` - SSE streaming (primary)
- `POST /api/agent/message` - Batch mode (fallback)
- `buildSdkOptions()` - Config transformation

**`sessions.ts`** - Session lifecycle
- `GET /api/sessions` - List with filters
- `POST /api/sessions/:id/stop` - Graceful stop
- `POST /api/sessions/:id/force-kill` - Emergency termination
- `GET /api/sessions/:id/status` - Polling endpoint

**`conversations.ts`** - Chat persistence (CRUD)
**`presets.ts`** - Config presets (CRUD)
**`analytics.ts`** - Usage stats and cost tracking
**`skills.ts`** - Skills management (CRUD)

### SessionManager

**File**: `backend/src/session-manager.ts`

Singleton managing session lifecycle:
- Lifecycle: `createSession()`, `getSession()`, `completeSession()`
- Emergency control: `requestStop()` (graceful), `requestForceKill()` (immediate)
- Metrics: `updateMetrics()`, `setCurrentTool()`
- Auto-cleanup: Terminates idle sessions >5 minutes

**Two-tier emergency stop**:
- Graceful: Sets abort flag, agent checks periodically
- Force kill: `AbortController.abort()`, kills processes immediately

### Database

**Schema**: `backend/db/schema.sql`

Core tables:
- `conversations` - Chat history
- `agent_sessions` - Session lifecycle and metrics
- `presets` - Saved configurations
- `usage_logs` - Per-request analytics
- `tool_usage_logs` - Tool execution tracking
- `uploaded_files` - File context storage

JSONB used for messages and flexible config data.

## Advanced Features

### Sessions
Persistent execution contexts with:
- **States**: initializing → active → idle → completed/terminated
- **Emergency stop**: Graceful (1-5s) or force kill (immediate)
- **Auto-cleanup**: 5-minute idle timeout
- **Metrics**: Tokens, cost, turns, tools used

### Skills
Packaged workflows from `.claude/skills/*/SKILL.md`:
- Auto-discovered on startup
- Invoked via `Skill` tool
- Format: Markdown with frontmatter
- Enable: `settingSources: ['project']` + `allowedTools: ['Skill']`

### MCP Servers
External plugins (GitHub, Playwright, etc.):
- Config: `mcpServers: { name: { command, args, env } }`
- Spawned on session start, shut down on end
- Find: `npm search @modelcontextprotocol/server-`

### Subagents
Specialized agents via `Task` tool:
- Custom prompts, tools, model overrides
- Built-in templates: Code Reviewer, Bug Hunter, Doc Writer
- Storage: `.claude/agents/*.json`

### Hooks
Event-driven automation:
- **Triggers**: on-prompt-submit, on-response-complete, on-tool-use, on-error
- **Actions**: bash, api-call, notification
- **Templates**: Git auto-commit, Slack notifications, error logging
- Run async, don't block execution

### File Uploads
Context files up to 10MB:
- **Integration**: system-prompt, working-directory, or both
- **Scope**: Global or conversation-specific
- **Formats**: Text, JSON, CSV, PDF, images, code

## Development Patterns

### Add Config Parameter
1. Update `AgentSDKConfig` in `lib/types.ts`
2. Update `DEFAULT_CONFIG` in store
3. Add UI in tab component
4. Pass in `backend/src/routes/agent.ts` via `buildSdkOptions()`

### Add API Endpoint
1. Create route in `backend/src/routes/`
2. Mount in `backend/src/server.ts`
3. Add method in `lib/api-client.ts`
4. Call from component

### Add Database Table
1. Add CREATE TABLE in `backend/db/schema.sql`
2. Reset: `docker-compose down -v && docker-compose up -d`
3. Add interface in `lib/types.ts`
4. Create CRUD routes

## Important Files

**Backend**:
- `backend/src/session-manager.ts` - Session lifecycle
- `backend/src/routes/agent.ts` - SDK integration
- `backend/db/schema.sql` - Database schema

**Frontend**:
- `lib/store.ts` - Zustand state
- `lib/types.ts` - TypeScript interfaces
- `lib/api-client.ts` - API wrapper
- `components/agent-tester.tsx` - Main layout
- `components/tabs/*` - Tab components

**Configuration**:
- `.claude/skills/*/SKILL.md` - Skill definitions
- `.claude/agents/*.json` - Subagent definitions

## Troubleshooting

**Backend connection**: Check `ANTHROPIC_API_KEY` in `backend/.env`, view logs
**Frontend errors**: Test `curl http://localhost:3333/health`, check `.env.local`
**Database issues**: Wait 10s for init, reset with `docker-compose down -v`
**Streaming problems**: Check console for SSE errors, auto-falls back to batch

## Environment

**`.env.local`**:
```
NEXT_PUBLIC_API_URL=http://localhost:3333/api
```

**`backend/.env`**:
```
DATABASE_URL=postgresql://agent_user:agent_pass@postgres:5432/agent_db
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
```

## Performance

**Prompt Caching**: Enable `cacheControl: true` (~90% cheaper subsequent requests)
**Token Optimization**: Use Haiku for simple tasks, Sonnet for balanced performance, Opus 4.5 for complex coding/agents (80.9% SWE-bench)
**Database**: JSONB indexing, connection pooling
**Frontend**: Zustand slices, React 19 concurrent features

<!-- BACKLOG.MD MCP GUIDELINES START -->

<CRITICAL_INSTRUCTION>

## BACKLOG WORKFLOW INSTRUCTIONS

This project uses Backlog.md MCP for task management.

**CRITICAL GUIDANCE**

- Read `backlog://workflow/overview` (or call `backlog.get_workflow_overview()`) BEFORE creating tasks
- Search-first workflow to avoid duplicates
- Only track significant, multi-step work

</CRITICAL_INSTRUCTION>

<!-- BACKLOG.MD MCP GUIDELINES END -->
