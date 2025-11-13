import { AgentConfig, Message, AgentResponse, Conversation, Preset, UsageLog, UsageStats } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiClient {
  // Agent endpoints
  static async sendMessage(messages: Message[], config: AgentConfig, conversationId?: number) {
    const response = await fetch(`${API_BASE_URL}/agent/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, config, conversationId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send message');
    }

    return response.json();
  }

  static async streamMessage(
    messages: Message[],
    config: AgentConfig,
    conversationId: number | undefined,
    onEvent: (event: any) => void
  ) {
    const response = await fetch(`${API_BASE_URL}/agent/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, config, conversationId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to stream message');
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) throw new Error('No reader available');

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const event = JSON.parse(data);
            onEvent(event);
          } catch (e) {
            console.error('Failed to parse SSE data:', e);
          }
        }
      }
    }
  }

  // Conversation endpoints
  static async getConversations(): Promise<Conversation[]> {
    const response = await fetch(`${API_BASE_URL}/conversations`);
    if (!response.ok) throw new Error('Failed to fetch conversations');
    return response.json();
  }

  static async getConversation(id: number): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`);
    if (!response.ok) throw new Error('Failed to fetch conversation');
    return response.json();
  }

  static async createConversation(
    title: string,
    config: AgentConfig,
    messages: Message[] = []
  ): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, config, messages }),
    });

    if (!response.ok) throw new Error('Failed to create conversation');
    return response.json();
  }

  static async updateConversation(
    id: number,
    updates: Partial<{ title: string; config: AgentConfig; messages: Message[] }>
  ): Promise<Conversation> {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) throw new Error('Failed to update conversation');
    return response.json();
  }

  static async deleteConversation(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete conversation');
  }

  // Preset endpoints
  static async getPresets(): Promise<Preset[]> {
    const response = await fetch(`${API_BASE_URL}/presets`);
    if (!response.ok) throw new Error('Failed to fetch presets');
    return response.json();
  }

  static async getPreset(id: number): Promise<Preset> {
    const response = await fetch(`${API_BASE_URL}/presets/${id}`);
    if (!response.ok) throw new Error('Failed to fetch preset');
    return response.json();
  }

  static async createPreset(
    name: string,
    config: AgentConfig,
    description?: string
  ): Promise<Preset> {
    const response = await fetch(`${API_BASE_URL}/presets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, config }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create preset');
    }
    return response.json();
  }

  static async updatePreset(
    id: number,
    updates: Partial<{ name: string; description: string; config: AgentConfig }>
  ): Promise<Preset> {
    const response = await fetch(`${API_BASE_URL}/presets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) throw new Error('Failed to update preset');
    return response.json();
  }

  static async deletePreset(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/presets/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete preset');
  }

  // Analytics endpoints
  static async getUsageLogs(filters?: {
    conversationId?: number;
    startDate?: string;
    endDate?: string;
    model?: string;
  }): Promise<UsageLog[]> {
    const params = new URLSearchParams();
    if (filters?.conversationId) params.append('conversationId', filters.conversationId.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.model) params.append('model', filters.model);

    const response = await fetch(`${API_BASE_URL}/analytics?${params}`);
    if (!response.ok) throw new Error('Failed to fetch usage logs');
    return response.json();
  }

  static async getUsageStats(filters?: {
    conversationId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<UsageStats[]> {
    const params = new URLSearchParams();
    if (filters?.conversationId) params.append('conversationId', filters.conversationId.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${API_BASE_URL}/analytics/stats?${params}`);
    if (!response.ok) throw new Error('Failed to fetch usage stats');
    return response.json();
  }

  static async getTimeline(interval: 'minute' | 'hour' | 'day' = 'hour'): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/analytics/timeline?interval=${interval}`);
    if (!response.ok) throw new Error('Failed to fetch timeline');
    return response.json();
  }
}
