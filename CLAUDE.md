# CLAUDE.md

**Comprehensive developer guidance for AI assistants working on this codebase.**

This document contains detailed architecture, patterns, and implementation details. Use it to understand the full system when making changes or adding features.

## Project Overview

**Rigger** is a comprehensive visual testing interface for the Claude Agent SDK. It provides a full-featured web application for configuring AI agents, testing tools, monitoring execution, and managing agent workflows.

### Architecture Stack
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/ui components
- **Backend**: Express.js, Node.js, TypeScript
- **Database**: PostgreSQL with JSONB for flexible schema
- **Agent SDK**: `@anthropic-ai/claude-agent-sdk` with full tool support
- **State Management**: Zustand (simpler than Redux, no provider needed)
- **Real-time**: Server-Sent Events (SSE) for streaming responses
- **Containerization**: Docker Compose for backend and database

### Key Features

**Core Agent Testing:**
- 19 built-in Agent SDK tools (file ops, bash, web, planning)
- Real-time streaming responses with SSE
- Comprehensive debug metrics (tokens, costs, cache stats, timing)
- Tool selection and configuration UI
- Full conversation history and persistence

**Advanced Capabilities:**
- **Session Management**: Persistent execution contexts with two-tier emergency stop (graceful + force kill)
- **MCP Servers**: Connect external Model Context Protocol servers (GitHub, Notion, Playwright, etc.)
- **Skills System**: Packaged agent workflows loaded from `.claude/skills/`
- **Subagents**: Define specialized subagents with their own prompts and tools
- **Hooks**: Event-driven automation (git commits, notifications, webhooks)
- **Configuration Management**: Import/export configurations as JSON and manage saved presets
- **Analytics**: Usage tracking, cost analysis, and performance metrics

## Quick Reference

### Essential Commands

```bash
# Start development
docker-compose up -d    # Backend + DB
npm run dev             # Frontend (port 3334)

# Backend development
cd backend && npm run watch  # Auto-reload

# Database
docker exec -it rigger-postgres-1 psql -U agent_user -d agent_db
docker-compose down -v && docker-compose up -d  # Reset DB

# Logs
docker-compose logs -f backend
docker-compose logs -f postgres
```

### Port Map
- **Frontend**: 3334 (Next.js)
- **Backend API**: 3333 (Express, internal: 3001)
- **Database**: 5335 (PostgreSQL, internal: 5432)

## Detailed Architecture

### Application Structure

The application uses a **three-panel responsive layout** with sidebar navigation and tabbed content:

```
┌──────────┬────────────────────────┬─────────────────────┐
│          │                        │                     │
│ Sidebar  │   Center Content       │   Chat Panel        │
│ Nav      │   (Active Tab)         │                     │
│          │                        │  ┌───────────────┐  │
│ [≡]      │                        │  │ Chat          │  │
│          │  Configuration or      │  │ Debug         │  │
│ Sessions │  Management UI         │  │ Tools         │  │
│ Config   │  based on selected     │  │ Todo          │  │
│ Basic    │  navigation tab        │  └───────────────┘  │
│ Tools    │                        │                     │
│ MCP      │                        │  Message history    │
│ Skills   │                        │  Streaming input    │
│ Agents   │                        │  User input area    │
│ Hooks    │                        │                     │
│ Advanced │                        │                     │
│          │                        │                     │
└──────────┴────────────────────────┴─────────────────────┘
 64/240px        Flexible              ~400px
```

**Layout implemented in** `components/agent-tester.tsx`

#### Panel Breakdown

**Left: Sidebar Navigation** (`components/navigation/sidebar-nav.tsx`)
- Collapsible sidebar (64px collapsed, 240px expanded on hover)
- 10 navigation tabs with icons and labels
- Active tab highlighting
- State: `activeTab` in Zustand store

**Center: Tabbed Content Area**
- Renders active tab component based on navigation selection
- Each tab is a dedicated component in `components/tabs/`
- Configuration and management UIs

**Right: Chat Interface** (`components/chat-interface.tsx`)
- Multi-tabbed interface with 4 views
- Persistent across navigation changes
- Real-time message streaming

### Navigation System

The application features a **tab-based navigation system** defined in `lib/navigation-config.ts`. Users navigate between configuration and management screens using the sidebar.

#### Navigation Tabs (10 Tabs)

1. **Sessions** (`tabs/sessions-tab.tsx`)
   - Active session monitoring with real-time metrics
   - Session history and management
   - Two-tier emergency stop controls (Graceful Stop / Force Kill)
   - New session creation and deletion

2. **Configuration** (`tabs/presets-tab.tsx`)
   - Import and export agent configurations as JSON files
   - Save and load complete agent configurations
   - Manage saved presets with modification tracking
   - Quick configuration switching
   - Visual indicators show when active config differs from loaded preset

