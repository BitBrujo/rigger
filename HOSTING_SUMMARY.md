# Hosting Patterns Implementation Summary

## Overview

Rigger now supports production-ready hosting patterns for the Claude Agent SDK, enabling you to deploy agents in various scenarios from one-off tasks to long-running services.

## What Was Added

### 1. Session Management System

**New Types** (`lib/types.ts`):
- `SessionPattern` - Four hosting patterns: ephemeral, long-running, hybrid, single-container
- `SessionMetadata` - Complete session lifecycle tracking
- `SessionCreateRequest`, `SessionResumeRequest`, `SessionTerminateRequest` - API request types
- `SessionListResponse`, `SessionStatsResponse` - API response types

**Session Manager Service** (`backend/src/services/session-manager.ts`):
- In-memory session tracking
- Automatic lifecycle management
- Idle/budget/turn limit enforcement
- Real-time statistics and monitoring
- Background cleanup of expired sessions

**API Routes** (`backend/src/routes/sessions.ts`):
- `POST /api/sessions` - Create new session
- `GET /api/sessions` - List sessions with filtering
- `GET /api/sessions/:id` - Get session details
- `PATCH /api/sessions/:id` - Update session metadata
- `POST /api/sessions/:id/message` - Execute messages in session
- `POST /api/sessions/:id/terminate` - Terminate session
- `DELETE /api/sessions/:id` - Delete session
- `GET /api/sessions/stats/summary` - Get aggregate statistics

**Database Schema** (`backend/db/schema.sql`):
- New `agent_sessions` table with full lifecycle tracking
- Indexes for efficient querying by pattern, status, user, and date
- JSONB storage for flexible configuration

### 2. Four Hosting Patterns

#### Ephemeral Sessions
- **Use Case**: Bug fixes, invoice processing, translations, one-off tasks
- **Lifecycle**: Create → Execute → Auto-complete → Auto-cleanup (1 min)
- **Cost**: ~$0.10-$0.50 per session
- **Best For**: Batch processing, stateless operations

#### Long-Running Sessions
- **Use Case**: Email monitoring, site builders, continuous services
- **Lifecycle**: Create → Run continuously → Manual termination
- **Cost**: ~$5-$50 per day
- **Best For**: Real-time services, proactive agents

#### Hybrid Sessions
- **Use Case**: Project managers, research assistants, customer support
- **Lifecycle**: Create → Interact → Idle → Resume with state
- **Cost**: ~$0.50-$2.00 per session
- **Best For**: Intermittent interaction, cost optimization

#### Single-Container
- **Use Case**: Multi-agent simulations, agent collaboration
- **Lifecycle**: Create → Run multiple agents → Manual termination
- **Cost**: Varies by simulation duration
- **Best For**: Agent-to-agent interactions, gaming scenarios

### 3. Automatic Resource Management

**Idle Monitoring**:
- Background check every 60 seconds
- Auto-terminates sessions exceeding limits:
  - `maxIdleTimeMs` - Time without activity
  - `maxLifetimeMs` - Absolute lifetime
  - `maxBudgetUsd` - Cost threshold
  - `maxTurns` - Turn count limit

**Cleanup**:
- Ephemeral sessions auto-deleted 1 minute after completion
- Other patterns remain for historical tracking
- Manual cleanup via DELETE endpoint

### 4. Comprehensive Documentation

**New Documentation**:
- `docs/HOSTING_PATTERNS.md` - Complete guide to hosting patterns
- `docs/API_SESSIONS.md` - API reference with examples
- `examples/session-patterns.js` - Working code examples for all patterns
- `HOSTING_SUMMARY.md` - This file

## Quick Start

### 1. Apply Database Schema

```bash
# Reset database with new schema
docker-compose down -v
docker-compose up -d
```

### 2. Create Your First Session

```javascript
// Ephemeral session for a quick task
const session = await fetch('http://localhost:3333/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pattern: 'ephemeral',
    config: {
      model: 'claude-3-5-sonnet-20241022',
      systemPrompt: 'Fix bugs in code',
      maxTurns: 10,
      allowedTools: ['Read', 'Edit', 'Bash']
    },
    maxBudgetUsd: 0.50,
    description: 'Fix authentication bug'
  })
});

const { id } = await session.json();
```

### 3. Execute a Message

```javascript
// Execute task in session
const response = await fetch(`http://localhost:3333/api/sessions/${id}/message`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Fix the authentication timeout in src/auth/user.ts',
    streaming: false
  })
});

const result = await response.json();
console.log('Cost:', result.session.totalCost);
console.log('Turns:', result.session.numTurns);
```

### 4. Monitor Sessions

```javascript
// Get statistics
const stats = await fetch('http://localhost:3333/api/sessions/stats/summary');
const data = await stats.json();

