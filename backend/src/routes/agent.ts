import { Router, Request, Response } from 'express';
import { query } from '@anthropic-ai/claude-agent-sdk';
import pool from '../../db/client';

const router = Router();

// Helper function to build SDK options from config
function buildSdkOptions(config: any) {
  const options: any = {
    // Core settings
    model: config.model || 'claude-3-5-sonnet-20241022',
    systemPrompt: config.systemPrompt || config.system, // Support both formats

    // Agent behavior
    maxTurns: config.maxTurns || 20,
  };

  // Add optional parameters only if they're defined
  if (config.maxBudgetUsd !== undefined) {
    options.maxBudgetUsd = config.maxBudgetUsd;
  }

  if (config.maxThinkingTokens !== undefined) {
    options.maxThinkingTokens = config.maxThinkingTokens;
  }

  // Permissions & Security
  options.permissionMode = config.permissionMode || 'acceptEdits';

  if (config.allowDangerouslySkipPermissions !== undefined) {
    options.allowDangerouslySkipPermissions = config.allowDangerouslySkipPermissions;
  }

  // Tools
  if (config.allowedTools && config.allowedTools.length > 0) {
    options.allowedTools = config.allowedTools;
  } else {
    // Default tool set
    options.allowedTools = [
      'Read', 'Write', 'Edit', 'Glob', 'Grep',
      'Bash', 'BashOutput', 'KillShell',
      'WebFetch', 'WebSearch',
      'TodoWrite', 'Task'
    ];
  }

  if (config.disallowedTools && config.disallowedTools.length > 0) {
    options.disallowedTools = config.disallowedTools;
  }

  // Workspace
  options.cwd = config.workingDirectory || process.env.AGENT_WORKSPACE || '/app/workspace';

  if (config.additionalDirectories && config.additionalDirectories.length > 0) {
    options.additionalDirectories = config.additionalDirectories;
  }

  if (config.env && Object.keys(config.env).length > 0) {
    options.env = config.env;
  }

  if (config.executable) {
    options.executable = config.executable;
  }

  if (config.executableArgs && config.executableArgs.length > 0) {
    options.executableArgs = config.executableArgs;
  }

  // Session Management
  if (config.continueSession !== undefined) {
    options.continue = config.continueSession;
  }

  if (config.resumeSessionId) {
    options.resume = config.resumeSessionId;
  }

  if (config.resumeAtMessageId) {
    options.resumeSessionAt = config.resumeAtMessageId;
  }

  if (config.forkSession !== undefined) {
    options.forkSession = config.forkSession;
  }

  // Advanced
  if (config.fallbackModel) {
    options.fallbackModel = config.fallbackModel;
  }

  if (config.mcpServers && Object.keys(config.mcpServers).length > 0) {
    options.mcpServers = config.mcpServers;
  }

  if (config.strictMcpConfig !== undefined) {
    options.strictMcpConfig = config.strictMcpConfig;
  }

  if (config.customAgents && Object.keys(config.customAgents).length > 0) {
    options.agents = config.customAgents;
  }

  if (config.hooks && Object.keys(config.hooks).length > 0) {
    options.hooks = config.hooks;
  }

  if (config.plugins && config.plugins.length > 0) {
    options.plugins = config.plugins;
  }

  // Skills Configuration
  if (config.settingSources && config.settingSources.length > 0) {
    options.settingSources = config.settingSources;
  }

  return options;
}

