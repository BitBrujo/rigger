'use client';

import { AgentsManager } from '../agents-manager';
import { ScrollArea } from '@/components/ui/scroll-area';

export function AgentsTab() {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Custom Agents</h2>
          <p className="text-muted-foreground">
            Define specialized sub-agents with custom prompts, tools, and configurations
          </p>
        </div>

        <AgentsManager />
      </div>
    </ScrollArea>
  );
}
