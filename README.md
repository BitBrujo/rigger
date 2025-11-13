# Claude Agent SDK Tester

A Next.js application for testing and debugging the Claude Agent SDK with real-time streaming support.

## Features

- **Agent SDK Integration**: Full-featured Claude Agent SDK with built-in tools
- **Model Selection**: Test Claude 3.5 Sonnet, Haiku, and Opus
- **Tool Configuration**: Enable/disable specific tools through the UI
- **Parameter Testing**: Live adjustment of temperature, maxTurns, and thinking tokens
- **System Prompts**: Template library with custom prompt editing
- **Streaming Support**: Toggle between streaming and batch response modes
- **Debug Panel**: Real-time metrics, token usage, costs, cache stats, and API responses
- **Persistence**: Save conversations, configuration presets, and usage analytics
- **Four-Panel Layout**: Config (left), Tools (left-center), Chat (center), Debug (right)

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

- **Model Selection**: Choose between Claude 3.5 Sonnet, Haiku, or Opus
- **Max Turns**: Control multi-turn conversation limit
- **Max Thinking Tokens**: Set extended thinking token budget
- **Temperature**: Adjust randomness (0.0-1.0)
- **System Prompt**: Use templates or write custom prompts
- **Presets**: Save and load configuration presets

### Tools Panel (Left-Center)

- **Tool Selection**: Enable/disable individual tools
- **Categories**: File operations, execution, web, and task management
- **Quick Actions**: Enable all or disable all tools

### Chat Interface (Center)

- **Streaming/Batch Toggle**: Switch between response modes
- **Message History**: View conversation with role indicators
- **Export**: Download conversation as JSON
- **Clear**: Reset conversation

### Debug Panel (Right)

- **Key Metrics**: Latency, cost, token usage
- **Stop Reason**: Why the model stopped generating
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
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main page
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── agent-tester.tsx  # Main container
│   ├── config-panel.tsx  # Configuration controls
│   ├── tools-panel.tsx   # Tool selection
│   ├── chat-interface.tsx # Chat UI
│   ├── debug-panel.tsx   # Debug info display
│   └── ui/               # shadcn components
├── lib/                  # Utilities
│   ├── types.ts         # TypeScript types
│   ├── api-client.ts    # API wrapper
│   ├── store.ts         # Zustand state
│   └── utils.ts         # Helpers
├── backend/             # Express backend
│   ├── src/
│   │   ├── server.ts   # Main server
│   │   └── routes/     # API routes (agent, conversations, presets, analytics)
│   └── db/             # Database
│       ├── schema.sql  # Schema
│       └── client.ts   # PG client
├── workspace/           # Agent SDK workspace volume
└── docker-compose.yml  # Docker services
```

## Configuration Options

### Model Options

- **claude-3-5-sonnet-20241022**: Most capable, best for complex tasks
- **claude-3-5-haiku-20241022**: Fastest, great for simple tasks
- **claude-3-opus-20240229**: Previous generation, very capable

### Available Tools

- **File Operations**: Read, Write, Edit, Glob, Grep
- **Execution**: Bash, BashOutput, KillShell
- **Web**: WebFetch, WebSearch
- **Task Management**: TodoWrite, Task

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

- The application uses the Agent SDK's built-in tool system
- Cost calculation is automatic via SDK metrics
- The workspace directory is mounted for agent file operations
- PostgreSQL database persists conversations and usage logs

## License

MIT
