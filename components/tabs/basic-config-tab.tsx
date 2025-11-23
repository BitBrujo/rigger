'use client';

import { useAgentStore } from '@/lib/store';
import { MODEL_OPTIONS, CLAUDE_CODE_PRESET_PROMPT } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import { toast } from 'sonner';

export function BasicConfigTab() {
  const { config, setConfig } = useAgentStore();
  const [useClaudeCodePreset, setUseClaudeCodePreset] = useState(false);
  const [systemPromptText, setSystemPromptText] = useState('');

  const handleClaudeCodePresetToggle = (checked: boolean) => {
    setUseClaudeCodePreset(checked);
    if (checked) {
      const finalPrompt = systemPromptText
        ? `${CLAUDE_CODE_PRESET_PROMPT}\n\n**Additional Instructions:**\n${systemPromptText}`
        : CLAUDE_CODE_PRESET_PROMPT;
      setConfig({ systemPrompt: finalPrompt });
      toast.success('Claude Code preset enabled');
    } else {
      setConfig({ systemPrompt: systemPromptText || '' });
    }
  };

  const handleSystemPromptChange = (value: string) => {
    setSystemPromptText(value);
    if (useClaudeCodePreset) {
      const finalPrompt = value
        ? `${CLAUDE_CODE_PRESET_PROMPT}\n\n**Additional Instructions:**\n${value}`
        : CLAUDE_CODE_PRESET_PROMPT;
      setConfig({ systemPrompt: finalPrompt });
    } else {
      setConfig({ systemPrompt: value });
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Basic Configuration</h2>
          <p className="text-muted-foreground">Model selection, permission mode, and core Agent SDK settings</p>
        </div>

        {/* Model Selection */}
        <Card className="p-4">
          <div className="space-y-2">
            <Label htmlFor="model" className="text-base font-medium">Model</Label>
            <Select value={config.model} onValueChange={(value: any) => setConfig({ model: value })}>
              <SelectTrigger id="model">
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
        <Card className="p-4">
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
              <SelectTrigger>
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

        {/* Temperature */}
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Temperature: {config.temperature?.toFixed(2) || '1.00'}</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Lower values are more focused and deterministic, higher values are more creative
            </p>
            <Slider
              value={[config.temperature || 1.0]}
              onValueChange={([value]) => setConfig({ temperature: value })}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
          </div>
        </Card>

        {/* Max Turns */}
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-turns">Max Turns</Label>
              <Input
                id="max-turns"
                type="number"
                value={config.maxTurns || 20}
                onChange={(e) => setConfig({ maxTurns: parseInt(e.target.value) || 20 })}
                className="w-20"
                min={1}
                max={100}
              />
            </div>
            <p className="text-xs text-muted-foreground">Maximum conversation turns</p>
          </div>
        </Card>

        {/* System Prompt */}
        <Card className="p-4">
          <div className="space-y-3">
            <div>
              <Label className="text-base font-medium">System Prompt</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Instructions that guide the agent's behavior
              </p>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="claude-code-preset" className="text-sm">Use Claude Code Preset</Label>
              <Switch
                id="claude-code-preset"
                checked={useClaudeCodePreset}
                onCheckedChange={handleClaudeCodePresetToggle}
              />
            </div>
            <Textarea
              placeholder={useClaudeCodePreset ? "Additional instructions (optional)" : "Enter system prompt..."}
              value={systemPromptText}
              onChange={(e) => handleSystemPromptChange(e.target.value)}
              className="min-h-[200px] font-mono text-xs"
            />
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
}
