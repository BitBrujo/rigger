# Hosting Patterns for Agent SDK

This document describes the hosting patterns implemented in Rigger for deploying Claude Agent SDK applications in production environments.

## Overview

Rigger now supports four hosting patterns based on Anthropic's official hosting guide:

1. **Ephemeral Sessions** - One-off tasks that terminate on completion
2. **Long-Running Sessions** - Persistent sessions for continuous operation
3. **Hybrid Sessions** - Resumable sessions with state hydration
4. **Single-Container** - Multiple agents in one container (for simulations)

## Architecture

### Session Manager

The `SessionManager` service (`backend/src/services/session-manager.ts`) is a singleton that manages all active sessions in memory:

- **Lifecycle Management**: Create, start, update, complete, and terminate sessions
- **Activity Tracking**: Record cost, tokens, turns, and tool usage
- **Auto-Cleanup**: Automatically terminate idle or over-budget sessions
- **Statistics**: Aggregate metrics across all sessions

### Database Schema

The `agent_sessions` table stores session metadata:

```sql
CREATE TABLE agent_sessions (
    id VARCHAR(255) PRIMARY KEY,
    session_id VARCHAR(255),  -- SDK session ID
    pattern VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    conversation_id INTEGER REFERENCES conversations(id),
    config JSONB NOT NULL,

    -- Lifecycle timestamps
    created_at TIMESTAMP NOT NULL,
    started_at TIMESTAMP,
    last_activity_at TIMESTAMP,
    completed_at TIMESTAMP,
    terminated_at TIMESTAMP,

    -- Resource tracking
    total_cost DECIMAL(10, 6),
    total_tokens INTEGER,
    num_turns INTEGER,
    tools_used TEXT[],

    -- Session limits
    max_idle_time_ms BIGINT,
    max_lifetime_ms BIGINT,
    max_budget_usd DECIMAL(10, 4),
    max_turns INTEGER,

    -- Metadata
    tags JSONB,
    description TEXT,
    user_id VARCHAR(255)
);
```

### API Endpoints

All session endpoints are mounted at `/api/sessions`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Create new session |
| GET | `/api/sessions` | List sessions with filters |
| GET | `/api/sessions/:id` | Get session by ID |
| PATCH | `/api/sessions/:id` | Update session metadata |
| POST | `/api/sessions/:id/message` | Execute message in session |
| POST | `/api/sessions/:id/terminate` | Terminate session |
| DELETE | `/api/sessions/:id` | Delete session |
| GET | `/api/sessions/stats/summary` | Get session statistics |

## Hosting Patterns

### Pattern 1: Ephemeral Sessions

**Use Case**: One-off tasks like bug fixes, invoice processing, translations, or media transformations.

**Characteristics**:
- Creates a fresh container for each task
- Automatically completes and cleans up after execution
- No state persistence between invocations
- Lowest resource overhead

**Example**:

```javascript
// Create ephemeral session
const session = await fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pattern: 'ephemeral',
    config: {
      model: 'claude-3-5-sonnet-20241022',
      systemPrompt: 'Fix the bug in the provided code',
      maxTurns: 10,
      allowedTools: ['Read', 'Edit', 'Bash', 'Write']
    },
    description: 'Fix authentication bug in user service'
  })
});

const { id } = await session.json();

// Execute task
const response = await fetch(`/api/sessions/${id}/message`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Fix the authentication timeout bug in src/auth/user.ts',
    streaming: false
  })
});

// Session auto-completes and cleans up after 1 minute
```

**Configuration**:

```javascript
{
  pattern: 'ephemeral',
  maxIdleTimeMs: 300000,  // 5 minutes max idle
  maxBudgetUsd: 0.50,     // $0.50 budget limit
  maxTurns: 10            // Maximum 10 turns
}
```

### Pattern 2: Long-Running Sessions

**Use Case**: Proactive agents, email monitors, site builders, high-frequency chatbots.

**Characteristics**:
- Persistent container that stays alive
- Multiple agents can run in the container
- Continuous operation without state loss
- Best for services that need immediate response

**Example**:

```javascript
// Create long-running session
const session = await fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pattern: 'long-running',
    config: {
      model: 'claude-3-5-sonnet-20241022',
      systemPrompt: 'Monitor incoming emails and triage based on urgency',
      maxTurns: 1000,
      allowedTools: ['WebFetch', 'Write', 'Bash']
    },
    maxLifetimeMs: 86400000, // 24 hours
    description: 'Email triage agent'
  })
});

const { id } = await session.json();

// Process messages continuously
while (true) {
  const newEmails = await fetchNewEmails();

  for (const email of newEmails) {
    await fetch(`/api/sessions/${id}/message`, {
      method: 'POST',
      body: JSON.stringify({
        prompt: `Triage this email: ${email.subject}`,
        streaming: true
      })
    });
  }

  await sleep(60000); // Check every minute
}
```

**Configuration**:

```javascript
{
  pattern: 'long-running',
  maxLifetimeMs: 86400000,  // 24 hours
  maxBudgetUsd: 10.00,      // $10 daily budget
  maxIdleTimeMs: 3600000    // 1 hour idle timeout
}
```

### Pattern 3: Hybrid Sessions

**Use Case**: Personal project managers, deep research, customer support with intermittent interaction.

**Characteristics**:
- Ephemeral containers hydrated with history
- State loaded from database on resume
- Spins down when idle, resumes when needed
- Balance between cost and continuity

**Example**:

```javascript
// Create hybrid session
const session = await fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pattern: 'hybrid',
    conversationId: 123, // Link to existing conversation
    config: {
      model: 'claude-3-5-sonnet-20241022',
      systemPrompt: 'Help manage ongoing projects',
      maxTurns: 50,
      resumeSessionId: 'sess_xyz123', // Resume from previous session
      allowedTools: ['Read', 'Write', 'TodoWrite', 'WebSearch']
    },
    maxIdleTimeMs: 1800000, // 30 minutes
    description: 'Project management assistant'
  })
});

const { id } = await session.json();

// First interaction
await fetch(`/api/sessions/${id}/message`, {
  method: 'POST',
  body: JSON.stringify({
    prompt: 'Update me on the status of the API refactor project'
  })
});

// Session goes idle after 30 minutes of inactivity
// Resume later with full context
const updatedSession = await fetch(`/api/sessions/${id}`);
const sessionData = await updatedSession.json();

// Check if needs to be resumed
if (sessionData.status === 'idle' || sessionData.status === 'terminated') {
  // Create new session resuming from previous
  const resumedSession = await fetch('/api/sessions', {
    method: 'POST',
    body: JSON.stringify({
      pattern: 'hybrid',
      conversationId: sessionData.conversationId,
      config: {
        ...sessionData.config,
        resumeSessionId: sessionData.sessionId
      }
    })
  });
}
```

**Configuration**:

```javascript
{
  pattern: 'hybrid',
  conversationId: 123,      // Link to conversation history
  maxIdleTimeMs: 1800000,   // 30 minutes idle timeout
  maxBudgetUsd: 2.00,       // $2 per session budget
  config: {
    resumeSessionId: 'sess_xyz123', // Resume from previous
    continueSession: false  // Don't continue, resume instead
  }
}
```

### Pattern 4: Single-Container

**Use Case**: Multi-agent simulations, agent-to-agent interactions, gaming scenarios.

**Characteristics**:
- Multiple SDK processes in one container
- Shared filesystem and environment
- Agents can interact and collaborate
- Requires coordination to prevent conflicts

**Example**:

```javascript
// Create single-container session
const session = await fetch('/api/sessions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pattern: 'single-container',
    config: {
      model: 'claude-3-5-sonnet-20241022',
      systemPrompt: 'Coordinate multiple agents in simulation',
      maxTurns: 100,
      customAgents: {
        'player1': {
          systemPrompt: 'You are player 1 in a strategy game',
          allowedTools: ['Read', 'Write', 'Bash']
        },
        'player2': {
          systemPrompt: 'You are player 2 in a strategy game',
          allowedTools: ['Read', 'Write', 'Bash']
        }
      }
    },
    description: 'Multi-agent game simulation'
  })
});

// Coordinate multiple agents via Task tool
await fetch(`/api/sessions/${session.id}/message`, {
  method: 'POST',
  body: JSON.stringify({
    prompt: 'Start the game simulation with both players'
  })
});
```

## Session Lifecycle Management

### Auto-Termination

Sessions are automatically terminated when they exceed limits:

```javascript
// Idle timeout
{
  maxIdleTimeMs: 1800000  // 30 minutes
}

// Lifetime limit
{
  maxLifetimeMs: 86400000  // 24 hours
}

// Budget limit
{
  maxBudgetUsd: 5.00  // $5.00
}

// Turn limit
{
  maxTurns: 50  // 50 conversation turns
}
```

