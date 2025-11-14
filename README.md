# Rigger

A testing and debugging interface for the Claude Agent SDK. Configure agents, select tools, stream responses in real-time, and track costs—all through a clean two-panel interface.

<img width="4134" height="2672" alt="rigger1" src="https://github.com/user-attachments/assets/042bc530-6248-4514-ba2d-bb21161feee6" />

## What It Does

Rigger lets you experiment with Claude's Agent SDK without writing code. Configure your agent's behavior, enable specific tools, test prompts, and see detailed debug metrics including token usage and costs.

**Key Features:**
- 18 built-in Agent SDK tools (file ops, bash, web search, task management)
- Real-time streaming with debug metrics
- Configure 30+ SDK parameters through the UI
- Save/load configuration presets
- PostgreSQL persistence for conversations and analytics

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Anthropic API key

### Setup

1. **Clone and install**
```bash
git clone <repository-url>
cd rigger
npm install
cd backend && npm install && cd ..
```

2. **Configure environment**
```bash
# Frontend
cp .env.local.example .env.local

# Backend - add your API key here
cp backend/.env.example backend/.env
# Edit backend/.env and set ANTHROPIC_API_KEY=sk-ant-...
```

3. **Start services**
```bash
# Start backend + database
docker-compose up -d

# Start frontend (separate terminal)
npm run dev
```

4. **Open** → [http://localhost:3334](http://localhost:3334)

## How to Use

### Left Panel: Configuration
- **Model & Settings**: Choose Claude model, set max turns, temperature
- **Tools**: Enable/disable specific agent tools
- **System Prompt**: Use templates or write custom prompts
- **Advanced**: Configure workspace, permissions, MCP servers, custom agents, hooks
- **Presets**: Save/load your configurations

### Right Panel: Chat & Debug
- **Chat Tab**: Send messages, view streaming responses
- **Debug Tab**: See tokens, costs, latency, cache stats, raw API responses

## Architecture

- **Frontend**: Next.js 16 + React 19 + TypeScript + Tailwind CSS 4
- **Backend**: Express.js (Docker container)
- **Database**: PostgreSQL (Docker container)
- **SDK**: `@anthropic-ai/claude-agent-sdk`
- **State**: Zustand

## Development

```bash
# Frontend dev server
npm run dev

# Backend dev with auto-reload
cd backend && npm run watch

# View backend logs
docker-compose logs -f backend

# Reset database
docker-compose down -v && docker-compose up -d
```

## Troubleshooting

**Backend won't start:**
- Check `ANTHROPIC_API_KEY` in `backend/.env`
- Verify PostgreSQL is running: `docker-compose ps`
- Check logs: `docker-compose logs backend`

**Can't connect to backend:**
- Ensure `NEXT_PUBLIC_API_URL=http://localhost:3001/api` in `.env.local`
- Test: `curl http://localhost:3001/health`

**Database errors:**
- Reset: `docker-compose down -v && docker-compose up -d`
- Wait ~10 seconds for PostgreSQL to initialize

## API Endpoints

- `POST /api/agent/stream` - Stream agent responses (SSE)
- `POST /api/agent/message` - Batch agent responses
- `/api/conversations` - CRUD for conversations
- `/api/presets` - CRUD for configuration presets
- `/api/analytics` - Usage logs and statistics

## License

MIT