// Agent SDK streaming endpoint
router.post('/stream', async (req: Request, res: Response) => {
  try {
    const { messages, config, conversationId } = req.body;
    const startTime = Date.now();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Extract the last user message as the prompt
    const userPrompt = messages[messages.length - 1]?.content || '';

    let finalResult: any = null;
    let inputTokens = 0;
    let outputTokens = 0;
    let cacheCreationTokens = 0;
    let cacheReadTokens = 0;
    let toolsUsed: string[] = [];
    let sessionId: string | null = null;

    // Build SDK options from config
    const sdkOptions = buildSdkOptions(config);
    sdkOptions.includePartialMessages = true; // Enable streaming

    // Pass conversation history if available (all messages except the last)
    if (messages.length > 1) {
      sdkOptions.conversationHistory = messages.slice(0, -1).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));
    }

    for await (const msg of query({
      prompt: userPrompt,
      options: sdkOptions
    })) {
      // Track tools used from stream events and assistant messages
      if (msg.type === 'stream_event') {
        // Tool use detected in streaming content block
        if (msg.event?.type === 'content_block_start' && msg.event?.content_block?.type === 'tool_use') {
          const toolName = msg.event.content_block.name;
          if (toolName && !toolsUsed.includes(toolName)) {
            toolsUsed.push(toolName);
          }
          // Send tool_start event to frontend
          res.write(`data: ${JSON.stringify({
            type: 'tool_start',
            tool_name: toolName,
            tool_use_id: msg.event.content_block.id,
            input: msg.event.content_block.input,
            timestamp: new Date().toISOString()
          })}\n\n`);
        }

        // Tool result detected (completion or error)
        // NOTE: Commented out - SDK 0.68.0 no longer has 'tool_result' content block type
        // if (msg.event?.type === 'content_block_start' && msg.event?.content_block?.type === 'tool_result') {
        //   res.write(`data: ${JSON.stringify({
        //     type: 'tool_complete',
        //     tool_use_id: msg.event.content_block.tool_use_id,
        //     content: msg.event.content_block.content,
        //     is_error: msg.event.content_block.is_error || false,
        //     timestamp: new Date().toISOString()
        //   })}\n\n`);
        // }
      }

      // Stream different message types to client
      if (msg.type === 'stream_event') {
        // Partial message chunks during streaming
        res.write(`data: ${JSON.stringify({
          type: 'content_block_delta',
          data: msg.event,
          uuid: msg.uuid,
          session_id: msg.session_id
        })}\n\n`);
      } else if (msg.type === 'assistant') {
        // Complete assistant message
        res.write(`data: ${JSON.stringify({
          type: 'message',
          data: {
            role: 'assistant',
            content: msg.message.content
          },
          uuid: msg.uuid,
          session_id: msg.session_id
        })}\n\n`);
      } else if (msg.type === 'system') {
        // System messages (init, hook_response, compact_boundary)
        sessionId = msg.session_id || null;

        if (msg.subtype === 'init') {
          // Send complete system info to frontend
          res.write(`data: ${JSON.stringify({
            type: 'system_init',
            data: {
              session_id: msg.session_id,
              cwd: msg.cwd,
              tools: msg.tools,
              mcp_servers: msg.mcp_servers,
              model: msg.model,
              permissionMode: msg.permissionMode,
              agents: msg.agents,
              plugins: msg.plugins
            },
            uuid: msg.uuid
          })}\n\n`);
        } else if (msg.subtype === 'hook_response') {
          // Hook execution result
          res.write(`data: ${JSON.stringify({
            type: 'hook_response',
            data: {
              hook_name: msg.hook_name,
              hook_event: msg.hook_event,
              stdout: msg.stdout,
              stderr: msg.stderr,
              exit_code: msg.exit_code
            },
            uuid: msg.uuid,
            session_id: msg.session_id
          })}\n\n`);
        } else if (msg.subtype === 'compact_boundary') {
          // Conversation compaction event
          res.write(`data: ${JSON.stringify({
            type: 'compact_boundary',
            data: msg.compact_metadata,
            uuid: msg.uuid,
            session_id: msg.session_id
          })}\n\n`);
        }
      } else if (msg.type === 'tool_progress') {
        // Tool progress update
        res.write(`data: ${JSON.stringify({
          type: 'tool_progress',
          tool_name: msg.tool_name,
          tool_use_id: msg.tool_use_id,
          elapsed_seconds: msg.elapsed_time_seconds,
          uuid: msg.uuid,
          session_id: msg.session_id
        })}\n\n`);
      } // NOTE: Removed 'status' message type handling - SDK 0.68.0 no longer has this type
      // else if (msg.type === 'status') {
      //   // Status update (thinking, tool_executing, waiting)
      //   res.write(`data: ${JSON.stringify({
      //     type: 'status',
      //     status: msg.status,
      //     message: msg.message,
      //     uuid: msg.uuid,
      //     session_id: msg.session_id
      //   })}\n\n`);
      // }
      else if (msg.type === 'result') {
        // Final result with usage stats
        finalResult = msg;

        const latency = Date.now() - startTime;

        inputTokens = msg.usage.input_tokens;
        outputTokens = msg.usage.output_tokens;
        cacheCreationTokens = msg.usage.cache_creation_input_tokens || 0;
        cacheReadTokens = msg.usage.cache_read_input_tokens || 0;

        // Log to database
        if (conversationId) {
          await pool.query(
            `INSERT INTO usage_logs (
              conversation_id, model, input_tokens, output_tokens,
              latency_ms, cost_usd, stop_reason,
              num_turns, api_latency_ms,
              cache_creation_tokens, cache_read_tokens, permission_denials,
              tools_used
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
              conversationId,
              config.model || 'claude-3-5-sonnet-20241022',
              inputTokens,
              outputTokens,
              latency,
              msg.total_cost_usd,
              msg.is_error ? 'error' : 'end_turn',
              msg.num_turns || 1,
              null, // SDK doesn't expose API-only latency separately
              cacheCreationTokens,
              cacheReadTokens,
              msg.permission_denials ? JSON.stringify(msg.permission_denials) : JSON.stringify([]),
              toolsUsed
            ]
          );
        }

        res.write(`data: ${JSON.stringify({
          type: 'done',
          latency,
          usage: {
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            cache_creation_tokens: cacheCreationTokens,
            cache_read_tokens: cacheReadTokens
          },
          cost: msg.total_cost_usd,
          num_turns: msg.num_turns,
          is_error: msg.is_error,
          session_id: sessionId,
          tools_used: toolsUsed,
          permission_denials: msg.permission_denials || [],
          timestamp: new Date().toISOString()
        })}\n\n`);
        res.end();
      }
    }
  } catch (error: any) {
    console.error('Agent SDK stream error:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message,
      name: error.name
    })}\n\n`);
    res.end();
  }
});

// Agent SDK batch (non-streaming) endpoint
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { messages, config, conversationId } = req.body;
    const startTime = Date.now();

    // Extract the last user message as the prompt
    const userPrompt = messages[messages.length - 1]?.content || '';

    let finalResult: any = null;
    let assistantMessage: any = null;
    let toolsUsed: string[] = [];
    let sessionId: string | null = null;

    // Build SDK options from config
    const sdkOptions = buildSdkOptions(config);
    sdkOptions.includePartialMessages = false; // Disable streaming for batch mode

    // Pass conversation history if available (all messages except the last)
    if (messages.length > 1) {
      sdkOptions.conversationHistory = messages.slice(0, -1).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));
    }

    for await (const msg of query({
      prompt: userPrompt,
      options: sdkOptions
    })) {
      if (msg.type === 'system') {
        sessionId = msg.session_id || null;
      } else if (msg.type === 'assistant') {
        assistantMessage = msg;
        // Extract tool names from content blocks
        if (msg.message?.content) {
          const content = Array.isArray(msg.message.content) ? msg.message.content : [msg.message.content];
          content.forEach((block: any) => {
            if (block.type === 'tool_use' && block.name && !toolsUsed.includes(block.name)) {
              toolsUsed.push(block.name);
            }
          });
        }
      } else if (msg.type === 'result') {
        finalResult = msg;
      }
    }

    const latency = Date.now() - startTime;

    // Log usage
    if (conversationId && finalResult) {
      await pool.query(
        `INSERT INTO usage_logs (
          conversation_id, model, input_tokens, output_tokens,
          latency_ms, cost_usd, stop_reason,
          num_turns, api_latency_ms,
          cache_creation_tokens, cache_read_tokens, permission_denials,
          tools_used
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          conversationId,
          config.model || 'claude-3-5-sonnet-20241022',
          finalResult.usage.input_tokens,
          finalResult.usage.output_tokens,
          latency,
          finalResult.total_cost_usd,
          finalResult.is_error ? 'error' : 'end_turn',
          finalResult.num_turns || 1,
          null,
          finalResult.usage.cache_creation_input_tokens || 0,
          finalResult.usage.cache_read_input_tokens || 0,
          finalResult.permission_denials ? JSON.stringify(finalResult.permission_denials) : JSON.stringify([]),
          toolsUsed
        ]
      );
    }

    res.json({
      response: assistantMessage?.message || null,
      latency,
      usage: finalResult?.usage || null,
      cost: finalResult?.total_cost_usd || 0,
      num_turns: finalResult?.num_turns || 1,
      is_error: finalResult?.is_error || false,
      session_id: sessionId,
      tools_used: toolsUsed,
      permission_denials: finalResult?.permission_denials || [],
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Agent SDK error:', error);
    res.status(500).json({
      error: error.message,
      type: error.name,
    });
  }
});

export default router;
