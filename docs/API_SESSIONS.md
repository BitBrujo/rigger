# Session API Reference

Quick reference for the Session Management API.

> **Implementation Status**: This document describes both **implemented** and **planned** features. See each endpoint for status.
>
> **Note**: Sessions are typically **auto-created** by `/api/agent/stream` - you rarely need to call `POST /api/sessions` directly.

## Base URL

```
/api/sessions
```

## Endpoints

### Create Session

**Status**: ✅ Implemented (rarely used - sessions auto-created by `/api/agent/stream`)

```http
POST /api/sessions
```

**Request Body:**

```json
{
  "config": {
    "model": "claude-3-5-sonnet-20241022",
    "systemPrompt": "Your system prompt",
    "maxTurns": 20,
    "allowedTools": ["Read", "Write", "Edit", "Bash"],
    "workingDirectory": "/app/workspace"
  },
  "conversationId": 123  // Optional - link to conversation
}
```

**Response:**

```json
{
  "success": true,
  "session": {
    "id": "a1b2c3d4-e5f6-...",
    "sdkSessionId": null,
    "status": "initializing",
    "conversationId": 123,
    "config": { ... },
    "createdAt": "2025-01-15T10:00:00.000Z",
    "totalCost": 0,
    "totalTokens": 0,
    "numTurns": 0,
    "toolsUsed": [],
    "abortRequested": false,
    "forceKillRequested": false
  }
}
```

### List Sessions

**Status**: ✅ Implemented

```http
GET /api/sessions?status=active&conversationId=123&limit=50
```

**Query Parameters:**
- `status` - Filter by status (initializing, active, idle, stopping, completed, error, terminated)
- `conversationId` - Filter by conversation ID
- `limit` - Max results (default: 50)

**Response:**

```json
{
  "success": true,
  "sessions": [
    {
      "id": "a1b2c3d4-...",
      "sdkSessionId": "sdk_xyz...",
      "status": "active",
      "conversationId": 123,
      "totalCost": 0.35,
      "totalTokens": 18500,
      "numTurns": 3,
      "toolsUsed": ["Read", "Edit"],
      "currentTool": "Bash",
      "createdAt": "2025-01-15T10:00:00.000Z",
      "lastActivityAt": "2025-01-15T10:05:00.000Z"
    }
  ],
  "count": 15
}
```

### Get Session

**Status**: ✅ Implemented

```http
GET /api/sessions/:id
```

**Response:**

```json
{
  "success": true,
  "session": {
    "id": "a1b2c3d4-...",
    "sdkSessionId": "sdk_xyz...",
    "status": "active",
    "conversationId": 123,
    "config": { ... },
    "createdAt": "2025-01-15T10:00:00.000Z",
    "startedAt": "2025-01-15T10:00:05.000Z",
    "lastActivityAt": "2025-01-15T10:05:00.000Z",
    "completedAt": null,
    "terminatedAt": null,
    "terminationReason": null,
    "totalCost": 0.35,
    "totalTokens": 18500,
    "totalInputTokens": 12000,
    "totalOutputTokens": 6500,
    "totalCachedTokens": 5000,
    "numTurns": 3,
    "toolsUsed": ["Read", "Edit", "Bash"],
    "currentTool": "Bash",
    "messages": [...],
    "abortRequested": false,
    "forceKillRequested": false
  }
}
```

### Graceful Stop

**Status**: ✅ Implemented

```http
POST /api/sessions/:id/stop
```

Requests graceful shutdown - agent checks abort flag periodically and stops cleanly (typical delay: 1-5 seconds).

**Response:**

```json
{
  "success": true,
  "message": "Stop requested. Session will terminate gracefully.",
  "session": {
    "id": "a1b2c3d4-...",
    "status": "stopping",
    "abortRequested": true,
    ...
  }
}
```

### Force Kill

**Status**: ✅ Implemented

```http
POST /api/sessions/:id/force-kill
```

Emergency termination - immediately aborts execution, kills processes, cleans up resources.

**Response:**

```json
{
  "success": true,
  "message": "Session force killed",
  "session": {
    "id": "a1b2c3d4-...",
    "status": "terminated",
    "terminatedAt": "2025-01-15T10:30:00.000Z",
    "terminationReason": "emergency_stop",
    "abortRequested": true,
    "forceKillRequested": true,
    ...
  }
}
```

### Get Session Status

**Status**: ✅ Implemented

```http
GET /api/sessions/:id/status
```

Lightweight endpoint for polling session status (optimized for real-time UI updates).

**Response:**

