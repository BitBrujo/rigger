import { Router, Request, Response } from 'express';
import { query } from '@anthropic-ai/claude-agent-sdk';
import pool from '../../db/client';
import { sessionManager } from '../session-manager.js';
import fs from 'fs';
import path from 'path';

const router = Router();

// Helper function to build SDK options from config
function buildSdkOptions(config: any) {
  const options: any = {
    // Core settings
    model: config.model || 'claude-sonnet-4-20250514',
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
    // Filter out disabled agents
    const enabledAgents: Record<string, any> = {};
    Object.entries(config.customAgents).forEach(([name, agent]: [string, any]) => {
      if (agent.enabled !== false) {
        enabledAgents[name] = agent;
      }
    });
    if (Object.keys(enabledAgents).length > 0) {
      options.agents = enabledAgents;
    }
  }

  if (config.hooks && Object.keys(config.hooks).length > 0) {
    // Filter out disabled hooks
    const enabledHooks: Record<string, any> = {};
    Object.entries(config.hooks).forEach(([hookId, hook]: [string, any]) => {
      if (hook.enabled !== false) {
        enabledHooks[hookId] = hook;
      }
    });
    if (Object.keys(enabledHooks).length > 0) {
      options.hooks = enabledHooks;
    }
  }

  if (config.plugins && config.plugins.length > 0) {
    options.plugins = config.plugins;
  }

  // Skills Configuration
  if (config.settingSources && config.settingSources.length > 0) {
    options.settingSources = config.settingSources;
  }

  // Uploaded Files Integration
  if (config.uploadedFiles && config.uploadedFiles.length > 0) {
    const enabledFiles = config.uploadedFiles.filter((file: any) => file.enabled);

    if (enabledFiles.length > 0) {
      let fileContext = '';
      const uploadDir = path.join(options.cwd, '.rigger-uploads');

      enabledFiles.forEach((file: any) => {
        const integrationMethod = file.integrationMethod || 'working-directory';

        // Handle working-directory integration
        if (integrationMethod === 'working-directory' || integrationMethod === 'both') {
          try {
            // Create upload directory if it doesn't exist
            fs.mkdirSync(uploadDir, { recursive: true });

            // Copy file to working directory
            const destPath = path.join(uploadDir, file.filename);
            if (fs.existsSync(file.filePath)) {
              fs.copyFileSync(file.filePath, destPath);
              console.log(`[Files] Copied file to working directory: ${destPath}`);
            }
          } catch (err) {
            console.error(`[Files] Failed to copy file ${file.filename}:`, err);
          }
        }

        // Handle system-prompt integration
        if (integrationMethod === 'system-prompt' || integrationMethod === 'both') {
          const relativePath = `.rigger-uploads/${file.filename}`;
          fileContext += `\n- **${file.originalFilename}** (${(file.fileSizeBytes / 1024).toFixed(1)} KB)`;
          if (file.description) {
            fileContext += `: ${file.description}`;
          }
          fileContext += `\n  Path: \`${relativePath}\``;

          // Include content preview for small text files
          if (file.contentPreview && integrationMethod === 'system-prompt') {
            fileContext += `\n  Preview:\n  \`\`\`\n  ${file.contentPreview}\n  \`\`\``;
          }
        }
      });

      // Append file context to system prompt if any files use system-prompt integration
      if (fileContext) {
        options.systemPrompt = (options.systemPrompt || '') +
          `\n\n## Available Files\n\nThe following files have been uploaded for this conversation:${fileContext}\n\nYou can access these files using the Read tool or directly from the \`.rigger-uploads/\` directory.`;
      }

      console.log(`[Files] Integrated ${enabledFiles.length} files`);
    }
  }

  return options;
}