3. **Basic Config** (`tabs/basic-config-tab.tsx`)
   - Model selection (Sonnet, Opus, Haiku)
   - Permission mode and sandbox controls
   - Max turns and token budget
   - System prompt editor

4. **Tools** (`tabs/tools-tab.tsx`)
   - 19 built-in Agent SDK tools with checkboxes
   - Organized by category: File Operations, Execution, Web, Planning, Agent System
   - Stored in `config.allowedTools` array

5. **MCP Servers** (`tabs/mcp-servers-tab.tsx`)
   - Add/edit/remove external Model Context Protocol servers
   - Configure command, args, environment variables
   - Preconfigured server templates (GitHub, Notion, Playwright, etc.)

6. **Skills** (`tabs/skills-tab.tsx`)
   - List discovered skills from `.claude/skills/`
   - Create, edit, delete skills
   - Skill content viewer

7. **Subagents** (`tabs/agents-tab.tsx`)
   - Define specialized subagents with custom prompts
   - Configure tools and model overrides per agent
   - Built-in templates (Code Reviewer, Bug Hunter, etc.)

8. **Hooks** (`tabs/hooks-tab.tsx`)
   - Event-driven automation configuration
   - Trigger types: on-prompt-submit, on-response-complete, on-tool-use, on-error
   - Pre-built templates (Git Auto-Commit, Slack Notifications, etc.)

9. **Files** (`tabs/files-tab.tsx`)
   - Upload and manage files for agent context (max 10MB)
   - Integration methods: system-prompt, working-directory, or both
   - Global vs conversation-scoped file management
   - Supported formats: text, JSON, CSV, PDF, images, code files
   - Enable/disable individual files and add descriptions

10. **Advanced** (`tabs/advanced-tab.tsx`)
   - Working directory and allowed directories
   - Thinking budget configuration
   - Cache control and advanced SDK settings
   - 30+ additional Agent SDK parameters

**Navigation State:**
- `activeTab: string` - Current tab ID (default: `'sessions'`)
- `sidebarHovered: boolean` - Sidebar expansion state
- Both stored in Zustand store

#### Chat Panel Tabs

The right-side chat panel has its own tab system:

1. **Chat Tab**
   - Message history display
   - Real-time streaming responses
   - Tool execution visualization
   - User input area with markdown support

2. **Debug Tab** (`components/debug-panel.tsx`)
   - Token usage breakdown (input, output, cached)
   - Cost calculation per message
   - API latency and cache metrics
   - Raw API responses (JSON)

3. **Tools Tab**
   - Tool execution timeline
   - Tool call parameters and results

4. **Todo Tab**
   - Task list management
   - Agent-created todos visualization

### State Management with Zustand

**The Zustand store (`lib/store.ts`) is the single source of truth for all application state.**

#### Store Structure

```typescript
interface StoreState {
  // Agent Configuration
  config: AgentSDKConfig;           // Complete agent configuration
  setConfig: (config: AgentSDKConfig) => void;

  // Active Preset Tracking
  activePresetId: string | null;           // Currently loaded preset ID
  activePresetName: string | null;         // Currently loaded preset name
  loadedPresetConfig: AgentSDKConfig | null; // Original preset config (for change detection)
  setActivePreset: (id, name, config) => void;
  clearActivePreset: () => void;

  // Conversation State
  messages: Message[];              // Full message history
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;

  // Streaming State
  isStreaming: boolean;
  streamingMode: boolean;           // User preference for streaming
  setIsStreaming: (streaming: boolean) => void;
  setStreamingMode: (mode: boolean) => void;

  // Debug Information
  debugInfo: DebugInfo | null;      // Latest API response metrics
  setDebugInfo: (info: DebugInfo) => void;

  // Persistence
  conversationId: string | null;    // Current conversation ID
  setConversationId: (id: string | null) => void;

  // Session Management
  activeSessionId: string | null;           // Current session ID
  activeSessionStatus: SessionStatus | null; // Session status
  activeSessionCost: number;                 // Session total cost
  activeSessionDuration: number;             // Seconds since start
  currentTool: string | null;                // Currently executing tool
  isStopRequested: boolean;                  // Graceful stop requested
  isForceKillRequested: boolean;             // Emergency stop requested
  availableSessions: SessionMetadata[];      // Session registry

  // Navigation
  activeTab: string;                         // Current navigation tab (default: 'sessions')
  setActiveTab: (tab: string) => void;
  sidebarHovered: boolean;                   // Sidebar expansion state
  setSidebarHovered: (hovered: boolean) => void;

  // Skills
  availableSkills: SkillMetadata[]; // Discovered skills
  setAvailableSkills: (skills: SkillMetadata[]) => void;

  // Uploaded Files
  uploadedFiles: UploadedFile[];    // Uploaded files for agent context
  setUploadedFiles: (files: UploadedFile[]) => void;
  toggleFileEnabled: (id: number) => void;

  // Todo Lists
  todoLists: TodoList[];            // Task lists from agent
  setTodoLists: (lists: TodoList[]) => void;
  clearTodoLists: () => void;
}
```