```json
{
  "success": true,
  "status": "active",
  "currentTool": "Bash",
  "totalCost": 0.35,
  "totalTokens": 18500,
  "numTurns": 3,
  "lastActivityAt": "2025-01-15T10:05:00.000Z",
  "abortRequested": false,
  "forceKillRequested": false
}
```

### Update Session Metadata

**Status**: 📅 Planned

```http
PATCH /api/sessions/:id
```

Update session metadata (tags, description, etc.). Not yet implemented.

### Execute Message in Session

**Status**: 📅 Planned

```http
POST /api/sessions/:id/message
```

Execute message in specific session context. Use `/api/agent/stream` instead (auto-handles session creation/resumption).

### Delete Session

**Status**: ✅ Implemented

```http
DELETE /api/sessions/:id
```

Deletes session from database. If session is active, force-kills it first.

**Response:**

```json
{
  "success": true,
  "message": "Session deleted"
}
```

### Get Statistics

**Status**: 📅 Planned

```http
GET /api/sessions/stats/summary
```

Aggregate statistics across sessions. Not yet implemented - use `/api/analytics` endpoints for usage statistics.

## Session Statuses

- `initializing` - Session created, AbortController initialized
- `active` - Session running and executing agent queries
- `idle` - Session paused after response, can be resumed (5-min timeout)
- `stopping` - Graceful stop requested, agent checking abort flag
- `completed` - Session finished successfully
- `error` - Session encountered an error
- `terminated` - Session force-killed or emergency stopped

## Session Patterns

> **Implementation Status**: 📅 Pattern-specific lifecycle management is **planned** but not yet implemented.
>
> Currently, all sessions use a **generic 5-minute idle timeout** regardless of pattern. The `pattern` field exists in the database but doesn't affect behavior.
>
> Use `/api/agent/stream` for normal usage - it auto-creates sessions.

### Current Behavior (Implemented)

- **Auto-creation**: Sessions created automatically by `/api/agent/stream`
- **Idle timeout**: 5 minutes for all sessions
- **Cleanup**: Sessions marked idle after 5 minutes of inactivity
- **Emergency stop**: Two-tier (graceful + force kill) available for all sessions
- **Resumption**: Send same `sessionId` to resume within idle window

### Planned Pattern-Based Behavior

**Ephemeral** (planned):
- Auto-cleanup 1 minute after completion
- Best for: one-off tasks, batch processing

**Long-Running** (planned):
- Never auto-cleanup, manual termination required
- Best for: continuous services, monitoring

**Hybrid** (planned):
- Auto-cleanup after configurable idle timeout
- Best for: intermittent interaction, cost optimization

**Single-Container** (planned):
- Multiple agents in one session container
- Best for: multi-agent simulations

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

### Quick Agent Request (Auto-creates Session)

```javascript
async function askAgent(message, config) {
  // Sessions auto-created by /api/agent/stream
  const response = await fetch('/api/agent/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      config: {
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: 'You are a helpful assistant',
        maxTurns: 10,
        allowedTools: ['Read', 'Write', 'Edit'],
        ...config
      }
    })
  });

  // Handle SSE stream
  const reader = response.body.getReader();
  // ... process stream
}

await askAgent('Fix the authentication bug in src/auth/user.ts');
```

### Resume Existing Session

```javascript
async function resumeSession(sessionId, message) {
  const response = await fetch('/api/agent/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      sessionId,  // Pass existing session ID to resume
      config: { /* config from original session */ }
    })
  });

  // Session status updated to 'active', abort signal reconnected
}
```

### Emergency Stop

```javascript
async function stopSession(sessionId, emergency = false) {
  const endpoint = emergency ? 'force-kill' : 'stop';

  const response = await fetch(`/api/sessions/${sessionId}/${endpoint}`, {
    method: 'POST'
  }).then(r => r.json());

  console.log(response.message);
  // Graceful: "Stop requested. Session will terminate gracefully."
  // Force: "Session force killed"
}

// Request graceful stop (5-second grace period)
await stopSession('session-id-123', false);

// Emergency termination (immediate)
await stopSession('session-id-123', true);
```

### Poll Session Status

```javascript
async function monitorSession(sessionId) {
  const interval = setInterval(async () => {
    const status = await fetch(`/api/sessions/${sessionId}/status`)
      .then(r => r.json());

    console.log(`Status: ${status.status}`);
    console.log(`Current tool: ${status.currentTool || 'none'}`);
    console.log(`Cost: $${status.totalCost.toFixed(4)}`);

    if (['completed', 'error', 'terminated'].includes(status.status)) {
      clearInterval(interval);
    }
  }, 1000);  // Poll every second
}
```
