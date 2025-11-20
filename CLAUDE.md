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
- **MCP Servers**: Connect external Model Context Protocol servers (GitHub, Notion, Playwright, etc.)
- **Skills System**: Packaged agent workflows loaded from `.claude/skills/`
- **Custom Agents**: Define specialized sub-agents with their own prompts and tools
- **Hooks**: Event-driven automation (git commits, notifications, webhooks)
- **Presets**: Save and load complete agent configurations
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

The application uses a **two-panel resizable layout** implemented in `components/agent-tester.tsx`:

#### Left Panel: Configuration (`components/config-panel.tsx`)

This panel contains collapsible sections for comprehensive agent configuration:

1. **Basic Agent Settings**
   - Model selection (Sonnet, Opus, Haiku)
   - Temperature slider (0.0 - 1.0)
   - Max turns configuration
   - System prompt editor

2. **Tool Selection** (`components/tool-selector.tsx`)
   - 19 built-in Agent SDK tools organized by category:
     - **File Operations**: Read, Write, Edit, Glob, Grep
     - **Execution**: Bash, BashOutput, KillShell
     - **Web**: WebFetch, WebSearch
     - **Planning & Interaction**: TodoWrite, Task, AskUserQuestion, ExitPlanMode
     - **Agent System**: Skill, SlashCommand
   - Visual checkboxes for enabling/disabling tools
   - Stored in `config.allowedTools` array

3. **MCP Servers Configuration**
   - Add/edit/remove external MCP servers
   - Configure command, args, and environment variables
   - Preconfigured servers available (GitHub, Notion, Playwright, etc.)

4. **Skills Configuration** (`components/skills-manager.tsx`)
   - List discovered skills from `.claude/skills/`
   - Create new skills with wizard
   - Edit existing SKILL.md files
   - Delete skills
   - View skill descriptions and content

5. **Custom Agents (Subagents)**
   - Define specialized agents with specific prompts
   - Configure allowed tools per agent
   - Set model and temperature overrides
   - Templates: Code Reviewer, Bug Hunter, Documentation Writer, etc.

6. **Hooks Configuration**
   - Event-driven automation setup
   - Trigger types: on-prompt-submit, on-response-complete, on-tool-use, on-error
   - Action types: bash, api-call, notification, custom
   - Pre-built templates (Git Auto-Commit, Slack Notifications, etc.)

7. **Advanced Settings**
   - Working directory and allowed directories
   - Thinking budget configuration
   - Cache control settings
   - Sandbox controls
   - 30+ additional Agent SDK parameters

8. **Presets Management**
   - Save current configuration as preset
   - Load saved presets
   - Delete presets
   - Share configurations

#### Right Panel: Chat & Debug (`components/chat-interface.tsx`)

Tabbed interface with two main views:

1. **Chat Tab**
   - Message history display
   - Real-time streaming responses
   - Tool execution visualization
   - User input area
   - Message formatting with markdown support

2. **Debug Tab** (`components/debug-panel.tsx`)
   - Token usage breakdown (input, output, cached)
   - Cost calculation per message
   - API latency metrics
   - Cache performance statistics
   - Raw API responses (JSON formatted)
   - Tool execution timeline
   - Request/response headers

### State Management with Zustand

**The Zustand store (`lib/store.ts`) is the single source of truth for all application state.**

#### Store Structure

```typescript
interface StoreState {
  // Agent Configuration
  config: AgentSDKConfig;           // Complete agent configuration
  setConfig: (config: AgentSDKConfig) => void;

  // Conversation State
  messages: Message[];              // Full message history
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;

  // Streaming State
  isStreaming: boolean;
  streamingMode: boolean;           // User preference for streaming
  streamingText: string;            // Accumulating text during stream
  setIsStreaming: (streaming: boolean) => void;
  setStreamingMode: (mode: boolean) => void;
  setStreamingText: (text: string) => void;

  // Debug Information
  debugInfo: DebugInfo | null;      // Latest API response metrics
  setDebugInfo: (info: DebugInfo) => void;

  // Persistence
  conversationId: string | null;    // Current conversation ID
  setConversationId: (id: string | null) => void;

  // Skills
  availableSkills: SkillMetadata[]; // Discovered skills
  setAvailableSkills: (skills: SkillMetadata[]) => void;
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
import { useStore } from '@/lib/store';

function MyComponent() {
  const config = useStore((state) => state.config);
  const setConfig = useStore((state) => state.setConfig);
  // Component automatically re-renders when config changes
}
```

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
   - Payload constructed: `{ message: userInput, config: storeConfig }`
   - Request sent to backend: `POST /api/agent/stream`

