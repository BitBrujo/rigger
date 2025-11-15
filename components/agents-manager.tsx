'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiClient } from '@/lib/api-client';
import { AgentDefinition } from '@/lib/types';
import { AGENT_TEMPLATES, getTemplate } from '@/lib/agent-templates';

export function AgentsManager() {
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingAgent, setEditingAgent] = useState<AgentDefinition | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Load agents on mount
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getAgents();
      setAgents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFromTemplate = (templateName: string) => {
    const template = getTemplate(templateName);
    if (!template) return;

    setEditingAgent({
      name: template.name,
      systemPrompt: template.systemPrompt,
      description: template.description,
      allowedTools: template.allowedTools || [],
      model: template.model || 'claude-sonnet-4-20250514',
      temperature: template.temperature || 1,
      maxTokens: template.maxTokens || 8192,
    });
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (!editingAgent || !editingAgent.name || !editingAgent.systemPrompt) {
      setError('Name and system prompt are required');
      return;
    }

    try {
      setError(null);
      if (isCreating) {
        await apiClient.createAgent(editingAgent);
      } else {
        await apiClient.updateAgent(editingAgent.name, editingAgent);
      }
      await loadAgents();
      setEditingAgent(null);
      setIsCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save agent');
    }
  };

  const handleDelete = async (name: string) => {
    if (!confirm(`Delete agent "${name}"?`)) return;

    try {
      setError(null);
      await apiClient.deleteAgent(name);
      await loadAgents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete agent');
    }
  };

  const handleCancel = () => {
    setEditingAgent(null);
    setIsCreating(false);
    setError(null);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading agents...</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Create from Template */}
      {!editingAgent && !isCreating && (
        <div>
          <h3 className="text-sm font-medium mb-2">Create Subagent from Template</h3>
          <div className="grid grid-cols-1 gap-2">
            {Object.values(AGENT_TEMPLATES).map((template) => (
              <Button
                key={template.name}
                variant="outline"
                size="sm"
                onClick={() => handleCreateFromTemplate(template.name)}
                className="justify-start h-auto py-2 px-3 text-left"
              >
                <div className="w-full overflow-hidden">
                  <div className="font-medium truncate">{template.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2 break-words">
                    {template.description}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Editor Form */}
      {(editingAgent || isCreating) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {isCreating ? 'Create Subagent' : 'Edit Subagent'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editingAgent?.name || ''}
                onChange={(e) =>
                  setEditingAgent(prev => prev ? { ...prev, name: e.target.value } : null)
                }
                placeholder="agent-name"
                disabled={!isCreating}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                value={editingAgent?.description || ''}
                onChange={(e) =>
                  setEditingAgent(prev => prev ? { ...prev, description: e.target.value } : null)
                }
                placeholder="Brief description"
              />
            </div>

            <div>
              <label className="text-sm font-medium">System Prompt</label>
              <Textarea
                value={editingAgent?.systemPrompt || ''}
                onChange={(e) =>
                  setEditingAgent(prev => prev ? { ...prev, systemPrompt: e.target.value } : null)
                }
                placeholder="You are..."
                rows={6}
                className="font-mono text-xs"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSave} size="sm">
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button onClick={handleCancel} variant="outline" size="sm">
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agents List */}
      {!editingAgent && !isCreating && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Saved Subagents</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingAgent({
                  name: '',
                  systemPrompt: '',
                  description: '',
                  allowedTools: [],
                  model: 'claude-sonnet-4-20250514',
                  temperature: 1,
                  maxTokens: 8192,
                });
                setIsCreating(true);
              }}
            >
              <Plus className="w-4 h-4 mr-1" />
              Custom
            </Button>
          </div>

          {agents.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No saved agents. Create one from a template above.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {agents.map((agent) => (
                <Card key={agent.name}>
                  <CardHeader className="py-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm">{agent.name}</CardTitle>
                        {agent.description && (
                          <CardDescription className="text-xs mt-1">
                            {agent.description}
                          </CardDescription>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingAgent(agent);
                            setIsCreating(false);
                          }}
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(agent.name)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
