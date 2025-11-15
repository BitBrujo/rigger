/**
 * Session Pattern Examples
 *
 * Demonstrates the four hosting patterns for Claude Agent SDK
 */

const API_BASE = 'http://localhost:3333/api';

// ============================================================================
// Pattern 1: Ephemeral Sessions
// ============================================================================

/**
 * Example: Bug Fix Agent
 * Creates a short-lived session to fix a specific bug
 */
async function ephemeralBugFix(bugDescription, filePath) {
  console.log('🔧 Starting ephemeral bug fix session...');

  // Create ephemeral session
  const session = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pattern: 'ephemeral',
      config: {
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: 'You are an expert debugging assistant. Fix bugs efficiently and verify the fix works.',
        maxTurns: 10,
        allowedTools: ['Read', 'Edit', 'Bash', 'Grep', 'Write'],
        workingDirectory: '/app/workspace',
      },
      maxIdleTimeMs: 300000,  // 5 minutes max
      maxBudgetUsd: 0.50,     // $0.50 budget
      maxTurns: 10,
      tags: ['bug-fix', 'automated'],
      description: `Fix: ${bugDescription}`,
    }),
  });

  const sessionData = await session.json();
  console.log(`✅ Session created: ${sessionData.id}`);

  // Execute bug fix
  const response = await fetch(`${API_BASE}/sessions/${sessionData.id}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Fix this bug: ${bugDescription}\nFile: ${filePath}\n\nPlease:\n1. Read the file\n2. Identify the issue\n3. Fix it\n4. Test the fix`,
      streaming: false,
    }),
  });

  const result = await response.json();

  console.log(`✅ Bug fix completed`);
  console.log(`Cost: $${result.session.totalCost}`);
  console.log(`Turns: ${result.session.numTurns}`);
  console.log(`Tools used: ${result.session.toolsUsed.join(', ')}`);

  // Session will auto-complete and clean up after 1 minute

  return result;
}

/**
 * Example: Invoice Processing
 * Process a batch of invoices
 */
async function ephemeralInvoiceProcessing(invoices) {
  console.log('📄 Processing invoices...');

  const results = [];

  for (const invoice of invoices) {
    const session = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pattern: 'ephemeral',
        config: {
          model: 'claude-3-5-haiku-20241022', // Use faster model for simple tasks
          systemPrompt: 'Extract structured data from invoices.',
          maxTurns: 5,
          allowedTools: ['Read', 'Write'],
        },
        maxBudgetUsd: 0.10,
        tags: ['invoice', 'batch-processing'],
        description: `Process invoice ${invoice.id}`,
      }),
    }).then((r) => r.json());

    const response = await fetch(`${API_BASE}/sessions/${session.id}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Extract invoice data from ${invoice.path} and save as JSON`,
        streaming: false,
      }),
    }).then((r) => r.json());

    results.push(response);
  }

  console.log(`✅ Processed ${results.length} invoices`);
  return results;
}

// ============================================================================
// Pattern 2: Long-Running Sessions
// ============================================================================

/**
 * Example: Email Monitor
 * Continuously monitor and triage emails
 */