4. **Backend Processing**
   - Express route handler in `backend/src/routes/agent.ts`
   - Config transformed via `buildSdkOptions()`
   - Agent SDK `query()` function invoked with async iteration
   - Agent SDK executes with configured tools

5. **Streaming Response**
   - Backend wraps each event in SSE format: `data: {JSON}\n\n`
   - Events streamed: `text`, `tool_use`, `thinking`, `done`, `error`
   - Frontend `ReadableStream` parses each event
   - Callback invoked for each chunk

6. **Frontend Update**
   - Text chunks accumulated in `streamingText` state
   - Tool use events displayed in real-time
   - UI updates reactively as text streams in

7. **Completion**
   - On `done` event, full message committed to store
   - `isStreaming` set to `false`
   - `debugInfo` updated with metrics (tokens, cost, timing)
   - Debug panel reactively displays new metrics

8. **Persistence**
   - If `conversationId` exists, conversation auto-saved to database
   - Database stores: config (JSONB), messages (JSONB), metadata
   - Usage metrics logged to `usage_logs` table

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

**`agents.ts`** - Custom agent management (future):
- CRUD operations for custom agent definitions
- Stored in `.claude/agents/*.json`

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

**`schema.sql`** - Database schema (auto-initialized on first run):

```sql
-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config JSONB NOT NULL,           -- Full agent configuration
  messages JSONB NOT NULL,          -- Array of messages
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Presets table
CREATE TABLE presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB NOT NULL,           -- Saved configuration
  created_at TIMESTAMP DEFAULT NOW()
);

-- Usage logs table
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  model VARCHAR(50),
  input_tokens INTEGER,
  output_tokens INTEGER,
  cached_tokens INTEGER,
  cost DECIMAL(10, 6),
  latency_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX idx_usage_logs_created ON usage_logs(created_at DESC);
CREATE INDEX idx_usage_logs_conversation ON usage_logs(conversation_id);
```

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

### Skills System

**Skills** are packaged agent workflows that extend Claude with specialized capabilities. They provide reusable, step-by-step instructions for specific tasks.

#### How Skills Work

1. **Discovery**: Skills are automatically discovered from `.claude/skills/` directory
2. **Configuration**: Loaded via `settingSources: ['project']` in agent config
3. **Matching**: When a user request matches a skill's description, Claude can invoke it
4. **Execution**: The skill provides detailed instructions that guide the agent through the task

#### Skill File Structure

Each skill is a directory containing a `SKILL.md` file:

```
.claude/skills/
├── example-pdf-processing/
│   └── SKILL.md
├── example-code-review/
│   └── SKILL.md
├── example-data-transform/
│   └── SKILL.md
└── README.md
```

#### SKILL.md Format

```markdown
---
description: Brief description of when to use this skill (shown to user)
---

# Skill Name

## When to Use
- Specific trigger phrases or scenarios
- Use cases this skill handles

## Prerequisites
- Required tools (e.g., Read, Write, Bash)
- External dependencies if any

## Workflow
1. Detailed step one
2. Detailed step two
3. ...

## Expected Output
What the skill produces when complete

## Error Handling
Common issues and how to resolve them
```

#### Creating Skills

**Option 1: Skills Manager UI**
1. Open Config Panel → Skills Configuration
2. Click "Create Skill"
3. Fill in wizard (name, description, workflow steps)
4. Save (automatically creates `.claude/skills/skill-name/SKILL.md`)

**Option 2: Manual Creation**
```bash
mkdir -p .claude/skills/my-custom-skill
cat > .claude/skills/my-custom-skill/SKILL.md << 'EOF'
---
description: Convert CSV files to JSON format with validation
---

# CSV to JSON Converter

## When to Use
- User asks to convert CSV to JSON
- Data transformation tasks

## Prerequisites
- Read tool (to read CSV files)
- Write tool (to write JSON files)

## Workflow
1. Use Read tool to load CSV file
2. Parse CSV headers and data rows
3. Validate data types
4. Convert to JSON array of objects
5. Use Write tool to save JSON file
6. Confirm conversion with user

## Expected Output
- Valid JSON file with same data as CSV
- Confirmation message with row count
EOF
```

