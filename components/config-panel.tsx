'use client';

import { useEffect, useState } from 'react';
import { useAgentStore } from '@/lib/store';
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
import { ApiClient } from '@/lib/api-client';
import { Preset, ALL_SDK_TOOLS } from '@/lib/types';
import { ToolSelector } from './tool-selector';
import { JsonEditor } from './ui/json-editor';

export default function ConfigPanel() {
  const { config, setConfig, resetConfig, sdkMode, setSdkMode } = useAgentStore();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [savingPreset, setSavingPreset] = useState(false);

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
    } catch (error: any) {
      alert('Failed to save preset: ' + error.message);
    } finally {
      setSavingPreset(false);
    }
  };

  const handleLoadPreset = async (preset: Preset) => {
    setConfig(preset.config);
  };

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

        {/* SDK Mode Toggle */}
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sdk-mode" className="text-base font-medium">
                Agent SDK Mode
              </Label>
              <p className="text-sm text-muted-foreground">
                {sdkMode
                  ? 'Using Agent SDK with built-in tools & containerization'
                  : 'Using standard Messages API'
                }
              </p>
            </div>
            <Switch
              id="sdk-mode"
              checked={sdkMode}
              onCheckedChange={setSdkMode}
            />
          </div>
          {sdkMode && (
            <div className="mt-3 pt-3 border-t border-border/50 space-y-3">
              <p className="text-xs text-muted-foreground">
                Agent SDK features: File operations, Bash execution, Web access, Multi-turn conversations, Automatic cost calculation
              </p>

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
          )}
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
        {sdkMode && (
          <>
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
          </>
        )}

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
