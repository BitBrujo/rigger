# Rigger

A visual testing interface for Claude Agent SDK. Configure AI agents, test tools, watch real-time execution, and track costs through a clean web interface.

<img width="4134" height="2672" alt="rigger1" src="https://github.com/user-attachments/assets/042bc530-6248-4514-ba2d-bb21161feee6" />

## What It Does

Rigger lets you test Claude's Agent SDK without writing code. Pick tools, configure settings, send messages, and see detailed metrics—all in your browser.

Think of it as a visual debugger for AI agents. You see exactly what tools the agent uses, how much each action costs, and what's happening in real-time.

## Key Features

- **19 Built-in Tools**: File operations, bash commands, web search, task management, and more
- **Real-Time Streaming**: Watch agent responses generate character by character
- **Debug Metrics**: Token usage, costs, cache performance, API timing
- **Tool Configuration**: Select which tools your agent can use
- **MCP Servers**: Connect to external Model Context Protocol servers
- **Custom Agents**: Define specialized sub-agents with specific prompts and tools
- **Skills System**: Package reusable agent workflows
- **Hooks**: Configure event-driven behaviors and integrations
- **Presets**: Save and load complete configurations
- **Full Persistence**: All conversations stored in PostgreSQL

## Quick Start

### What You Need

- Node.js 20 or higher
- Docker and Docker Compose
- An Anthropic API key ([get one here](https://console.anthropic.com))

### Installation

**1. Clone and install dependencies**
```bash
git clone <repository-url>
cd rigger
npm install
cd backend && npm install && cd ..
```

**2. Set up environment files**
```bash
# Frontend environment
cp .env.local.example .env.local

# Backend environment (IMPORTANT: Add your API key here)
cp backend/.env.example backend/.env
```

Edit `backend/.env` and add your Anthropic API key:
```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**3. Start the services**
```bash
# Start PostgreSQL and backend (runs in Docker)
docker-compose up -d

# Start frontend (separate terminal)
npm run dev
```

**4. Open your browser**

Go to [http://localhost:3334](http://localhost:3334)

You should see the two-panel interface ready to go.

## How to Use

### Left Panel: Agent Configuration

This is where you set up your agent's behavior.

**Basic Settings**
- Choose your Claude model (Sonnet, Haiku, etc.)
- Set temperature and max turns
- Write or select a system prompt

**Tool Selection**
- Enable/disable specific tools the agent can use
- Tools are grouped by category (File Operations, Execution, Web, etc.)
- The agent can only use tools you enable

**Advanced Features**
- **MCP Servers**: Connect external tools and data sources
- **Custom Agents**: Define sub-agents for specialized tasks
- **Skills**: Load packaged agent workflows from `.claude/skills/`
- **Hooks**: Configure event-driven behaviors
- **Workspace**: Set working directory and permissions

**Presets**
- Save your configuration for reuse
- Load previously saved setups
- Share configurations across projects

### Right Panel: Chat & Debug

**Chat Tab**
- Type messages to your agent
- See streaming responses in real-time
- View conversation history
- Watch tool execution as it happens

**Debug Tab**
- Token usage (input, output, cached)
- Cost breakdown per message
- API latency and cache stats
- Raw API responses for debugging
- Tool execution timeline

## Ports and Services

The application runs on three ports:

- **Frontend**: `http://localhost:3334` (Next.js)
- **Backend**: `http://localhost:3333` (Express API)
- **Database**: `localhost:5335` (PostgreSQL, internal)

Note: The backend container runs on port 3001 internally, but it's mapped to port 3333 on your machine.

## Example Workflow

1. **Configure the agent**
   - Select "Claude 3.5 Sonnet" model
   - Enable tools: Read, Write, Edit, Bash
   - Set system prompt: "You are a helpful coding assistant"

2. **Send a message**
   - Type: "Create a simple Python script that prints 'Hello World'"
   - Watch the agent use the Write tool
   - See the file get created

3. **Check the debug info**
   - View tokens used
   - See total cost
   - Review which tools were called

4. **Save your config**
   - Click "Save Preset"
   - Name it "Python Helper"
   - Load it next time you need it

## Troubleshooting

### Backend won't start

**Check your API key:**
```bash
cat backend/.env | grep ANTHROPIC_API_KEY
```

**View backend logs:**
```bash
docker-compose logs -f backend
```

**Verify services are running:**
```bash
docker-compose ps
```

### Can't connect to backend

**Test the health endpoint:**
```bash
curl http://localhost:3333/health
```

**Check your .env.local file:**
```bash
cat .env.local
# Should show: NEXT_PUBLIC_API_URL=http://localhost:3333/api
```

### Database errors

**Reset the database:**
```bash
docker-compose down -v && docker-compose up -d
```

Wait about 10 seconds for PostgreSQL to initialize.

**Connect to database directly:**
```bash
docker exec -it rigger-postgres-1 psql -U agent_user -d agent_db
```

### Streaming not working

Some corporate proxies block Server-Sent Events (SSE). If streaming fails, the app will automatically fall back to batch mode.

## Development Commands

**Frontend**
```bash
npm run dev          # Dev server on :3334
npm run build        # Production build
npm run start        # Production server
npm run lint         # Run ESLint
```

**Backend**
```bash
cd backend
npm run dev          # Run with ts-node
npm run watch        # Auto-reload on changes
npm run build        # Compile TypeScript
npm run start        # Run compiled code
```

**Docker**
```bash
docker-compose up -d              # Start all services
docker-compose logs -f backend    # View backend logs
docker-compose logs -f postgres   # View database logs
docker-compose down               # Stop services
docker-compose down -v            # Stop and remove data
```

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix primitives)
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with JSONB storage
- **Agent SDK**: `@anthropic-ai/claude-agent-sdk`
- **State Management**: Zustand
- **Real-Time**: Server-Sent Events (SSE)

## Project Structure

```
rigger/
├── app/                    # Next.js pages
├── components/             # React components
│   ├── agent-tester.tsx   # Main two-panel layout
│   ├── config-panel.tsx   # Left panel
│   └── chat-interface.tsx # Right panel
├── lib/
│   ├── store.ts           # Zustand state
│   ├── types.ts           # TypeScript types
│   └── api-client.ts      # Backend API wrapper
├── backend/
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   └── server.ts      # Express app
│   └── db/
│       ├── schema.sql     # Database schema
│       └── client.ts      # PostgreSQL client
├── .claude/
│   └── skills/            # Agent skills
└── docker-compose.yml     # Service orchestration
```

## API Reference

**Agent Endpoints**
- `POST /api/agent/stream` - Stream agent responses with SSE
- `POST /api/agent/message` - Get batch agent responses

**Data Management**
- `GET /api/conversations` - List all conversations
- `POST /api/conversations` - Create new conversation
- `PUT /api/conversations/:id` - Update conversation
- `DELETE /api/conversations/:id` - Delete conversation

**Configuration**
- `GET /api/presets` - List saved presets
- `POST /api/presets` - Save new preset
- `PUT /api/presets/:id` - Update preset
- `DELETE /api/presets/:id` - Delete preset

**Analytics**
- `GET /api/analytics` - Usage logs
- `GET /api/analytics/stats` - Aggregate statistics
- `GET /api/analytics/timeline` - Time-series data

**Skills**
- `GET /api/skills` - List available skills
- `GET /api/skills/:name` - Get specific skill
- `POST /api/skills` - Create new skill
- `PUT /api/skills/:name` - Update skill
- `DELETE /api/skills/:name` - Delete skill

**Custom Agents**
- `GET /api/agents` - List custom agents
- `POST /api/agents` - Create custom agent
- `PUT /api/agents/:name` - Update agent
- `DELETE /api/agents/:name` - Delete agent

## Learn More


- **.claude/skills/README.md** - Skills system guide
- **docs/HOSTING_PATTERNS.md** - Session patterns and hosting
- **examples/session-patterns.js** - Code examples

## License

MIT