async function longRunningEmailMonitor() {
  console.log('📧 Starting email monitor...');

  // Create long-running session
  const session = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pattern: 'long-running',
      config: {
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: `You are an email triage assistant. Classify emails as:
- Urgent: Requires immediate attention
- Important: Handle within 24 hours
- Normal: Can wait
- Spam: Ignore

Take appropriate actions based on urgency.`,
        maxTurns: 1000,
        allowedTools: ['WebFetch', 'Write', 'Bash'],
      },
      maxLifetimeMs: 86400000, // 24 hours
      maxBudgetUsd: 10.0,
      maxIdleTimeMs: 3600000, // 1 hour idle timeout
      tags: ['email', 'automation', 'monitoring'],
      description: 'Email triage agent',
    }),
  });

  const sessionData = await session.json();
  console.log(`✅ Email monitor session: ${sessionData.id}`);

  // Simulate continuous email processing
  let running = true;
  let emailCount = 0;

  while (running) {
    // Fetch new emails (simulated)
    const emails = await fetchNewEmails();

    for (const email of emails) {
      console.log(`Processing email: ${email.subject}`);

      const response = await fetch(`${API_BASE}/sessions/${sessionData.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Triage this email:\nFrom: ${email.from}\nSubject: ${email.subject}\nBody: ${email.body}`,
          streaming: true,
        }),
      });

      // Process streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'done') {
              emailCount++;
              console.log(`✅ Email processed (${emailCount} total)`);
            }
          }
        }
      }
    }

    // Wait before checking again
    await new Promise((resolve) => setTimeout(resolve, 60000)); // Check every minute

    // Check if we should stop (example: after 1 hour)
    if (emailCount > 100) {
      running = false;
    }
  }

  // Terminate session when done
  await fetch(`${API_BASE}/sessions/${sessionData.id}/terminate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reason: 'user_requested',
    }),
  });

  console.log('📧 Email monitor stopped');
}

async function fetchNewEmails() {
  // Simulated email fetching
  return [
    { from: 'user@example.com', subject: 'Urgent: Server down', body: 'Production server is not responding' },
    { from: 'newsletter@example.com', subject: 'Weekly digest', body: 'This week in tech...' },
  ];
}

/**
 * Example: Site Builder
 * Host custom websites per user
 */
async function longRunningSiteBuilder(userId, siteConfig) {
  console.log(`🌐 Starting site builder for user ${userId}...`);

  const session = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pattern: 'long-running',
      config: {
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: 'You are a website builder. Create and serve websites based on user requests.',
        maxTurns: 500,
        allowedTools: ['Read', 'Write', 'Edit', 'Bash'],
        workingDirectory: `/app/workspace/sites/${userId}`,
      },
      maxLifetimeMs: 2592000000, // 30 days
      maxBudgetUsd: 50.0,
      tags: ['site-builder', 'hosting'],
      description: `Site for user ${userId}`,
      userId,
    }),
  });

  const sessionData = await session.json();
  console.log(`✅ Site builder session: ${sessionData.id}`);

  // Build initial site
  await fetch(`${API_BASE}/sessions/${sessionData.id}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Build a ${siteConfig.type} website with ${siteConfig.pages.join(', ')} pages`,
      streaming: false,
    }),
  });

  return sessionData.id;
}

// ============================================================================
// Pattern 3: Hybrid Sessions
// ============================================================================

/**
 * Example: Project Manager
 * Intermittent interaction with state persistence
 */
async function hybridProjectManager(projectId, conversationId = null) {
  console.log('📋 Starting project manager...');

  // Check for existing session
  const existingSessions = await fetch(
    `${API_BASE}/sessions?tags=project-${projectId}&status=active`
  ).then((r) => r.json());

  let sessionData;

  if (existingSessions.sessions.length > 0) {
    // Resume existing session
    sessionData = existingSessions.sessions[0];
    console.log(`♻️ Resuming session: ${sessionData.id}`);
  } else {
    // Create new hybrid session
    const session = await fetch(`${API_BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pattern: 'hybrid',
        conversationId,
        config: {
          model: 'claude-3-5-sonnet-20241022',
          systemPrompt: `You are a project management assistant. Help track tasks, deadlines, and progress.
Maintain context of the project across interactions.`,
          maxTurns: 50,
          allowedTools: ['Read', 'Write', 'TodoWrite', 'WebSearch'],
          resumeSessionId: conversationId ? `conv_${conversationId}` : undefined,
        },
        maxIdleTimeMs: 1800000, // 30 minutes
        maxBudgetUsd: 2.0,
        tags: [`project-${projectId}`, 'management'],
        description: `Project ${projectId} manager`,
      }),
    });

    sessionData = await session.json();
    console.log(`✅ New session: ${sessionData.id}`);
  }

  return sessionData.id;
}

/**
 * Interact with project manager
 */