**Why Zustand?**
- No provider wrapping required (unlike Context API)
- Components can subscribe to specific slices
- Built-in devtools support
- Simpler API than Redux
- TypeScript-friendly
- No prop drilling

**Components consume store directly:**
```typescript
// In any component
import { useAgentStore } from '@/lib/store';

function MyComponent() {
  const config = useAgentStore((state) => state.config);
  const setConfig = useAgentStore((state) => state.setConfig);
  // Component automatically re-renders when config changes
}
```

**Note:** `useStore` is also exported as an alias for backward compatibility.

### Complete Request Flow

**Detailed step-by-step data flow for agent requests:**

1. **User Input**
   - User types message in `ChatInterface`
   - Message input captured in component state
   - User clicks "Send" button

2. **State Preparation**
   - Current `config` retrieved from Zustand store
   - User message added to `messages` array in store
   - `isStreaming` set to `true`

3. **API Request**
   - `ApiClient.streamMessage()` called from `lib/api-client.ts`
   - Payload constructed: `{ message: userInput, config: storeConfig, sessionId?: activeSessionId }`
   - Request sent to backend: `POST /api/agent/stream`

4. **Session Creation/Resumption**
   - Backend checks for `sessionId` in request
   - If exists: Resume session, update status to 'active', get AbortSignal
   - If new: Auto-create session, store in `agent_sessions` table, initialize AbortController
   - Session ID sent to frontend via `session_created` event

5. **Backend Processing**
   - Express route handler in `backend/src/routes/agent.ts`
   - Config transformed via `buildSdkOptions()`
   - Agent SDK `query()` function invoked with async iteration and AbortSignal
   - Agent SDK executes with configured tools
   - Abort signal checked on each iteration for emergency stop

6. **Streaming Response**
   - Backend wraps each event in SSE format: `data: {JSON}\n\n`
   - Events streamed: `text`, `tool_use`, `thinking`, `done`, `error`, `session_created`
   - On `tool_use`: SessionManager updates `current_tool`, frontend displays in real-time
   - Frontend `ReadableStream` parses each event

7. **Frontend Update**
   - Session ID stored in `activeSessionId` state
   - Text chunks accumulated in messages
   - Tool use events tracked with session metrics
   - UI updates reactively as text streams in

8. **Completion**
   - On `done` event, full message committed to store
   - `isStreaming` set to `false`
   - Session status updated to 'idle' in database
   - `debugInfo` updated with metrics (tokens, cost, timing)
   - Session metrics (tokens, cost, tools used) updated in `agent_sessions` table

9. **Persistence**
   - If `conversationId` exists, conversation auto-saved to database
   - Session linked to conversation via `conversation_id` foreign key
   - Session remains active for resumption (5-min idle timeout)
   - Usage metrics logged to both `usage_logs` and `agent_sessions` tables

**Error Handling:**
- Network errors: Retry logic in `ApiClient`
- SSE connection drops: Auto-fallback to batch mode
- Backend errors: Error message displayed in chat
- Tool execution errors: Shown in debug panel

### Backend Architecture

The backend is an Express.js application running in Docker with PostgreSQL.

#### Express Router Structure (`backend/src/routes/`)

**`agent.ts`** - Core Agent SDK integration:
- `POST /api/agent/stream` - Streaming endpoint (primary mode)
  - Uses Server-Sent Events (SSE)
  - Streams `text`, `tool_use`, `thinking` events
  - Returns metrics on `done`
- `POST /api/agent/message` - Batch endpoint (fallback)
  - Returns complete response at once
  - Used when streaming fails or disabled
- `buildSdkOptions()` helper - Transforms UI config to SDK format
  - Maps 30+ configuration parameters
  - Handles MCP server configs
  - Sets up custom agents and hooks
  - Configures workspace and permissions

**`conversations.ts`** - Conversation persistence:
- `GET /api/conversations` - List all conversations (with pagination)
- `GET /api/conversations/:id` - Get specific conversation
- `POST /api/conversations` - Create new conversation
- `PUT /api/conversations/:id` - Update existing conversation
- `DELETE /api/conversations/:id` - Delete conversation
- Stores full config and messages as JSONB

**`presets.ts`** - Configuration presets:
- `GET /api/presets` - List all saved presets
- `GET /api/presets/:id` - Get specific preset
- `POST /api/presets` - Save new preset
- `PUT /api/presets/:id` - Update preset
- `DELETE /api/presets/:id` - Delete preset
- Allows sharing configurations between users

