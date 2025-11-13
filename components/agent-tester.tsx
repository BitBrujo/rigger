'use client';

import { useState, useEffect } from 'react';
import ConfigPanel from './config-panel';
import ChatInterface from './chat-interface';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAgentStore } from '@/lib/store';
import { ApiClient } from '@/lib/api-client';
import { Preset } from '@/lib/types';
import { toast } from 'sonner';

export default function AgentTester() {
  const { config, setConfig, resetConfig } = useAgentStore();
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

  return (
    <div className="h-full w-full bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Rigger</h1>
          <p className="text-sm text-muted-foreground">
            Test and debug Claude SDK configurations
          </p>
        </div>
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

      {/* Two-panel layout */}
      <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-80px)]">
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
