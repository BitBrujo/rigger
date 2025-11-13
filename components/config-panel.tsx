'use client';

import { useEffect, useState } from 'react';
import { useAgentStore } from '@/lib/store';
import { toast } from 'sonner';
import { MODEL_OPTIONS, SYSTEM_PROMPT_TEMPLATES } from '@/lib/types';
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
import { ApiClient } from '@/lib/api-client';
import { Preset, ALL_SDK_TOOLS } from '@/lib/types';
import { ToolSelector } from './tool-selector';
import { JsonEditor } from './ui/json-editor';
import { ChevronDown, AlertCircle, Plus, Wand2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { HOOK_TEMPLATES, HOOK_CATEGORIES, HookTemplate } from '@/lib/hook-templates';

export default function ConfigPanel() {
  const { config, setConfig, resetConfig } = useAgentStore();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [savingPreset, setSavingPreset] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [hookCategory, setHookCategory] = useState<string>('all');

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const data = await ApiClient.getPresets();
      setPresets(data);
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const handleSavePreset = async () => {
    const name = prompt('Enter preset name:');
    if (!name) return;

    setSavingPreset(true);
    try {
      await ApiClient.createPreset(name, config);
      await loadPresets();
      toast.success('Preset saved successfully', {
        description: `"${name}" has been saved to your presets`,
      });
    } catch (error: any) {
      toast.error('Failed to save preset', {
        description: error.message,
      });
    } finally {
      setSavingPreset(false);
    }
  };

  const handleLoadPreset = async (preset: Preset) => {
    setConfig(preset.config);
    toast.success('Preset loaded', {
      description: `Loaded configuration: ${preset.name}`,
    });
  };

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

  const filteredHookTemplates = hookCategory === 'all'
    ? HOOK_TEMPLATES
    : HOOK_TEMPLATES.filter(t => t.category === hookCategory);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold mb-2">Configuration</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleSavePreset} disabled={savingPreset}>
              Save Preset
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  Load Preset
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {presets.map((preset) => (
                  <DropdownMenuItem key={preset.id} onClick={() => handleLoadPreset(preset)}>
                    <div className="flex flex-col">
                      <span className="font-medium">{preset.name}</span>
                      {preset.description && (
                        <span className="text-xs text-muted-foreground">{preset.description}</span>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="ghost" onClick={resetConfig}>
              Reset
            </Button>
          </div>
        </div>

        <Separator />

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

            {/* Permission Mode */}
            <div className="space-y-2">
              <Label htmlFor="permission-mode" className="text-sm">Permission Mode</Label>
              <Select
                value={config.permissionMode || 'acceptEdits'}
                onValueChange={(value: any) => setConfig({ permissionMode: value })}
              >
                <SelectTrigger id="permission-mode" className="h-8 text-xs">
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
              <Alert className="mt-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs">
                  Controls which operations require user approval during agent execution
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </Card>

        <Separator />

        {/* Model Selection */}
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Select value={config.model} onValueChange={(value: any) => setConfig({ model: value })}>
            <SelectTrigger id="model">
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

        {/* Advanced Model Parameters - Collapsible */}
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

        <Separator />

        {/* System Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost">
                  Templates
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                {SYSTEM_PROMPT_TEMPLATES.map((template) => (
                  <DropdownMenuItem
                    key={template.name}
                    onClick={() => setConfig({ system: template.prompt })}
                  >
                    {template.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Textarea
            id="system-prompt"
            value={config.system || ''}
            onChange={(e) => setConfig({ system: e.target.value })}
            placeholder="Enter system prompt..."
            className="min-h-[100px] font-mono text-sm"
          />
        </div>

        {/* Agent SDK Tools Section */}
        <Separator />
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

            {/* Hook Configuration */}
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Hooks</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Intercept and modify agent behavior at specific lifecycle events
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setConfig({ hooks: {} })}
                  className="text-xs"
                >
                  Clear All
                </Button>
              </div>

              {/* Hook Templates */}
              <Card className="p-3 bg-muted/30">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-muted-foreground" />
                    <Label className="text-sm font-medium">Quick Templates</Label>
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

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs space-y-2">
                    <div><strong>Available Hook Events:</strong></div>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li><code>pre_tool_use</code> - Before tool execution</li>
                      <li><code>post_tool_use</code> - After tool execution</li>
                      <li><code>on_permission_denied</code> - When permission is denied</li>
                      <li><code>on_budget_exceeded</code> - When budget limit reached</li>
                      <li><code>on_turn_start</code> - Start of each turn</li>
                      <li><code>on_turn_end</code> - End of each turn</li>
                    </ul>
                    <div><strong>Actions:</strong> <code>warn</code>, <code>block</code>, <code>log</code>, <code>stop</code></div>
                  </AlertDescription>
                </Alert>
              </div>
            </div>

        {/* Stop Sequences */}
        <div className="space-y-2">
          <Label htmlFor="stop-sequences">Stop Sequences</Label>
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
      </div>
    </ScrollArea>
  );
}