**`analytics.ts`** - Usage statistics:
- `GET /api/analytics` - Usage logs with filtering
- `GET /api/analytics/stats` - Aggregate statistics
  - Total tokens, costs by model
  - Average latency
  - Cache hit rates
- `GET /api/analytics/timeline` - Time-series data for charts
- Logs every request to `usage_logs` table

**`skills.ts`** - Skills management:
- `GET /api/skills` - List all discovered skills
- `GET /api/skills/:name` - Get specific skill content
- `POST /api/skills` - Create new skill
- `PUT /api/skills/:name` - Update skill
- `DELETE /api/skills/:name` - Delete skill
- Reads from `.claude/skills/*/SKILL.md` files

**`agents.ts`** - Subagent management (future):
- CRUD operations for subagent definitions
- Stored in `.claude/agents/*.json`

**`sessions.ts`** - Session management:
- `POST /api/sessions` - Create new session (rarely used; auto-created by `/api/agent/stream`)
- `GET /api/sessions` - List sessions with filters (status, conversationId, limit)
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/:id/stop` - Request graceful stop (5-second grace period)
- `POST /api/sessions/:id/force-kill` - Emergency termination (immediate)
- `DELETE /api/sessions/:id` - Delete session from database
- `GET /api/sessions/:id/status` - Lightweight status polling (for UI updates)

**SessionManager** (`backend/src/session-manager.ts`) - Singleton session registry:
- Maintains map of active sessions with AbortControllers
- Lifecycle management: create, resume, stop, force-kill, complete
- Metrics tracking: tokens, cost, turns, tools used, current tool
- **Two-tier emergency stop**:
  - `requestStop()`: Sets abort flag, agent checks periodically (graceful)
  - `requestForceKill()`: Aborts immediately, kills generators, cleans up resources
- Auto-cleanup job runs every minute (terminates idle sessions >5 minutes)
- Process management: Registers query generators for force termination

#### Database Layer (`backend/db/`)

**`client.ts`** - PostgreSQL connection:
```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Max connections in pool
  idleTimeoutMillis: 30000,   // Close idle connections
  connectionTimeoutMillis: 2000,
});

