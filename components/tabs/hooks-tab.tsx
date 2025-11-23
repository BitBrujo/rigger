'use client';

import { useState } from 'react';
import { useAgentStore } from '@/lib/store';
import { toast } from 'sonner';
import { ApiClient } from '@/lib/api-client';
import { HOOK_TEMPLATES, HOOK_CATEGORIES, HookTemplate } from '@/lib/hook-templates';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JsonEditor } from '../ui/json-editor';
import { Plus, Wand2 } from 'lucide-react';

export function HooksTab() {
  const { config, setConfig, toggleHookEnabled } = useAgentStore();
  const [hookCategory, setHookCategory] = useState<string>('all');

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

  const handleToggleHookEnabled = async (hookId: string, hook: any) => {
    try {
      toggleHookEnabled(hookId);
      const updatedHook = { ...hook, enabled: !(hook.enabled ?? true) };
      await ApiClient.updateHook(hookId, updatedHook);
      toast.success('Hook updated', {
        description: `${hook.name || hookId} ${updatedHook.enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (err: any) {
      toggleHookEnabled(hookId);
      toast.error('Failed to update hook', {
        description: err.message || 'An error occurred',
      });
    }
  };

  const filteredHookTemplates = hookCategory === 'all'
    ? HOOK_TEMPLATES
    : HOOK_TEMPLATES.filter(t => t.category === hookCategory);

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Hooks Configuration</h2>
          <p className="text-muted-foreground">
            Intercept and modify agent behavior at specific lifecycle events
          </p>
        </div>

        {/* Hook Templates */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-medium">Quick Templates</Label>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfig({ hooks: {} })}
              >
                Clear All
              </Button>
            </div>

            {/* Category Filter */}
            <Select value={hookCategory} onValueChange={setHookCategory}>
              <SelectTrigger>
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
                  className="p-3 border rounded-md bg-background hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium truncate">{template.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          {template.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleApplyHookTemplate(template)}
                        title="Merge with current hooks"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
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

        {/* Active Hooks List */}
        {config.hooks && Object.keys(config.hooks).length > 0 && (
          <Card className="p-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">Active Hooks</Label>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {Object.entries(config.hooks).map(([hookId, hook]: [string, any]) => (
                  <Card
                    key={hookId}
                    className={`hover:border-primary/50 transition-all ${
                      hook.enabled === false ? 'opacity-60' : ''
                    }`}
                  >
                    <CardHeader className="py-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {hook.name || hookId}
                            {hook.enabled === false && (
                              <Badge variant="outline" className="text-xs">Disabled</Badge>
                            )}
                            {hook.event && (
                              <Badge variant="outline" className="text-xs">{hook.event}</Badge>
                            )}
                          </CardTitle>
                          {hook.description && (
                            <CardDescription className="text-xs mt-1">
                              {hook.description}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={hook.enabled ?? true}
                            onCheckedChange={() => handleToggleHookEnabled(hookId, hook)}
                            aria-label={`Toggle ${hook.name || hookId}`}
                          />
                          <span className="text-xs text-muted-foreground">
                            {hook.enabled ?? true ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* Manual JSON Editor */}
        <Card className="p-4">
          <div className="space-y-2">
            <Label className="text-base font-medium">Custom Hooks (JSON)</Label>
            <p className="text-xs text-muted-foreground">
              Define hooks in JSON format for advanced customization
            </p>
            <JsonEditor
              value={config.hooks || {}}
              onChange={(value) => setConfig({ hooks: value })}
              placeholder={`{
  "pre_tool_use": {
    "name": "Pre Tool Hook",
    "event": "before_tool_use",
    "enabled": true,
    "action": {
      "type": "bash",
      "command": "echo 'Tool about to execute'"
    }
  }
}`}
              rows={12}
            />
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
}
