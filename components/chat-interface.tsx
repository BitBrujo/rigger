'use client';

import { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '@/lib/store';
import { ApiClient } from '@/lib/api-client';
import { Message, ContentBlock, TodoList } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Send, Download, Wrench, ListTodo } from 'lucide-react';
import { toast } from 'sonner';
import DebugPanel from './debug-panel';
import { ToolsPanel } from './tools-panel';
import { TodoPanel } from './todo-panel';

export default function ChatInterface() {
  const {
    messages,
    addMessage,
    clearMessages,
    config,
    isStreaming,
    setIsStreaming,
    streamingMode,
    setStreamingMode,
    setDebugInfo,
    conversationId,
    addCost,
    resetAccumulatedCost,
    // Tool execution tracking
    addToolExecution,
    updateToolExecution,
    addActiveTool,
    removeActiveTool,
    // System info
    setSystemInfo,
    // Hook logs
    addHookLog,
    // Todos
    todoLists,
    addTodoList,
    // Session state
    activeSessionId,
    setActiveSessionId,
    setActiveSessionStatus,
    setActiveSessionCost,
    setCurrentTool,
  } = useAgentStore();

  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages or streaming text changes
  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has updated
    requestAnimationFrame(() => {
      if (bottomRef.current) {
        bottomRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }, [messages, streamingText]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
    };

    addMessage(userMessage);
    setInput('');
    setIsStreaming(true);
    setStreamingText('');

    const allMessages = [...messages, userMessage];

    try {
      if (streamingMode) {
        await handleStreamingRequest(allMessages);
      } else {
        await handleBatchRequest(allMessages);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message', {
        description: error.message,
      });
      setDebugInfo({
        latency: 0,
        tokens: { input: 0, output: 0, total: 0 },
        cost: 0,
        stopReason: 'error',
        timestamp: new Date().toISOString(),
        errors: [error.message],
      });
    } finally {
      setIsStreaming(false);
      setStreamingText('');
    }
  };

  const handleStreamingRequest = async (messages: Message[]) => {
    let fullText = '';
    let finalMessage: any = null;
    const startTime = Date.now();

    // Choose API based on SDK mode
    const streamFn = ApiClient.streamMessage; // Use the correct endpoint

    await streamFn(messages, config, conversationId || undefined, (event) => {
      // Handle session events
      if (event.type === 'session_created') {
        setActiveSessionId(event.session_id);
        setActiveSessionStatus('active');
      } else if (event.type === 'aborted') {
        toast.info('Session stopped', {
          description: 'The session was stopped by user request',
        });
        setActiveSessionStatus('terminated');
        return;
      }

      // Handle regular events
      if (event.type === 'text') {
        fullText += event.data;
        setStreamingText(fullText);
      } else if (event.type === 'content_block_delta') {
        if (event.data.delta?.type === 'text_delta') {
          fullText += event.data.delta.text;
          setStreamingText(fullText);
        }
      } else if (event.type === 'tool_start') {
        // Tool execution started
        const toolExecution = {
          id: event.tool_use_id,
          toolName: event.tool_name,
          status: 'running' as const,
          startTime: Date.now(),
          input: event.input,
          parentToolUseId: null,
        };
        addToolExecution(toolExecution);
        addActiveTool(event.tool_use_id);

        // Update session current tool
        setCurrentTool(event.tool_name);

        // Reload todos when TodoWrite is executed
        if (event.tool_name === 'TodoWrite') {
          setTimeout(async () => {
            try {
              const lists = await ApiClient.getTodos();
              lists.forEach(list => {
                // Only add if not already in the store
                const exists = todoLists.some((existing: TodoList) => existing.id === list.id);
                if (!exists) {
                  addTodoList(list);
                }
              });
            } catch (error) {
              console.error('Failed to reload todos:', error);
            }
          }, 500); // Small delay to ensure database write completes
        }
      } else if (event.type === 'tool_progress') {
        // Tool progress update
        updateToolExecution(event.tool_use_id, {
          elapsedSeconds: event.elapsed_seconds,
        });
      } else if (event.type === 'tool_complete') {
        // Tool execution completed
        updateToolExecution(event.tool_use_id, {
          status: event.is_error ? 'failed' : 'completed',
          endTime: Date.now(),
          output: event.content,
          error: event.is_error ? 'Tool execution failed' : undefined,
        });
        removeActiveTool(event.tool_use_id);
      } else if (event.type === 'system_init') {
        // System initialization message
        setSystemInfo({
          apiKeySource: event.data.apiKeySource || 'unknown',
          cwd: event.data.cwd || '',
          tools: event.data.tools || [],
          mcpServers: event.data.mcp_servers || [],
          model: event.data.model || '',
          permissionMode: event.data.permissionMode || 'default',
          slashCommands: event.data.slash_commands,
          agents: event.data.agents,
          plugins: event.data.plugins,
        });
      } else if (event.type === 'hook_response') {
        // Hook execution result
        addHookLog({
          hookName: event.data.hook_name,
          hookEvent: event.data.hook_event,
          stdout: event.data.stdout,
          stderr: event.data.stderr,
          exitCode: event.data.exit_code,
          timestamp: new Date().toISOString(),
        });
      } else if (event.type === 'message') {
        finalMessage = event.data;
      } else if (event.type === 'done') {
        const latency = event.latency || Date.now() - startTime;

        // Update session state
        if (event.session_id) {
          setActiveSessionId(event.session_id);
        }
        if (event.cost) {
          setActiveSessionCost(event.cost);
        }
        setActiveSessionStatus('idle');
        setCurrentTool(null);

        // Clear any remaining active tools when session completes
        const { activeTools } = useAgentStore.getState();
        activeTools.forEach(toolId => removeActiveTool(toolId));

        // Agent SDK always has final message
        addMessage({
          role: 'assistant',
          content: fullText,
        });

        // Handle Agent SDK response with message ID deduplication
        const cost = event.cost || 0;
        const messageId = event.message_id;

        // Only add cost if we haven't processed this message ID before
        const { processedMessageIds, addProcessedMessageId } = useAgentStore.getState();
        if (messageId && !processedMessageIds.has(messageId)) {
          addCost(cost);
          addProcessedMessageId(messageId);
          console.log(`[Cost Tracking] Added cost $${cost} for message ${messageId}`);
        } else if (messageId) {
          console.log(`[Cost Tracking] Skipping duplicate message ${messageId}`);
        } else {
          // Fallback: if no message_id, add cost anyway (shouldn't happen with SDK)
          addCost(cost);
          console.warn('[Cost Tracking] No message_id provided, adding cost without deduplication');
        }

        // Budget warning
        const { config: currentConfig, accumulatedCost: currentAccumulated } = useAgentStore.getState();
        const totalCost = currentAccumulated;
        if (currentConfig.maxBudgetUsd && totalCost > currentConfig.maxBudgetUsd * 0.8) {
          if (totalCost >= currentConfig.maxBudgetUsd) {
            toast.error('Budget exceeded!', {
              description: `Spent $${totalCost.toFixed(6)} of $${currentConfig.maxBudgetUsd.toFixed(6)}`,
            });
          } else if (totalCost > currentConfig.maxBudgetUsd * 0.9) {
            toast.warning('Budget warning', {
              description: `90% of budget used: $${totalCost.toFixed(6)} / $${currentConfig.maxBudgetUsd.toFixed(6)}`,
            });
          }
        }

        setDebugInfo({
          latency,
          tokens: {
            input: event.usage?.input_tokens || 0,
            output: event.usage?.output_tokens || 0,
            total: (event.usage?.input_tokens || 0) + (event.usage?.output_tokens || 0),
            cacheCreation: event.usage?.cache_creation_tokens,
            cacheRead: event.usage?.cache_read_tokens,
          },
          cost,
          messageId: event.message_id, // Include message ID for display
          stopReason: event.is_error ? 'error' : 'end_turn',
          timestamp: event.timestamp || new Date().toISOString(),
          errors: event.is_error ? ['Error during execution'] : [],
          numTurns: event.num_turns,
          sessionId: event.session_id,
          permissionDenials: event.permission_denials,
          toolsUsed: event.tools_used,
        });
      } else if (event.type === 'error') {
        throw new Error(event.error);
      }
    }, activeSessionId);
  };

  const handleBatchRequest = async (messages: Message[]) => {
    const startTime = Date.now();

    // Always use Agent SDK
    const result = await ApiClient.sendAgentMessage(messages, config, conversationId || undefined);

    const latency = result.latency || Date.now() - startTime;

    // Handle Agent SDK response
    const response = result.response;
    let text = '';

    if (response && Array.isArray(response.content)) {
      text = response.content
        .filter((block: ContentBlock) => block.type === 'text')
        .map((block: ContentBlock) => block.text)
        .join('\n');
    }

    addMessage({
      role: 'assistant',
      content: text,
    });

    const cost = result.cost || 0;
    addCost(cost);
    setDebugInfo({
      latency,
      tokens: {
        input: result.usage?.input_tokens || 0,
        output: result.usage?.output_tokens || 0,
        total: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0),
        cacheCreation: result.usage?.cache_creation_input_tokens,
        cacheRead: result.usage?.cache_read_input_tokens,
      },
      cost,
      stopReason: result.is_error ? 'error' : 'end_turn',
      timestamp: result.timestamp || new Date().toISOString(),
      errors: result.is_error ? ['Error during execution'] : [],
      numTurns: result.num_turns,
      sessionId: result.session_id,
      permissionDenials: result.permission_denials,
      toolsUsed: result.tools_used,
    });
  };

  const calculateCost = (model: string, inputTokens: number, outputTokens: number): number => {
    const pricing: Record<string, { input: number; output: number }> = {
      'claude-3-5-sonnet-20241022': { input: 3.0, output: 15.0 },
      'claude-3-5-haiku-20241022': { input: 0.8, output: 4.0 },
      'claude-3-opus-20240229': { input: 15.0, output: 75.0 },
    };

    const modelPricing = pricing[model] || pricing['claude-3-5-sonnet-20241022'];
    return (inputTokens / 1_000_000) * modelPricing.input + (outputTokens / 1_000_000) * modelPricing.output;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const exportConversation = () => {
    const data = JSON.stringify({ messages, config }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `conversation-${Date.now()}.json`;
    a.download = filename;
    a.click();
    toast.success('Conversation exported', {
      description: `Saved as ${filename}`,
    });
  };

  return (
    <Tabs defaultValue="messages" className="flex flex-col h-full overflow-hidden">
      {/* Tabs Header */}
      <div className="border-b flex-shrink-0">
        <TabsList className="w-full justify-start rounded-none h-12 bg-transparent px-6">
          <TabsTrigger value="messages" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Messages
          </TabsTrigger>
          <TabsTrigger value="tools" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex items-center gap-1">
            <Wrench className="h-4 w-4" />
            Tools
          </TabsTrigger>
          <TabsTrigger value="todos" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex items-center gap-1">
            <ListTodo className="h-4 w-4" />
            Todos
            {todoLists.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
                {todoLists.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="debug" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
            Debug
          </TabsTrigger>
        </TabsList>
      </div>

      {/* Messages Tab */}
      <TabsContent value="messages" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden overflow-hidden">
        <div className="border-b px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="streaming-mode"
              checked={streamingMode}
              onCheckedChange={setStreamingMode}
              disabled={isStreaming}
            />
            <Label htmlFor="streaming-mode" className="cursor-pointer">
              {streamingMode ? 'Streaming' : 'Batch'}
            </Label>
          </div>
          <Badge variant="outline">{messages.length} messages</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={exportConversation}>
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              clearMessages();
              resetAccumulatedCost();
            }}
            disabled={isStreaming}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6" ref={scrollRef}>
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.map((message: Message, i: number) => (
            <div
              key={i}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card
                className={`p-4 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">
                    {message.role}
                  </Badge>
                  <div className="flex-1 whitespace-pre-wrap break-words">
                    {typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}
                  </div>
                </div>
              </Card>
            </div>
          ))}

          {/* Streaming message */}
          {isStreaming && streamingText && (
            <div className="flex justify-start">
              <Card className="p-4 max-w-[80%] bg-muted">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5">
                    assistant
                  </Badge>
                  <div className="flex-1 whitespace-pre-wrap break-words">
                    {streamingText}
                    <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-1" />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {isStreaming && !streamingText && (
            <div className="flex justify-start">
              <Card className="p-4 bg-muted">
                <Loader2 className="w-5 h-5 animate-spin" />
              </Card>
            </div>
          )}

          {/* Invisible anchor for auto-scroll */}
          <div ref={bottomRef} className="h-0" />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            className="min-h-[60px] resize-none"
            disabled={isStreaming}
          />
          <Button onClick={handleSend} disabled={isStreaming || !input.trim()} size="icon" className="h-[60px] w-[60px]">
            {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
        </div>
      </TabsContent>

      {/* Tools Tab */}
      <TabsContent value="tools" className="flex-1 m-0 data-[state=inactive]:hidden overflow-auto">
        <ToolsPanel />
      </TabsContent>

      {/* Todos Tab */}
      <TabsContent value="todos" className="flex-1 m-0 data-[state=inactive]:hidden overflow-auto">
        <TodoPanel />
      </TabsContent>

      {/* Debug Tab */}
      <TabsContent value="debug" className="flex-1 m-0 data-[state=inactive]:hidden overflow-auto">
        <DebugPanel />
      </TabsContent>
    </Tabs>
  );
}