#### Built-in Example Skills

**example-pdf-processing**:
- Extracts text and metadata from PDF documents
- Tools: Read, Bash
- Use case: PDF analysis and content extraction

**example-code-review**:
- Comprehensive code review with security checks
- Tools: Read, Glob, Grep
- Use case: Pull request reviews, code audits

**example-data-transform**:
- Convert between JSON, CSV, XML, YAML formats
- Tools: Read, Write
- Use case: Data format migrations

#### Skills API

**Backend endpoints** (`backend/src/routes/skills.ts`):

```typescript
// List all discovered skills
GET /api/skills
Response: { skills: SkillMetadata[] }

// Get specific skill content
GET /api/skills/:name
Response: { skill: SkillMetadata }

// Create new skill
POST /api/skills
Body: { name: string, description: string, content: string }

// Update existing skill
PUT /api/skills/:name
Body: { description?: string, content?: string }

// Delete skill
DELETE /api/skills/:name
```

#### Skills in Agent Config

```typescript
config: {
  settingSources: ['project'],  // Load from .claude/skills/
  allowedTools: ['Skill'],       // Enable Skill tool
  // ... other config
}
```

**State management**:
- Discovered skills stored in: `availableSkills: SkillMetadata[]` (Zustand)
- Loaded on app startup
- Refreshed when skills are created/edited/deleted
- Passed to Agent SDK via `settingSources`

**See `.claude/skills/README.md` for comprehensive documentation.**

### MCP (Model Context Protocol) Servers

**MCP servers** extend Claude's capabilities by connecting external tools and data sources. Think of them as plugins for AI agents.

#### What is MCP?

MCP is an open protocol that allows Claude to interact with external systems through standardized tool interfaces. Each MCP server provides a set of tools that the agent can use.

**Official spec**: https://modelcontextprotocol.io/

#### Preconfigured MCP Servers

The application includes preconfigured servers for common use cases:

**Playwright** (`@modelcontextprotocol/server-playwright`):
- Browser automation and web testing
- Tools: navigate, click, type, screenshot, evaluate JavaScript
- Use case: Automated testing, web scraping, UI interaction

**Fetch** (`@modelcontextprotocol/server-fetch`):
- HTTP requests and web content retrieval
- Tools: GET/POST/PUT/DELETE requests, header management
- Use case: API testing, content fetching

**Filesystem** (`@modelcontextprotocol/server-filesystem`):
- Advanced file system operations
- Tools: create, read, update, delete files and directories
- Use case: File management beyond basic SDK tools

**GitHub** (`@modelcontextprotocol/server-github`):
- Repository management and operations
- Tools: create repos, PRs, issues, commits, branches
- Use case: Git workflow automation
- **Requires**: `GITHUB_PERSONAL_ACCESS_TOKEN` environment variable

**Git** (`@modelcontextprotocol/server-git`):
- Version control operations
- Tools: commit, push, pull, branch, merge
- Use case: Local git operations

**Notion** (`@modelcontextprotocol/server-notion`):
- Workspace integration
- Tools: create/update pages, databases, blocks
- Use case: Documentation, knowledge management
- **Requires**: `NOTION_API_KEY` environment variable

**Time** (`@modelcontextprotocol/server-time`):
- Timezone and date operations
- Tools: convert times, calculate durations, format dates
- Use case: Time-sensitive scheduling

**Memory** (`@modelcontextprotocol/server-memory`):
- Persistent knowledge graphs
- Tools: store/retrieve/query facts and relationships
- Use case: Long-term memory, knowledge retention

**Sequential Thinking** (`@modelcontextprotocol/server-sequentialthinking`):
- Chain-of-thought reasoning
- Tools: structured problem-solving workflows
- Use case: Complex reasoning tasks

#### MCP Configuration Format

