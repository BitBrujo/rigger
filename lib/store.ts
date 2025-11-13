import { create } from 'zustand';
import { AgentConfig, Message, DebugInfo, Tool, DEFAULT_CONFIG } from './types';

interface AgentStore {
  // Configuration
  config: AgentConfig;
  setConfig: (config: Partial<AgentConfig>) => void;
  resetConfig: () => void;

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

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;

  // Agent SDK mode
  sdkMode: boolean;
  setSdkMode: (mode: boolean) => void;
}

export const useAgentStore = create<AgentStore>((set) => ({
  // Configuration
  config: DEFAULT_CONFIG,
  setConfig: (newConfig) =>
    set((state) => ({
      config: { ...state.config, ...newConfig },
    })),
  resetConfig: () => set({ config: DEFAULT_CONFIG }),

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

  // UI
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),

  // Agent SDK
  sdkMode: false,
  setSdkMode: (mode) => set({ sdkMode: mode }),
}));
