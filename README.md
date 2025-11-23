# Rigger

**The visual dashboard for Claude's Agent SDK.** Test, debug, and manage your AI agents without writing code.

<img width="4134" height="2672" alt="rigger1" src="https://github.com/user-attachments/assets/042bc530-6248-4514-ba2d-bb21161feee6" />

## What Is This?

If you're working with the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-ts), you know it's powerful—but running agents from the command line or writing test scripts gets old fast.

**Rigger is mission control for the Agent SDK.** It gives you a visual interface to:
- Configure all 30+ SDK parameters with forms instead of JSON
- Test agents with real-time streaming and debug metrics
- Monitor sessions with token usage, costs, and execution timelines
- Manage tools, MCP servers, skills, and subagents visually
- Save and share agent configurations as presets

Think of it as **the SDK's built-in developer tools**, but as a standalone web app.

## Why Use This?

**Instead of this:**
```typescript
import { Agent } from '@anthropic-ai/claude-agent-sdk';

const agent = new Agent({
  model: 'claude-3-5-sonnet-20241022',
  maxTurns: 20,
  allowedTools: ['Read', 'Write', 'Bash', 'WebSearch'],
  systemPrompt: 'You are a helpful assistant...',
  workingDirectory: '/path/to/project',
  mcpServers: { /* ... complex config ... */ },
  // ... 25+ more parameters
});

const result = await agent.query('Help me refactor this code');
// Now parse the response, check tokens, calculate costs...
```

**You get this:**
- Toggle checkboxes to enable tools
- Type your system prompt in a textarea
- See streaming responses in real-time
- Get automatic token counts and cost breakdowns
- View tool executions as they happen
- Emergency stop controls (graceful + force kill)
- Session history and conversation management

## Core Features

### SDK Configuration Dashboard
- **All 30+ SDK parameters** exposed through a clean UI
- **Tool selector** with 19 built-in tools (Read, Write, Bash, Grep, WebSearch, etc.)
- **Model picker** (Sonnet, Opus, Haiku) with temperature controls
- **MCP server manager** for connecting external tools (GitHub, Notion, Playwright)
- **Advanced settings** (thinking budget, cache control, workspace paths)

### Real-Time Monitoring
- **Streaming responses** with Server-Sent Events
- **Live debug metrics**: tokens (input/output/cached), costs, latency
- **Tool execution timeline** showing every tool call and result
- **Session tracking** with status, duration, and resource usage
- **Emergency controls**: graceful stop or force kill runaway sessions

### Agent SDK Features
- **Skills system** → Load reusable workflows from `.claude/skills/`
- **Subagents** → Configure specialized agents for delegation (Task tool)
- **Hooks** → Event-driven automation (auto-commit, notifications, webhooks)
- **File uploads** → Add context via system prompt or working directory
- **Presets** → Save and share complete SDK configurations