```typescript
interface McpServerConfig {
  command: string;              // Command to execute (e.g., "npx")
  args: string[];               // Command arguments
  env?: Record<string, string>; // Environment variables
}

// In agent config:
config: {
  mcpServers: {
    "server-name": {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: "ghp_..."
      }
    }
  }
}
```

#### Adding Custom MCP Servers

**Via UI** (Config Panel → MCP Servers):
1. Click "Add MCP Server"
2. Enter server name (e.g., "slack")
3. Configure command: `npx`
4. Add args: `["-y", "@modelcontextprotocol/server-slack"]`
5. Set environment variables if needed
6. Save configuration

**Programmatically**:
```typescript
const config = useStore((state) => state.config);
const setConfig = useStore((state) => state.setConfig);

setConfig({
  ...config,
  mcpServers: {
    ...config.mcpServers,
    "custom-server": {
      command: "node",
      args: ["/path/to/server.js"],
      env: {
        API_KEY: "your-key"
      }
    }
  }
});
```

#### How MCP Servers Work

1. **Initialization**: When agent starts, backend spawns MCP server processes
2. **Tool Discovery**: Agent SDK queries each server for available tools
3. **Execution**: When agent uses a tool, request routed to appropriate MCP server
4. **Response**: Server executes tool and returns result to agent
5. **Cleanup**: Servers shut down when agent session ends

#### Finding MCP Servers

**Official servers**: https://github.com/modelcontextprotocol/servers
- Browse community-maintained servers
- Each server has README with tool documentation

**npm search**: `npm search @modelcontextprotocol/server-`
- Discover third-party servers

**Build your own**: https://modelcontextprotocol.io/docs
- Create custom MCP servers for proprietary tools
- Publish to npm for sharing

#### MCP State Management

- **Zustand store**: `config.mcpServers`
- **Persistence**: Saved with conversation in database
- **Backend**: Passed to Agent SDK via `buildSdkOptions()`
- **Process management**: Backend handles server lifecycle

### Custom Agents (Subagents)

**Custom agents** are specialized AI agents that can be invoked by the main agent via the `Task` tool. They act as domain experts for specific types of work.

#### Concept

The main agent can delegate work to specialized sub-agents, each configured with:
- Specific expertise (via system prompt)
- Limited tool access (for security/focus)
- Custom model/temperature settings
- Max turn limits

**Example**: Main agent working on a project might invoke a "code-reviewer" sub-agent to analyze code quality.

#### Agent Definition Structure

```typescript
interface AgentDefinition {
  name: string;                  // Unique identifier
  systemPrompt: string;          // Defines agent's expertise
  allowedTools: string[];        // Subset of main agent's tools
  model?: string;                // Override model (e.g., "haiku" for speed)
  temperature?: number;          // Override temperature
  maxTurns?: number;             // Limit conversation length
  description?: string;          // User-facing description
}
```

#### Built-in Agent Templates

**Code Reviewer**:
```typescript
{
  name: "code-reviewer",
  systemPrompt: "You are an expert code reviewer. Analyze code for:\n- Best practices\n- Security vulnerabilities\n- Performance issues\n- Code style consistency\n- Potential bugs\nProvide actionable, specific feedback.",
  allowedTools: ["Read", "Glob", "Grep"],
  temperature: 0.3,  // Lower for consistent analysis
  description: "Reviews code for quality, security, and best practices"
}
```

**Documentation Writer**:
```typescript
{
  name: "doc-writer",
  systemPrompt: "You are a technical documentation expert. Write clear, comprehensive documentation that:\n- Explains concepts simply\n- Provides code examples\n- Includes usage instructions\n- Follows documentation best practices",
  allowedTools: ["Read", "Write", "Glob"],
  temperature: 0.7,  // Higher for creative writing
  description: "Creates clear, comprehensive technical documentation"
}
```

**Bug Hunter**:
```typescript
{
  name: "bug-hunter",
  systemPrompt: "You are a debugging specialist. Analyze code to:\n- Identify bugs and edge cases\n- Trace error sources\n- Suggest fixes\n- Explain root causes",
  allowedTools: ["Read", "Grep", "Bash"],
  temperature: 0.2,  // Very focused analysis
  description: "Finds and diagnoses bugs in code"
}
```