// Agent SDK streaming endpoint
router.post('/stream', async (req: Request, res: Response) => {
  let agentSessionId: string | null = null;

  try {
    const { messages, config, conversationId, sessionId: clientSessionId } = req.body;
    const startTime = Date.now();

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: 'No messages provided',
        name: 'ValidationError'
      })}\n\n`);
      res.end();
      return;
    }

    // Create or retrieve session
    if (clientSessionId) {
      // Resume existing session
      const existingSession = await sessionManager.getSession(clientSessionId);
      if (!existingSession) {
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: 'Session not found',
          name: 'SessionError'
        })}\n\n`);
        res.end();
        return;
      }
      agentSessionId = clientSessionId; // TypeScript knows clientSessionId is string here
      await sessionManager.updateStatus(clientSessionId, 'active');
    } else {
      // Create new session
      const newSession = await sessionManager.createSession(config, conversationId || null);
      agentSessionId = newSession.id;
    }

    // Ensure agentSessionId is set (should always be true at this point)
    if (!agentSessionId) {
      throw new Error('Failed to create or retrieve session');
    }

    // From this point forward, TypeScript knows agentSessionId is string
    const sessionId: string = agentSessionId;

    // Get abort signal for this session
    const abortSignal = sessionManager.getAbortSignal(sessionId);

    // Extract the last user message as the prompt
    const userPrompt = messages[messages.length - 1]?.content || '';

    let finalResult: any = null;
    let inputTokens = 0;
    let outputTokens = 0;
    let cacheCreationTokens = 0;
    let cacheReadTokens = 0;
    let toolsUsed: string[] = [];
    let sdkSessionId: string | null = null;

    // Query uploaded files if conversationId is provided
    if (conversationId) {
      try {
        const filesResult = await pool.query(
          `SELECT * FROM uploaded_files
           WHERE enabled = TRUE
           AND (is_global = TRUE OR conversation_id = $1)
           ORDER BY uploaded_at DESC`,
          [conversationId]
        );

        if (filesResult.rows.length > 0) {
          config.uploadedFiles = filesResult.rows.map((row: any) => ({
            id: row.id,
            filename: row.filename,
            originalFilename: row.original_filename,
            filePath: row.file_path,
            mimeType: row.mime_type,
            fileSizeBytes: row.file_size_bytes,
            isGlobal: row.is_global,
            conversationId: row.conversation_id,
            integrationMethod: row.integration_method,
            enabled: row.enabled,
            description: row.description,
            contentPreview: row.content_preview,
            uploadedAt: row.uploaded_at,
            lastAccessedAt: row.last_accessed_at,
            accessCount: row.access_count
          }));
          console.log(`[Files] Loaded ${filesResult.rows.length} files for conversation ${conversationId}`);
        }
      } catch (err) {
        console.error('[Files] Failed to query uploaded files:', err);
      }
    }

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

    // Send session_created event
    res.write(`data: ${JSON.stringify({
      type: 'session_created',
      session_id: sessionId,
      timestamp: new Date().toISOString()
    })}\n\n`);

    // Update session status to active
    await sessionManager.updateStatus(sessionId, 'active');

    const queryGenerator = query({
      prompt: userPrompt,
      options: sdkOptions
    });

    // Register query generator for potential cleanup
    sessionManager.setQueryGenerator(sessionId, queryGenerator);

    for await (const msg of queryGenerator) {
      // Check for abort signal
      if (abortSignal?.aborted) {
        res.write(`data: ${JSON.stringify({
          type: 'aborted',
          session_id: sessionId,
          message: 'Session stopped by user',
          timestamp: new Date().toISOString()
        })}\n\n`);
        await sessionManager.completeSession(sessionId);
        res.end();
        return;
      }
      // Track tools used from stream events and assistant messages
      if (msg.type === 'stream_event') {
        // Tool use detected in streaming content block
        if (msg.event?.type === 'content_block_start' && msg.event?.content_block?.type === 'tool_use') {
          const toolName = msg.event.content_block.name;
          if (toolName && !toolsUsed.includes(toolName)) {
            toolsUsed.push(toolName);
          }

          // Update session with current tool
          await sessionManager.setCurrentTool(sessionId, toolName);

          // Send tool_start event to frontend
          res.write(`data: ${JSON.stringify({
            type: 'tool_start',
            tool_name: toolName,
            tool_use_id: msg.event.content_block.id,
            input: msg.event.content_block.input,
            session_id: sessionId,
            timestamp: new Date().toISOString()
          })}\n\n`);

          // Auto-save todos when TodoWrite is detected
          if (toolName === 'TodoWrite' && (msg.event.content_block.input as any)?.todos) {
            try {
              const toolInput = msg.event.content_block.input as any;
              const todos = toolInput.todos as any[];

              // Insert todo list
              const todoResult = await pool.query(
                'INSERT INTO todos (tool_use_id) VALUES ($1) RETURNING id',
                [msg.event.content_block.id]
              );

              const todoId = todoResult.rows[0].id;

              // Insert todo items
              const itemPromises = todos.map((item: any) =>
                pool.query(
                  'INSERT INTO todo_items (todo_id, content, active_form, status) VALUES ($1, $2, $3, $4)',
                  [todoId, item.content, item.activeForm || null, item.status || 'pending']
                )
              );

              await Promise.all(itemPromises);

              console.log(`Saved todo list ${todoId} with ${todos.length} items`);
            } catch (error) {
              console.error('Error saving todo:', error);
            }
          }
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
        sdkSessionId = msg.session_id || null;

        // Update session with SDK session ID
        if (sdkSessionId) {
          await pool.query(
            'UPDATE agent_sessions SET sdk_session_id = $1 WHERE id = $2',
            [sdkSessionId, sessionId]
          );
        }

        if (msg.subtype === 'init') {
          // Send complete system info to frontend
          res.write(`data: ${JSON.stringify({
            type: 'system_init',
            data: {
              session_id: sessionId,
              sdk_session_id: msg.session_id,
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

        // Update session metrics
        await sessionManager.updateMetrics(sessionId, {
          inputTokens,
          outputTokens,
          cachedTokens: cacheCreationTokens + cacheReadTokens,
          cost: msg.total_cost_usd,
          turns: msg.num_turns || 1,
          toolsUsed
        });

        // Clear current tool
        await sessionManager.setCurrentTool(sessionId, null);

        // Mark session as idle (waiting for next request)
        await sessionManager.updateStatus(sessionId, 'idle');

        // Log to database with message ID deduplication
        if (conversationId && msg.uuid) {
          try {
            // Check if this message_id already exists to prevent duplicate charges
            const existingLog = await pool.query(
              'SELECT id FROM usage_logs WHERE message_id = $1',
              [msg.uuid]
            );

            if (existingLog.rows.length === 0) {
              // Only insert if we haven't seen this message ID before
              const usageLogResult = await pool.query(
                `INSERT INTO usage_logs (
                  conversation_id, message_id, step_number, model, input_tokens, output_tokens,
                  latency_ms, cost_usd, stop_reason,
                  num_turns, api_latency_ms,
                  cache_creation_tokens, cache_read_tokens, permission_denials,
                  tools_used
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                RETURNING id`,
                [
                  conversationId,
                  msg.uuid,
                  msg.num_turns || 1, // Use num_turns as step_number
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

              const usageLogId = usageLogResult.rows[0].id;
              console.log(`[Cost Tracking] Logged message ${msg.uuid} with cost $${msg.total_cost_usd}`);

              // Log individual tool usage with proportional cost estimates
              if (toolsUsed.length > 0 && msg.total_cost_usd) {
                const estimatedCostPerTool = msg.total_cost_usd / toolsUsed.length;
                const estimatedTokensPerTool = Math.floor((inputTokens + outputTokens) / toolsUsed.length);

                for (const toolName of toolsUsed) {
                  try {
                    await pool.query(
                      `INSERT INTO tool_usage_logs (
                        usage_log_id, message_id, tool_name,
                        estimated_input_tokens, estimated_output_tokens, estimated_cost_usd
                      ) VALUES ($1, $2, $3, $4, $5, $6)`,
                      [
                        usageLogId,
                        msg.uuid,
                        toolName,
                        Math.floor(estimatedTokensPerTool / 2), // Rough estimate: half input, half output
                        Math.floor(estimatedTokensPerTool / 2),
                        estimatedCostPerTool
                      ]
                    );
                  } catch (toolLogError: any) {
                    console.error(`[Cost Tracking] Error logging tool ${toolName}:`, toolLogError.message);
                  }
                }
                console.log(`[Cost Tracking] Logged ${toolsUsed.length} tool uses`);
              }
            } else {
              console.log(`[Cost Tracking] Skipping duplicate message ${msg.uuid}`);
            }
          } catch (dbError: any) {
            console.error('[Cost Tracking] Database error:', dbError.message);
            // Continue execution even if logging fails
          }
        }

        res.write(`data: ${JSON.stringify({
          type: 'done',
          message_id: msg.uuid, // Include message ID for frontend deduplication
          session_id: sessionId,
          sdk_session_id: sdkSessionId,
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
          tools_used: toolsUsed,
          permission_denials: msg.permission_denials || [],
          timestamp: new Date().toISOString()
        })}\n\n`);
        res.end();
      }
    }
  } catch (error: any) {
    console.error('Agent SDK stream error:', error);

    // Mark session as error if it exists
    if (agentSessionId) {
      await sessionManager.errorSession(agentSessionId, error.message);
    }

    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message,
      name: error.name,
      session_id: agentSessionId // Use agentSessionId here since sessionId may not be defined in catch block
    })}\n\n`);
    res.end();
  }
});

// Agent SDK batch (non-streaming) endpoint
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { messages, config, conversationId } = req.body;
    const startTime = Date.now();

    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        error: 'No messages provided',
        type: 'ValidationError'
      });
      return;
    }

    // Extract the last user message as the prompt
    const userPrompt = messages[messages.length - 1]?.content || '';

    let finalResult: any = null;
    let assistantMessage: any = null;
    let toolsUsed: string[] = [];
    let sessionId: string | null = null;

    // Query uploaded files if conversationId is provided
    if (conversationId) {
      try {
        const filesResult = await pool.query(
          `SELECT * FROM uploaded_files
           WHERE enabled = TRUE
           AND (is_global = TRUE OR conversation_id = $1)
           ORDER BY uploaded_at DESC`,
          [conversationId]
        );

        if (filesResult.rows.length > 0) {
          config.uploadedFiles = filesResult.rows.map((row: any) => ({
            id: row.id,
            filename: row.filename,
            originalFilename: row.original_filename,
            filePath: row.file_path,
            mimeType: row.mime_type,
            fileSizeBytes: row.file_size_bytes,
            isGlobal: row.is_global,
            conversationId: row.conversation_id,
            integrationMethod: row.integration_method,
            enabled: row.enabled,
            description: row.description,
            contentPreview: row.content_preview,
            uploadedAt: row.uploaded_at,
            lastAccessedAt: row.last_accessed_at,
            accessCount: row.access_count
          }));
          console.log(`[Files] Loaded ${filesResult.rows.length} files for conversation ${conversationId}`);
        }
      } catch (err) {
        console.error('[Files] Failed to query uploaded files:', err);
      }
    }

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

    // Log usage with message ID deduplication
    if (conversationId && finalResult && finalResult.uuid) {
      try {
        // Check if this message_id already exists to prevent duplicate charges
        const existingLog = await pool.query(
          'SELECT id FROM usage_logs WHERE message_id = $1',
          [finalResult.uuid]
        );

        if (existingLog.rows.length === 0) {
          // Only insert if we haven't seen this message ID before
          const usageLogResult = await pool.query(
            `INSERT INTO usage_logs (
              conversation_id, message_id, step_number, model, input_tokens, output_tokens,
              latency_ms, cost_usd, stop_reason,
              num_turns, api_latency_ms,
              cache_creation_tokens, cache_read_tokens, permission_denials,
              tools_used
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING id`,
            [
              conversationId,
              finalResult.uuid,
              finalResult.num_turns || 1, // Use num_turns as step_number
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

          const usageLogId = usageLogResult.rows[0].id;
          console.log(`[Cost Tracking] Logged message ${finalResult.uuid} with cost $${finalResult.total_cost_usd}`);

          // Log individual tool usage with proportional cost estimates
          if (toolsUsed.length > 0 && finalResult.total_cost_usd) {
            const estimatedCostPerTool = finalResult.total_cost_usd / toolsUsed.length;
            const totalTokens = finalResult.usage.input_tokens + finalResult.usage.output_tokens;
            const estimatedTokensPerTool = Math.floor(totalTokens / toolsUsed.length);

            for (const toolName of toolsUsed) {
              try {
                await pool.query(
                  `INSERT INTO tool_usage_logs (
                    usage_log_id, message_id, tool_name,
                    estimated_input_tokens, estimated_output_tokens, estimated_cost_usd
                  ) VALUES ($1, $2, $3, $4, $5, $6)`,
                  [
                    usageLogId,
                    finalResult.uuid,
                    toolName,
                    Math.floor(estimatedTokensPerTool / 2),
                    Math.floor(estimatedTokensPerTool / 2),
                    estimatedCostPerTool
                  ]
                );
              } catch (toolLogError: any) {
                console.error(`[Cost Tracking] Error logging tool ${toolName}:`, toolLogError.message);
              }
            }
            console.log(`[Cost Tracking] Logged ${toolsUsed.length} tool uses`);
          }
        } else {
          console.log(`[Cost Tracking] Skipping duplicate message ${finalResult.uuid}`);
        }
      } catch (dbError: any) {
        console.error('[Cost Tracking] Database error:', dbError.message);
        // Continue execution even if logging fails
      }
    }

    res.json({
      response: assistantMessage?.message || null,
      message_id: finalResult?.uuid, // Include message ID for frontend deduplication
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
