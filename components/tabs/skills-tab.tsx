'use client';

import { SkillsManager } from '../skills-manager';
import { ScrollArea } from '@/components/ui/scroll-area';

export function SkillsTab() {
  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Skills Management</h2>
          <p className="text-muted-foreground">
            Manage packaged agent workflows loaded from .claude/skills/
          </p>
        </div>

        <SkillsManager />
      </div>
    </ScrollArea>
  );
}