The `SessionManager` checks these limits every minute and terminates sessions that exceed them.

### Manual Termination

```javascript
// Terminate session manually
await fetch(`/api/sessions/${id}/terminate`, {
  method: 'POST',
  body: JSON.stringify({
    reason: 'user_requested'
  })
});
```

### Cleanup

- **Ephemeral sessions**: Auto-deleted 1 minute after completion
- **Other patterns**: Remain in database for historical tracking
- **Manual cleanup**: Use DELETE endpoint to remove sessions

## Monitoring and Metrics

### Session Statistics

```javascript
// Get aggregate stats
const stats = await fetch('/api/sessions/stats/summary');
const data = await stats.json();

/*
{
  totalSessions: 150,
  activeSessions: 12,
  completedSessions: 130,
  errorSessions: 8,
  totalCost: 45.32,
  totalTokens: 2500000,
  avgSessionDuration: 3600000,
  byPattern: {
    ephemeral: {
      count: 100,
      avgCost: 0.25,
      avgTokens: 15000,
      avgDuration: 120000
    },
    hybrid: {
      count: 40,
      avgCost: 0.80,
      avgTokens: 45000,
      avgDuration: 7200000
    },
    ...
  }
}
*/
```

### Listing Sessions

```javascript
// List active sessions
const sessions = await fetch('/api/sessions?status=active&page=1&pageSize=20');

// Filter by pattern
const ephemeral = await fetch('/api/sessions?pattern=ephemeral');

// Filter by user
const userSessions = await fetch('/api/sessions?userId=user_123');

// Filter by tags
const bugFixes = await fetch('/api/sessions?tags=bug-fix,urgent');
```

### Session Details

```javascript
// Get full session metadata
const session = await fetch(`/api/sessions/${id}`);
const data = await session.json();

/*
{
  id: "sess_abc123",
  sessionId: "sdk_sess_xyz789",
  pattern: "ephemeral",
  status: "completed",
  conversationId: 42,

  createdAt: "2025-01-15T10:00:00Z",
  startedAt: "2025-01-15T10:00:05Z",
  completedAt: "2025-01-15T10:05:30Z",

  totalCost: 0.35,
  totalTokens: 18500,
  numTurns: 3,
  toolsUsed: ["Read", "Edit", "Bash"],

  maxBudgetUsd: 0.50,
  maxTurns: 10,

  description: "Fix authentication bug",
  tags: ["bug-fix", "auth"]
}
*/
```

## Best Practices

### 1. Choose the Right Pattern

- **Ephemeral**: One-time tasks, batch processing, stateless operations
- **Long-Running**: Real-time monitoring, continuous services, instant response needs
- **Hybrid**: Intermittent interaction, context preservation, cost optimization
- **Single-Container**: Multi-agent coordination, simulations, shared state

### 2. Set Appropriate Limits

```javascript
{
  // Prevent runaway costs
  maxBudgetUsd: 1.00,

  // Prevent infinite loops
  maxTurns: 20,

  // Free up resources
  maxIdleTimeMs: 1800000,  // 30 minutes

  // Absolute lifetime
  maxLifetimeMs: 86400000  // 24 hours
}
```

### 3. Tag Your Sessions

```javascript
{
  tags: ['production', 'bug-fix', 'urgent', 'user-requested'],
  description: 'Fix authentication timeout in production',
  userId: 'user_123'
}
```

This enables filtering and analysis later.

### 4. Monitor Session Health

```javascript
// Periodic health check
setInterval(async () => {
  const stats = await fetch('/api/sessions/stats/summary');
  const data = await stats.json();

  if (data.activeSessions > 50) {
    console.warn('High number of active sessions');
  }

  if (data.errorSessions > 10) {
    console.error('Multiple session errors detected');
  }
}, 60000);
```

### 5. Handle Session Errors

```javascript
try {
  const response = await fetch(`/api/sessions/${id}/message`, {
    method: 'POST',
    body: JSON.stringify({ prompt: 'Process task' })
  });

  if (!response.ok) {
    // Session may be terminated or in error state
    const session = await fetch(`/api/sessions/${id}`);
    const data = await session.json();

    if (data.status === 'error' || data.status === 'terminated') {
      // Create new session or handle error
    }
  }
} catch (error) {
  console.error('Session execution failed:', error);
}
```

