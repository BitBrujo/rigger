# Rigger

**A visual playground for testing Claude's Agent SDK.** No code required—just configure, chat, and watch your AI agent work.

<img width="4134" height="2672" alt="rigger1" src="https://github.com/user-attachments/assets/042bc530-6248-4514-ba2d-bb21161feee6" />

## What's This For?

Ever wondered what it's like to give an AI agent real tools and watch it work? Rigger lets you do exactly that.

You configure which tools Claude can use (file operations, bash commands, web search, etc.), send it a message, and watch in real-time as it decides what to do. See every token used, every tool called, and exactly how much it costs.

Think of it as **mission control for AI agents**—you see everything happening under the hood.

## What You Get

**Core Features:**
- **19 built-in tools** the agent can use (files, bash, web, more)
- **Session management** with two-tier emergency stop (graceful + force kill)
- **Real-time debug view** showing tokens, costs, and API calls
- **Live streaming** so you watch responses generate
- **Full persistence** with PostgreSQL for conversations and sessions

**Advanced Stuff:**
- **MCP servers** to connect external tools (GitHub, Notion, browsers, etc.)
- **Custom sub-agents** for specialized tasks
- **Skills system** for reusable agent workflows
- **Hooks** for event-driven automation
- **Presets** to save and share configurations

## Getting Started

### Prerequisites

You'll need:
- Node.js 20+
- Docker & Docker Compose
- An Anthropic API key ([grab one here](https://console.anthropic.com))

### 5-Minute Setup

**1. Clone and install:**
```bash
git clone <repository-url>
cd rigger
npm install
cd backend && npm install && cd ..
```

**2. Add your API key:**
```bash
# Copy the environment templates
cp .env.local.example .env.local
cp backend/.env.example backend/.env

# Edit backend/.env and add your key
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

**3. Start everything:**
```bash
# Terminal 1: Start database & backend (Docker)
docker-compose up -d

# Terminal 2: Start frontend
npm run dev
```

**4. Open http://localhost:3334**

You should see a split-panel interface. Configure on the left, chat on the right. You're ready!

## How It Works

The interface has two main panels:

### Left Side: Configure Your Agent

**Basic setup:**
- Pick a Claude model (Sonnet for smart, Haiku for fast)
- Adjust temperature (higher = more creative)
- Write a system prompt to guide behavior

**Choose tools:**
- Select which tools the agent can access
- Categories: File Ops, Bash, Web, Planning, etc.
- The agent can only use what you enable here

**Advanced options** (click to expand):
- **MCP Servers** → Connect external services (GitHub, Notion, browsers)
- **Custom Agents** → Define specialized sub-agents for specific tasks
- **Skills** → Load reusable workflows from `.claude/skills/`
- **Hooks** → Set up event triggers (auto-commit, notifications, etc.)
- **Workspace** → Control which directories the agent can access

**Save configurations:**
- Hit "Save Preset" to store your setup
- Load it later or share with teammates

### Right Side: Chat & Debug

**Chat tab** → Your conversation with the agent:
- Type messages and get streaming responses
- See tool calls happen in real-time
- Full conversation history

**Debug tab** → See what's happening under the hood:
- Tokens used (input, output, cached)
- Cost per message
- API latency
- Raw JSON responses
- Tool execution timeline

## Try This First

Here's a quick workflow to test everything:

**1. Configure:**
- Model: "Claude 3.5 Sonnet"
- Enable tools: `Read`, `Write`, `Edit`, `Bash`
- System prompt: "You are a helpful coding assistant"

**2. Send a message:**
```
Create a simple Python script that prints 'Hello World'
```

**3. Watch what happens:**
- Agent decides to use the `Write` tool
- File gets created in real-time
- Debug tab shows tokens and cost

**4. Save it:**
- Click "Save Preset"
- Name: "Python Helper"
- Now you can reload this setup anytime

## Common Issues

**Backend won't start?**
- Check your API key: `cat backend/.env | grep ANTHROPIC_API_KEY`
- View logs: `docker-compose logs -f backend`
- Make sure Docker is running: `docker-compose ps`

**Can't connect to backend?**
- Test health: `curl http://localhost:3333/health`
- Check `.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:3333/api`

**Database acting weird?**
- Reset it: `docker-compose down -v && docker-compose up -d`
- Wait ~10 seconds for PostgreSQL to start
- Connect directly: `docker exec -it rigger-postgres-1 psql -U agent_user -d agent_db`

**Streaming not working?**
- Some proxies block Server-Sent Events (SSE)
- The app will auto-fallback to batch mode if streaming fails

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
```

## What's Inside

**Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind 4
**Backend:** Express + Node.js
**Database:** PostgreSQL (with JSONB for flexible storage)
**Agent SDK:** `@anthropic-ai/claude-agent-sdk`
**State:** Zustand (simpler than Redux)
**Real-time:** Server-Sent Events for streaming

**Project structure:**
```
rigger/
├── components/             # UI components
│   ├── agent-tester.tsx   # Main layout
│   ├── config-panel.tsx   # Left side
│   └── chat-interface.tsx # Right side
├── lib/
│   ├── store.ts           # Global state
│   └── api-client.ts      # Backend calls
├── backend/
│   ├── routes/            # API endpoints
│   └── db/                # Database stuff
└── .claude/skills/        # Agent workflows
```

## API Endpoints

The backend exposes these REST endpoints:

**Agent:**
- `POST /api/agent/stream` → Stream responses (SSE, auto-creates/resumes sessions)
- `POST /api/agent/message` → Batch responses

**Sessions:**
- `GET/POST /api/sessions/:id?` → List/create sessions
- `POST /api/sessions/:id/stop` → Graceful stop (5-second grace period)
- `POST /api/sessions/:id/force-kill` → Emergency termination (immediate)
- `GET /api/sessions/:id/status` → Lightweight status polling
- `DELETE /api/sessions/:id` → Delete session

**Conversations:**
- `GET/POST/PUT/DELETE /api/conversations/:id?` → CRUD

**Presets:**
- `GET/POST/PUT/DELETE /api/presets/:id?` → CRUD

**Skills:**
- `GET/POST/PUT/DELETE /api/skills/:name?` → CRUD

**Custom Agents:**
- `GET/POST/PUT/DELETE /api/agents/:name?` → CRUD

**Analytics:**
- `GET /api/analytics` → Usage logs
- `GET /api/analytics/stats` → Aggregated stats
- `GET /api/analytics/timeline` → Time-series data

## Want to Learn More?

- **`CLAUDE.md`** → Comprehensive developer guide (architecture, sessions, advanced features)
- **`.claude/skills/README.md`** → Deep dive into the skills system
- **`docs/API_SESSIONS.md`** → Session API reference and patterns
- **`docs/HOSTING_PATTERNS.md`** → Session deployment patterns

## Ports Reference

- **Frontend:** http://localhost:3334
- **Backend API:** http://localhost:3333
- **Database:** localhost:5335 (internal only)

## License

MIT — do whatever you want with it.