**Refactorer**:
```typescript
{
  name: "refactorer",
  systemPrompt: "You are a code refactoring expert. Improve code by:\n- Reducing duplication\n- Improving readability\n- Optimizing performance\n- Modernizing patterns\nMaintain functionality while improving structure.",
  allowedTools: ["Read", "Edit", "Glob"],
  temperature: 0.4,
  description: "Refactors code for better structure and maintainability"
}
```

**Test Generator**:
```typescript
{
  name: "test-generator",
  systemPrompt: "You are a testing specialist. Create comprehensive test suites:\n- Unit tests\n- Integration tests\n- Edge cases\n- Mocking strategies\nFollow testing best practices for the language/framework.",
  allowedTools: ["Read", "Write", "Bash"],
  temperature: 0.5,
  description: "Generates comprehensive test suites"
}
```

#### Creating Custom Agents

**Via UI** (Config Panel → Custom Agents):
1. Click "Create Agent" or "Use Template"
2. Fill in form:
   - **Name**: Unique identifier (e.g., "api-designer")
   - **System Prompt**: Define agent's expertise and behavior
   - **Allowed Tools**: Select from available tools
   - **Model**: Override if needed (e.g., Haiku for speed)
   - **Temperature**: Adjust creativity level
   - **Description**: User-facing summary
3. Save (stores to `.claude/agents/agent-name.json`)

**Via API**:
```typescript
POST /api/agents
{
  "name": "api-designer",
  "systemPrompt": "You are an API design expert...",
  "allowedTools": ["Read", "Write"],
  "model": "sonnet",
  "temperature": 0.6,
  "description": "Designs RESTful APIs with best practices"
}
```

#### Invoking Custom Agents

The main agent uses the `Task` tool to delegate to custom agents:

```
User: "Review the authentication code in src/auth/"

Main Agent: I'll use the code-reviewer agent to analyze this.
[Uses Task tool with subagent: "code-reviewer"]

Code Reviewer Agent:
[Reads files in src/auth/]
[Analyzes code]
[Returns detailed review]

Main Agent: [Presents code review results to user]
```

**Programmatic invocation**:
```typescript
// In agent SDK config
config: {
  customAgents: {
    "code-reviewer": {
      systemPrompt: "...",
      allowedTools: ["Read", "Glob", "Grep"]
    }
  }
}

// Agent uses Task tool
"Use the code-reviewer agent to analyze src/auth/"
```

#### Agent File Storage

```
.claude/agents/
├── code-reviewer.json
├── bug-hunter.json
├── doc-writer.json
├── refactorer.json
├── test-generator.json
└── custom-agent.json
```

#### Custom Agent State

- **Zustand**: `config.customAgents`
- **File system**: `.claude/agents/*.json`
- **Backend API**: `/api/agents` (CRUD operations)
- **Agent SDK**: Passed via `customAgents` parameter

#### Best Practices

**When to create custom agents:**
- Specialized domain expertise needed
- Want to limit tool access for security
- Need different model/temperature for specific tasks
- Delegation simplifies complex workflows

**Tips:**
- Keep system prompts focused and specific
- Limit tools to what's needed (principle of least privilege)
- Use lower temperature for analytical tasks (code review, debugging)
- Use higher temperature for creative tasks (documentation, ideation)
- Test agents thoroughly before relying on them

### Hooks System

**Hooks** enable event-driven automation. Configure the agent to automatically perform actions in response to specific events during execution.

#### Hook Architecture

```typescript
interface HookConfig {
  name: string;                // Human-readable name
  trigger: TriggerType;        // When to execute
  action: HookAction;          // What to do
  enabled: boolean;            // Enable/disable without deleting
  conditions?: Condition[];    // Optional: only run if conditions met
}

type TriggerType =
  | 'on-prompt-submit'        // Before sending message to agent
  | 'on-response-complete'    // After agent finishes responding
  | 'on-tool-use'             // When agent uses a tool
  | 'on-error';               // When an error occurs

interface HookAction {
  type: 'bash' | 'api-call' | 'notification' | 'custom';
  config: Record<string, any>;  // Action-specific configuration
}
```

#### Trigger Events

**on-prompt-submit**:
- Fires: Before user message sent to agent
- Use cases: Pre-processing, backups, logging
- Example: Create timestamped backup before AI makes changes

