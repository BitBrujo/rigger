'use client';

import { useAgentStore } from '@/lib/store';
import { MODEL_OPTIONS } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JsonEditor } from '../ui/json-editor';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';

export function AdvancedTab() {
  const { config, setConfig } = useAgentStore();

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Advanced Settings</h2>
          <p className="text-muted-foreground">
            Extended thinking, fallback model, working directory, environment variables, and other advanced options
          </p>
        </div>

        {/* Max Thinking Tokens */}
        <Card className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Label htmlFor="max-thinking-tokens" className="cursor-help text-base font-medium">
                      Max Thinking Tokens
                    </Label>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">Maximum tokens for extended thinking mode. Set to null to disable thinking.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Input
                id="max-thinking-tokens"
                type="number"
                value={config.maxThinkingTokens === null || config.maxThinkingTokens === undefined ? '' : config.maxThinkingTokens}
                onChange={(e) => setConfig({ maxThinkingTokens: e.target.value ? parseInt(e.target.value) : null })}
                className="w-24"
                placeholder="None"
                min={0}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enable extended thinking mode (Claude 3.7 Sonnet). Leave empty to disable.
            </p>
          </div>
        </Card>

        {/* Fallback Model */}
        <Card className="p-4">
          <div className="space-y-2">
            <Label htmlFor="fallback-model" className="text-base font-medium">Fallback Model</Label>
            <Select
              value={config.fallbackModel || 'none'}
              onValueChange={(value: any) => setConfig({ fallbackModel: value === 'none' ? undefined : value })}
            >
              <SelectTrigger id="fallback-model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No fallback</SelectItem>
                {MODEL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Model to use if primary model fails or is unavailable
            </p>
          </div>
        </Card>

        {/* Working Directory */}
        <Card className="p-4">
          <div className="space-y-2">
            <Label htmlFor="working-directory" className="text-base font-medium">Working Directory</Label>
            <Input
              id="working-directory"
              value={config.workingDirectory || ''}
              onChange={(e) => setConfig({ workingDirectory: e.target.value })}
              placeholder="/app/workspace"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Base directory for file operations (default: /app/workspace)
            </p>
          </div>
        </Card>

        {/* Additional Directories */}
        <Card className="p-4">
          <div className="space-y-2">
            <Label htmlFor="additional-directories" className="text-base font-medium">Additional Directories</Label>
            <Input
              id="additional-directories"
              placeholder="Comma-separated paths..."
              value={config.additionalDirectories?.join(', ') || ''}
              onChange={(e) =>
                setConfig({
                  additionalDirectories: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Extra directories the agent can access
            </p>
          </div>
        </Card>

        {/* Environment Variables */}
        <Card className="p-4">
          <div className="space-y-2">
            <Label htmlFor="env-variables" className="text-base font-medium">Environment Variables</Label>
            <JsonEditor
              value={config.env || {}}
              onChange={(value) => setConfig({ env: value })}
              placeholder={`{
  "API_KEY": "...",
  "DEBUG": "true"
}`}
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Custom environment variables for Bash tool execution
            </p>
          </div>
        </Card>

        {/* JavaScript Runtime */}
        <Card className="p-4">
          <div className="space-y-2">
            <Label htmlFor="executable" className="text-base font-medium">JavaScript Runtime</Label>
            <Select
              value={config.executable || 'node'}
              onValueChange={(value: any) => setConfig({ executable: value })}
            >
              <SelectTrigger id="executable">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="node">Node.js</SelectItem>
                <SelectItem value="bun">Bun</SelectItem>
                <SelectItem value="deno">Deno</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Runtime to use for JavaScript execution
            </p>
          </div>
        </Card>

        {/* Runtime Arguments */}
        <Card className="p-4">
          <div className="space-y-2">
            <Label htmlFor="executable-args" className="text-base font-medium">Runtime Arguments</Label>
            <Input
              id="executable-args"
              placeholder="Comma-separated args..."
              value={config.executableArgs?.join(', ') || ''}
              onChange={(e) =>
                setConfig({
                  executableArgs: e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Arguments passed to the JavaScript runtime (e.g., --experimental-modules)
            </p>
          </div>
        </Card>

        {/* Session Management */}
        <Card className="p-4">
          <div className="space-y-4">
            <Label className="text-base font-medium">Session Management</Label>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="continue-session" className="text-sm">Continue Session</Label>
                <p className="text-xs text-muted-foreground">
                  Resume previous conversation context
                </p>
              </div>
              <Switch
                id="continue-session"
                checked={config.continueSession || false}
                onCheckedChange={(checked) => setConfig({ continueSession: checked })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resume-session-id" className="text-sm">Resume Session ID</Label>
              <Input
                id="resume-session-id"
                value={config.resumeSessionId || ''}
                onChange={(e) => setConfig({ resumeSessionId: e.target.value || undefined })}
                placeholder="Session ID to resume..."
                className="font-mono text-xs"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="fork-session" className="text-sm">Fork Session</Label>
                <p className="text-xs text-muted-foreground">
                  Create a new branch from existing session
                </p>
              </div>
              <Switch
                id="fork-session"
                checked={config.forkSession || false}
                onCheckedChange={(checked) => setConfig({ forkSession: checked })}
              />
            </div>
          </div>
        </Card>

        {/* Other Settings */}
        <Card className="p-4">
          <div className="space-y-4">
            <Label className="text-base font-medium">Other Settings</Label>

            <div className="space-y-2">
              <Label htmlFor="setting-sources" className="text-sm">Setting Sources</Label>
              <Input
                id="setting-sources"
                value={config.settingSources?.join(', ') || ''}
                onChange={(e) =>
                  setConfig({
                    settingSources: e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="e.g., project, user"
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                Sources to load skills and configurations from
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="strict-mcp" className="text-sm">Strict MCP Config</Label>
                <p className="text-xs text-muted-foreground">
                  Fail if MCP server initialization errors occur
                </p>
              </div>
              <Switch
                id="strict-mcp"
                checked={config.strictMcpConfig || false}
                onCheckedChange={(checked) => setConfig({ strictMcpConfig: checked })}
              />
            </div>
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
}
