import { create } from 'zustand';
import { AgentSDKConfig, Message, DebugInfo, DEFAULT_SDK_CONFIG, McpServerConfig, AgentDefinition } from './types';

interface AgentStore {
  // Agent SDK Configuration (all 30+ parameters)
  config: AgentSDKConfig;
  setConfig: (config: Partial<AgentSDKConfig>) => void;
  resetConfig: () => void;

  // Individual config setters for granular updates
  setModel: (model: string) => void;
  setSystemPrompt: (prompt: string) => void;
  setMaxTurns: (turns: number) => void;
  setMaxBudgetUsd: (budget: number | undefined) => void;
  setMaxThinkingTokens: (tokens: number | null | undefined) => void;
  setPermissionMode: (mode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan') => void;
  setAllowDangerouslySkipPermissions: (allow: boolean) => void;
  setAllowedTools: (tools: string[]) => void;
  setDisallowedTools: (tools: string[]) => void;
  setWorkingDirectory: (dir: string) => void;
  setAdditionalDirectories: (dirs: string[]) => void;
  setEnv: (env: Record<string, string>) => void;
  setExecutable: (executable: 'bun' | 'deno' | 'node') => void;
  setExecutableArgs: (args: string[]) => void;
  setContinueSession: (continue_: boolean) => void;
  setResumeSessionId: (id: string | undefined) => void;
  setResumeAtMessageId: (id: string | undefined) => void;
  setForkSession: (fork: boolean) => void;
  setFallbackModel: (model: string | undefined) => void;
  setMcpServers: (servers: Record<string, McpServerConfig>) => void;
  setStrictMcpConfig: (strict: boolean) => void;
  setCustomAgents: (agents: Record<string, AgentDefinition>) => void;
  setHooks: (hooks: Record<string, any>) => void;
  setPlugins: (plugins: any[]) => void;

  // Messages
  messages: Message[];
  addMessage: (message: Message) => void;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;

  // Streaming state
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
  streamingMode: boolean;
  setStreamingMode: (mode: boolean) => void;

  // Debug info
  debugInfo: DebugInfo | null;
  setDebugInfo: (info: DebugInfo | null) => void;

  // Current conversation
  conversationId: number | null;
  setConversationId: (id: number | null) => void;
  accumulatedCost: number;
  addCost: (cost: number) => void;
  resetAccumulatedCost: () => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  // Configuration (Agent SDK only)
  config: DEFAULT_SDK_CONFIG,
  setConfig: (newConfig) =>
    set((state) => ({
      config: { ...state.config, ...newConfig },
    })),
  resetConfig: () => set({ config: DEFAULT_SDK_CONFIG }),

  // Individual config setters
  setModel: (model) => set((state) => ({ config: { ...state.config, model } })),
  setSystemPrompt: (systemPrompt) => set((state) => ({ config: { ...state.config, systemPrompt } })),
  setMaxTurns: (maxTurns) => set((state) => ({ config: { ...state.config, maxTurns } })),
  setMaxBudgetUsd: (maxBudgetUsd) => set((state) => ({ config: { ...state.config, maxBudgetUsd } })),
  setMaxThinkingTokens: (maxThinkingTokens) => set((state) => ({ config: { ...state.config, maxThinkingTokens } })),
  setPermissionMode: (permissionMode) => set((state) => ({ config: { ...state.config, permissionMode } })),
  setAllowDangerouslySkipPermissions: (allowDangerouslySkipPermissions) =>
    set((state) => ({ config: { ...state.config, allowDangerouslySkipPermissions } })),
  setAllowedTools: (allowedTools) => set((state) => ({ config: { ...state.config, allowedTools } })),
  setDisallowedTools: (disallowedTools) => set((state) => ({ config: { ...state.config, disallowedTools } })),
  setWorkingDirectory: (workingDirectory) => set((state) => ({ config: { ...state.config, workingDirectory } })),
  setAdditionalDirectories: (additionalDirectories) =>
    set((state) => ({ config: { ...state.config, additionalDirectories } })),
  setEnv: (env) => set((state) => ({ config: { ...state.config, env } })),
  setExecutable: (executable) => set((state) => ({ config: { ...state.config, executable } })),
  setExecutableArgs: (executableArgs) => set((state) => ({ config: { ...state.config, executableArgs } })),
  setContinueSession: (continueSession) => set((state) => ({ config: { ...state.config, continueSession } })),
  setResumeSessionId: (resumeSessionId) => set((state) => ({ config: { ...state.config, resumeSessionId } })),
  setResumeAtMessageId: (resumeAtMessageId) => set((state) => ({ config: { ...state.config, resumeAtMessageId } })),
  setForkSession: (forkSession) => set((state) => ({ config: { ...state.config, forkSession } })),
  setFallbackModel: (fallbackModel) => set((state) => ({ config: { ...state.config, fallbackModel } })),
  setMcpServers: (mcpServers) => set((state) => ({ config: { ...state.config, mcpServers } })),
  setStrictMcpConfig: (strictMcpConfig) => set((state) => ({ config: { ...state.config, strictMcpConfig } })),
  setCustomAgents: (customAgents) => set((state) => ({ config: { ...state.config, customAgents } })),
  setHooks: (hooks) => set((state) => ({ config: { ...state.config, hooks } })),
  setPlugins: (plugins) => set((state) => ({ config: { ...state.config, plugins } })),

  // Messages
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [] }),
  setMessages: (messages) => set({ messages }),

  // Streaming
  isStreaming: false,
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  streamingMode: true,
  setStreamingMode: (mode) => set({ streamingMode: mode }),

  // Debug
  debugInfo: null,
  setDebugInfo: (info) => set({ debugInfo: info }),

  // Conversation
  conversationId: null,
  setConversationId: (id) => set({ conversationId: id }),
  accumulatedCost: 0,
  addCost: (cost) => set((state) => ({ accumulatedCost: state.accumulatedCost + cost })),
  resetAccumulatedCost: () => set({ accumulatedCost: 0 }),

  // UI
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
}));
