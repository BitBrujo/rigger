'use client';

import { useState, useEffect } from 'react';
import ConfigPanel from './config-panel';
import ChatInterface from './chat-interface';
import { SessionControlBar } from './session-control-bar';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAgentStore } from '@/lib/store';
import { ApiClient } from '@/lib/api-client';
import { Preset, AgentConfig } from '@/lib/types';
import { toast } from 'sonner';
import { AlertCircle } from 'lucide-react';

export default function AgentTester() {
  const { config, setConfig, resetConfig } = useAgentStore();
  const [presets, setPresets] = useState<Preset[]>([]);
  const [savingPreset, setSavingPreset] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    loadPresets();
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const status = await ApiClient.checkApiKey();
      setHasApiKey(status.hasApiKey);
    } catch (error) {
      console.error('Failed to check API key status:', error);
      // Assume API key is missing if we can't check
      setHasApiKey(false);
    }
  };

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
    // Convert flat Preset to AgentConfig structure
    const loadedConfig: AgentConfig = {
      model: preset.model,
      systemPrompt: preset.system_prompt || '',
      maxTurns: preset.max_turns,
      maxBudgetUsd: preset.max_budget_usd,
      maxThinkingTokens: preset.max_thinking_tokens,
      permissionMode: preset.permission_mode as 'allow' | 'deny' | 'prompt',
      allowDangerousSkipPermissions: preset.allow_dangerous_skip_permissions,
      allowedTools: preset.allowed_tools,
      disallowedTools: preset.disallowed_tools,
      workingDirectory: preset.working_directory,
      additionalDirectories: preset.additional_directories,
      environmentVars: preset.environment_vars,
      executable: preset.executable,
      executableArgs: preset.executable_args,
      continueSession: preset.continue_session,
      resumeSessionId: preset.resume_session_id,
      resumeAtMessageId: preset.resume_at_message_id,
      forkSession: preset.fork_session,
      fallbackModel: preset.fallback_model,
      mcpServers: preset.mcp_servers,
      strictMcpConfig: preset.strict_mcp_config,
      customAgents: preset.custom_agents,
      hooks: preset.hooks,
      plugins: preset.plugins,
    };

    setConfig(loadedConfig);
    toast.success('Preset loaded', {
      description: `Loaded configuration: ${preset.name}`,
    });
  };

  return (
    <div className="h-full w-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-primary">Rigger</h1>
          <p className="text-sm text-muted-foreground">
            Test and debug Claude SDK configurations
          </p>
        </div>

        {/* API Key Missing Alert - Centered */}
        {!hasApiKey && (
          <div className="flex-1 flex justify-center px-4">
            <Alert variant="destructive" className="w-fit">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ANTHROPIC_API_KEY is missing
              </AlertDescription>
            </Alert>
          </div>
        )}

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
            <DropdownMenuContent align="end" className="w-64">
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

      {/* Session Control Bar */}
      <SessionControlBar />

      {/* Two-panel layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
        {/* Left Panel - Configuration (doubled size) */}
        <ResizablePanel defaultSize={50} minSize={40} maxSize={70}>
          <ConfigPanel />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Chat with Debug Tab */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <ChatInterface />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
