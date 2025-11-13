# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Claude Agent SDK testing and debugging application built with Next.js 15 and Express.js. It provides a three-panel interface for testing Claude API configurations with real-time streaming, debugging metrics, and persistence.

## Development Commands

### Frontend (Next.js)
```bash
npm run dev          # Start Next.js dev server (port 3000)
npm run build        # Build production bundle
npm run start        # Start production server
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
docker exec -it gunnyclaude-postgres-1 psql -U agent_user -d agent_db

# Reset database (re-runs schema.sql)
docker-compose down -v && docker-compose up -d
```

## Architecture

### Three-Panel Layout Architecture

The application uses a resizable three-panel layout (`components/agent-tester.tsx`):
- **Left Panel (ConfigPanel)**: Agent configuration controls
- **Center Panel (ChatInterface)**: Message history and input
- **Right Panel (DebugPanel)**: Real-time metrics and raw API responses

All panels share state via Zustand store (`lib/store.ts`).

### State Management Flow

**Zustand Store (`lib/store.ts`)** is the single source of truth:
- `config`: Current agent configuration (model, temperature, etc.)
- `messages`: Conversation history
- `debugInfo`: Latest API response metrics
- `isStreaming`, `streamingMode`: Streaming state
- `conversationId`: Current conversation for persistence

Components consume and update this store directly. No prop drilling.

### API Communication Pattern

**Frontend → Backend flow:**

1. **ChatInterface** collects user input and current config from store
2. **ApiClient** (`lib/api-client.ts`) handles HTTP/SSE communication
3. Two modes:
   - **Batch**: `POST /api/agent/message` returns complete response
   - **Streaming**: `POST /api/agent/stream` uses Server-Sent Events (SSE)
4. **ChatInterface** updates store with messages and debug info
5. **DebugPanel** reactively displays metrics from store

### Backend Architecture

**Express Router Pattern** (`backend/src/routes/`):
- `agent.ts`: Anthropic SDK wrapper (message + streaming endpoints)
- `conversations.ts`: CRUD for conversation history
- `presets.ts`: CRUD for configuration presets
- `analytics.ts`: Usage statistics and aggregations

**Database Abstraction:**
- `backend/db/client.ts`: pg Pool singleton
- `backend/db/schema.sql`: PostgreSQL schema (auto-initialized on first run)

**Cost Calculation:**
- Hardcoded in `agent.ts` `calculateCost()` function
- Also duplicated in `chat-interface.tsx` for frontend display
- Pricing per million tokens (input/output rates differ by model)

### Type System

**Shared Types** (`lib/types.ts`):
- `AgentConfig`: Configuration object sent to Anthropic API
- `Message`: User/assistant message format
- `AgentResponse`: Anthropic API response structure
- `DebugInfo`: Aggregated metrics for DebugPanel
- Database types: `Conversation`, `Preset`, `UsageLog`, `UsageStats`

Frontend and backend expect these types but backend doesn't import from `lib/types.ts` (Docker isolation). Keep types in sync manually.

### Streaming Implementation

**Server-Sent Events (SSE) flow:**

1. Backend (`agent.ts`):
   - Uses `anthropic.messages.stream()`
   - Emits events: `message`, `text`, `content_block_delta`, `done`, `error`
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

### Why Duplicate Cost Calculation?
- Frontend needs immediate cost display (no API call)
- Backend logs accurate costs to database
- Trade-off: must keep pricing in sync manually

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

- `lib/store.ts`: Global state management
- `lib/types.ts`: Shared TypeScript interfaces
- `lib/api-client.ts`: Backend API wrapper
- `backend/src/routes/agent.ts`: Anthropic SDK integration and cost calculation
- `backend/db/schema.sql`: Database schema
- `components/agent-tester.tsx`: Main layout container
- `components/chat-interface.tsx`: Streaming and batch message handling
- `docker-compose.yml`: Service orchestration

## Testing the Application

1. Start services: `docker-compose up -d && npm run dev`
2. Visit http://localhost:3000
3. Configure agent in left panel (model, temperature, etc.)
4. Send test message in center panel
5. Verify metrics in right panel (tokens, cost, latency)
6. Save preset and reload to verify database persistence
7. Toggle streaming mode and compare response behavior
8. Check backend logs for errors: `docker-compose logs -f backend`
