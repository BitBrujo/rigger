'use client';

import { useState } from 'react';
import { useAgentStore } from '@/lib/store';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { JsonEditor } from '../ui/json-editor';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { McpServerCard } from '../mcp-server-card';
import { McpServerForm } from '../mcp-server-form';
import { AlertCircle, Plus, ServerIcon } from 'lucide-react';
import type { McpServerConfig } from '@/lib/types';

export function McpServersTab() {
  const { config, setConfig } = useAgentStore();

  // UI state
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<string | null>(null);
  const [deletingServer, setDeletingServer] = useState<string | null>(null);

  const servers = config.mcpServers || {};
  const serverEntries = Object.entries(servers);

  const handleAddServer = () => {
    setEditingServer(null);
    setIsFormDialogOpen(true);
  };

  const handleEditServer = (name: string) => {
    setEditingServer(name);
    setIsFormDialogOpen(true);
  };

  const handleDeleteClick = (name: string) => {
    setDeletingServer(name);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveServer = (name: string, serverConfig: McpServerConfig) => {
    const newServers = { ...servers, [name]: serverConfig };
    setConfig({ mcpServers: newServers });
    setIsFormDialogOpen(false);
    setEditingServer(null);
  };

  const handleConfirmDelete = () => {
    if (deletingServer) {
      const newServers = { ...servers };
      delete newServers[deletingServer];
      setConfig({ mcpServers: newServers });
    }
    setIsDeleteDialogOpen(false);
    setDeletingServer(null);
  };

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

        <Tabs defaultValue="form" className="space-y-4">
          <TabsList>
            <TabsTrigger value="form">Form View</TabsTrigger>
            <TabsTrigger value="json">JSON View</TabsTrigger>
          </TabsList>

          {/* Form View */}
          <TabsContent value="form" className="space-y-4">
            <Card className="p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Configured Servers</Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add and manage MCP servers with a user-friendly form
                    </p>
                  </div>
                  <Button onClick={handleAddServer} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Server
                  </Button>
                </div>

                {/* Server Cards Grid */}
                {serverEntries.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {serverEntries.map(([name, serverConfig]) => (
                      <McpServerCard
                        key={name}
                        name={name}
                        config={serverConfig}
                        onEdit={() => handleEditServer(name)}
                        onDelete={() => handleDeleteClick(name)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ServerIcon className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      No MCP servers configured yet
                    </p>
                    <Button onClick={handleAddServer} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Server
                    </Button>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="space-y-0.5">
                    <Label htmlFor="strict-mcp-form" className="text-sm font-medium">
                      Strict MCP Config
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Fail if MCP server initialization encounters errors
                    </p>
                  </div>
                  <Switch
                    id="strict-mcp-form"
                    checked={config.strictMcpConfig || false}
                    onCheckedChange={(checked) => setConfig({ strictMcpConfig: checked })}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* JSON View */}
          <TabsContent value="json" className="space-y-4">
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Server Configuration (JSON)</Label>
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
                    <Label htmlFor="strict-mcp-json" className="text-sm font-medium">
                      Strict MCP Config
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Fail if MCP server initialization encounters errors
                    </p>
                  </div>
                  <Switch
                    id="strict-mcp-json"
                    checked={config.strictMcpConfig || false}
                    onCheckedChange={(checked) => setConfig({ strictMcpConfig: checked })}
                  />
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add/Edit Dialog */}
        <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingServer ? 'Edit MCP Server' : 'Add MCP Server'}
              </DialogTitle>
            </DialogHeader>
            <McpServerForm
              serverName={editingServer || undefined}
              initialConfig={editingServer ? servers[editingServer] : undefined}
              existingServerNames={Object.keys(servers)}
              onSave={handleSaveServer}
              onCancel={() => {
                setIsFormDialogOpen(false);
                setEditingServer(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete MCP Server</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the <strong>{deletingServer}</strong> server?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeletingServer(null)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ScrollArea>
  );
}