console.log('Active sessions:', data.activeSessions);
console.log('Total cost:', data.totalCost);
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│                    (Session UI - TBD)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/SSE
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    Express Backend                           │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Session Routes                           │  │
│  │  POST   /api/sessions          Create                │  │
│  │  GET    /api/sessions          List                  │  │
│  │  GET    /api/sessions/:id      Get                   │  │
│  │  PATCH  /api/sessions/:id      Update                │  │
│  │  POST   /api/sessions/:id/msg  Execute               │  │
│  │  POST   /api/sessions/:id/term Terminate             │  │
│  │  DELETE /api/sessions/:id      Delete                │  │
│  │  GET    /api/sessions/stats    Statistics            │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
│  ┌───────────────────▼──────────────────────────────────┐  │
│  │           Session Manager Service                     │  │
│  │  - In-memory session tracking                         │  │
│  │  - Lifecycle management                               │  │
│  │  - Auto-termination (idle/budget/turns)               │  │
│  │  - Statistics aggregation                             │  │
│  │  - Background monitoring (60s interval)               │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                       │
└──────────────────────┼───────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
┌───────────────┐            ┌────────────────┐
│  PostgreSQL   │            │  Agent SDK     │
│               │            │                │
│ agent_sessions│            │  query()       │
│  - metadata   │            │  - streaming   │
│  - limits     │            │  - tools       │
│  - lifecycle  │            │  - sessions    │
│  - costs      │            │                │
└───────────────┘            └────────────────┘
```

## Key Features

### ✅ Pattern-Based Architecture
Four distinct hosting patterns for different use cases

### ✅ Automatic Resource Management
Background monitoring with auto-termination on limits

### ✅ Cost Tracking
Real-time cost, token, and turn tracking per session

### ✅ Session Resumption
Hybrid pattern supports state hydration from previous sessions

### ✅ Database Persistence
All session metadata stored for historical analysis

### ✅ Statistics & Monitoring
Aggregate stats by pattern, status, user, and tags

### ✅ Flexible Configuration
Per-session limits for idle time, lifetime, budget, and turns

### ✅ Streaming Support
Both streaming (SSE) and batch (JSON) responses

## Testing

### Run Example Patterns

```bash
# Install dependencies
cd examples
npm install

# Test ephemeral pattern (bug fix)
node session-patterns.js bug-fix

# Test long-running pattern (email monitor)
node session-patterns.js email-monitor

# Test hybrid pattern (project manager)
node session-patterns.js project-manager

# Test single-container pattern (simulation)
node session-patterns.js simulation

# Monitor all sessions
node session-patterns.js monitor

# Clean up idle sessions
node session-patterns.js cleanup
```

### Manual Testing

```bash
# Create ephemeral session
curl -X POST http://localhost:3333/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "ephemeral",
    "config": {
      "model": "claude-3-5-sonnet-20241022",
      "systemPrompt": "You are a helpful assistant",
      "maxTurns": 10,
      "allowedTools": ["Read", "Write"]
    },
    "maxBudgetUsd": 0.50
  }'

# List all sessions
curl http://localhost:3333/api/sessions

# Get session stats
curl http://localhost:3333/api/sessions/stats/summary

# Execute message in session
curl -X POST http://localhost:3333/api/sessions/SESSION_ID/message \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Hello, how are you?",
    "streaming": false
  }'
```

## Next Steps

### Immediate (Required)

1. **Reset Database**
   ```bash
   docker-compose down -v && docker-compose up -d
   ```

2. **Test Basic Flow**
   - Create ephemeral session
   - Execute message
   - Verify auto-completion

### Short-Term (Recommended)

1. **Add Frontend UI**
   - Session creation form
   - Session list/grid view
   - Real-time session monitoring
   - Statistics dashboard

2. **Add Monitoring**
   - Prometheus metrics export
   - Health check endpoints
   - Session lifecycle webhooks

3. **Add Security**
   - API key authentication
   - Per-user session limits
   - Rate limiting

### Long-Term (Optional)

1. **Container Orchestration**
   - Deploy sessions to actual containers
   - Kubernetes integration
   - Auto-scaling based on load

2. **Advanced Features**
   - Session pooling (pre-warmed containers)
   - Session snapshots/restore
   - Distributed sessions across servers
   - WebSocket support for real-time updates

## Production Checklist

Before deploying to production:

- [ ] Set appropriate session limits (`maxBudgetUsd`, `maxTurns`, `maxIdleTimeMs`)
- [ ] Configure database backups for `agent_sessions` table
- [ ] Set up monitoring alerts (high session count, errors, costs)
- [ ] Implement authentication and authorization
- [ ] Add rate limiting per user/API key
- [ ] Test auto-termination behavior under load
- [ ] Document session patterns for your team
- [ ] Set up cost tracking and budget alerts
- [ ] Configure logging and error tracking (Sentry, etc.)
- [ ] Review and optimize database indexes

## Troubleshooting

### Sessions Not Auto-Terminating

Check SessionManager is running:
```javascript
// In backend logs, you should see:
// [SessionManager] Started idle monitoring
```

Verify limits are set:
```javascript
{
  maxIdleTimeMs: 1800000,  // Must be set
  maxBudgetUsd: 5.00       // Must be set
}
```

### High Database Growth

Implement cleanup policy:
```sql
-- Delete completed ephemeral sessions older than 7 days
DELETE FROM agent_sessions
WHERE pattern = 'ephemeral'
  AND status = 'completed'
  AND completed_at < NOW() - INTERVAL '7 days';
```

### Session Not Found

Check session was created in database:
```sql
SELECT id, pattern, status FROM agent_sessions WHERE id = 'sess_abc123';
```

Verify SessionManager has the session:
```bash
curl http://localhost:3333/api/sessions/sess_abc123
```

## Documentation

- **Complete Guide**: `docs/HOSTING_PATTERNS.md`
- **API Reference**: `docs/API_SESSIONS.md`
- **Code Examples**: `examples/session-patterns.js`
- **Database Schema**: `backend/db/schema.sql`

## Support

For questions or issues:
1. Check the documentation in `docs/`
2. Review examples in `examples/session-patterns.js`
3. Inspect backend logs: `docker-compose logs -f backend`
4. Check database state: `docker exec -it rigger-postgres-1 psql -U agent_user -d agent_db`

## Conclusion

The hosting patterns implementation provides a production-ready foundation for deploying Claude Agent SDK applications. Choose the pattern that best fits your use case:

- **Quick tasks** → Ephemeral
- **Continuous services** → Long-Running
- **User interaction** → Hybrid
- **Multi-agent** → Single-Container

All patterns include automatic resource management, cost tracking, and comprehensive monitoring out of the box.
