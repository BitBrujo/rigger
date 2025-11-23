import { create } from 'zustand';
import {
  AgentSDKConfig,
  Message,
  DebugInfo,
  DEFAULT_SDK_CONFIG,
  McpServerConfig,
  AgentDefinition,
  AgentWithName,
  ToolExecution,
  SystemInfo,
  PermissionRequest,
  McpServerStatus,
  SessionHistory,
  SkillMetadata,
  TodoList
} from './types';

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
  toggleHookEnabled: (hookId: string) => void;
  setPlugins: (plugins: any[]) => void;
  setSettingSources: (sources: string[]) => void;

  // Skills Management
  availableSkills: SkillMetadata[];
  setAvailableSkills: (skills: SkillMetadata[]) => void;
  addSkill: (skill: SkillMetadata) => void;
  removeSkill: (name: string) => void;
  updateSkill: (name: string, updates: Partial<SkillMetadata>) => void;
  toggleSkillEnabled: (name: string) => void;

  // Agents Management
  availableAgents: AgentWithName[];
  setAvailableAgents: (agents: AgentWithName[]) => void;
  addAgent: (agent: AgentWithName) => void;
  removeAgent: (name: string) => void;
  updateAgent: (name: string, updates: Partial<AgentDefinition>) => void;
  toggleAgentEnabled: (name: string) => void;

  // Todo Lists Management
  todoLists: TodoList[];
  setTodoLists: (lists: TodoList[]) => void;
  addTodoList: (list: TodoList) => void;
  removeTodoList: (id: number) => void;
  clearTodoLists: () => void;

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

  // Message ID tracking for cost deduplication
  processedMessageIds: Set<string>;
  addProcessedMessageId: (messageId: string) => void;
  clearProcessedMessageIds: () => void;

  // Active session
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  activeSessionStatus: 'initializing' | 'active' | 'idle' | 'stopping' | 'completed' | 'error' | 'terminated' | null;
  setActiveSessionStatus: (status: 'initializing' | 'active' | 'idle' | 'stopping' | 'completed' | 'error' | 'terminated' | null) => void;
  activeSessionCost: number;
  setActiveSessionCost: (cost: number) => void;
  activeSessionDuration: number; // seconds
  setActiveSessionDuration: (duration: number) => void;
  currentTool: string | null;
  setCurrentTool: (tool: string | null) => void;

  // Available sessions
  availableSessions: any[]; // SessionMetadata[]
  setAvailableSessions: (sessions: any[]) => void;
  addSession: (session: any) => void;
  removeSession: (id: string) => void;

  // Emergency stop
  isStopRequested: boolean;
  setIsStopRequested: (requested: boolean) => void;
  isForceKillRequested: boolean;
  setIsForceKillRequested: (requested: boolean) => void;

  // Tool execution tracking
  toolExecutions: ToolExecution[];
  addToolExecution: (execution: ToolExecution) => void;
  updateToolExecution: (id: string, updates: Partial<ToolExecution>) => void;
  clearToolExecutions: () => void;
  activeTools: Set<string>; // tool_use_ids currently running
  addActiveTool: (id: string) => void;
  removeActiveTool: (id: string) => void;

  // System info (from SDKSystemMessage)
  systemInfo: SystemInfo | null;
  setSystemInfo: (info: SystemInfo | null) => void;

  // Permission requests
  permissionRequests: PermissionRequest[];
  addPermissionRequest: (request: PermissionRequest) => void;
  updatePermissionRequest: (id: string, updates: Partial<PermissionRequest>) => void;
  clearPermissionRequests: () => void;

  // MCP server status
  mcpServerStatuses: McpServerStatus[];
  setMcpServerStatuses: (statuses: McpServerStatus[]) => void;
  updateMcpServerStatus: (name: string, updates: Partial<McpServerStatus>) => void;

  // Hook execution logs
  hookLogs: Array<{
    hookName: string;
    hookEvent: string;
    stdout: string;
    stderr: string;
    exitCode?: number;
    timestamp: string;
  }>;
  addHookLog: (log: {
    hookName: string;
    hookEvent: string;
    stdout: string;
    stderr: string;
    exitCode?: number;
    timestamp: string;
  }) => void;
  clearHookLogs: () => void;

  // Session history
  sessionHistory: SessionHistory[];
  addSessionHistory: (session: SessionHistory) => void;
  updateSessionHistory: (id: string, updates: Partial<SessionHistory>) => void;
  clearSessionHistory: () => void;

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
  toggleHookEnabled: (hookId) =>
    set((state) => {
      const hooks = state.config.hooks || {};
      const hook = hooks[hookId];
      if (!hook) return state;

      return {
        config: {
          ...state.config,
          hooks: {
            ...hooks,
            [hookId]: {
              ...hook,
              enabled: !(hook.enabled ?? true),
            },
          },
        },
      };
    }),
  setPlugins: (plugins) => set((state) => ({ config: { ...state.config, plugins } })),
  setSettingSources: (settingSources) => set((state) => ({ config: { ...state.config, settingSources } })),

  // Skills Management
  availableSkills: [],
  setAvailableSkills: (skills) => set({ availableSkills: skills }),
  addSkill: (skill) =>
    set((state) => ({
      availableSkills: [...state.availableSkills, skill],
    })),
  removeSkill: (name) =>
    set((state) => ({
      availableSkills: state.availableSkills.filter((skill) => skill.name !== name),
    })),
  updateSkill: (name, updates) =>
    set((state) => ({
      availableSkills: state.availableSkills.map((skill) =>
        skill.name === name ? { ...skill, ...updates } : skill
      ),
    })),
  toggleSkillEnabled: (name) =>
    set((state) => ({
      availableSkills: state.availableSkills.map((skill) =>
        skill.name === name ? { ...skill, enabled: !(skill.enabled ?? true) } : skill
      ),
    })),

  // Agents Management
  availableAgents: [],
  setAvailableAgents: (agents) => set({ availableAgents: agents }),
  addAgent: (agent) =>
    set((state) => ({
      availableAgents: [...state.availableAgents, agent],
    })),
  removeAgent: (name) =>
    set((state) => ({
      availableAgents: state.availableAgents.filter((agent) => agent.name !== name),
    })),
  updateAgent: (name, updates) =>
    set((state) => ({
      availableAgents: state.availableAgents.map((agent) =>
        agent.name === name ? { ...agent, ...updates } : agent
      ),
    })),
  toggleAgentEnabled: (name) =>
    set((state) => ({
      availableAgents: state.availableAgents.map((agent) =>
        agent.name === name ? { ...agent, enabled: !(agent.enabled ?? true) } : agent
      ),
    })),

  // Todo Lists
  todoLists: [],
  setTodoLists: (lists) => set({ todoLists: lists }),
  addTodoList: (list) =>
    set((state) => ({
      todoLists: [...state.todoLists, list],
    })),
  removeTodoList: (id) =>
    set((state) => ({
      todoLists: state.todoLists.filter((list) => list.id !== id),
    })),
  clearTodoLists: () => set({ todoLists: [] }),

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

  // Message ID tracking for cost deduplication
  processedMessageIds: new Set(),
  addProcessedMessageId: (messageId) =>
    set((state) => ({
      processedMessageIds: new Set([...state.processedMessageIds, messageId]),
    })),
  clearProcessedMessageIds: () => set({ processedMessageIds: new Set() }),

  // Active session
  activeSessionId: null,
  setActiveSessionId: (id) => set({ activeSessionId: id }),
  activeSessionStatus: null,
  setActiveSessionStatus: (status) => set({ activeSessionStatus: status }),
  activeSessionCost: 0,
  setActiveSessionCost: (cost) => set({ activeSessionCost: cost }),
  activeSessionDuration: 0,
  setActiveSessionDuration: (duration) => set({ activeSessionDuration: duration }),
  currentTool: null,
  setCurrentTool: (tool) => set({ currentTool: tool }),

  // Available sessions
  availableSessions: [],
  setAvailableSessions: (sessions) => set({ availableSessions: sessions }),
  addSession: (session) =>
    set((state) => ({
      availableSessions: [...state.availableSessions, session],
    })),
  removeSession: (id) =>
    set((state) => ({
      availableSessions: state.availableSessions.filter((s: any) => s.id !== id),
    })),

  // Emergency stop
  isStopRequested: false,
  setIsStopRequested: (requested) => set({ isStopRequested: requested }),
  isForceKillRequested: false,
  setIsForceKillRequested: (requested) => set({ isForceKillRequested: requested }),

  // Tool execution tracking
  toolExecutions: [],
  addToolExecution: (execution) =>
    set((state) => ({
      toolExecutions: [...state.toolExecutions, execution],
    })),
  updateToolExecution: (id, updates) =>
    set((state) => ({
      toolExecutions: state.toolExecutions.map((exec) =>
        exec.id === id ? { ...exec, ...updates } : exec
      ),
    })),
  clearToolExecutions: () => set({ toolExecutions: [] }),
  activeTools: new Set(),
  addActiveTool: (id) =>
    set((state) => ({
      activeTools: new Set([...state.activeTools, id]),
    })),
  removeActiveTool: (id) =>
    set((state) => {
      const newActiveTools = new Set(state.activeTools);
      newActiveTools.delete(id);
      return { activeTools: newActiveTools };
    }),

  // System info
  systemInfo: null,
  setSystemInfo: (info) => set({ systemInfo: info }),

  // Permission requests
  permissionRequests: [],
  addPermissionRequest: (request) =>
    set((state) => ({
      permissionRequests: [...state.permissionRequests, request],
    })),
  updatePermissionRequest: (id, updates) =>
    set((state) => ({
      permissionRequests: state.permissionRequests.map((req) =>
        req.id === id ? { ...req, ...updates } : req
      ),
    })),
  clearPermissionRequests: () => set({ permissionRequests: [] }),

  // MCP server status
  mcpServerStatuses: [],
  setMcpServerStatuses: (statuses) => set({ mcpServerStatuses: statuses }),
  updateMcpServerStatus: (name, updates) =>
    set((state) => ({
      mcpServerStatuses: state.mcpServerStatuses.map((status) =>
        status.name === name ? { ...status, ...updates } : status
      ),
    })),

  // Hook execution logs
  hookLogs: [],
  addHookLog: (log) =>
    set((state) => ({
      hookLogs: [...state.hookLogs, log],
    })),
  clearHookLogs: () => set({ hookLogs: [] }),

  // Session history
  sessionHistory: [],
  addSessionHistory: (session) =>
    set((state) => ({
      sessionHistory: [...state.sessionHistory, session],
    })),
  updateSessionHistory: (id, updates) =>
    set((state) => ({
      sessionHistory: state.sessionHistory.map((session) =>
        session.id === id ? { ...session, ...updates } : session
      ),
    })),
  clearSessionHistory: () => set({ sessionHistory: [] }),

  // UI
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
}));

// Helper function to check if message ID has been processed
// (moved outside store to avoid circular reference)
export const hasProcessedMessageId = (messageId: string): boolean => {
  return useAgentStore.getState().processedMessageIds.has(messageId);
};

// Backward compatibility export
export const useStore = useAgentStore;
