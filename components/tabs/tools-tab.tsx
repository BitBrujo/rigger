'use client';

import { ToolSelector } from '../tool-selector';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAgentStore } from '@/lib/store';

export function ToolsTab() {
  const { config, setConfig } = useAgentStore();

  const handleToolsChange = (tools: string[]) => {
    setConfig({ ...config, allowedTools: tools });
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Tool Selection</h2>
          <p className="text-muted-foreground">Select which of the 19 built-in Agent SDK tools the agent can use</p>
        </div>

        <ToolSelector
          selectedTools={config.allowedTools}
          onChange={handleToolsChange}
        />
      </div>
    </ScrollArea>
  );
}
