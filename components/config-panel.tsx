'use client';

import { useState } from 'react';
import { useAgentStore } from '@/lib/store';
import { toast } from 'sonner';
import { MODEL_OPTIONS, ALL_SDK_TOOLS, CLAUDE_CODE_PRESET_PROMPT, AgentDefinition } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ToolSelector } from './tool-selector';
import { JsonEditor } from './ui/json-editor';
import { ChevronDown, AlertCircle, Plus, Wand2, Trash2, Edit2, Users } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HOOK_TEMPLATES, HOOK_CATEGORIES, HookTemplate } from '@/lib/hook-templates';

export default function ConfigPanel() {
  const { config, setConfig } = useAgentStore();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [hookCategory, setHookCategory] = useState<string>('all');
  const [useClaudeCodePreset, setUseClaudeCodePreset] = useState(false);
  const [systemPromptText, setSystemPromptText] = useState('');
  const [editingSubagent, setEditingSubagent] = useState<string | null>(null);
  const [newSubagentName, setNewSubagentName] = useState('');
  const [newSubagentDefinition, setNewSubagentDefinition] = useState<AgentDefinition>({
    systemPrompt: '',
    allowedTools: [],
    disallowedTools: [],
  });

  const handleApplyHookTemplate = (template: HookTemplate) => {
    const currentHooks = config.hooks || {};
    const mergedHooks = { ...currentHooks, ...template.hooks };
    setConfig({ hooks: mergedHooks });
    toast.success('Hook template applied', {
      description: `Applied: ${template.name}`,
    });
  };

  const handleReplaceWithHookTemplate = (template: HookTemplate) => {
    setConfig({ hooks: template.hooks });
    toast.success('Hooks replaced', {
      description: `Replaced with: ${template.name}`,
    });
  };

  const handleClaudeCodePresetToggle = (checked: boolean) => {
    setUseClaudeCodePreset(checked);
    if (checked) {
      // Combine Claude Code preset with system prompt
      const finalPrompt = systemPromptText
        ? `${CLAUDE_CODE_PRESET_PROMPT}\n\n**Additional Instructions:**\n${systemPromptText}`
        : CLAUDE_CODE_PRESET_PROMPT;
      setConfig({ systemPrompt: finalPrompt });
      toast.success('Claude Code preset enabled');
    } else {
      // Clear to manual mode
      setConfig({ systemPrompt: systemPromptText || '' });
    }
  };

  const handleSystemPromptChange = (value: string) => {
    setSystemPromptText(value);
    if (useClaudeCodePreset) {
      // Update system prompt with preset + additional instructions
      const finalPrompt = value
        ? `${CLAUDE_CODE_PRESET_PROMPT}\n\n**Additional Instructions:**\n${value}`
        : CLAUDE_CODE_PRESET_PROMPT;
      setConfig({ systemPrompt: finalPrompt });
    } else {
      // Direct system prompt
      setConfig({ systemPrompt: value });
    }
  };

  const filteredHookTemplates = hookCategory === 'all'
    ? HOOK_TEMPLATES
    : HOOK_TEMPLATES.filter(t => t.category === hookCategory);


  const handleDeleteSubagent = (name: string) => {
    const currentAgents = config.customAgents || {};
    const { [name]: removed, ...remaining } = currentAgents;
    setConfig({ customAgents: remaining });
    toast.success('Subagent deleted', {
      description: `Removed: ${name}`,
    });
  };

  const handleSaveSubagent = () => {
    if (!newSubagentName.trim()) {
      toast.error('Please enter a subagent name');
      return;
    }
    const currentAgents = config.customAgents || {};
    const updatedAgents = { ...currentAgents, [newSubagentName]: newSubagentDefinition };
    setConfig({ customAgents: updatedAgents });
    toast.success('Subagent saved', {
      description: `Saved: ${newSubagentName}`,
    });
    // Reset form
    setNewSubagentName('');
    setNewSubagentDefinition({
      systemPrompt: '',
      allowedTools: [],
      disallowedTools: [],
    });
    setEditingSubagent(null);
  };

  const handleEditSubagent = (name: string) => {
    const currentAgents = config.customAgents || {};
    const agentDef = currentAgents[name];
    if (agentDef) {
      setNewSubagentName(name);
      setNewSubagentDefinition(agentDef);
      setEditingSubagent(name);
    }
  };

  const handleCancelEdit = () => {
    setNewSubagentName('');
    setNewSubagentDefinition({
      systemPrompt: '',
      allowedTools: [],
      disallowedTools: [],
    });
    setEditingSubagent(null);
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Two-column layout for configuration sections */}
        <div className="grid grid-cols-2 gap-6">
          {/* LEFT COLUMN - Core Settings */}
          <div className="space-y-6">
            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={config.model} onValueChange={(value: any) => setConfig({ model: value })}>
                <SelectTrigger id="model" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span>{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Agent SDK Configuration */}
            <Card className="p-4 bg-muted/50">
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-medium">Agent SDK Configuration</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    File operations, Bash execution, Web access, Multi-turn conversations, Automatic cost calculation
                  </p>
                </div>

                {/* Max Turns */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="max-turns" className="text-sm">Max Turns</Label>
                    <Input
                      id="max-turns"
                      type="number"
                      value={config.maxTurns || 20}
                      onChange={(e) => setConfig({ maxTurns: parseInt(e.target.value) || 20 })}
                      className="w-20 h-7 text-xs"
                      min={1}
                      max={100}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Maximum conversation turns</p>
                </div>

                {/* Max Budget USD */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="max-budget" className="text-sm">Max Budget (USD)</Label>
                    <Input
                      id="max-budget"
                      type="number"
                      value={config.maxBudgetUsd || ''}
                      onChange={(e) => setConfig({ maxBudgetUsd: e.target.value ? parseFloat(e.target.value) : undefined })}
                      className="w-20 h-7 text-xs"
                      placeholder="No limit"
                      step="0.01"
                      min={0}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Stop when cost exceeds this amount</p>
                </div>
              </div>
            </Card>

            {/* Permission Mode */}
            <Card className="p-4 bg-muted/50">
              <div className="space-y-3">
                <div>
                  <Label className="text-base font-medium">Permission Mode</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Controls which operations require user approval during agent execution
                  </p>
                </div>
                <Select
                  value={config.permissionMode || 'acceptEdits'}
                  onValueChange={(value: any) => setConfig({ permissionMode: value })}
                >
                  <SelectTrigger id="permission-mode" className="h-11 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">
                      <div className="flex flex-col">
                        <span className="font-medium">Default</span>
                        <span className="text-xs text-muted-foreground">Prompt for all file/bash operations</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="acceptEdits">
                      <div className="flex flex-col">
                        <span className="font-medium">Accept Edits</span>
                        <span className="text-xs text-muted-foreground">Auto-approve file edits, prompt for bash</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bypassPermissions">
                      <div className="flex flex-col">
                        <span className="font-medium">Bypass Permissions</span>
                        <span className="text-xs text-muted-foreground">Auto-approve all operations (use with caution)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="plan">
                      <div className="flex flex-col">
                        <span className="font-medium">Plan Mode</span>
                        <span className="text-xs text-muted-foreground">Agent plans before executing</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* System Prompt */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-medium">System Prompt</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Define the agent's persona, capabilities, and behavioral guidelines
                </p>
              </div>

              {/* Claude Code Preset Toggle */}
              <Card className="p-3 bg-muted/30">
                <div className="flex items-center gap-2">
                  <Switch
                    id="use-claude-code-preset"
                    checked={useClaudeCodePreset}
                    onCheckedChange={handleClaudeCodePresetToggle}
                  />
                  <Label htmlFor="use-claude-code-preset" className="text-sm font-medium cursor-pointer">
                    Use Claude Code Preset
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Professional coding assistant prompt with best practices and tool usage guidelines
                </p>
              </Card>

              {/* System Prompt Field */}
              <div className="space-y-2">
                <Label htmlFor="system-prompt" className="text-sm">
                  System Prompt {useClaudeCodePreset && '(Additional Instructions)'}
                </Label>
                <Textarea
                  id="system-prompt"
                  value={systemPromptText}
                  onChange={(e) => handleSystemPromptChange(e.target.value)}
                  placeholder={
                    useClaudeCodePreset
                      ? "Add project-specific instructions, coding standards, or custom guidelines..."
                      : "Enter your system prompt..."
                  }
                  className={`min-h-[150px] text-sm ${useClaudeCodePreset ? '' : 'font-mono'}`}
                />
                <p className="text-xs text-muted-foreground">
                  {useClaudeCodePreset
                    ? "These instructions will be appended to the Claude Code preset"
                    : "Define the agent's persona, capabilities, and behavioral guidelines"}
                </p>
              </div>
            </div>

            {/* Hook Configuration */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-medium">Hooks</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Intercept and modify agent behavior at specific lifecycle events
                </p>
              </div>

              {/* Hook Templates */}
              <Card className="p-3 bg-muted/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wand2 className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm font-medium">Quick Templates</Label>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setConfig({ hooks: {} })}
                      className="text-xs h-7"
                    >
                      Clear All
                    </Button>
                  </div>

                  {/* Category Filter */}
                  <Select value={hookCategory} onValueChange={setHookCategory}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOOK_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Template Grid */}
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {filteredHookTemplates.map((template) => (
                      <div
                        key={template.name}
                        className="p-2 border rounded-md bg-background hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-medium truncate">{template.name}</h4>
                              <Badge variant="outline" className="text-[10px] px-1 py-0">
                                {template.category}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {template.description}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleApplyHookTemplate(template)}
                              title="Merge with current hooks"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => handleReplaceWithHookTemplate(template)}
                              title="Replace all hooks"
                            >
                              Use
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              {/* Manual JSON Editor */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Custom Hooks (JSON)</Label>
                <JsonEditor
                  value={config.hooks || {}}
                  onChange={(value) => setConfig({ hooks: value })}
                  placeholder={`{
  "pre_tool_use": {
    "pattern": "^Bash$",
    "action": "warn"
  },
  "on_budget_exceeded": {
    "action": "stop"
  }
}`}
                  rows={10}
                />
              </div>
            </div>

            {/* Subagent Configuration */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Subagents
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Define specialized agents for specific tasks (used with Task tool)
                </p>
              </div>

              {/* Current Subagents List */}
              {Object.keys(config.customAgents || {}).length > 0 && (
                <Card className="p-3 bg-muted/30">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Your Subagents</Label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {Object.entries(config.customAgents || {}).map(([name, definition]) => (
                        <div
                          key={name}
                          className="p-2 border rounded-md bg-background flex items-center justify-between"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {definition.allowedTools?.length || 0} tools allowed
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0"
                              onClick={() => handleEditSubagent(name)}
                              title="Edit"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteSubagent(name)}
                              title="Delete"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Add/Edit Form */}
              <Collapsible open={editingSubagent !== null}>
                <CollapsibleContent>
                  <Card className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        {editingSubagent ? 'Edit Subagent' : 'New Subagent'}
                      </Label>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </div>

                    {/* Name */}
                    <div className="space-y-1">
                      <Label htmlFor="subagent-name" className="text-xs">Name</Label>
                      <Input
                        id="subagent-name"
                        value={newSubagentName}
                        onChange={(e) => setNewSubagentName(e.target.value)}
                        placeholder="e.g., code-reviewer"
                        className="h-8 text-sm"
                        disabled={!!editingSubagent}
                      />
                    </div>

                    {/* System Prompt */}
                    <div className="space-y-1">
                      <Label htmlFor="subagent-prompt" className="text-xs">System Prompt</Label>
                      <Textarea
                        id="subagent-prompt"
                        value={newSubagentDefinition.systemPrompt || ''}
                        onChange={(e) =>
                          setNewSubagentDefinition({
                            ...newSubagentDefinition,
                            systemPrompt: e.target.value,
                          })
                        }
                        placeholder="Define the subagent's purpose and instructions..."
                        className="min-h-[80px] text-xs"
                      />
                    </div>

                    {/* Allowed Tools */}
                    <div className="space-y-1">
                      <Label htmlFor="subagent-allowed-tools" className="text-xs">
                        Allowed Tools (comma-separated)
                      </Label>
                      <Input
                        id="subagent-allowed-tools"
                        value={newSubagentDefinition.allowedTools?.join(', ') || ''}
                        onChange={(e) =>
                          setNewSubagentDefinition({
                            ...newSubagentDefinition,
                            allowedTools: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="Read, Write, Grep, Glob..."
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    {/* Disallowed Tools */}
                    <div className="space-y-1">
                      <Label htmlFor="subagent-disallowed-tools" className="text-xs">
                        Disallowed Tools (comma-separated)
                      </Label>
                      <Input
                        id="subagent-disallowed-tools"
                        value={newSubagentDefinition.disallowedTools?.join(', ') || ''}
                        onChange={(e) =>
                          setNewSubagentDefinition({
                            ...newSubagentDefinition,
                            disallowedTools: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        placeholder="Bash, Edit..."
                        className="h-8 text-xs font-mono"
                      />
                    </div>

                    <Button
                      size="sm"
                      onClick={handleSaveSubagent}
                      className="w-full h-8 text-xs"
                    >
                      Save Subagent
                    </Button>
                  </Card>
                </CollapsibleContent>
              </Collapsible>

              {/* Add New Button */}
              {editingSubagent === null && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setEditingSubagent('new')}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Custom Subagent
                </Button>
              )}
            </div>
          </div>
          {/* END LEFT COLUMN */}

          {/* RIGHT COLUMN - Advanced/Tools/Integrations */}
          <div className="space-y-6">
            {/* Agent SDK Tools Section */}
            <div className="space-y-3">
              <div>
                <Label className="text-base font-medium">Agent SDK Tools</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Select which built-in tools the agent can use during execution
                </p>
              </div>
              <ToolSelector
                selectedTools={config.allowedTools || [...ALL_SDK_TOOLS]}
                onChange={(tools) => setConfig({ allowedTools: tools })}
                disabled={false}
              />
            </div>

            {/* MCP Server Configuration */}
            <Separator />
            <div className="space-y-3">
              <div>
                <Label className="text-base font-medium">MCP Servers</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  Configure Model Context Protocol servers for external tool integration
                </p>
              </div>

              <JsonEditor
                value={config.mcpServers || {}}
                onChange={(value) => setConfig({ mcpServers: value })}
                placeholder={`{
  "server-name": {
    "command": "node",
    "args": ["path/to/server.js"],
    "env": { "API_KEY": "..." }
  }
}`}
                rows={8}
              />

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Switch
                    id="strict-mcp"
                    checked={config.strictMcpConfig || false}
                    onCheckedChange={(checked) => setConfig({ strictMcpConfig: checked })}
                  />
                  <Label htmlFor="strict-mcp" className="text-sm">
                    Strict MCP Config
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Fail if MCP server connection fails (otherwise continues without MCP)
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Example MCP Server:</strong><br />
                  <code className="text-xs">
                    {`{ "filesystem": { "command": "npx", "args": ["-y", "@modelcontextprotocol/server-filesystem", "/path"] } }`}
                  </code>
                </AlertDescription>
              </Alert>
            </div>

            {/* Stop Sequences */}
            <div className="space-y-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="stop-sequences" className="cursor-help">Stop Sequences</Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Sequences that will cause the model to stop generating (e.g., custom delimiters or tokens)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="stop-sequences"
                placeholder="Comma-separated..."
                value={config.stop_sequences?.join(', ') || ''}
                onChange={(e) =>
                  setConfig({
                    stop_sequences: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>

            {/* Advanced SDK Settings - Collapsible */}
            <Separator />
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between" size="sm">
                  <span className="text-sm">Advanced SDK Settings</span>
                  <ChevronDown className="h-4 w-4 transition-transform" />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* Max Thinking Tokens */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Label htmlFor="max-thinking-tokens" className="cursor-help">Max Thinking Tokens</Label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">Maximum tokens for extended thinking mode. Set to null to disable thinking.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <Input
                      id="max-thinking-tokens"
                      type="number"
                      value={config.maxThinkingTokens === null || config.maxThinkingTokens === undefined ? '' : config.maxThinkingTokens}
                      onChange={(e) => setConfig({ maxThinkingTokens: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-24 h-8 text-xs"
                      placeholder="None"
                      min={0}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enable extended thinking mode (Claude 3.7 Sonnet). Leave empty to disable.
                  </p>
                </div>

                {/* Fallback Model */}
                <div className="space-y-2">
                  <Label htmlFor="fallback-model">Fallback Model</Label>
                  <Select
                    value={config.fallbackModel || 'none'}
                    onValueChange={(value: any) => setConfig({ fallbackModel: value === 'none' ? undefined : value })}
                  >
                    <SelectTrigger id="fallback-model" className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No fallback</SelectItem>
                      {MODEL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Model to use if primary model fails or is unavailable
                  </p>
                </div>

                {/* Working Directory */}
                <div className="space-y-2">
                  <Label htmlFor="working-directory">Working Directory</Label>
                  <Input
                    id="working-directory"
                    value={config.workingDirectory || ''}
                    onChange={(e) => setConfig({ workingDirectory: e.target.value })}
                    placeholder="/app/workspace"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Base directory for file operations (default: /app/workspace)
                  </p>
                </div>

                {/* Additional Directories */}
                <div className="space-y-2">
                  <Label htmlFor="additional-directories">Additional Directories</Label>
                  <Input
                    id="additional-directories"
                    placeholder="Comma-separated paths..."
                    value={config.additionalDirectories?.join(', ') || ''}
                    onChange={(e) =>
                      setConfig({
                        additionalDirectories: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Extra directories the agent can access
                  </p>
                </div>

                {/* Environment Variables */}
                <div className="space-y-2">
                  <Label htmlFor="env-variables">Environment Variables</Label>
                  <JsonEditor
                    value={config.env || {}}
                    onChange={(value) => setConfig({ env: value })}
                    placeholder={`{
  "API_KEY": "...",
  "DEBUG": "true"
}`}
                    rows={6}
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom environment variables for Bash tool execution
                  </p>
                </div>

                {/* Executable */}
                <div className="space-y-2">
                  <Label htmlFor="executable">JavaScript Runtime</Label>
                  <Select
                    value={config.executable || 'node'}
                    onValueChange={(value: any) => setConfig({ executable: value })}
                  >
                    <SelectTrigger id="executable" className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="node">Node.js</SelectItem>
                      <SelectItem value="bun">Bun</SelectItem>
                      <SelectItem value="deno">Deno</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Runtime to use for JavaScript execution
                  </p>
                </div>

                {/* Executable Args */}
                <div className="space-y-2">
                  <Label htmlFor="executable-args">Runtime Arguments</Label>
                  <Input
                    id="executable-args"
                    placeholder="Comma-separated args..."
                    value={config.executableArgs?.join(', ') || ''}
                    onChange={(e) =>
                      setConfig({
                        executableArgs: e.target.value
                          .split(',')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Arguments passed to the JavaScript runtime (e.g., --experimental-modules)
                  </p>
                </div>

                {/* Allow Dangerously Skip Permissions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="skip-permissions"
                      checked={config.allowDangerouslySkipPermissions || false}
                      onCheckedChange={(checked) => setConfig({ allowDangerouslySkipPermissions: checked })}
                    />
                    <Label htmlFor="skip-permissions" className="text-sm">
                      Dangerously Skip All Permissions
                    </Label>
                  </div>
                  <Alert className="border-destructive/50">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <AlertDescription className="text-xs">
                      <strong>Warning:</strong> This bypasses ALL permission checks. Only enable in trusted, isolated environments.
                    </AlertDescription>
                  </Alert>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Advanced Model Parameters - Collapsible */}
            <Separator />
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between" size="sm">
                  <span className="text-sm">Advanced Model Parameters</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* Max Tokens */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="max-tokens">Max Tokens</Label>
                    <Input
                      id="max-tokens-input"
                      type="number"
                      value={config.max_tokens}
                      onChange={(e) => setConfig({ max_tokens: parseInt(e.target.value) || 1024 })}
                      className="w-20 h-8"
                      min={1}
                      max={8192}
                    />
                  </div>
                  <Slider
                    id="max-tokens"
                    value={[config.max_tokens]}
                    onValueChange={([value]) => setConfig({ max_tokens: value })}
                    min={256}
                    max={8192}
                    step={256}
                  />
                </div>

                {/* Temperature */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="temperature">Temperature</Label>
                    <Badge variant="outline">{config.temperature?.toFixed(2) || '0.70'}</Badge>
                  </div>
                  <Slider
                    id="temperature"
                    value={[config.temperature || 0.7]}
                    onValueChange={([value]) => setConfig({ temperature: value })}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Deterministic</span>
                    <span>Creative</span>
                  </div>
                </div>

                {/* Top P */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="top-p">Top P</Label>
                    <Badge variant="outline">{config.top_p?.toFixed(2) || '0.90'}</Badge>
                  </div>
                  <Slider
                    id="top-p"
                    value={[config.top_p || 0.9]}
                    onValueChange={([value]) => setConfig({ top_p: value })}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>

                {/* Top K */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="top-k">Top K</Label>
                    <Input
                      id="top-k-input"
                      type="number"
                      value={config.top_k || ''}
                      onChange={(e) => setConfig({ top_k: parseInt(e.target.value) || undefined })}
                      className="w-20 h-8"
                      placeholder="Auto"
                      min={1}
                      max={500}
                    />
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
          {/* END RIGHT COLUMN */}
        </div>
        {/* END TWO-COLUMN GRID */}
      </div>
    </ScrollArea>
  );
}