async function askProjectManager(sessionId, question) {
  const response = await fetch(`${API_BASE}/sessions/${sessionId}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: question,
      streaming: false,
    }),
  });

  return response.json();
}

/**
 * Example usage of hybrid project manager
 */
async function hybridProjectManagerDemo() {
  // Initial interaction
  const sessionId = await hybridProjectManager('proj_123');

  await askProjectManager(sessionId, 'Create a todo list for the API refactor project');
  await askProjectManager(sessionId, 'Add a task to update the authentication endpoints');

  // Session goes idle after 30 minutes...

  // Later (hours or days later), resume with context
  const resumedSessionId = await hybridProjectManager('proj_123');

  // Continue where we left off
  const status = await askProjectManager(resumedSessionId, 'What is the current status of the API refactor?');

  console.log('Project status:', status);
}

/**
 * Example: Research Assistant
 * Deep research with intermittent check-ins
 */
async function hybridResearchAssistant(topic, conversationId = null) {
  console.log(`🔍 Starting research on: ${topic}`);

  const session = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pattern: 'hybrid',
      conversationId,
      config: {
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: 'You are a research assistant. Conduct thorough research and maintain findings across sessions.',
        maxTurns: 100,
        allowedTools: ['WebSearch', 'WebFetch', 'Read', 'Write'],
      },
      maxIdleTimeMs: 3600000, // 1 hour
      maxBudgetUsd: 5.0,
      tags: ['research', topic],
      description: `Research: ${topic}`,
    }),
  });

  const sessionData = await session.json();

  // Start initial research
  await fetch(`${API_BASE}/sessions/${sessionData.id}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Research ${topic}. Compile findings into a comprehensive report.`,
      streaming: false,
    }),
  });

  console.log(`✅ Research session: ${sessionData.id}`);
  return sessionData.id;
}

// ============================================================================
// Pattern 4: Single-Container
// ============================================================================

/**
 * Example: Multi-Agent Simulation
 * Multiple agents interacting in a shared environment
 */
async function singleContainerSimulation() {
  console.log('🎮 Starting multi-agent simulation...');

  const session = await fetch(`${API_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pattern: 'single-container',
      config: {
        model: 'claude-3-5-sonnet-20241022',
        systemPrompt: 'You are the coordinator for a multi-agent simulation.',
        maxTurns: 200,
        allowedTools: ['Read', 'Write', 'Bash', 'Task'],
        customAgents: {
          player1: {
            systemPrompt: 'You are Player 1 in a strategy game. Be competitive but fair.',
            allowedTools: ['Read', 'Write', 'Bash'],
            model: 'claude-3-5-sonnet-20241022',
          },
          player2: {
            systemPrompt: 'You are Player 2 in a strategy game. Be strategic and thoughtful.',
            allowedTools: ['Read', 'Write', 'Bash'],
            model: 'claude-3-5-sonnet-20241022',
          },
          referee: {
            systemPrompt: 'You are the game referee. Enforce rules and judge outcomes.',
            allowedTools: ['Read', 'Write'],
            model: 'claude-3-5-haiku-20241022',
          },
        },
      },
      maxLifetimeMs: 7200000, // 2 hours
      maxBudgetUsd: 5.0,
      tags: ['simulation', 'game'],
      description: 'Strategy game simulation',
    }),
  });

  const sessionData = await session.json();
  console.log(`✅ Simulation session: ${sessionData.id}`);

  // Start the game
  const response = await fetch(`${API_BASE}/sessions/${sessionData.id}/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: `Initialize a turn-based strategy game between player1 and player2.
The referee should explain the rules and manage turns.
Play 10 rounds and declare a winner.`,
      streaming: true,
    }),
  });

  // Stream the simulation
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    console.log(chunk);
  }

  console.log('🎮 Simulation completed');
}

// ============================================================================
// Monitoring and Management
// ============================================================================

/**
 * Monitor session health
 */
async function monitorSessions() {
  const stats = await fetch(`${API_BASE}/sessions/stats/summary`).then((r) => r.json());

  console.log('\n📊 Session Statistics:');
  console.log(`Total Sessions: ${stats.totalSessions}`);
  console.log(`Active: ${stats.activeSessions}`);
  console.log(`Completed: ${stats.completedSessions}`);
  console.log(`Errors: ${stats.errorSessions}`);
  console.log(`Total Cost: $${stats.totalCost.toFixed(2)}`);
  console.log(`Total Tokens: ${stats.totalTokens.toLocaleString()}`);
  console.log(`Avg Duration: ${(stats.avgSessionDuration / 1000).toFixed(0)}s`);

  console.log('\n📈 By Pattern:');
  for (const [pattern, data] of Object.entries(stats.byPattern)) {
    console.log(`  ${pattern}:`);
    console.log(`    Count: ${data.count}`);
    console.log(`    Avg Cost: $${data.avgCost.toFixed(4)}`);
    console.log(`    Avg Tokens: ${data.avgTokens.toLocaleString()}`);
    console.log(`    Avg Duration: ${(data.avgDuration / 1000).toFixed(0)}s`);
  }

  // Alert on high usage
  if (stats.activeSessions > 50) {
    console.warn('⚠️ High number of active sessions!');
  }

  if (stats.errorSessions > 10) {
    console.error('🚨 Multiple session errors detected!');
  }
}

/**
 * Clean up idle sessions
 */
async function cleanupIdleSessions() {
  const idleSessions = await fetch(`${API_BASE}/sessions?status=idle`).then((r) => r.json());

  console.log(`🧹 Found ${idleSessions.total} idle sessions`);

  for (const session of idleSessions.sessions) {
    // Check if idle for more than 1 hour
    const idleTime = Date.now() - new Date(session.lastActivityAt).getTime();

    if (idleTime > 3600000) {
      console.log(`Terminating idle session: ${session.id}`);
      await fetch(`${API_BASE}/sessions/${session.id}/terminate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: 'idle_timeout',
        }),
      });
    }
  }
}

// ============================================================================
// Export examples
// ============================================================================

module.exports = {
  // Ephemeral
  ephemeralBugFix,
  ephemeralInvoiceProcessing,

  // Long-Running
  longRunningEmailMonitor,
  longRunningSiteBuilder,

  // Hybrid
  hybridProjectManager,
  askProjectManager,
  hybridProjectManagerDemo,
  hybridResearchAssistant,

  // Single-Container
  singleContainerSimulation,

  // Monitoring
  monitorSessions,
  cleanupIdleSessions,
};

// ============================================================================
// CLI Demo
// ============================================================================

if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'bug-fix':
      ephemeralBugFix('Authentication timeout', 'src/auth/user.ts');
      break;

    case 'email-monitor':
      longRunningEmailMonitor();
      break;

    case 'project-manager':
      hybridProjectManagerDemo();
      break;

    case 'simulation':
      singleContainerSimulation();
      break;

    case 'monitor':
      monitorSessions();
      break;

    case 'cleanup':
      cleanupIdleSessions();
      break;

    default:
      console.log('Usage: node session-patterns.js <command>');
      console.log('Commands: bug-fix, email-monitor, project-manager, simulation, monitor, cleanup');
  }
}