**on-response-complete**:
- Fires: After agent completes response
- Use cases: Post-processing, notifications, summaries
- Example: Send Slack notification with response summary

**on-tool-use**:
- Fires: When agent uses any tool (or specific tools)
- Use cases: Automation based on tool usage
- Example: Auto-commit when Write or Edit tools used
- Available data: Tool name, tool arguments, tool result

**on-error**:
- Fires: When errors occur (network, API, tool execution)
- Use cases: Error monitoring, alerting, recovery
- Example: Log errors to external monitoring service

#### Pre-built Hook Templates

Located in `lib/hook-templates.ts`:

**1. Git Auto-Commit**:
```typescript
{
  name: "Git Auto-Commit",
  trigger: "on-tool-use",
  action: {
    type: "bash",
    config: {
      command: "git add {{file}} && git commit -m 'AI: {{description}}'",
      toolFilter: ["Write", "Edit"]  // Only for these tools
    }
  },
  enabled: true
}
```
- Automatically commits file changes
- AI generates commit message based on changes
- Only triggers for Write/Edit tools

**2. Slack Notifications**:
```typescript
{
  name: "Slack Notifications",
  trigger: "on-response-complete",
  action: {
    type: "api-call",
    config: {
      url: "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: {
        text: "Agent completed task: {{summary}}",
        username: "Rigger Bot",
        icon_emoji: ":robot_face:"
      }
    }
  },
  enabled: true
}
```
- Sends notification when agent completes
- Includes response summary
- Customizable message format

**3. Error Logging**:
```typescript
{
  name: "Error Logging",
  trigger: "on-error",
  action: {
    type: "api-call",
    config: {
      url: "https://api.sentry.io/YOUR/PROJECT/ID",
      method: "POST",
      headers: {
        "Authorization": "Bearer {{SENTRY_TOKEN}}",
        "Content-Type": "application/json"
      },
      body: {
        message: "{{error.message}}",
        level: "error",
        tags: {
          source: "rigger",
          conversation_id: "{{conversation_id}}"
        },
        extra: {
          stack: "{{error.stack}}",
          context: "{{error.context}}"
        }
      }
    }
  },
  enabled: true
}
```
- Logs errors to external monitoring
- Includes full error context
- Helps track issues in production

**4. Code Formatting**:
```typescript
{
  name: "Auto-Format Code",
  trigger: "on-tool-use",
  action: {
    type: "bash",
    config: {
      command: "prettier --write {{file}} || eslint --fix {{file}}",
      toolFilter: ["Write"],
      fileFilter: "\\.(js|ts|jsx|tsx)$"  // Only for JS/TS files
    }
  },
  enabled: true
}
```
- Automatically formats created files
- Runs prettier/eslint on write
- Only for JavaScript/TypeScript files

**5. Backup Creation**:
```typescript
{
  name: "Create Backup",
  trigger: "on-prompt-submit",
  action: {
    type: "bash",
    config: {
      command: "tar -czf backups/backup-$(date +%Y%m%d-%H%M%S).tar.gz .",
      workingDirectory: "{{project_root}}"
    }
  },
  enabled: true
}
```
- Creates timestamped backup before each request
- Stores in backups/ directory
- Useful for experiments with AI changes

**6. API Webhooks**:
```typescript
{
  name: "Custom Webhook",
  trigger: "on-response-complete",
  action: {
    type: "api-call",
    config: {
      url: "https://your-api.com/webhooks/agent",
      method: "POST",
      body: {
        event: "response_complete",
        data: {
          tokens: "{{debug.tokens}}",
          cost: "{{debug.cost}}",
          duration: "{{debug.latency}}",
          summary: "{{summary}}"
        }
      }
    }
  },
  enabled: true
}
```
- POST event data to your API
- Include metrics and summaries
- Integrate with existing systems

#### Creating Custom Hooks

**Via UI** (Config Panel → Hooks):
1. Click "Add Hook" or "Use Template"
2. Configure:
   - **Name**: Descriptive name
   - **Trigger**: Select event type
   - **Action Type**: bash, api-call, notification, or custom
   - **Action Config**: Specific to action type
   - **Conditions**: Optional filters
3. Test hook execution
4. Enable and save