export default pool;
```

**`schema.sql`** - Complete database schema defined in `backend/db/schema.sql`:

**Core tables:**
- `conversations` - Chat history and messages
- `agent_sessions` - Session lifecycle, metrics, and emergency control
- `presets` - Saved agent configurations
- `usage_logs` - Per-request metrics and analytics
- `tool_usage_logs` - Per-tool execution tracking
- `todos` / `todo_items` - Task list management
- `custom_agents` - User-defined subagent definitions
- `uploaded_files` - File uploads for agent context

**Note:** The schema uses individual columns for most configuration data (model, temperature, etc.) rather than JSONB blobs. This provides better indexing and query performance. JSONB is used selectively for truly flexible data like messages and tool results.

See `backend/db/schema.sql` for the complete schema definition with all columns, constraints, and indexes.

**Why JSONB?**
- Flexible schema - config parameters change frequently
- PostgreSQL has excellent JSONB performance
- Can index specific JSONB fields: `CREATE INDEX ON conversations ((config->>'model'))`
- Avoids complex joins for retrieving full conversations
- Easy to query: `SELECT config->>'model' FROM conversations WHERE id = $1`

**Cost Calculation:**
- Automatic via Agent SDK's built-in metrics
- No manual price tables needed
- SDK returns exact cost per request
- Logged to `usage_logs` for analytics

### Agent SDK Tools System

The application provides access to 19 built-in Agent SDK tools, organized into categories:

#### Tool Categories

**File Operations:**
- `Read` - Read file contents with line ranges
- `Write` - Create or overwrite files
- `Edit` - Make targeted edits to existing files
- `Glob` - Find files matching patterns (e.g., `**/*.ts`)
- `Grep` - Search file contents with regex

**Execution:**
- `Bash` - Execute shell commands
- `BashOutput` - Monitor output from running commands
- `KillShell` - Terminate background processes

**Web Access:**
- `WebFetch` - Fetch and parse web pages
- `WebSearch` - Search the internet

**Planning & Interaction:**
- `TodoWrite` - Manage task lists
- `Task` - Delegate to sub-agents
- `AskUserQuestion` - Prompt user for input
- `ExitPlanMode` - Exit planning state

**Agent System:**
- `Skill` - Invoke packaged workflows
- `SlashCommand` - Execute custom commands

#### Tool Configuration

Tools are enabled/disabled via the `config.allowedTools` array:

```typescript
config: {
  allowedTools: ['Read', 'Write', 'Bash', 'WebSearch'],
  // Agent can only use these 4 tools
}
```

The UI provides checkboxes in the Tool Selector component for easy management.

## Advanced Features

### Session Management

**Sessions** are persistent execution contexts that track agent activity across multiple requests. They enable emergency stop controls, resource monitoring, and cost tracking.

#### Session Lifecycle

**States**: `initializing` → `active` → `idle` → (`stopping` | `completed` | `error` | `terminated`)

1. **Creation**: Auto-created on first `/api/agent/stream` request (or explicitly via `POST /api/sessions`)
2. **Execution**: Session tracks all activity - tokens, cost, tools used, current tool
3. **Idle**: After response completes, session enters idle state (resumable for 5 minutes)
4. **Termination**: Either graceful completion, error, or emergency stop

#### Two-Tier Emergency Stop

**Graceful Stop** (`POST /api/sessions/:id/stop`):
- Sets `abort_requested` flag in database
- Agent checks flag periodically during execution
- Allows current operation to finish cleanly
- Typical delay: 1-5 seconds

**Force Kill** (`POST /api/sessions/:id/force-kill`):
- Calls `AbortController.abort()` immediately
- Terminates query generator
- Kills child processes (bash shells, MCP servers)
- Cleans up resources
- Status set to `terminated` with reason `emergency_stop`

#### Architecture

**SessionManager Singleton** (`backend/src/session-manager.ts`) - Manages session lifecycle, metrics, and emergency controls:
- **Lifecycle:** `createSession()`, `getSession()`, `updateStatus()`, `completeSession()`
- **Emergency Control:** `requestStop()` (graceful), `requestForceKill()` (immediate), `getAbortSignal()`
- **Metrics:** `updateMetrics()`, `setCurrentTool()` - Tracks tokens, cost, turns, tools used
- **Cleanup:** Auto-cleanup job runs every minute (terminates idle sessions >5 minutes)

#### Session Data

Sessions store: ID, status, config snapshot, lifecycle timestamps (created, started, completed, terminated), resource metrics (tokens, cost, turns), tool tracking, and emergency control flags. See `SessionMetadata` type in `lib/types.ts`.

#### Frontend Integration

Sessions auto-created by `ApiClient.streamMessage()` - no explicit creation needed. Zustand store tracks `activeSessionId`, `activeSessionStatus`, `activeSessionCost`, `currentTool`, `isStopRequested`, and `isForceKillRequested`.

#### Session API

- `POST /api/sessions` - Create session (rarely used)
- `GET /api/sessions` - List with filters (status, conversationId, limit)
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/:id/stop` - Graceful stop
- `POST /api/sessions/:id/force-kill` - Emergency termination
- `DELETE /api/sessions/:id` - Delete session
- `GET /api/sessions/:id/status` - Lightweight polling endpoint

#### Auto-Cleanup

SessionManager runs cleanup job every 60 seconds:
- Finds sessions with `status = 'idle'` and `last_activity_at > 5 minutes ago`
- Calls `completeSession()` to mark as completed and remove from active registry
- Prevents resource leaks from abandoned sessions

#### Best Practices

**When to use emergency stop:**
- Graceful stop: Agent stuck in loop, want to stop cleanly
- Force kill: Runaway bash process, immediate termination needed

**Session vs Conversation:**
- **Session**: Execution context (technical, tracks resources)
- **Conversation**: Chat history (user-facing, stores messages)
- One conversation can have multiple sessions
- Sessions are ephemeral, conversations persist

### Skills System

**Skills** are packaged agent workflows that provide step-by-step instructions for specific tasks (PDF processing, code review, data transformation).

**How it works:**
- **Discovery**: Auto-loaded from `.claude/skills/*/SKILL.md` files
- **Usage**: Agent invokes via `Skill` tool when request matches description
- **Format**: Markdown with frontmatter: `---\ndescription: Brief description\n---\n# Skill Name\n## Workflow, Prerequisites, etc.`
- **Management**: Create/edit via UI (Skills tab) or manually edit files
- **Examples**: `example-pdf-processing`, `example-data-transform`, `example-code-review`

**Configuration:**
- **State**: `availableSkills: SkillMetadata[]` (Zustand)
- **Enable**: `settingSources: ['project']` + `allowedTools: ['Skill']`
- **API**: `/api/skills` (GET list, GET :name, POST create, PUT update, DELETE)

See `.claude/skills/README.md` for detailed documentation.

### MCP (Model Context Protocol) Servers

**MCP servers** are external plugins that extend Claude with additional tools (browser automation, GitHub operations, file systems, etc.). Protocol spec: https://modelcontextprotocol.io/

#### Configuration

```typescript
config: {
  mcpServers: {
    "github": {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: { GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_..." }
    }
  }
}
```

#### Common Servers

Available via UI (Navigation → MCP Servers tab) or programmatically:

- **Playwright**: Browser automation (navigate, click, screenshot)
- **Fetch**: HTTP requests (GET/POST/PUT/DELETE)
- **GitHub**: Repo management (PRs, issues, commits) - requires token
- **Filesystem**: Advanced file operations
- **Git**: Version control (commit, push, pull, merge)
- **Notion**: Workspace integration - requires API key
- **Memory**: Persistent knowledge graphs
- **Time**: Timezone and date operations

#### How It Works

1. Backend spawns MCP server processes on agent start
2. Agent SDK queries servers for available tools
3. Tool requests routed to appropriate server
4. Servers shut down when session ends

**State**: `config.mcpServers` (Zustand)
**Find servers**: `npm search @modelcontextprotocol/server-` or https://github.com/modelcontextprotocol/servers

### Subagents

**Subagents** are specialized AI agents invoked via the `Task` tool. They delegate specific work with custom prompts, tools, and models.

#### Agent Definition

```typescript
interface AgentDefinition {
  name: string;
  systemPrompt: string;          // Defines expertise
  allowedTools: string[];        // Limited tool access
  model?: string;                // Override (e.g., "haiku" for speed)
  temperature?: number;          // Adjust creativity
  maxTurns?: number;
  description?: string;
}
```

#### Built-in Templates

Available via UI (Navigation → Subagents tab):

- **Code Reviewer**: Analyze code quality, security, performance (temp: 0.3)
- **Bug Hunter**: Find bugs, trace errors, suggest fixes (temp: 0.2)
- **Doc Writer**: Create technical documentation (temp: 0.7)
- **Refactorer**: Improve code structure, reduce duplication (temp: 0.4)
- **Test Generator**: Create unit/integration tests (temp: 0.5)

#### Usage

Main agent delegates via `Task` tool:
```
User: "Review authentication code"
Main Agent: [Invokes code-reviewer subagent]
Code Reviewer: [Analyzes, returns review]
```

**State**: `config.customAgents` (Zustand)
**Storage**: `.claude/agents/*.json`
**API**: `/api/agents` (CRUD - planned)

#### Best Practices

- Use lower temp for analytical tasks (review, debug)
- Use higher temp for creative tasks (docs, design)
- Limit tools to minimum needed (security)
- Keep prompts focused and specific

### Hooks System

**Hooks** enable event-driven automation - execute actions in response to events during agent execution.

#### Hook Configuration

```typescript
interface HookConfig {
  name: string;
  trigger: 'on-prompt-submit' | 'on-response-complete' | 'on-tool-use' | 'on-error';
  action: { type: 'bash' | 'api-call' | 'notification'; config: Record<string, any> };
  enabled: boolean;
  conditions?: Condition[];
}
```

#### Triggers

- **on-prompt-submit**: Before message sent (backups, pre-processing)
- **on-response-complete**: After response (notifications, post-processing)
- **on-tool-use**: When specific tools used (auto-commit, formatting)
- **on-error**: On errors (monitoring, alerting)

#### Pre-built Templates

Located in `lib/hook-templates.ts`, available via UI:

1. **Git Auto-Commit**: Auto-commit on Write/Edit with AI-generated message
2. **Slack Notifications**: Send summary on response complete
3. **Error Logging**: Log to Sentry/monitoring on errors
4. **Code Formatting**: Run prettier/eslint on file writes
5. **Backup Creation**: Timestamped backup before each request
6. **API Webhooks**: POST metrics to your API

#### Variable Interpolation

Templates support runtime variables:
- All: `{{conversation_id}}`, `{{timestamp}}`, `{{user_message}}`
- Tool use: `{{tool}}`, `{{file}}`, `{{description}}`
- Response: `{{summary}}`, `{{debug.tokens}}`, `{{debug.cost}}`
- Error: `{{error.message}}`, `{{error.stack}}`

#### Execution

Hooks run asynchronously in parallel, don't block agent execution. Errors logged but don't fail requests.

**State**: `config.hooks` (Zustand)
**Execution**: `backend/src/hooks/executor.ts`
**Management**: Navigation → Hooks tab

#### Best Practices

- Use environment variables for secrets (not hook configs)
- Test individually before enabling
- Use conditions to avoid unnecessary executions

### File Upload System

**Files** can be uploaded to provide additional context to the agent. Files are stored in the database and can be integrated into agent execution in multiple ways.

#### File Management

**Upload:** Files up to 10MB with supported formats (text, JSON, CSV, PDF, images, code files)

**Storage:** Files stored in `uploaded_files` table with metadata:
- Original filename, MIME type, size
- Upload timestamp and description
- Global vs conversation-scoped
- Enabled/disabled status
- Integration method selection

**Scope:**
- **Global files**: Available across all conversations (marked with globe icon)
- **Conversation files**: Only available in specific conversation (marked with user icon)

#### Integration Methods

**Three ways to integrate uploaded files:**

1. **System Prompt** - File content injected into system prompt
   - Ideal for: Reference documents, guidelines, context data
   - Automatically included in every request
   - Best for text-based files (JSON, MD, TXT)

