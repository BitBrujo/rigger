import { Router, Request, Response } from 'express';
import { query } from '@anthropic-ai/claude-agent-sdk';
import pool from '../../db/client';

const router = Router();

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

    // Build conversation history for context (all messages except the last)
    const conversationHistory = messages.slice(0, -1);

    let finalResult: any = null;
    let inputTokens = 0;
    let outputTokens = 0;
    let cacheCreationTokens = 0;
    let cacheReadTokens = 0;

    for await (const msg of query({
      prompt: userPrompt,
      options: {
        model: config.model || 'claude-3-5-sonnet-20241022',
        systemPrompt: config.system || undefined,
        includePartialMessages: true, // Enable streaming
        cwd: process.env.AGENT_WORKSPACE || '/app/workspace',
        permissionMode: 'acceptEdits', // Auto-accept file edits for testing
        allowedTools: [
          'Read', 'Write', 'Edit', 'Grep', 'Glob',
          'Bash', 'BashOutput', 'KillShell',
          'WebFetch', 'WebSearch',
          'TodoWrite', 'Task'
        ],
        maxTurns: 20,
        // Note: SDK doesn't expose max_tokens or temperature directly
        // These are controlled at the model/SDK level
      }
    })) {
      // Stream different message types to client
      if (msg.type === 'stream_event') {
        // Partial message chunks during streaming
        res.write(`data: ${JSON.stringify({
          type: 'content_block_delta',
          data: msg.event
        })}\n\n`);
      } else if (msg.type === 'assistant') {
        // Complete assistant message
        res.write(`data: ${JSON.stringify({
          type: 'message',
          data: {
            role: 'assistant',
            content: msg.message.content
          }
        })}\n\n`);
      } else if (msg.type === 'system') {
        // System initialization message
        res.write(`data: ${JSON.stringify({
          type: 'system',
          data: {
            subtype: msg.subtype,
            session_id: msg.session_id
          }
        })}\n\n`);
      } else if (msg.type === 'result') {
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
              cache_creation_tokens, cache_read_tokens, permission_denials
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
              msg.permission_denials ? JSON.stringify(msg.permission_denials) : null
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

    for await (const msg of query({
      prompt: userPrompt,
      options: {
        model: config.model || 'claude-3-5-sonnet-20241022',
        systemPrompt: config.system || undefined,
        includePartialMessages: false, // Disable streaming for batch mode
        cwd: process.env.AGENT_WORKSPACE || '/app/workspace',
        permissionMode: 'acceptEdits',
        allowedTools: [
          'Read', 'Write', 'Edit', 'Grep', 'Glob',
          'Bash', 'BashOutput', 'KillShell',
          'WebFetch', 'WebSearch',
          'TodoWrite', 'Task'
        ],
        maxTurns: 20,
        // Note: SDK doesn't expose max_tokens or temperature directly
        // These are controlled at the model/SDK level
      }
    })) {
      if (msg.type === 'assistant') {
        assistantMessage = msg;
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
          cache_creation_tokens, cache_read_tokens, permission_denials
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
          finalResult.permission_denials ? JSON.stringify(finalResult.permission_denials) : null
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