### Persistence & Analytics
- **PostgreSQL database** for conversations and sessions
- **Usage tracking** with cost analysis and performance metrics
- **Configuration export** as JSON for sharing or version control
- **Session history** with filtering and search

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Anthropic API key ([get one here](https://console.anthropic.com))

### Quick Setup

**1. Clone and install:**
```bash
git clone <repository-url>
cd rigger
npm install
cd backend && npm install && cd ..
```

**2. Configure API key:**
```bash
# Copy environment templates
cp .env.local.example .env.local
cp backend/.env.example backend/.env

# Edit backend/.env and add your Anthropic API key
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**3. Start services:**
```bash
# Start backend + database
docker-compose up -d

# Start frontend (in a new terminal)
npm run dev
```

**4. Open http://localhost:3334**

You'll see the SDK dashboard with sidebar navigation on the left and chat interface on the right.

## How It Works

### The Interface

**Left Panel: SDK Configuration**
- **Sessions** → Monitor active sessions, view history, emergency stop controls
- **Configuration** → Save/load/export agent configurations
- **Basic Config** → Model, temperature, max turns, system prompt
- **Tools** → Enable/disable SDK tools with checkboxes
- **MCP Servers** → Connect external Model Context Protocol servers
- **Skills** → Manage reusable agent workflows
- **Subagents** → Define specialized agents for the Task tool
- **Hooks** → Configure event-driven automation
- **Files** → Upload context files (system prompt or working directory)
- **Advanced** → Working directory, thinking budget, cache control, etc.

**Right Panel: Agent Interaction**
- **Chat** → Send messages, see streaming responses
- **Debug** → Token usage, costs, API latency, raw JSON
- **Tools** → Timeline of tool executions with parameters and results
- **Todo** → Task lists from the agent's TodoWrite tool

### The SDK Integration

Rigger is a **thin wrapper around the Claude Agent SDK**. Every configuration option maps directly to SDK parameters:

```typescript
// Your UI selections become SDK config
const sdkConfig = {
  model: uiState.selectedModel,           // From dropdown
  temperature: uiState.temperature,       // From slider
  allowedTools: uiState.enabledTools,     // From checkboxes
  systemPrompt: uiState.systemPrompt,     // From textarea
  mcpServers: uiState.mcpServers,         // From MCP manager
  customAgents: uiState.subagents,        // From Subagents tab
  // ... everything configured visually
};

// Rigger calls the SDK for you
const agent = new Agent(sdkConfig);
const response = await agent.query(userMessage);
```

The backend handles streaming, session management, and persistence. The frontend gives you real-time visibility into what the SDK is doing.

## Quick Start Guide

**Try this workflow to test the SDK:**

1. **Navigate to Tools tab**
   - Enable: `Read`, `Write`, `Edit`, `Bash`
   - This controls which SDK tools the agent can access

2. **Go to Basic Config tab**
   - Model: "Claude 3.5 Sonnet"
   - System Prompt: "You are a helpful coding assistant"
   - These map to SDK's `model` and `systemPrompt` parameters

3. **Send a message in the Chat panel:**
   ```
   Create a Python script that prints "Hello from the Agent SDK"
   ```

4. **Watch the SDK in action:**
   - Agent decides to use the `Write` tool
   - File appears in your working directory
   - Debug tab shows SDK metrics (tokens, cost, timing)
   - Tools tab shows the complete tool execution

5. **Save your configuration:**
   - Go to Configuration tab
   - Click "Save Preset" → Name: "Python Helper"
   - Your SDK config is now reusable

## SDK Features Explained

### Sessions
Sessions are persistent SDK execution contexts. Each session:
- Tracks multi-turn conversations
- Monitors resource usage (tokens, costs)
- Maintains tool state
- Supports emergency stop (graceful or force kill)

See the **Sessions tab** to monitor active sessions and view history.

### Tools
The SDK comes with 19 built-in tools. Enable them in the **Tools tab**:

**File Operations:** Read, Write, Edit, Glob, Grep
**Execution:** Bash, BashOutput, KillShell
**Web:** WebFetch, WebSearch
**Planning:** TodoWrite, Task, AskUserQuestion, ExitPlanMode
**Agent System:** Skill, SlashCommand

### MCP Servers
The SDK supports [Model Context Protocol](https://modelcontextprotocol.io/) servers. Connect external services:

- **GitHub** → Create issues, PRs, commits
- **Notion** → Query workspace, create pages
- **Playwright** → Browser automation
- **Filesystem** → Advanced file operations
- **Git** → Version control

Configure in **MCP Servers tab** with command, args, and environment variables.

### Skills
Skills are SDK workflows packaged as markdown files. The SDK's `Skill` tool loads them from `.claude/skills/`.

**Example:** Create `example-code-review/SKILL.md`:
```markdown
---
description: Perform comprehensive code reviews
---
# Code Review Skill

## Workflow
1. Analyze code for bugs and security issues
2. Check performance and best practices
3. Suggest improvements
```

The agent can now invoke this workflow when needed.

### Subagents
The SDK's `Task` tool delegates work to specialized agents. Define them in **Subagents tab**:

**Example subagent:**
- Name: "Bug Hunter"
- Prompt: "Find bugs, trace errors, suggest fixes"
- Tools: `Read`, `Grep`, `Bash`
- Model: `haiku` (faster, cheaper)

The main agent can delegate: "Use Bug Hunter to analyze authentication code"

### Hooks
Trigger actions based on SDK events:

**Available triggers:**
- `on-prompt-submit` → Before SDK query
- `on-response-complete` → After SDK response
- `on-tool-use` → When specific tools execute
- `on-error` → On SDK errors

**Example:** Auto-commit on file writes
```typescript
{
  trigger: 'on-tool-use',
  conditions: [{ tool: 'Write' }],
  action: {
    type: 'bash',
    command: 'git add {{file}} && git commit -m "Auto-commit: {{description}}"'
  }
}
```

## Troubleshooting

**Backend won't start?**
```bash
# Check API key
cat backend/.env | grep ANTHROPIC_API_KEY

# View logs
docker-compose logs -f backend

# Verify Docker
docker-compose ps
```

**Frontend can't connect?**
```bash
# Test backend health
curl http://localhost:3333/health

# Check frontend config
cat .env.local | grep NEXT_PUBLIC_API_URL
```

**Database issues?**
```bash
# Reset database (WARNING: deletes all data)
docker-compose down -v && docker-compose up -d

# Connect directly
docker exec -it rigger-postgres-1 psql -U agent_user -d agent_db
```

**SDK errors?**
- Check the Debug tab for raw SDK responses
- View backend logs: `docker-compose logs -f backend`
- Verify your API key has sufficient credits

## Useful Commands

```bash
# Frontend (Next.js on :3334)
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Check for errors

# Backend (Express on :3333)
cd backend
npm run watch        # Auto-reload on changes
npm run build        # Compile TypeScript

# Docker
docker-compose up -d              # Start services
docker-compose logs -f backend    # Watch backend logs
docker-compose down               # Stop everything
docker-compose down -v            # Stop + delete data

# Database
docker exec -it rigger-postgres-1 psql -U agent_user -d agent_db
```

## Architecture

**Tech Stack:**
- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Backend: Express, Node.js, PostgreSQL
- Agent SDK: `@anthropic-ai/claude-agent-sdk`
- State: Zustand
- Real-time: Server-Sent Events (SSE)

**How it works:**
1. Frontend captures SDK configuration via UI
2. Backend transforms config to SDK format
3. SDK executes with streaming responses
4. Backend wraps SDK events in SSE
5. Frontend displays real-time updates
6. PostgreSQL persists sessions and conversations

**Data Flow:**
```
UI Config → Zustand Store → API Request → buildSdkOptions()
    → Agent SDK → Streaming Response → SSE → Frontend Update
```

## Documentation

- **`CLAUDE.md`** → Complete architecture and SDK integration details
- **`docs/API_SESSIONS.md`** → Session API reference
- **`.claude/skills/README.md`** → Skills system deep dive
- **[Agent SDK Docs](https://github.com/anthropics/claude-agent-sdk-ts)** → Official SDK documentation

## Contributing

This is a tool for the Agent SDK community. Contributions welcome:

- **Bug reports** → Open an issue
- **Feature requests** → Describe your SDK use case
- **Pull requests** → Add features that help SDK development

## License

MIT — use it however helps your SDK development.

---

Built for developers working with the Claude Agent SDK. Makes testing and debugging agents visual and fast.