2. **Working Directory** - File copied to agent's working directory
   - Ideal for: Files agent needs to read/modify with tools
   - Agent can use Read, Edit tools on the file
   - Best for code files, data files agent will process

3. **Both** - Combined approach
   - File content in system prompt AND copied to working directory
   - Maximum context availability
   - Use when file needs to be both referenced and modified

**State**: `uploadedFiles: UploadedFile[]` (Zustand)
**API**: `/api/files` (CRUD operations)
**Management**: Navigation → Files tab

#### Best Practices

- Use system prompt integration for read-only reference materials
- Use working directory for files the agent should manipulate
- Disable unused files to reduce token consumption
- Add descriptions to help track file purposes
- Use global scope for commonly referenced files across projects

## Technical Details

### Type System (`lib/types.ts`)

Important interfaces:
- `AgentSDKConfig` - 30+ Agent SDK parameters
- `Message` / `SDKMessage` - Message formats
- `AgentDefinition` - Subagent config
- `McpServerConfig` - MCP server settings
- `HookConfig` - Hook definitions
- `SkillMetadata` - Skill metadata
- DB types: `Conversation`, `Preset`, `UsageLog`, `UsageStats`

**Note**: Backend doesn't import from `lib/types.ts` (Docker isolation). Keep types synced manually.

### Streaming (SSE)

**Backend** (`agent.ts`):
- Uses Agent SDK `query()` with async iteration
- Wraps in SSE: `data: {JSON}\n\n`

**Frontend** (`chat-interface.tsx`):
- `ApiClient.streamMessage()` uses Fetch + ReadableStream
- Parses events, updates `streamingText` state
- Commits to store on `done`

### Database

**Core tables:**
- `conversations` - Chat history and messages
- `agent_sessions` - Session lifecycle, metrics, and emergency control
- `presets` - Saved agent configurations
- `usage_logs` - Per-request metrics and analytics
- `tool_usage_logs` - Per-tool execution tracking
- `todos` / `todo_items` - Task list management
- `custom_agents` - User-defined subagent definitions
- `uploaded_files` - File uploads for agent context

**Schema details:** See `backend/db/schema.sql` for complete table definitions, columns, constraints, and indexes. Auto-initialized on first run.

### Environment

**`.env.local`** (frontend):
```
NEXT_PUBLIC_API_URL=http://localhost:3333/api
```

**`backend/.env`**:
```
DATABASE_URL=postgresql://agent_user:agent_pass@postgres:5432/agent_db
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
```

### UI Components

**shadcn/ui** - Radix primitives + Tailwind styling.

Add components: `npx shadcn@latest add <component-name>`

Currently using: button, input, textarea, select, slider, switch, badge, card, tabs, separator, scroll-area, tooltip, alert, dropdown-menu, dialog, resizable.

## Design Decisions

**Zustand over Context**: Simpler API, no provider wrapping, dev tools.
**Separate backend**: Docker isolation, independent scaling, connection pooling.
**JSONB storage**: Flexible schema for frequently changing config.
**Agent SDK**: Built-in tools, auto cost tracking, multi-turn handling.

## Common Development Patterns

### Add Agent Config Parameter
1. Update `AgentSDKConfig` in `lib/types.ts`
2. Update `DEFAULT_CONFIG` constant in store
3. Add UI control in appropriate tab component (`tabs/basic-config-tab.tsx` or `tabs/advanced-tab.tsx`)
4. Pass to Agent SDK in `backend/src/routes/agent.ts` via `buildSdkOptions()`
5. Make optional (SDK has defaults)

### Add API Endpoint
1. Create route file in `backend/src/routes/`
2. Mount in `backend/src/server.ts`
3. Add method in `lib/api-client.ts`
4. Call from component with error handling

### Add Database Table
1. Add CREATE TABLE in `backend/db/schema.sql`
2. Reset DB: `docker-compose down -v && docker-compose up -d`
3. Add TypeScript interface in `lib/types.ts`
4. Create CRUD routes in `backend/src/routes/`

## Troubleshooting

**Anthropic connection fails**:
- Check `ANTHROPIC_API_KEY` in `backend/.env`
- View logs: `docker-compose logs backend`

**Frontend "Failed to fetch"**:
- Test backend: `curl http://localhost:3333/health`
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

**Database errors**:
- Wait ~10s for PostgreSQL init
- Reset: `docker-compose down -v && docker-compose up -d`
- Check: `docker-compose logs postgres | grep "ready"`

**Streaming issues**:
- Some proxies block SSE
- Check console for EventSource errors
- App auto-falls back to batch mode

## Agent SDK Configuration

**30+ parameters available** - key ones:
- `model`: Claude model (sonnet, opus, haiku)
- `temperature`: 0.0-1.0 (creativity vs consistency)
- `maxTurns`: Maximum conversation turns
- `maxTokens`: Max tokens per response

