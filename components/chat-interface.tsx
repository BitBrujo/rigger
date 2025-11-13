'use client';

import { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '@/lib/store';
import { ApiClient } from '@/lib/api-client';
import { Message, AgentResponse, ContentBlock } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Send, Download } from 'lucide-react';

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
    sdkMode,
    addCost,
    resetAccumulatedCost,
  } = useAgentStore();

  const [input, setInput] = useState('');
  const [streamingText, setStreamingText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
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
      setDebugInfo({
        rawResponse: null,
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
    const streamFn = sdkMode ? ApiClient.streamAgentMessage : ApiClient.streamMessage;

    await streamFn(messages, config, conversationId || undefined, (event) => {
      if (event.type === 'text') {
        fullText += event.data;
        setStreamingText(fullText);
      } else if (event.type === 'content_block_delta') {
        if (event.data.delta?.type === 'text_delta') {
          fullText += event.data.delta.text;
          setStreamingText(fullText);
        }
      } else if (event.type === 'message') {
        finalMessage = event.data;
      } else if (event.type === 'done') {
        const latency = event.latency || Date.now() - startTime;

        if (finalMessage || sdkMode) {
          addMessage({
            role: 'assistant',
            content: fullText,
          });

          // Handle SDK mode response (with automatic cost calculation)
          if (sdkMode) {
            const cost = event.cost || 0;
            addCost(cost);
            setDebugInfo({
              rawResponse: null, // SDK doesn't expose raw response
              latency,
              tokens: {
                input: event.usage?.input_tokens || 0,
                output: event.usage?.output_tokens || 0,
                total: (event.usage?.input_tokens || 0) + (event.usage?.output_tokens || 0),
                cacheCreation: event.usage?.cache_creation_tokens,
                cacheRead: event.usage?.cache_read_tokens,
              },
              cost,
              stopReason: event.is_error ? 'error' : 'end_turn',
              timestamp: event.timestamp || new Date().toISOString(),
              errors: event.is_error ? ['Error during execution'] : [],
              numTurns: event.num_turns,
              sdkMode: true,
            });
          } else {
            // Messages API response
            setDebugInfo({
              rawResponse: finalMessage,
              latency,
              tokens: {
                input: finalMessage.usage?.input_tokens || 0,
                output: finalMessage.usage?.output_tokens || 0,
                total:
                  (finalMessage.usage?.input_tokens || 0) + (finalMessage.usage?.output_tokens || 0),
              },
              cost: calculateCost(
                finalMessage.model,
                finalMessage.usage?.input_tokens || 0,
                finalMessage.usage?.output_tokens || 0
              ),
              stopReason: finalMessage.stop_reason || 'unknown',
              timestamp: event.timestamp || new Date().toISOString(),
              errors: [],
              sdkMode: false,
            });
          }
        }
      } else if (event.type === 'error') {
        throw new Error(event.error);
      }
    });
  };

  const handleBatchRequest = async (messages: Message[]) => {
    const startTime = Date.now();

    // Choose API based on SDK mode
    const sendFn = sdkMode ? ApiClient.sendAgentMessage : ApiClient.sendMessage;
    const result = await sendFn(messages, config, conversationId || undefined);

    const latency = result.latency || Date.now() - startTime;

    // Handle SDK mode response
    if (sdkMode) {
      // SDK response format
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
        rawResponse: null,
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
        sdkMode: true,
      });
    } else {
      // Messages API response
      const response: AgentResponse = result.response;

      let text = '';
      if (Array.isArray(response.content)) {
        text = response.content
          .filter((block: ContentBlock) => block.type === 'text')
          .map((block: ContentBlock) => block.text)
          .join('\n');
      }

      addMessage({
        role: 'assistant',
        content: text,
      });

      setDebugInfo({
        rawResponse: response,
        latency,
        tokens: {
          input: response.usage.input_tokens,
          output: response.usage.output_tokens,
          total: response.usage.input_tokens + response.usage.output_tokens,
        },
        cost: calculateCost(response.model, response.usage.input_tokens, response.usage.output_tokens),
        stopReason: response.stop_reason || 'unknown',
        timestamp: result.timestamp || new Date().toISOString(),
        errors: [],
        sdkMode: false,
      });
    }
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
    a.download = `conversation-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b px-6 py-3 flex items-center justify-between">
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
          {messages.map((message, i) => (
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
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
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
    </div>
  );
}
