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
import { SkillsManager } from './skills-manager';
import { AgentsManager } from './agents-manager';
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

  // Collapsible state for expandable cards
  const [agentSdkOpen, setAgentSdkOpen] = useState(false);
  const [systemPromptOpen, setSystemPromptOpen] = useState(false);
  const [hooksOpen, setHooksOpen] = useState(false);
  const [sdkToolsOpen, setSdkToolsOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);
  const [mcpServersOpen, setMcpServersOpen] = useState(false);
  const [stopSequencesOpen, setStopSequencesOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);
  const [advancedSdkOpen, setAdvancedSdkOpen] = useState(false);

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

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Two-column layout for configuration sections */}
        <div className="grid grid-cols-2 gap-6">
          {/* LEFT COLUMN - Core Settings */}
          <div className="space-y-6">
            {/* Model Selection */}
            <Card className="p-4 border-2 bg-muted/50">
              <div className="space-y-2">
                <Label htmlFor="model" className="text-base font-medium">Model</Label>
                <Select value={config.model} onValueChange={(value: any) => setConfig({ model: value })}>
                  <SelectTrigger id="model" className="w-full !h-auto !py-2 flex items-center justify-between">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODEL_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col items-start py-2">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Permission Mode */}
            <Card className="p-4 border-2 bg-muted/50">
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
                  <SelectTrigger id="permission-mode" className="w-full !h-auto !py-2 flex items-center justify-between text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">
                      <div className="flex flex-col items-start py-2">
                        <span className="font-medium">Default</span>
                        <span className="text-xs text-muted-foreground">Prompt for all file/bash operations</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="acceptEdits">
                      <div className="flex flex-col items-start py-2">
                        <span className="font-medium">Accept Edits</span>
                        <span className="text-xs text-muted-foreground">Auto-approve file edits, prompt for bash</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="bypassPermissions">
                      <div className="flex flex-col items-start py-2">
                        <span className="font-medium">Bypass Permissions</span>
                        <span className="text-xs text-muted-foreground">Auto-approve all operations (use with caution)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="plan">
                      <div className="flex flex-col items-start py-2">
                        <span className="font-medium">Plan Mode</span>
                        <span className="text-xs text-muted-foreground">Agent plans before executing</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </Card>

            {/* Agent SDK Configuration */}
            <Collapsible open={agentSdkOpen} onOpenChange={setAgentSdkOpen}>
              <Card className="p-4 border-2 bg-muted/50">
                <CollapsibleTrigger asChild>
                  <div className="flex items-start gap-2 cursor-pointer">
                    <ChevronDown className={`h-5 w-5 transition-transform flex-shrink-0 mt-0.5 ${agentSdkOpen ? 'rotate-180' : ''}`} />
                    <div className="flex-1">
                      <Label className="text-base font-medium cursor-pointer">Agent SDK Configuration</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        File operations, Bash execution, Web access, Multi-turn conversations, Automatic cost calculation
                      </p>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-3">
                    <Card className="p-3 bg-background">
                  <div className="space-y-3">
                    {/* Max Turns */}
                    <div className="space-y-1">
                      <div className="flex items-end justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="max-turns" className="text-sm">Max Turns</Label>
                          <p className="text-xs text-muted-foreground">Maximum conversation turns</p>
                        </div>
                        <Input
                          id="max-turns"
                          type="number"
                          value={config.maxTurns || 20}
                          onChange={(e) => setConfig({ maxTurns: parseInt(e.target.value) || 20 })}
                          className="w-20 h-8 text-xs"
                          min={1}
                          max={100}
                        />
                      </div>
                    </div>

                    {/* Max Budget USD */}
                    <div className="space-y-1">
                      <div className="flex items-end justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="max-budget" className="text-sm">Max Budget (USD)</Label>
                          <p className="text-xs text-muted-foreground">Stop when cost exceeds this amount</p>
                        </div>
                        <Input
                          id="max-budget"
                          type="number"
                          value={config.maxBudgetUsd || ''}
                          onChange={(e) => setConfig({ maxBudgetUsd: e.target.value ? parseFloat(e.target.value) : undefined })}
                          className="w-20 h-8 text-xs"
                          placeholder="No limit"
                          step="0.01"
                          min={0}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* System Prompt */}
            <Collapsible open={systemPromptOpen} onOpenChange={setSystemPromptOpen}>
              <Card className="p-4 border-2 bg-muted/50">
                <CollapsibleTrigger asChild>
                  <div className="flex items-start gap-2 cursor-pointer">
                    <ChevronDown className={`h-5 w-5 transition-transform flex-shrink-0 mt-0.5 ${systemPromptOpen ? 'rotate-180' : ''}`} />
                    <div className="flex-1">
                      <Label className="text-base font-medium cursor-pointer">System Prompt</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Define the agent's persona, capabilities, and behavioral guidelines
                      </p>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-3 space-y-3">
                    {/* Claude Code Preset Toggle */}
                <Card className="p-3 bg-background">
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
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Agents Configuration */}
            <Collapsible open={agentsOpen} onOpenChange={setAgentsOpen}>
              <Card className="p-4 border-2 bg-muted/50">
                <CollapsibleTrigger asChild>
                  <div className="flex items-start gap-2 cursor-pointer">
                    <ChevronDown className={`h-5 w-5 transition-transform flex-shrink-0 mt-0.5 ${agentsOpen ? 'rotate-180' : ''}`} />
                    <div className="flex-1">
                      <Label className="text-base font-medium cursor-pointer">Custom Agents</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create specialized agents with templates or from scratch
                      </p>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-3">
                    <AgentsManager />
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Hook Configuration */}
            <Collapsible open={hooksOpen} onOpenChange={setHooksOpen}>
              <Card className="p-4 border-2 bg-muted/50">
                <CollapsibleTrigger asChild>
                  <div className="flex items-start gap-2 cursor-pointer">
                    <ChevronDown className={`h-5 w-5 transition-transform flex-shrink-0 mt-0.5 ${hooksOpen ? 'rotate-180' : ''}`} />
                    <div className="flex-1">
                      <Label className="text-base font-medium cursor-pointer">Hooks</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Intercept and modify agent behavior at specific lifecycle events
                      </p>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-3 space-y-3">
                    {/* Hook Templates */}
                <Card className="p-3 bg-background">
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
                </CollapsibleContent>
              </Card>
            </Collapsible>

          </div>
          {/* END LEFT COLUMN */}

          {/* RIGHT COLUMN - Advanced/Tools/Integrations */}
          <div className="space-y-6">
            {/* Agent SDK Tools Section */}
            <Collapsible open={sdkToolsOpen} onOpenChange={setSdkToolsOpen}>
              <Card className="p-4 border-2 bg-muted/50">
                <CollapsibleTrigger asChild>
                  <div className="flex items-start gap-2 cursor-pointer">
                    <ChevronDown className={`h-5 w-5 transition-transform flex-shrink-0 mt-0.5 ${sdkToolsOpen ? 'rotate-180' : ''}`} />
                    <div className="flex-1">
                      <Label className="text-base font-medium cursor-pointer">Agent SDK Tools</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Select which built-in tools the agent can use during execution
                      </p>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-3">
                    <ToolSelector
                      selectedTools={config.allowedTools || [...ALL_SDK_TOOLS]}
                      onChange={(tools) => setConfig({ allowedTools: tools })}
                      disabled={false}
                    />
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Skills Configuration */}
            <Collapsible open={skillsOpen} onOpenChange={setSkillsOpen}>
              <Card className="p-4 border-2 bg-muted/50">
                <CollapsibleTrigger asChild>
                  <div className="flex items-start gap-2 cursor-pointer">
                    <ChevronDown className={`h-5 w-5 transition-transform flex-shrink-0 mt-0.5 ${skillsOpen ? 'rotate-180' : ''}`} />
                    <div className="flex-1">
                      <Label className="text-base font-medium cursor-pointer">Skills Configuration</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Manage specialized agent skills from .claude/skills/
                      </p>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-3">
                    <SkillsManager />
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* MCP Server Configuration */}
            <Collapsible open={mcpServersOpen} onOpenChange={setMcpServersOpen}>
              <Card className="p-4 border-2 bg-muted/50">
                <CollapsibleTrigger asChild>
                  <div className="flex items-start gap-2 cursor-pointer">
                    <ChevronDown className={`h-5 w-5 transition-transform flex-shrink-0 mt-0.5 ${mcpServersOpen ? 'rotate-180' : ''}`} />
                    <div className="flex-1">
                      <Label className="text-base font-medium cursor-pointer">MCP Servers</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Configure Model Context Protocol servers for external tool integration
                      </p>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-3 space-y-3">

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
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Stop Sequences */}
            <Collapsible open={stopSequencesOpen} onOpenChange={setStopSequencesOpen}>
              <Card className="p-4 border-2 bg-muted/50">
                <CollapsibleTrigger asChild>
                  <div className="flex items-start gap-2 cursor-pointer">
                    <ChevronDown className={`h-5 w-5 transition-transform flex-shrink-0 mt-0.5 ${stopSequencesOpen ? 'rotate-180' : ''}`} />
                    <div className="flex-1">
                      <Label className="text-base font-medium cursor-pointer">Stop Sequences</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Special strings that tell the AI when to stop generating text
                      </p>
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="mt-3">
                    <Card className="p-3 bg-background">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="stop-sequences" className="text-sm">Custom Stop Sequences</Label>
                      <Input
                        id="stop-sequences"
                        placeholder='e.g., "\n\n", "User:", "END"'
                        value={config.stop_sequences?.join(', ') || ''}
                        onChange={(e) =>
                          setConfig({
                            stop_sequences: e.target.value
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean),
                          })
                        }
                        className="font-mono text-xs"
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter comma-separated values. Model stops when it encounters any of these strings.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Quick Templates</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => {
                            const current = config.stop_sequences || [];
                            if (!current.includes('\n\n')) {
                              setConfig({ stop_sequences: [...current, '\n\n'] });
                            }
                          }}
                          className="justify-start text-xs h-auto py-2"
                        >
                          <code className="font-mono">\n\n</code>
                          <span className="ml-2 text-muted-foreground">Double newline</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => {
                            const current = config.stop_sequences || [];
                            if (!current.includes('User:')) {
                              setConfig({ stop_sequences: [...current, 'User:'] });
                            }
                          }}
                          className="justify-start text-xs h-auto py-2"
                        >
                          <code className="font-mono">User:</code>
                          <span className="ml-2 text-muted-foreground">User turn</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => {
                            const current = config.stop_sequences || [];
                            if (!current.includes('</response>')) {
                              setConfig({ stop_sequences: [...current, '</response>'] });
                            }
                          }}
                          className="justify-start text-xs h-auto py-2"
                        >
                          <code className="font-mono">{"</response>"}</code>
                          <span className="ml-2 text-muted-foreground">XML tag</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => {
                            const current = config.stop_sequences || [];
                            if (!current.includes('---')) {
                              setConfig({ stop_sequences: [...current, '---'] });
                            }
                          }}
                          className="justify-start text-xs h-auto py-2"
                        >
                          <code className="font-mono">---</code>
                          <span className="ml-2 text-muted-foreground">Delimiter</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                    </Card>
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Advanced SDK Settings - Collapsible */}
            <Collapsible open={advancedSdkOpen} onOpenChange={setAdvancedSdkOpen}>
              <Card className="p-4 border-2 bg-muted/50">
                <CollapsibleTrigger asChild>
                  <div className="flex items-start gap-2 cursor-pointer">
                    <ChevronDown className={`h-5 w-5 transition-transform flex-shrink-0 mt-0.5 ${advancedSdkOpen ? 'rotate-180' : ''}`} />
                    <div className="flex-1">
                      <Label className="text-base font-medium cursor-pointer">Advanced SDK Settings</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Extended thinking, fallback model, working directory, environment variables
                      </p>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-3 space-y-4">
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
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Advanced Model Parameters - Collapsible */}
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
              <Card className="p-4 border-2 bg-muted/50">
                <CollapsibleTrigger asChild>
                  <div className="flex items-start gap-2 cursor-pointer">
                    <ChevronDown className={`h-5 w-5 transition-transform flex-shrink-0 mt-0.5 ${advancedOpen ? 'rotate-180' : ''}`} />
                    <div className="flex-1">
                      <Label className="text-base font-medium cursor-pointer">Advanced Model Parameters</Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Max tokens, temperature, top-p, top-k sampling parameters
                      </p>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-3 space-y-4">
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
                  </div>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </div>
          {/* END RIGHT COLUMN */}
        </div>
        {/* END TWO-COLUMN GRID */}
      </div>
    </ScrollArea>
  );
}