**Tool Configuration:**
- `allowedTools`: Array of tool names to enable
- `customAgents`: Subagent definitions
- `settingSources`: Where to load skills from

**Workspace & Permissions:**
- `workingDirectory`: Agent's working directory
- `allowedDirectories`: Paths agent can access
- `dangerouslyDisableSandbox`: Disable safety restrictions

**MCP Integration:**
- `mcpServers`: External server configurations
- Tool discovery happens automatically

**Hooks & Events:**
- `hooks`: Event-driven behaviors
- Executed by backend hook system

**Advanced Options:**
- `resumeSessionId`: Continue previous conversation
- `thinkingBudget`: Tokens allocated for reasoning
- `cacheControl`: Enable prompt caching
- `metadata`: Custom request metadata

**Configuration flow:** UI → Zustand store → Backend API → `buildSdkOptions()` → Agent SDK → Execution (see "Complete Request Flow" section for details)

### Performance Optimization

**Prompt Caching:**
```typescript
config: {
  cacheControl: true,  // Enable caching
  systemPrompt: "Your long system prompt..."
}
```
- First request: Full cost
- Subsequent requests: ~90% cheaper on cached portions
- Cache TTL: 5 minutes

**Token Optimization:**
- Use Haiku for simple tasks (faster, cheaper)
- Use Sonnet for complex reasoning
- Limit `maxTokens` to prevent runaway responses
- Enable streaming for faster perceived performance

**Database Performance:**
- JSONB indexing on frequently queried fields
- Connection pooling in `backend/db/client.ts`
- Batch inserts for analytics data

**Frontend Optimization:**
- Zustand for efficient re-renders
- React 19 concurrent features
- Code splitting for route-based chunks
- Tailwind CSS JIT compilation

## Important Files

**Backend Core:**
- `backend/src/session-manager.ts`: Session lifecycle, AbortController registry, emergency stop
- `backend/src/routes/sessions.ts`: Session API endpoints (stop, force-kill, status)
- `backend/src/routes/agent.ts`: Agent SDK integration, session creation/resumption
- `backend/src/routes/skills.ts`: Skills CRUD API
- `backend/db/schema.sql`: Database schema (conversations, agent_sessions, presets, usage_logs)

**Frontend State & API:**
- `lib/store.ts`: Zustand store (config, messages, sessions, navigation state)
- `lib/types.ts`: TypeScript interfaces (AgentSDKConfig, SessionMetadata, etc.)
- `lib/api-client.ts`: Backend API wrapper
- `lib/navigation-config.ts`: Navigation tab definitions and structure
- `lib/hook-templates.ts`: Pre-built hook configurations

**Layout & Navigation:**
- `components/agent-tester.tsx`: Main three-panel layout
- `components/navigation/sidebar-nav.tsx`: Collapsible sidebar navigation
- `components/navigation/nav-item.tsx`: Individual navigation items
- `components/chat-interface.tsx`: Chat panel with multi-tab interface

**Tab Components:**
- `components/tabs/sessions-tab.tsx`: Session management and emergency stop controls
- `components/tabs/presets-tab.tsx`: Configuration presets management
- `components/tabs/basic-config-tab.tsx`: Basic agent configuration
- `components/tabs/tools-tab.tsx`: Tool selector UI
- `components/tabs/mcp-servers-tab.tsx`: MCP server configuration
- `components/tabs/skills-tab.tsx`: Skills management
- `components/tabs/agents-tab.tsx`: Subagents configuration
- `components/tabs/hooks-tab.tsx`: Hooks configuration
- `components/tabs/files-tab.tsx`: File upload and management
- `components/tabs/advanced-tab.tsx`: Advanced SDK settings

**Shared Components:**
- `components/debug-panel.tsx`: Debug metrics and API response viewer
- `components/tool-selector.tsx`: Reusable tool selection component
- `components/skills-manager.tsx`: Skills CRUD operations

**Configuration:**
- `.claude/skills/*/SKILL.md`: Skill definitions and documentation
- `.claude/agents/*.json`: Subagent definitions
- `docker-compose.yml`: Service orchestration

## Testing the Application

1. Start services: `docker-compose up -d && npm run dev`
2. Visit http://localhost:3334
3. Navigate to Basic Config tab and configure agent (model, temperature, system prompt)
4. Navigate to Tools tab and select desired tools
5. Send test message in chat panel (right side)
6. Verify metrics in Debug tab (tokens, cost, latency)
7. Navigate to Configuration tab, save current configuration as preset, export to JSON, and reload to verify database persistence
8. Navigate to Sessions tab to view active session and test emergency stop controls
9. Toggle streaming mode and compare response behavior
10. Check backend logs for errors: `docker-compose logs -f backend`