## Production Deployment

### Container Requirements

For production deployment, each session should run in a sandboxed container:

- **Runtime**: Node.js 18+ or Python 3.10+
- **Resources**: 1 GiB RAM, 5 GiB disk, 1 CPU (adjust based on workload)
- **Network**: Outbound HTTPS to `api.anthropic.com`
- **Environment**: Claude Code CLI installed (`npm install -g @anthropic-ai/claude-code`)

### Recommended Providers

- [Cloudflare Sandboxes](https://github.com/cloudflare/sandbox-sdk)
- [Modal Sandboxes](https://modal.com/docs/guide/sandbox)
- [E2B](https://e2b.dev/)
- [Fly Machines](https://fly.io/docs/machines/)
- [Daytona](https://www.daytona.io/)

### Environment Variables

```bash
# Backend .env
ANTHROPIC_API_KEY=your_key_here
DATABASE_URL=postgresql://user:pass@host:5432/db
NODE_ENV=production
PORT=3001
AGENT_WORKSPACE=/app/workspace

# Session limits (optional defaults)
DEFAULT_MAX_IDLE_TIME_MS=1800000
DEFAULT_MAX_LIFETIME_MS=86400000
DEFAULT_MAX_BUDGET_USD=5.00
```

### Database Migration

```bash
# Apply schema changes
docker-compose down -v
docker-compose up -d

# Or run migration manually
psql -U agent_user -d agent_db -f backend/db/schema.sql
```

## Cost Optimization

### Pattern Comparison

| Pattern | Avg Cost/Session | Container Uptime | Best For |
|---------|------------------|------------------|----------|
| Ephemeral | $0.10 - $0.50 | Minutes | Batch tasks |
| Long-Running | $5 - $50/day | 24 hours | Real-time services |
| Hybrid | $0.50 - $2.00 | Hours (intermittent) | User interaction |
| Single-Container | Varies | Duration of simulation | Multi-agent |

### Cost Tracking

All sessions automatically track:
- Total cost (from SDK)
- Input/output tokens
- Number of turns
- Tools used

Export cost data:

```javascript
const session = await fetch(`/api/sessions/${id}`);
const data = await session.json();

console.log(`Session cost: $${data.totalCost}`);
console.log(`Total tokens: ${data.totalTokens}`);
console.log(`Turns: ${data.numTurns}`);
console.log(`Tools: ${data.toolsUsed.join(', ')}`);
```

## Troubleshooting

### Session Won't Start

Check session status:

```javascript
const session = await fetch(`/api/sessions/${id}`);
const data = await session.json();

if (data.status === 'initializing') {
  // Still starting, wait a moment
} else if (data.status === 'error') {
  // Check logs for error details
}
```

### Session Terminated Unexpectedly

Check termination reason:

```javascript
const session = await fetch(`/api/sessions/${id}`);
const data = await session.json();

if (data.status === 'terminated') {
  // Check timestamps to determine cause
  if (data.totalCost >= data.maxBudgetUsd) {
    console.log('Budget limit reached');
  } else if (data.numTurns >= data.maxTurns) {
    console.log('Turn limit reached');
  }
}
```

### High Memory Usage

Monitor active sessions:

```bash
# Check active session count
curl http://localhost:3333/api/sessions/stats/summary | jq '.activeSessions'

# List long-running sessions
curl http://localhost:3333/api/sessions?pattern=long-running&status=active
```

## Future Enhancements

Potential improvements to consider:

1. **Session Pooling**: Pre-warm containers for faster startup
2. **Auto-Scaling**: Scale containers based on demand
3. **Session Sharing**: Share sessions across multiple users
4. **Snapshot/Restore**: Save and restore session state
5. **Distributed Sessions**: Run sessions across multiple servers
6. **Webhook Notifications**: Notify on session events
7. **Rate Limiting**: Per-user session limits
8. **Cost Alerts**: Notify when approaching budget limits

## References

- [Official Hosting Guide](https://docs.anthropic.com/en/docs/agent-sdk/hosting)
- [Agent SDK Documentation](https://docs.anthropic.com/en/docs/agent-sdk)
- [Session Management Guide](https://docs.anthropic.com/en/docs/agent-sdk/sessions)
- [Cost Tracking Guide](https://docs.anthropic.com/en/docs/agent-sdk/cost-tracking)
