'use client';

import { ToolSelector } from '../tool-selector';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ToolsTab() {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Tool Selection</h2>
          <p className="text-muted-foreground">Select which of the 19 built-in Agent SDK tools the agent can use</p>
        </div>

        <ToolSelector />
      </div>
    </ScrollArea>
  );
}
