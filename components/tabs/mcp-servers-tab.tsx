'use client';

import { useAgentStore } from '@/lib/store';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JsonEditor } from '../ui/json-editor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function McpServersTab() {
  const { config, setConfig } = useAgentStore();

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">MCP Servers</h2>
          <p className="text-muted-foreground">
            Configure Model Context Protocol servers for external tool integration
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            MCP servers extend Claude with additional tools like browser automation (Playwright),
            file systems, GitHub operations, and more. Each server runs as a separate process.
          </AlertDescription>
        </Alert>

        <Card className="p-4">
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Server Configuration</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Define servers in JSON format with command, args, and environment variables
              </p>
            </div>

            <JsonEditor
              value={config.mcpServers || {}}
              onChange={(value) => setConfig({ mcpServers: value })}
              placeholder={`{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..." }
  },
  "playwright": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-playwright"]
  },
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "/allowed/path"]
  }
}`}
              rows={16}
            />

            <div className="flex items-center justify-between pt-2">
              <div className="space-y-0.5">
                <Label htmlFor="strict-mcp" className="text-sm font-medium">
                  Strict MCP Config
                </Label>
                <p className="text-xs text-muted-foreground">
                  Fail if MCP server initialization encounters errors
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

        <Card className="p-4 bg-muted/50">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Common MCP Servers</Label>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li><code className="text-foreground">@modelcontextprotocol/server-github</code> - GitHub API (requires token)</li>
              <li><code className="text-foreground">@modelcontextprotocol/server-playwright</code> - Browser automation</li>
              <li><code className="text-foreground">@modelcontextprotocol/server-fetch</code> - HTTP requests</li>
              <li><code className="text-foreground">@modelcontextprotocol/server-filesystem</code> - Advanced file ops</li>
              <li><code className="text-foreground">@modelcontextprotocol/server-git</code> - Git operations</li>
              <li><code className="text-foreground">@modelcontextprotocol/server-notion</code> - Notion workspace (requires key)</li>
              <li><code className="text-foreground">@modelcontextprotocol/server-memory</code> - Persistent knowledge graphs</li>
            </ul>
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
}
