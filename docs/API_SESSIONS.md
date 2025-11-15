# Session API Reference

Quick reference for the Session Management API.

## Base URL

```
/api/sessions
```

## Endpoints

### Create Session

```http
POST /api/sessions
```

**Request Body:**

```json
{
  "pattern": "ephemeral" | "long-running" | "hybrid" | "single-container",
  "config": {
    "model": "claude-3-5-sonnet-20241022",
    "systemPrompt": "Your system prompt",
    "maxTurns": 20,
    "allowedTools": ["Read", "Write", "Edit", "Bash"],
    "workingDirectory": "/app/workspace"
  },
  "conversationId": 123,
  "maxIdleTimeMs": 1800000,
  "maxLifetimeMs": 86400000,
  "maxBudgetUsd": 5.00,
  "maxTurns": 50,
  "tags": ["bug-fix", "urgent"],
  "description": "Fix authentication bug",
  "userId": "user_123"
}
```

**Response:**

```json
{
  "id": "sess_abc123",
  "sessionId": "",
  "pattern": "ephemeral",
  "status": "initializing",
  "config": { ... },
  "createdAt": "2025-01-15T10:00:00Z",
  "totalCost": 0,
  "totalTokens": 0,
  "numTurns": 0,
  "toolsUsed": []
}
```

### List Sessions

```http
GET /api/sessions?pattern=ephemeral&status=active&userId=user_123&tags=bug-fix,urgent&page=1&pageSize=50
```

**Response:**

```json
{
  "sessions": [
    {
      "id": "sess_abc123",
      "pattern": "ephemeral",
      "status": "active",
      ...
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 50
}
```

### Get Session

```http
GET /api/sessions/:id
```

**Response:**

```json
{
  "id": "sess_abc123",
  "sessionId": "sdk_sess_xyz789",
  "pattern": "ephemeral",
  "status": "active",
  "conversationId": 42,
  "config": { ... },
  "createdAt": "2025-01-15T10:00:00Z",
  "startedAt": "2025-01-15T10:00:05Z",
  "lastActivityAt": "2025-01-15T10:05:00Z",
  "totalCost": 0.35,
  "totalTokens": 18500,
  "numTurns": 3,
  "toolsUsed": ["Read", "Edit", "Bash"],
  "maxIdleTimeMs": 1800000,
  "maxBudgetUsd": 0.50,
  "description": "Fix authentication bug",
  "tags": ["bug-fix", "auth"]
}
```

### Update Session

```http
PATCH /api/sessions/:id
```

**Request Body:**

```json
{
  "status": "idle",
  "tags": ["completed", "verified"],
  "description": "Bug fix completed and verified"
}
```

**Response:**

```json
{
  "id": "sess_abc123",
  "status": "idle",
  "tags": ["completed", "verified"],
  "description": "Bug fix completed and verified",
  ...
}
```

### Execute Message

```http
POST /api/sessions/:id/message
```

**Request Body:**

```json
{
  "prompt": "Fix the authentication bug in src/auth/user.ts",
  "streaming": true
}
```

**Streaming Response (SSE):**

```
data: {"type":"stream_event","data":{...}}
data: {"type":"message","data":{...}}
data: {"type":"done","latency":5300,"usage":{...},"cost":0.35}
```

**Batch Response (JSON):**

```json
{
  "response": {
    "role": "assistant",
    "content": "I've fixed the authentication bug..."
  },
  "result": {
    "uuid": "msg_xyz",
    "total_cost_usd": 0.35,
    "usage": { ... }
  },
  "latency": 5300,
  "session": {
    "id": "sess_abc123",
    "totalCost": 0.35,
    "numTurns": 1,
    ...
  }
}
```

### Terminate Session

```http
POST /api/sessions/:id/terminate
```

**Request Body:**

```json
{
  "reason": "user_requested" | "idle_timeout" | "budget_exceeded" | "max_turns" | "error"
}
```

**Response:**

```json
{
  "session": {
    "id": "sess_abc123",
    "status": "terminated",
    "terminatedAt": "2025-01-15T10:30:00Z",
    ...
  },
  "reason": "user_requested"
}
```

### Delete Session

```http
DELETE /api/sessions/:id
```

**Response:**

```json
{
  "success": true,
  "id": "sess_abc123"
}
```

### Get Statistics

```http
GET /api/sessions/stats/summary
```

**Response:**

```json
{
  "totalSessions": 150,
  "activeSessions": 12,
  "completedSessions": 130,
  "errorSessions": 8,
  "totalCost": 45.32,
  "totalTokens": 2500000,
  "avgSessionDuration": 3600000,
  "byPattern": {
    "ephemeral": {
      "count": 100,
      "avgCost": 0.25,
      "avgTokens": 15000,
      "avgDuration": 120000
    },
    "long-running": {
      "count": 10,
      "avgCost": 8.50,
      "avgTokens": 450000,
      "avgDuration": 28800000
    },
    "hybrid": {
      "count": 40,
      "avgCost": 0.80,
      "avgTokens": 45000,
      "avgDuration": 7200000
    }
  }
}
```

## Session Statuses

