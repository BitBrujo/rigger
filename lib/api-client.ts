import { AgentConfig, Message, AgentResponse, Conversation, Preset, UsageLog, UsageStats } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333/api';

export class ApiClient {
  // Agent endpoints (Messages API)
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

  // Agent SDK endpoints
  static async sendAgentMessage(messages: Message[], config: AgentConfig, conversationId?: number) {
    const response = await fetch(`${API_BASE_URL}/agent-sdk/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, config, conversationId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send agent message');
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

  static async streamAgentMessage(
    messages: Message[],
    config: AgentConfig,
    conversationId: number | undefined,
    onEvent: (event: any) => void
  ) {
    const response = await fetch(`${API_BASE_URL}/agent-sdk/stream`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, config, conversationId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to stream agent message');
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

  // Status endpoint
  static async checkApiKey(): Promise<{ hasApiKey: boolean; timestamp: string }> {
    const response = await fetch(`${API_BASE_URL}/status`);
    if (!response.ok) throw new Error('Failed to check API key status');
    return response.json();
  }

  // Todos API endpoints
  static async getTodos(): Promise<import('./types').TodoList[]> {
    const response = await fetch(`${API_BASE_URL}/todos`);
    if (!response.ok) throw new Error('Failed to fetch todos');
    return response.json();
  }

  static async getTodoById(id: number): Promise<import('./types').TodoList> {
    const response = await fetch(`${API_BASE_URL}/todos/${id}`);
    if (!response.ok) throw new Error('Failed to fetch todo');
    return response.json();
  }

  static async createTodo(data: {
    title?: string;
    toolUseId?: string;
    items: Array<{
      content: string;
      activeForm?: string;
      status?: 'pending' | 'in_progress' | 'completed';
    }>;
  }): Promise<import('./types').TodoList> {
    const response = await fetch(`${API_BASE_URL}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create todo');
    }
    return response.json();
  }

  static async deleteTodo(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/todos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete todo');
  }

  // Agents API endpoints
  static async getAgents(): Promise<Record<string, import('./types').AgentDefinition>> {
    const response = await fetch(`${API_BASE_URL}/agents`);
    if (!response.ok) throw new Error('Failed to fetch agents');
    return response.json();
  }

  static async getAgent(name: string): Promise<import('./types').AgentDefinition & { name: string }> {
    const response = await fetch(`${API_BASE_URL}/agents/${name}`);
    if (!response.ok) throw new Error('Failed to fetch agent');
    return response.json();
  }

  static async getAgentTemplates(): Promise<Record<string, import('./types').AgentDefinition>> {
    const response = await fetch(`${API_BASE_URL}/agents/templates`);
    if (!response.ok) throw new Error('Failed to fetch agent templates');
    return response.json();
  }

  static async getAgentTemplate(name: string): Promise<import('./types').AgentDefinition & { name: string }> {
    const response = await fetch(`${API_BASE_URL}/agents/templates/${name}`);
    if (!response.ok) throw new Error('Failed to fetch agent template');
    return response.json();
  }

  static async createAgent(data: {
    name: string;
    definition: import('./types').AgentDefinition;
  }): Promise<import('./types').AgentDefinition & { name: string }> {
    const response = await fetch(`${API_BASE_URL}/agents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create agent');
    }
    return response.json();
  }

  static async createAgentFromTemplate(
    templateName: string,
    name: string,
    customizations?: Partial<import('./types').AgentDefinition>
  ): Promise<import('./types').AgentDefinition & { name: string }> {
    const response = await fetch(`${API_BASE_URL}/agents/from-template/${templateName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, customizations }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create agent from template');
    }
    return response.json();
  }

  static async updateAgent(
    name: string,
    definition: import('./types').AgentDefinition
  ): Promise<import('./types').AgentDefinition & { name: string }> {
    const response = await fetch(`${API_BASE_URL}/agents/${name}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ definition }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update agent');
    }
    return response.json();
  }

  static async deleteAgent(name: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/agents/${name}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete agent');
    }
  }

  static async validateAgent(data: {
    name: string;
    definition: import('./types').AgentDefinition;
  }): Promise<{ valid: boolean; errors: string[] }> {
    const response = await fetch(`${API_BASE_URL}/agents/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      if (error.valid === false) {
        return error;
      }
      throw new Error('Failed to validate agent');
    }
    return response.json();
  }

  // Skills API endpoints
  static async listSkills() {
    const response = await fetch(`${API_BASE_URL}/skills`);
    if (!response.ok) throw new Error('Failed to list skills');
    return response.json();
  }

  static async getSkill(name: string) {
    const response = await fetch(`${API_BASE_URL}/skills/${name}`);
    if (!response.ok) throw new Error('Failed to fetch skill');
    return response.json();
  }

  static async createSkill(data: {
    name: string;
    description: string;
    content?: string;
    allowedTools?: string[];
  }) {
    const response = await fetch(`${API_BASE_URL}/skills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create skill');
    }
    return response.json();
  }

  static async updateSkill(
    name: string,
    data: {
      description?: string;
      content?: string;
      allowedTools?: string[];
    }
  ) {
    const response = await fetch(`${API_BASE_URL}/skills/${name}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update skill');
    }
    return response.json();
  }

  static async deleteSkill(name: string) {
    const response = await fetch(`${API_BASE_URL}/skills/${name}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete skill');
    }
    return response.json();
  }

  // Step-level cost breakdown
  static async getStepBreakdown(conversationId: number): Promise<import('./types').StepCostBreakdown[]> {
    const response = await fetch(`${API_BASE_URL}/analytics/steps/${conversationId}`);
    if (!response.ok) throw new Error('Failed to fetch step breakdown');
    return response.json();
  }

  // Per-tool cost breakdown
  static async getToolBreakdown(filters?: {
    conversationId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<import('./types').ToolCostBreakdown[]> {
    const params = new URLSearchParams();
    if (filters?.conversationId) params.append('conversationId', filters.conversationId.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);

    const response = await fetch(`${API_BASE_URL}/analytics/tools?${params}`);
    if (!response.ok) throw new Error('Failed to fetch tool breakdown');
    return response.json();
  }

  // Export cost report
  static async exportCostReport(conversationId: number, format: 'json' | 'csv' = 'json'): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/analytics/export/${conversationId}?format=${format}`);
    if (!response.ok) throw new Error('Failed to export cost report');

    if (format === 'csv') {
      return response.text();
    }
    return response.json();
  }

  // Download CSV helper
  static downloadCSV(csvContent: string, filename: string) {
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}

// Export singleton instance for convenience
export const apiClient = ApiClient;