**Programmatically**:
```typescript
const config = useStore((state) => state.config);
const setConfig = useStore((state) => state.setConfig);

setConfig({
  ...config,
  hooks: [
    ...config.hooks,
    {
      name: "Log to File",
      trigger: "on-tool-use",
      action: {
        type: "bash",
        config: {
          command: "echo '$(date): {{tool}} used' >> tool-usage.log",
          toolFilter: ["Write", "Edit", "Bash"]
        }
      },
      enabled: true
    }
  ]
});
```

#### Variable Interpolation

Hooks support template variables that are replaced at execution time:

```typescript
// Available in all hooks:
{{conversation_id}}   // Current conversation ID
{{timestamp}}         // ISO timestamp
{{user_message}}      // Latest user message

// on-tool-use specific:
{{tool}}              // Tool name (e.g., "Write")
{{file}}              // File path (for file operations)
{{description}}       // AI-generated description of action

// on-response-complete specific:
{{summary}}           // Response summary
{{debug.tokens}}      // Token count
{{debug.cost}}        // Request cost
{{debug.latency}}     // Response time

// on-error specific:
{{error.message}}     // Error message
{{error.stack}}       // Stack trace
{{error.context}}     // Additional context
```

#### Hook Execution Flow

```
Event occurs (e.g., tool use)
  ↓
Filter hooks by trigger type
  ↓
Check conditions (if any)
  ↓
Execute enabled hooks in parallel
  ↓
Interpolate variables
  ↓
Execute action (bash, API call, etc.)
  ↓
Log results
  ↓
Continue normal flow (hooks don't block)
```

**Error handling:**
- Hook failures don't stop agent execution
- Errors logged to backend logs
- Failed hooks can be debugged via logs

#### Hook State Management

- **Zustand**: `config.hooks` array
- **Persistence**: Saved with conversation
- **Execution**: Backend `backend/src/hooks/executor.ts`
- **Logging**: Hook execution results logged

#### Backend Implementation

Hooks are executed by `backend/src/hooks/executor.ts`:

```typescript
export async function executeHooks(
  trigger: TriggerType,
  context: HookContext
) {
  const matchingHooks = hooks.filter(
    h => h.enabled && h.trigger === trigger
  );

  await Promise.all(
    matchingHooks.map(hook => executeHook(hook, context))
  );
}

async function executeHook(hook: HookConfig, context: HookContext) {
  // Interpolate variables
  const config = interpolateVariables(hook.action.config, context);

  switch (hook.action.type) {
    case 'bash':
      return execBashCommand(config.command);
    case 'api-call':
      return makeHttpRequest(config);
    case 'notification':
      return sendNotification(config);
    // ...
  }
}
```

#### Best Practices

**Security:**
- Be careful with bash hooks - validate inputs
- Don't include secrets in hook configs (use environment variables)
- Limit hook permissions to what's needed

**Performance:**
- Hooks execute asynchronously (don't block agent)
- Use conditions to avoid unnecessary executions
- Be mindful of external API rate limits

**Debugging:**
- Check backend logs for hook execution results
- Test hooks individually before enabling
- Use descriptive names for easier troubleshooting

## Technical Details

### Type System (`lib/types.ts`)

Important interfaces:
- `AgentSDKConfig` - 30+ Agent SDK parameters
- `Message` / `SDKMessage` - Message formats
- `AgentDefinition` - Custom agent config
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

**3 tables** (JSONB for flexibility):
- `conversations` - Full conversation (config + messages)
- `presets` - Saved configurations
- `usage_logs` - Per-request metrics

Auto-initialized via `schema.sql` on first run.

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
1. Update `AgentConfig` in `lib/types.ts`
2. Update `DEFAULT_CONFIG` constant
3. Add UI control in `config-panel.tsx`
4. Pass to Agent SDK in `backend/src/routes/agent.ts`
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

**Full Configuration Flow:**
```
User configures in UI (ConfigPanel)
  ↓
Stored in Zustand (lib/store.ts)
  ↓
Sent to backend (/api/agent/stream)
  ↓
Transformed by buildSdkOptions() (backend/src/routes/agent.ts)
  ↓
Passed to Agent SDK query()
  ↓
Agent executes with configuration
```

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