- `initializing` - Session created but SDK not yet started
- `active` - Session running and accepting messages
- `idle` - Session inactive but can be resumed
- `completed` - Session finished successfully
- `error` - Session encountered an error
- `terminated` - Session manually or automatically terminated

## Session Patterns

### Ephemeral

**Best for**: One-off tasks, batch processing

**Auto-cleanup**: Deleted 1 minute after completion

**Example**:
```javascript
const session = await createSession({
  pattern: 'ephemeral',
  maxIdleTimeMs: 300000,  // 5 minutes
  maxBudgetUsd: 0.50
});
```

### Long-Running

**Best for**: Continuous services, real-time monitoring

**Auto-cleanup**: Never (manual termination required)

**Example**:
```javascript
const session = await createSession({
  pattern: 'long-running',
  maxLifetimeMs: 86400000,  // 24 hours
  maxBudgetUsd: 10.00
});
```

### Hybrid

**Best for**: Intermittent interaction, cost optimization

**Auto-cleanup**: After idle timeout

**Example**:
```javascript
const session = await createSession({
  pattern: 'hybrid',
  conversationId: 123,
  maxIdleTimeMs: 1800000,  // 30 minutes
  config: {
    resumeSessionId: 'sess_previous'
  }
});
```

### Single-Container

**Best for**: Multi-agent simulations, agent collaboration

**Auto-cleanup**: Never (manual termination required)

**Example**:
```javascript
const session = await createSession({
  pattern: 'single-container',
  config: {
    customAgents: {
      'agent1': { systemPrompt: '...' },
      'agent2': { systemPrompt: '...' }
    }
  }
});
```

## Error Handling

### Session Not Found

```json
{
  "error": "Session not found",
  "id": "sess_abc123"
}
```

### Invalid Pattern

```json
{
  "error": "Invalid pattern",
  "validPatterns": ["ephemeral", "long-running", "hybrid", "single-container"]
}
```

### Session Not Active

```json
{
  "error": "Session is not active",
  "status": "completed"
}
```

## Rate Limits

Currently no rate limits are enforced, but consider implementing:

- Max 100 active sessions per user
- Max 10 new sessions per minute per user
- Max 1000 messages per session

## Best Practices

1. **Set appropriate limits**: Always set `maxBudgetUsd` and `maxTurns`
2. **Tag sessions**: Use tags for filtering and analysis
3. **Clean up**: Manually terminate long-running sessions when done
4. **Monitor stats**: Regularly check `/stats/summary` for health
5. **Handle errors**: Check session status before sending messages
6. **Use streaming**: For better UX in interactive applications

## Examples

### Quick Bug Fix (Ephemeral)

```javascript
async function fixBug(description) {
  // Create session
  const session = await fetch('/api/sessions', {
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
      tags: ['bug-fix'],
      description
    })
  }).then(r => r.json());

  // Execute fix
  const response = await fetch(`/api/sessions/${session.id}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Fix: ${description}`,
      streaming: false
    })
  }).then(r => r.json());

  return response;
}

await fixBug('Authentication timeout in user service');
```

### Email Monitor (Long-Running)

```javascript
async function startEmailMonitor() {
  // Create session
  const session = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pattern: 'long-running',
      config: {
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: 'Triage incoming emails',
        maxTurns: 1000,
        allowedTools: ['WebFetch', 'Write']
      },
      maxLifetimeMs: 86400000,  // 24 hours
      maxBudgetUsd: 10.00,
      tags: ['email', 'automation'],
      description: 'Email triage agent'
    })
  }).then(r => r.json());

  // Process emails continuously
  while (true) {
    const emails = await fetchNewEmails();

    for (const email of emails) {
      await fetch(`/api/sessions/${session.id}/message`, {
        method: 'POST',
        body: JSON.stringify({
          prompt: `Triage: ${email.subject}`,
          streaming: true
        })
      });
    }

    await new Promise(r => setTimeout(r, 60000)); // Check every minute
  }
}
```

### Research Assistant (Hybrid)

```javascript
async function askResearchQuestion(conversationId, question) {
  // Check for existing session
  let sessionId = localStorage.getItem(`research_session_${conversationId}`);
  let session;

  if (sessionId) {
    // Try to get existing session
    try {
      session = await fetch(`/api/sessions/${sessionId}`).then(r => r.json());

      // If terminated/completed, create new one
      if (session.status === 'terminated' || session.status === 'completed') {
        session = null;
      }
    } catch {
      session = null;
    }
  }

  // Create new session if needed
  if (!session) {
    session = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pattern: 'hybrid',
        conversationId,
        config: {
          model: 'claude-3-5-sonnet-20241022',
          systemPrompt: 'Deep research assistant',
          maxTurns: 50,
          allowedTools: ['WebSearch', 'WebFetch', 'Write', 'Read']
        },
        maxIdleTimeMs: 1800000,  // 30 minutes
        maxBudgetUsd: 2.00,
        tags: ['research'],
        description: 'Research session'
      })
    }).then(r => r.json());

    localStorage.setItem(`research_session_${conversationId}`, session.id);
  }

  // Ask question
  const response = await fetch(`/api/sessions/${session.id}/message`, {
    method: 'POST',
    body: JSON.stringify({
      prompt: question,
      streaming: true
    })
  });

  return response;
}
```
