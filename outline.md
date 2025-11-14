# Jigger - Architecture Outline

> A comprehensive guide to understanding how the Jigger Claude Agent SDK testing application works

---

## Table of Contents

1. [Overview](#overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Frontend Architecture](#frontend-architecture)
4. [Request Flow](#request-flow)
5. [Agent SDK Integration](#agent-sdk-integration)
6. [Real-Time Tool Tracking](#real-time-tool-tracking)
7. [Cost Tracking](#cost-tracking)
8. [Advanced Features](#advanced-features)
9. [Database Persistence](#database-persistence)
10. [Streaming vs Batch Mode](#streaming-vs-batch-mode)
11. [Development Workflow](#development-workflow)
12. [Key Innovations](#key-innovations)

---

## Overview

**Jigger** is a web application for testing and debugging the Claude Agent SDK. It provides a visual interface to configure AI agents, watch them execute tools in real-time, and debug their behavior with comprehensive metrics.

**Core Purpose**: Visual debugger for Claude Agent SDK with real-time tool execution tracking

**Tech Stack**:
- Frontend: Next.js 16, React 19, TypeScript, shadcn/ui, Tailwind CSS 4
- Backend: Express.js, Node.js (Docker)
- Database: PostgreSQL (Docker)
- SDK: `@anthropic-ai/claude-agent-sdk`
- State: Zustand

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ ConfigPanel  │  │ChatInterface │  │DebugPanel    │      │
│  │              │  │              │  │ToolsPanel    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         └─────────────────┼─────────────────┘               │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │ Zustand     │                          │
│                    │ Store       │                          │
│                    └──────┬──────┘                          │
│                           │                                 │
│                    ┌──────▼──────┐                          │
│                    │ ApiClient   │                          │
│                    └──────┬──────┘                          │
└───────────────────────────┼─────────────────────────────────┘
                            │ HTTP/SSE
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Express.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ /api/agent   │  │/conversations│  │  /presets    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                 │               │
│         ▼                 ▼                 ▼               │
│  ┌─────────────────────────────────────────────┐            │
│  │     Agent SDK Integration                   │            │
│  └─────────────┬───────────────────────────────┘            │
│                │                                            │
│                ▼                                            │
│  ┌─────────────────────────────────────────────┐            │
│  │          PostgreSQL Database                │            │
│  └─────────────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Anthropic Claude API │
                └───────────────────────┘
```

**Data Flow**: User → UI Components → Zustand Store → ApiClient → Backend → Agent SDK → Claude API → Database

---

## Frontend Architecture

### Component Hierarchy

```
AgentTester (Main Container)
├── Header (Title, Preset Management)
├── ResizablePanelGroup (Two Panels)
│   ├── ConfigPanel (Left - 50% default)
│   │   ├── Model Selection
│   │   ├── SDK Configuration (Max Turns, Budget)
│   │   ├── Permission Mode
│   │   ├── System Prompt (with Presets)
│   │   ├── Hook Configuration
│   │   ├── Subagent Management
│   │   ├── ToolSelector
│   │   ├── MCP Server Config
│   │   └── Advanced Settings
│   │
│   └── ChatInterface (Right - 50% default)
│       └── Tabs
│           ├── Messages Tab
│           │   ├── Message List (User/Assistant)
│           │   ├── Streaming Indicator
│           │   └── Input Textarea
│           ├── Tools Tab → ToolsPanel
│           │   ├── History (All completed tools)
│           │   ├── Active (Running tools)
│           │   ├── Agents (Subagent hierarchy)
│           │   ├── Files (File tree browser)
│           │   └── Stats (Tool statistics)
│           └── Debug Tab → DebugPanel
│               ├── Metrics (Tokens, Cost, Latency)
│               ├── System (SDK initialization info)
│               ├── MCP (MCP server status)
│               ├── Hooks (Hook execution logs)
│               ├── Sessions (Session management)
│               └── Raw (JSON response)
```

### State Management (Zustand)

**Location**: `lib/store.ts`

**Key State Sections**:
```typescript
{
  // Configuration (30+ Agent SDK parameters)
  config: {
    model, systemPrompt, maxTurns, maxBudgetUsd,
    permissionMode, allowedTools, disallowedTools,
    workingDirectory, env, executable,
    continueSession, resumeSessionId, forkSession,
    mcpServers, customAgents, hooks, plugins, ...
  },

  // Conversation state
  messages: Message[],
  isStreaming: boolean,
  streamingMode: boolean,
  conversationId: number | null,

  // Tool execution tracking
  toolExecutions: ToolExecution[],
  activeTools: Set<string>,

  // Debug & metrics
  debugInfo: {
    latency, tokens, cost, stopReason,
    numTurns, sessionId, permissionDenials,
    toolsUsed
  },

  // Advanced tracking
  systemInfo: SystemInfo,
  hookLogs: HookLog[],
  sessionHistory: SessionHistory[],
  mcpServerStatuses: McpServerStatus[]
}
```

**Why Zustand?**
- Simpler than Redux (no boilerplate)
- No provider wrapping needed
- Built-in DevTools support
- Excellent TypeScript support
- Components directly access and update store (no prop drilling)

### Component Communication

**Pattern**: All components consume from and update the global Zustand store

```typescript
// Any component can access/update store
const { config, setConfig, messages, addMessage } = useAgentStore();
```

**Flow**:
1. ConfigPanel → Store: User changes settings → `setConfig()`
2. Store → All Components: Config updates → UI reflects changes
3. ChatInterface → ApiClient: User sends message → API call
4. Backend → ChatInterface: Stream events via SSE
5. ChatInterface → Store: Update tool executions, debug info
6. Store → ToolsPanel/DebugPanel: Reactive updates

---

## Request Flow

### What Happens When You Send a Message

**Step-by-Step**:

1. **User Input**
   - User types message in ChatInterface
   - Press Enter or click Send button

2. **ChatInterface Processing**
   - Adds user message to store: `addMessage({ role: 'user', content: text })`
   - Determines streaming vs batch mode
   - Calls ApiClient method

3. **ApiClient Request** (`lib/api-client.ts`)
   - Streaming: `ApiClient.streamAgentMessage(messages, config, conversationId, callback)`
   - Batch: `ApiClient.sendAgentMessage(messages, config, conversationId)`
   - Makes HTTP POST to `http://localhost:3001/api/agent/stream` or `/message`
   - Sends: messages array + full config object + conversation ID

4. **Backend Receives** (`backend/src/routes/agent.ts`)
   - Extracts last message as prompt
   - Calls `buildSdkOptions(config)` to convert frontend config → SDK format
   - Invokes Agent SDK: `query({ prompt, options })`

5. **Agent SDK Execution**
   - Sends request to Anthropic Claude API
   - Claude responds with text + tool use requests
   - SDK automatically executes tools (Read files, run Bash, etc.)
   - Streams events back to backend via async iteration

6. **Backend Streams Events** (Server-Sent Events)
   - `content_block_delta`: Text chunks as they generate
   - `tool_start`: Agent begins using a tool
   - `tool_progress`: Tool still running (elapsed time updates)
   - `tool_complete`: Tool finished with output
   - `system_init`: SDK initialization data
   - `hook_response`: Hook script execution result
   - `done`: Final metrics (tokens, cost, turns)
   - `error`: Execution failures

7. **Frontend Event Processing** (`chat-interface.tsx`)
   - Text deltas → Accumulate into `streamingText` state
   - Tool events → Add/update `toolExecutions` in store
   - System events → Update `systemInfo` in store
   - Done event → Commit final message, update `debugInfo`

8. **UI Reactive Updates**
   - Messages tab: Streaming text appears
   - Tools tab: Tool cards appear and update in real-time
   - Debug tab: Metrics update with token/cost data

9. **Database Logging**
   - Backend saves usage stats to `usage_logs` table
   - Updates conversation in `conversations` table
   - Includes: tokens, cost, latency, tools used, errors

---

## Agent SDK Integration

### What is Agent SDK?

The `@anthropic-ai/claude-agent-sdk` package provides **18 built-in tools** that Claude can use automatically.

**Categories**:
- **File Operations** (6): Read, Write, Edit, Glob, Grep, NotebookEdit
- **Execution** (3): Bash, BashOutput, KillShell
- **Web** (2): WebFetch, WebSearch
- **Task Management** (2): TodoWrite, Task
- **MCP Integration** (2): ListMcpResources, ReadMcpResource
- **Planning** (3): ExitPlanMode, TimeMachine, MultipleChoiceQuestion

### Core Integration Pattern

**Backend Usage** (`backend/src/routes/agent.ts`):

```typescript
import { query } from '@anthropic-ai/claude-agent-sdk';

// Convert frontend config to SDK options
const sdkOptions = buildSdkOptions(config);

// Stream events from SDK
for await (const msg of query({
  prompt: userMessage,
  options: sdkOptions
})) {
  // Handle different message types
  if (msg.type === 'stream_event') {
    // Text streaming
  } else if (msg.type === 'tool_progress') {
    // Tool execution updates
  } else if (msg.type === 'result') {
    // Final metrics and cost
  }
}
```

### Configuration Mapping

**Frontend config → SDK options** (30+ parameters):

| Frontend Field | SDK Field | Purpose |
|----------------|-----------|---------|
| `model` | `model` | Claude model version |
| `systemPrompt` | `systemPrompt` | Agent instructions |
| `maxTurns` | `maxTurns` | Multi-turn conversation limit |
| `maxBudgetUsd` | `maxBudgetUsd` | Cost limit in USD |
| `permissionMode` | `permissionMode` | Tool permission level |
| `allowedTools` | `allowedTools` | Tool whitelist |
| `disallowedTools` | `disallowedTools` | Tool blacklist |
| `workingDirectory` | `cwd` | File operation base path |
| `continueSession` | `continue` | Resume previous session |
| `mcpServers` | `mcpServers` | MCP server configs |
| `customAgents` | `agents` | Subagent definitions |
| `hooks` | `hooks` | Lifecycle event scripts |

### Tool Execution Flow

**Example**: User asks "Create a file called test.txt with 'Hello World'"

1. Claude receives prompt
2. Claude responds with text + **tool_use block**: `Write({ path: 'test.txt', content: 'Hello World' })`
3. SDK intercepts tool_use block
4. SDK executes Write tool automatically
5. SDK sends tool result back to Claude: "File created successfully"
6. Claude continues: "I've created test.txt with the content you requested"
7. Frontend receives all events and displays them

**Key Advantage**: You don't write code to execute tools - SDK handles it automatically.

---

## Real-Time Tool Tracking

### ToolsPanel - 5 Sub-tabs

#### 1. History Tab
Shows every tool used with collapsible cards:
- Tool name and status badge (running/completed/failed)
- Duration in seconds
- Input parameters (expandable JSON)
- Output results (expandable JSON)
- Special diff viewer for Edit tool (shows old_string vs new_string)
- Error messages if failed

#### 2. Active Tab
Only currently running tools:
- Elapsed time updating in real-time via `tool_progress` events
- Animated spinner indicating activity
- Auto-removes when tool completes

#### 3. Agents Tab
Subagent hierarchy visualization:
- Tree view of Task tool executions
- Parent-child relationships (nested subagents)
- Subagent type badges (code-reviewer, test-writer, etc.)
- Collapsed by default, expand to see details

#### 4. Files Tab
File tree browser:
- Shows all files accessed during execution
- Organized by directory structure
- Operation counts per file (e.g., "2x Read, 1x Write")
- Status indicators (completed/failed/running)
- Expandable directories

#### 5. Stats Tab
Aggregated tool usage analytics:
- Total uses per tool (e.g., "Read: 15 uses")
- Success rate percentage (e.g., "93% success")
- Average duration per tool
- Completed/failed/running counts
- Sortable by usage frequency

### Tool Execution Tracking

**State Structure**:
```typescript
toolExecutions: Array<{
  id: string,              // Unique tool_use_id
  toolName: string,        // 'Read', 'Write', 'Bash', etc.
  status: 'running' | 'completed' | 'failed',
  startTime: number,       // Timestamp
  endTime?: number,        // When completed/failed
  input: any,              // Tool parameters
  output?: any,            // Tool result
  error?: string,          // Error message if failed
  parentToolUseId?: string // For nested subagent tools
}>
```

**Update Flow**:
1. Backend sends `tool_start` event → Add to toolExecutions with status='running'
2. Backend sends `tool_progress` events → Update elapsed time
3. Backend sends `tool_complete` event → Update status='completed', add output
4. Frontend reactively updates ToolsPanel display

---

## Cost Tracking

### Automatic Cost Calculation

Unlike the Messages API (manual calculation), Agent SDK provides `total_cost_usd` automatically.

**How It Works**:
- Every API response includes cost in USD
- SDK calculates based on:
  - Input tokens: ~$3 per million
  - Output tokens: ~$15 per million
  - Cache reads: 90% cheaper
  - Extended thinking tokens: Different rate
- No manual pricing table needed

**Display Locations**:
- Messages tab: Cost per message
- Debug tab: Session total cost
- Debug metrics: Token breakdown (input/output/cached)

### Budget Management

**Configuration**:
```typescript
config: {
  maxBudgetUsd: 5.00  // Stop agent if cost exceeds $5
}
```

**Features**:
- Hard limit: Agent stops when exceeded
- Warnings at 80% and 90% of budget
- Visual progress bar in DebugPanel
- Accumulated cost tracking across session
- Per-turn cost breakdown

**Budget Exceeded Flow**:
1. SDK monitors cumulative cost
2. When exceeds `maxBudgetUsd`, SDK stops execution
3. Backend receives budget exceeded event
4. Frontend displays error alert
5. Conversation saved with partial results

---

## Advanced Features

### 1. Multi-turn Conversations

**Configuration**: `maxTurns: 20`

**How It Works**:
The agent can have multiple exchanges with tools:
1. Read user request
2. Use a tool (e.g., Read file)
3. See tool output
4. Use another tool (e.g., Grep for pattern)
5. See that output
6. Use another tool (e.g., Write report)
... up to 20 turns

**Use Cases**:
- Complex workflows: Search codebase → Read files → Analyze → Write report
- Iterative problem-solving: Try approach → Check result → Adjust → Retry
- Multi-step tasks: Read config → Install dependencies → Run tests → Report results

### 2. Permission Modes

**Four Modes**:

1. **default**: Prompt for every file/bash operation
   - User must approve each tool use
   - Safest mode

2. **acceptEdits**: Auto-approve file edits, prompt for bash
   - File Read/Write/Edit: Automatic
   - Bash commands: Require approval
   - Balanced safety/convenience

3. **bypassPermissions**: Approve everything automatically
   - All tools execute without prompts
   - Dangerous but fastest
   - Use with trusted prompts only

4. **plan**: Agent creates plan first, user approves
   - Agent outlines what it will do
   - User reviews and approves
   - Then agent executes
   - Best for complex operations

**Permission Denials Tracking**:
- Logged in `debugInfo.permissionDenials`
- Shows tool name, tool_use_id, input
- Displayed in DebugPanel with warning badges

### 3. Session Management

**Three Session Modes**:

1. **Continue Session** (`continueSession: true`)
   - Resume previous conversation exactly where it left off
   - Preserves full context and state
   - Use when conversation was interrupted

2. **Resume Session ID** (`resumeSessionId: 'session-abc123'`)
   - Start new conversation from previous session's state
   - Loads context but begins fresh interaction
   - Use for follow-up conversations

3. **Fork Session** (`forkSession: true`)
   - Copy session state but start new branch
   - Experiment with different approaches from same starting point
   - Use for "what if" scenarios

**Session Controls** (DebugPanel Sessions Tab):
- Copy session ID to clipboard
- Toggle "Continue" mode
- Input resume session ID
- Enable fork mode
- View session timeline
- See cumulative cost/tokens per session

### 4. Hook System

**Lifecycle Event Interception**:

Hooks allow running custom scripts when events occur.

**Hook Types**:
- `pre_tool_use`: Before tool executes (validate/block/log)
- `post_tool_use`: After tool finishes
- `on_budget_exceeded`: When cost limit hit
- `post_turn`: After each conversation turn
- `on_permission_denied`: When tool blocked
- `on_error`: When execution fails

**Hook Configuration**:
```typescript
hooks: {
  'pre_tool_use': {
    pattern: '^Bash$',  // Regex matching tool name
    action: 'warn',     // warn/block/log
    script: './hooks/bash-check.sh'  // Optional script to run
  },
  'on_budget_exceeded': {
    action: 'stop',
    script: './hooks/notify-admin.sh'
  }
}
```

**Use Cases**:
- **Safety**: Block dangerous Bash commands in production
- **Logging**: Audit trail of all file writes
- **Notifications**: Alert when budget exceeded
- **Validation**: Check tool inputs before execution
- **Integration**: Trigger external systems (CI/CD, monitoring)
- **Compliance**: Log for regulatory requirements

**Hook Execution Logs** (DebugPanel Hooks Tab):
- Hook name and event type
- stdout/stderr output
- Exit code (0 = success)
- Timestamp
- Duration

### 5. MCP Integration

**Model Context Protocol** allows connecting external data sources.

**Server Configuration**:
```typescript
mcpServers: {
  'filesystem': {
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-filesystem', '/workspace'],
    env: { 'API_KEY': 'secret' }
  },
  'database': {
    command: 'node',
    args: ['./mcp-servers/postgres-server.js']
  }
}
```

**Features**:
- Connect to databases, APIs, file systems
- `ListMcpResources` tool: List available resources
- `ReadMcpResource` tool: Read resource content
- `strictMcpConfig: true`: Fail if server connection fails
- Server status tracking in DebugPanel

**Use Cases**:
- Query company database
- Access internal APIs
- Read from external file systems
- Integrate with existing tools

### 6. Custom Subagents

**Define Specialized Agents**:

```typescript
customAgents: {
  'code-reviewer': {
    systemPrompt: 'You are a code review specialist. Check for bugs, security issues, and best practices.',
    allowedTools: ['Read', 'Grep', 'Glob'],  // Read-only
    disallowedTools: ['Write', 'Edit', 'Bash']  // No modifications
  },
  'test-writer': {
    systemPrompt: 'You write comprehensive unit tests.',
    allowedTools: ['Read', 'Write', 'Grep', 'Bash']
  },
  'doc-writer': {
    systemPrompt: 'You write clear documentation.',
    allowedTools: ['Read', 'Write', 'WebSearch']
  }
}
```

**Usage**:
Main agent spawns subagent via Task tool:
```typescript
Task({
  subagent_type: 'code-reviewer',
  description: 'Review authentication module',
  prompt: 'Analyze auth.ts for security issues'
})
```

**Pre-built Templates** (5 included):
- `code-reviewer`: Code analysis, read-only
- `test-writer`: Test generation with execution
- `doc-writer`: Documentation with web search
- `refactorer`: Code improvements with edit access
- `researcher`: Web research, file reading

**Hierarchy Tracking**:
- Agents tab shows parent-child relationships
- Nested subagents (subagent spawning subagent)
- Tool executions attributed to correct agent

---

## Database Persistence

### PostgreSQL Schema

**Three Main Tables**:

#### 1. conversations
Stores full conversation state:
```sql
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),

  -- All 30+ SDK config fields (flat columns)
  model VARCHAR(100),
  system_prompt TEXT,
  max_turns INTEGER,
  max_budget_usd DECIMAL(10,2),
  permission_mode VARCHAR(50),
  allowed_tools TEXT[],
  disallowed_tools TEXT[],
  working_directory TEXT,
  environment_vars JSONB,
  continue_session BOOLEAN,
  resume_session_id TEXT,
  fork_session BOOLEAN,
  mcp_servers JSONB,
  custom_agents JSONB,
  hooks JSONB,
  plugins JSONB,
  -- ... more config fields

  -- Conversation history
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. presets
Saved configurations:
```sql
CREATE TABLE presets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,

  -- Same config fields as conversations
  model, system_prompt, max_turns, ...

  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. usage_logs
Per-request analytics:
```sql
CREATE TABLE usage_logs (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER REFERENCES conversations(id),

  model VARCHAR(100),
  input_tokens INTEGER,
  output_tokens INTEGER,
  cache_creation_tokens INTEGER,
  cache_read_tokens INTEGER,

  cost_usd DECIMAL(10,6),
  latency_ms INTEGER,
  api_latency_ms INTEGER,

  num_turns INTEGER,
  stop_reason VARCHAR(100),
  permission_denials JSONB,
  tools_used TEXT[],

  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Why JSONB for Config/Messages?

**Advantages**:
- ✅ No schema changes needed when SDK adds new parameters
- ✅ Full conversations stored in single row
- ✅ Flexible schema (config changes frequently)
- ✅ PostgreSQL JSONB has good indexing

**Trade-offs**:
- ❌ Harder to query individual config fields
- ❌ Must keep TypeScript types in sync manually
- ❌ Requires casting for queries: `config->>'model'`

### Database Access Pattern

**Backend Routes**:
- `/api/conversations` - CRUD for conversation history
- `/api/presets` - CRUD for saved configurations
- `/api/analytics` - Query usage_logs with filters (date range, model, conversation)

**Example Queries**:
```typescript
// Save conversation
await pool.query(`
  INSERT INTO conversations (title, model, system_prompt, ..., messages)
  VALUES ($1, $2, $3, ..., $17)
`, [title, config.model, config.systemPrompt, ..., JSON.stringify(messages)]);

// Load conversation
const result = await pool.query(`
  SELECT * FROM conversations WHERE id = $1
`, [conversationId]);

// Analytics query
const stats = await pool.query(`
  SELECT
    model,
    SUM(input_tokens + output_tokens) as total_tokens,
    SUM(cost_usd) as total_cost,
    AVG(latency_ms) as avg_latency
  FROM usage_logs
  WHERE created_at >= $1
  GROUP BY model
`, [startDate]);
```

---

## Streaming vs Batch Mode

### Streaming Mode (Default)

**How It Works**:
- Uses Server-Sent Events (SSE)
- Backend sends events as they occur
- Frontend displays updates in real-time

**User Experience**:
- See text appear character-by-character
- Tool execution cards appear immediately when started
- Progress updates for long-running tools
- Feels responsive and interactive

**Technical Implementation**:
```typescript
// Backend
res.setHeader('Content-Type', 'text/event-stream');
for await (const msg of query(...)) {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}

// Frontend
const reader = response.body?.getReader();
while (true) {
  const { done, value } = await reader.read();
  // Parse and process each event
}
```

**Event Types**:
- `content_block_delta`: Text chunks
- `tool_start`: Tool begins
- `tool_progress`: Progress updates
- `tool_complete`: Tool finishes
- `done`: Final metrics

### Batch Mode

**How It Works**:
- Single HTTP POST request
- Wait for complete response
- All tools execute, then return results

**User Experience**:
- No streaming text (appears all at once)
- Tool cards appear after completion
- Simpler but less responsive

**Technical Implementation**:
```typescript
// Backend
const result = await query(...);
res.json({ message: result, usage: result.usage });

// Frontend
const response = await fetch('/api/agent/message', {
  method: 'POST',
  body: JSON.stringify({ messages, config })
});
const data = await response.json();
```

**When to Use**:
- Streaming issues (proxy blocking SSE)
- Simple requests (no long-running tools)
- Debugging (easier to inspect single response)

### Toggle

User can switch modes via checkbox in ChatInterface:
- ☑ Streaming Mode (default)
- ☐ Batch Mode

---

## Development Workflow

### Local Development Setup

**Prerequisites**:
- Node.js 20+
- Docker & Docker Compose
- Anthropic API key

**Start Services**:

1. **Backend (PostgreSQL + Express)**:
   ```bash
   docker-compose up -d
   # Starts PostgreSQL on :5432
   # Starts Express backend on :3001
   ```

2. **Frontend (Next.js)**:
   ```bash
   npm run dev
   # Starts Next.js on :3334
   ```

3. **Open Browser**:
   - Navigate to `http://localhost:3334`
   - Backend API at `http://localhost:3001/api`

### Environment Configuration

**Frontend** (`.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

**Backend** (`backend/.env`):
```bash
DATABASE_URL=postgresql://agent_user:agent_pass@postgres:5432/agent_db
ANTHROPIC_API_KEY=sk-ant-your-key-here
NODE_ENV=development
PORT=3001
```

### File Structure

```
/jigger
├── app/                       # Next.js app directory
│   ├── page.tsx              # Main page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Global styles
├── components/               # React components
│   ├── agent-tester.tsx      # Main container (resizable panels)
│   ├── config-panel.tsx      # Left panel (configuration)
│   ├── chat-interface.tsx    # Right panel (chat + tabs)
│   ├── tools-panel.tsx       # Tools tab content
│   ├── debug-panel.tsx       # Debug tab content
│   ├── tool-selector.tsx     # Tool enable/disable UI
│   └── ui/                   # shadcn components
├── lib/                      # Utilities
│   ├── store.ts              # Zustand global state
│   ├── api-client.ts         # Backend API wrapper
│   ├── types.ts              # TypeScript interfaces (40+)
│   ├── utils.ts              # Helper functions
│   └── hook-templates.ts     # Pre-built hook configs
├── backend/                  # Express backend
│   ├── src/
│   │   ├── server.ts         # Main server entry
│   │   └── routes/
│   │       ├── agent.ts      # Agent SDK integration
│   │       ├── conversations.ts  # Conversation CRUD
│   │       ├── presets.ts    # Preset CRUD
│   │       └── analytics.ts  # Usage analytics
│   ├── db/
│   │   ├── client.ts         # PostgreSQL connection pool
│   │   └── schema.sql        # Database schema
│   ├── package.json
│   └── tsconfig.json
├── workspace/                # Agent SDK workspace volume
├── public/                   # Static assets
├── docker-compose.yml        # Service orchestration
├── package.json
├── tsconfig.json
├── README.md                 # User-facing documentation
├── CLAUDE.md                 # Claude Code instructions
└── outline.md                # This file
```

### Development Commands

**Frontend**:
```bash
npm run dev          # Next.js dev server (:3334)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint checks
```

**Backend**:
```bash
cd backend
npm run dev          # ts-node execution
npm run watch        # Auto-reload (ts-node-dev)
npm run build        # Compile to dist/
npm run start        # Run compiled JavaScript
```

**Docker**:
```bash
docker-compose up -d              # Start services
docker-compose logs -f backend    # View backend logs
docker-compose logs -f postgres   # View database logs
docker-compose down               # Stop services
docker-compose down -v            # Stop + delete volumes (reset DB)
```

**Database**:
```bash
# Connect to PostgreSQL
docker exec -it jigger-postgres-1 psql -U agent_user -d agent_db

# Run queries
SELECT * FROM conversations;
SELECT * FROM usage_logs ORDER BY created_at DESC LIMIT 10;

# Reset database
docker-compose down -v && docker-compose up -d
```

### Debugging Tools

**Frontend**:
- Browser DevTools → Network tab for SSE streams
- React DevTools for component tree
- Zustand DevTools for state inspection
- Console logs for event processing

**Backend**:
```bash
# Filter logs
docker-compose logs -f backend | grep "Tool"     # Tool executions
docker-compose logs -f backend | grep "ERROR"    # Errors
docker-compose logs -f backend | grep "cost"     # Cost tracking

# Watch database
watch -n 1 'docker exec jigger-postgres-1 psql -U agent_user -d agent_db -c "SELECT COUNT(*) FROM usage_logs"'
```

**DebugPanel Tabs**:
- **Raw**: Full JSON response inspection
- **Metrics**: Token/cost breakdown with charts
- **System**: SDK initialization details (tools, cwd, model)
- **Hooks**: Script execution stdout/stderr
- **Sessions**: Session ID management and controls
- **MCP**: MCP server connection status

---

## Key Innovations

### 1. Real-Time Tool Tracking

**Problem**: Most chat UIs only show final responses. Users don't know what the agent is doing.

**Solution**: Jigger shows **every tool execution** as it happens:
- Which files are being read
- What bash commands are running
- What websites are being fetched
- How long each operation takes

**Impact**: Makes debugging agent behavior much easier. Users can see exactly where things go wrong.

### 2. Visual Diff Viewer for Edits

**Problem**: File edits are hard to understand from text descriptions.

**Solution**: Custom diff viewer for Edit tool:
- Shows old_string (red) vs new_string (green)
- Side-by-side comparison
- Context around the change

**Impact**: Users immediately understand what changed in their files.

### 3. Hierarchical Subagent Tracking

**Problem**: When agents spawn subagents, it's hard to track who did what.

**Solution**: Agents tab with tree view:
- Parent agent at root
- Subagents indented below
- Tool executions attributed correctly
- Collapse/expand branches

**Impact**: Complex multi-agent workflows become comprehensible.

### 4. File Tree Visualization

**Problem**: Agents access many files. Hard to see patterns.

**Solution**: Files tab builds tree structure:
- Directories expandable
- Operation counts per file
- Status indicators
- Mimics file explorer UI

**Impact**: Users see agent's "workspace" visually.

### 5. Comprehensive Debug Metrics

**Problem**: Need to understand performance, costs, and errors.

**Solution**: Multi-tab DebugPanel:
- Metrics: Tokens, cost, latency
- System: Tools, cwd, model info
- Hooks: Script execution logs
- Sessions: Session management
- MCP: Server statuses
- Raw: Full JSON inspection

**Impact**: All debugging info in one organized interface.

### 6. Session Continuity

**Problem**: Long conversations need multiple sessions. Context gets lost.

**Solution**: Three session modes:
- Continue: Resume exactly where left off
- Resume: Start fresh from previous state
- Fork: Branch from previous state

**Impact**: Users can have long-running agent workflows spanning days.

### 7. Budget Safeguards

**Problem**: Agent tools can run expensive operations. Costs can spiral.

**Solution**: Built-in budget management:
- Set `maxBudgetUsd` limit
- Real-time cost tracking
- Warnings at 80%/90%
- Automatic stop when exceeded
- Visual progress bar

**Impact**: Users never accidentally spend more than intended.

### 8. Hook System for Customization

**Problem**: Every team has different requirements (logging, validation, compliance).

**Solution**: Lifecycle hooks with custom scripts:
- Pre/post tool execution
- Budget events
- Permission events
- Error events

**Impact**: Jigger adapts to any workflow without code changes.

### 9. Type-Safe Configuration

**Problem**: Agent SDK has 30+ parameters. Easy to misconfigure.

**Solution**: Full TypeScript typing:
- 40+ interfaces in `lib/types.ts`
- Compile-time validation
- IDE autocomplete
- Runtime type checking with Zod

**Impact**: Configuration errors caught before runtime.

### 10. Preset System

**Problem**: Switching between common configurations is tedious.

**Solution**: Save/load presets:
- Store in database
- One-click apply
- Shareable between users
- Pre-built templates included

**Impact**: Users can quickly test different agent configurations.

---

## Comparison: Why Agent SDK?

Your app used to support both Messages API and Agent SDK. Now exclusively Agent SDK because:

| Feature | Messages API | Agent SDK |
|---------|--------------|-----------|
| **Tool Implementation** | Manual (define schemas) | 18 built-in tools |
| **Tool Execution** | Manual (handle tool_use blocks) | Automatic |
| **Cost Calculation** | Manual (hardcoded pricing) | Automatic (`total_cost_usd`) |
| **Multi-turn** | Manual orchestration | Automatic via `maxTurns` |
| **File Operations** | Code yourself | Read/Write/Edit/Glob/Grep built-in |
| **Bash Execution** | Code yourself | Bash/BashOutput/KillShell built-in |
| **Web Access** | Code yourself | WebFetch/WebSearch built-in |
| **Subagents** | Code yourself | Task tool with custom agents |
| **Session Management** | Manual | continue/resume/fork built-in |
| **Workspace Isolation** | Manual | `/app/workspace` automatic |
| **Permission System** | Manual | 4 modes built-in |
| **MCP Integration** | Manual | ListMcpResources/ReadMcpResource |
| **Budget Limits** | Manual | `maxBudgetUsd` built-in |

**Advantage**: Agent SDK dramatically reduces backend complexity while adding powerful features.

---

## Summary

**Jigger is a visual debugger for the Claude Agent SDK**. It provides:

✅ **Configuration UI**: 30+ Agent SDK parameters with presets
✅ **Real-Time Execution**: See exactly what agents are doing
✅ **Tool Tracking**: 5-tab tool panel (History, Active, Agents, Files, Stats)
✅ **Debug Metrics**: Tokens, cost, latency, errors
✅ **Advanced Features**: Multi-turn, permissions, sessions, hooks, MCP, subagents
✅ **Persistence**: PostgreSQL database for conversations and analytics
✅ **Type Safety**: Comprehensive TypeScript types throughout
✅ **Developer Experience**: Intuitive UI with collapsible panels and tabs

**Architecture Highlights**:
- Zustand for simple global state (no prop drilling)
- Server-Sent Events for real-time streaming
- Agent SDK for automatic tool execution
- PostgreSQL with JSONB for flexible persistence
- Docker for isolated backend environment

**Perfect For**:
- Testing different Agent SDK configurations
- Debugging agent behavior and tool usage
- Understanding agent costs and performance
- Prototyping AI agent workflows
- Learning how Agent SDK works

The application serves as both a **practical tool** (test agent configurations) and a **reference implementation** (how to integrate Agent SDK in a web app).

---

## Next Steps

To extend Jigger:

1. **Add New Tools**: Add to `ALL_SDK_TOOLS` in `types.ts`
2. **Add Config Parameters**: Update `AgentSDKConfig` interface and `buildSdkOptions()`
3. **Add Hook Templates**: Extend `HOOK_TEMPLATES` array
4. **Add Subagent Templates**: Extend `SUBAGENT_TEMPLATES` array
5. **Add Analytics Queries**: Create new routes in `backend/src/routes/analytics.ts`
6. **Add Database Tables**: Update `schema.sql` and add routes

All architecture patterns are established and extensible.

---

**End of Outline**
