'use client';

import { useAgentStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronRight, Clock, CheckCircle2, XCircle, Loader2, BarChart3, FileText, FileEdit, Search, FolderOpen, Folder, File, Network, Box } from 'lucide-react';
import { useState, useEffect, useRef, useMemo } from 'react';
import { ToolExecution } from '@/lib/types';
import { toast } from 'sonner';

// Diff viewer component for Edit tool
function DiffViewer({ oldString, newString }: { oldString: string; newString: string }) {
  // Simple line-by-line diff
  const oldLines = oldString.split('\n');
  const newLines = newString.split('\n');
  const maxLines = Math.max(oldLines.length, newLines.length);

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-muted-foreground mb-2">
        <div className="flex items-center gap-1">
          <XCircle className="h-3 w-3 text-red-600" />
          <span>Old</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          <span>New</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <pre className="text-xs bg-red-50 dark:bg-red-950/20 p-2 rounded-md overflow-x-auto border border-red-200 dark:border-red-900">
          {oldString}
        </pre>
        <pre className="text-xs bg-green-50 dark:bg-green-950/20 p-2 rounded-md overflow-x-auto border border-green-200 dark:border-green-900">
          {newString}
        </pre>
      </div>
    </div>
  );
}

// Tool execution card with collapsible details
function ToolExecutionCard({ execution }: { execution: ToolExecution }) {
  const [isOpen, setIsOpen] = useState(false);
  const duration = execution.endTime
    ? ((execution.endTime - execution.startTime) / 1000).toFixed(2)
    : execution.elapsedSeconds?.toFixed(2);

  // Status badge
  const StatusBadge = () => {
    switch (execution.status) {
      case 'running':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Running
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="default" className="gap-1 bg-green-600">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
    }
  };

  // Check if this is an Edit tool execution with old_string and new_string
  const isEditTool = execution.toolName === 'Edit';
  const hasEditData =
    isEditTool &&
    execution.input &&
    typeof execution.input === 'object' &&
    'old_string' in execution.input &&
    'new_string' in execution.input;

  // Check if this is a Task tool (subagent)
  const isTaskTool = execution.toolName === 'Task';
  const subagentType = isTaskTool && execution.input && typeof execution.input === 'object' && 'subagent_type' in execution.input
    ? String(execution.input.subagent_type)
    : null;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-2">
      <Card className={isTaskTool ? 'border-l-4 border-l-purple-500' : ''}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {isTaskTool && <Network className="h-4 w-4 text-purple-600" />}
                <CardTitle className="text-sm font-semibold">{execution.toolName}</CardTitle>
                <StatusBadge />
                {hasEditData && <Badge variant="outline" className="text-xs">Diff Available</Badge>}
                {subagentType && <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">{subagentType}</Badge>}
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {duration && (
                  <>
                    <Clock className="h-3 w-3" />
                    <span>{duration}s</span>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-3 pt-0 space-y-2">
            <Separator />

            {/* Show subagent details for Task tool */}
            {isTaskTool && execution.input && typeof execution.input === 'object' ? (
              <>
                <div className="space-y-2 bg-purple-50 dark:bg-purple-950/20 p-3 rounded-md border border-purple-200 dark:border-purple-900">
                  <div className="flex items-center gap-2">
                    <Box className="h-4 w-4 text-purple-600" />
                    <p className="text-xs font-semibold text-purple-700 dark:text-purple-300">Subagent Execution</p>
                  </div>

                  {subagentType && (
                    <div>
                      <p className="text-xs text-muted-foreground">Agent Type</p>
                      <Badge variant="secondary" className="text-xs">{subagentType}</Badge>
                    </div>
                  )}

                  {'description' in execution.input && (
                    <div>
                      <p className="text-xs text-muted-foreground">Description</p>
                      <p className="text-xs">{String(execution.input.description)}</p>
                    </div>
                  )}

                  {'prompt' in execution.input && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Task Prompt</p>
                      <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-32">
                        {String(execution.input.prompt)}
                      </pre>
                    </div>
                  )}

                  {'model' in execution.input && (
                    <div>
                      <p className="text-xs text-muted-foreground">Model</p>
                      <Badge variant="outline" className="text-xs">{String(execution.input.model)}</Badge>
                    </div>
                  )}
                </div>

                {execution.output && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Subagent Output</p>
                    <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-48">
                      {typeof execution.output === 'string'
                        ? execution.output
                        : JSON.stringify(execution.output, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            ) : hasEditData ? (
              /* Show diff viewer for Edit tool if data is available */
              <>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">File Path</p>
                  <code className="text-xs bg-muted p-1 rounded">
                    {'file_path' in execution.input ? String(execution.input.file_path) : 'N/A'}
                  </code>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Changes</p>
                  <DiffViewer
                    oldString={String((execution.input as any).old_string)}
                    newString={String((execution.input as any).new_string)}
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">Input</p>
                  <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-48">
                    {JSON.stringify(execution.input, null, 2)}
                  </pre>
                </div>
                {execution.output && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">Output</p>
                    <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-48">
                      {typeof execution.output === 'string'
                        ? execution.output
                        : JSON.stringify(execution.output, null, 2)}
                    </pre>
                  </div>
                )}
              </>
            )}

            {execution.error && (
              <div>
                <p className="text-xs font-semibold text-destructive mb-1">Error</p>
                <pre className="text-xs bg-destructive/10 text-destructive p-2 rounded-md overflow-x-auto">
                  {execution.error}
                </pre>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              <p>Tool Use ID: {execution.id}</p>
              {execution.parentToolUseId && (
                <p>Parent Tool: {execution.parentToolUseId}</p>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

// Tool statistics component
function ToolStatistics({ executions }: { executions: ToolExecution[] }) {
  const stats = executions.reduce((acc, exec) => {
    const tool = exec.toolName;
    if (!acc[tool]) {
      acc[tool] = { total: 0, completed: 0, failed: 0, running: 0, totalDuration: 0 };
    }
    acc[tool].total++;
    acc[tool][exec.status]++;
    if (exec.endTime) {
      acc[tool].totalDuration += (exec.endTime - exec.startTime) / 1000;
    }
    return acc;
  }, {} as Record<string, { total: number; completed: number; failed: number; running: number; totalDuration: number }>);

  const sortedStats = Object.entries(stats).sort(([, a], [, b]) => b.total - a.total);

  return (
    <div className="space-y-2">
      {sortedStats.map(([tool, stat]) => {
        const avgDuration = stat.completed > 0 ? (stat.totalDuration / stat.completed).toFixed(2) : 'N/A';
        const successRate = stat.total > 0 ? ((stat.completed / stat.total) * 100).toFixed(0) : '0';

        return (
          <Card key={tool} className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="font-semibold text-sm">{tool}</p>
              <Badge variant="secondary">{stat.total} uses</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Success Rate</p>
                <p className="font-semibold">{successRate}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Avg Duration</p>
                <p className="font-semibold">{avgDuration}s</p>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-600" />
                <span>{stat.completed} completed</span>
              </div>
              {stat.failed > 0 && (
                <div className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-destructive" />
                  <span>{stat.failed} failed</span>
                </div>
              )}
              {stat.running > 0 && (
                <div className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                  <span>{stat.running} running</span>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// Subagent hierarchy component
function SubagentHierarchy({ executions }: { executions: ToolExecution[] }) {
  // Build hierarchy tree from Task tool executions
  const hierarchy = useMemo(() => {
    const taskExecutions = executions.filter((exec) => exec.toolName === 'Task');

    // Build parent-child relationships based on parentToolUseId
    const rootTasks = taskExecutions.filter((exec) => !exec.parentToolUseId);

    const buildTree = (parentId: string | null): ToolExecution[] => {
      return taskExecutions.filter((exec) => exec.parentToolUseId === parentId);
    };

    return rootTasks.map((root) => ({
      ...root,
      children: buildTree(root.id),
    }));
  }, [executions]);

  const renderTaskNode = (task: ToolExecution & { children?: ToolExecution[] }, level = 0) => {
    const subagentType = task.input && typeof task.input === 'object' && 'subagent_type' in task.input
      ? String(task.input.subagent_type)
      : 'general';

    const description = task.input && typeof task.input === 'object' && 'description' in task.input
      ? String(task.input.description)
      : 'Task execution';

    return (
      <div key={task.id} className="text-xs">
        <div
          className="flex items-center gap-2 py-2 px-3 rounded-md hover:bg-accent/50"
          style={{ paddingLeft: `${level * 16 + 12}px` }}
        >
          <Network className="h-3 w-3 text-purple-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium truncate">{subagentType}</span>
              {task.status === 'running' && <Loader2 className="h-3 w-3 animate-spin text-blue-600" />}
              {task.status === 'completed' && <CheckCircle2 className="h-3 w-3 text-green-600" />}
              {task.status === 'failed' && <XCircle className="h-3 w-3 text-destructive" />}
            </div>
            <p className="text-muted-foreground truncate text-xs">{description}</p>
          </div>
          {task.endTime && (
            <span className="text-muted-foreground text-xs flex-shrink-0">
              {((task.endTime - task.startTime) / 1000).toFixed(1)}s
            </span>
          )}
        </div>
        {task.children && task.children.length > 0 && (
          <div className="border-l-2 border-purple-200 dark:border-purple-900 ml-4">
            {task.children.map((child) => renderTaskNode(child as any, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {hierarchy.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-xs">No subagents spawned yet</p>
          <p className="text-xs mt-1">Task tool executions will appear here</p>
        </div>
      ) : (
        <div className="space-y-1">
          {hierarchy.map((task: any) => renderTaskNode(task))}
        </div>
      )}
    </div>
  );
}

// File browser component
interface FileTreeNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  operations: Array<{ tool: string; timestamp: number; status: string }>;
}

function FileTreeItem({ node, level = 0 }: { node: FileTreeNode; level?: number }) {
  const [isOpen, setIsOpen] = useState(level < 2); // Auto-expand first 2 levels

  const recentOperation = node.operations.length > 0
    ? node.operations[node.operations.length - 1]
    : null;

  return (
    <div className="text-xs">
      {node.type === 'directory' ? (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <div
              className="flex items-center gap-1 py-1 px-2 hover:bg-accent/50 rounded cursor-pointer"
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              {isOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              <Folder className="h-3 w-3 text-blue-600" />
              <span className="font-medium">{node.name}</span>
              {node.operations.length > 0 && (
                <Badge variant="secondary" className="text-xs h-4 px-1">
                  {node.operations.length}
                </Badge>
              )}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {node.children?.map((child) => (
              <FileTreeItem key={child.path} node={child} level={level + 1} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <div
          className="flex items-center justify-between gap-1 py-1 px-2 hover:bg-accent/50 rounded group"
          style={{ paddingLeft: `${level * 12 + 8}px` }}
        >
          <div className="flex items-center gap-1 flex-1 min-w-0">
            <File className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{node.name}</span>
          </div>
          {recentOperation && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge variant="outline" className="text-xs h-4 px-1">
                {recentOperation.tool}
              </Badge>
              {recentOperation.status === 'completed' ? (
                <CheckCircle2 className="h-3 w-3 text-green-600" />
              ) : recentOperation.status === 'failed' ? (
                <XCircle className="h-3 w-3 text-destructive" />
              ) : (
                <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FileBrowser({ executions }: { executions: ToolExecution[] }) {
  // Build file tree from tool executions
  const fileTree = useMemo(() => {
    const root: FileTreeNode = { path: '', name: 'workspace', type: 'directory', children: [], operations: [] };
    const pathMap = new Map<string, FileTreeNode>();
    pathMap.set('', root);

    // File operation tools that have file paths
    const fileOperations = executions.filter((exec) =>
      ['Read', 'Write', 'Edit', 'NotebookEdit'].includes(exec.toolName) &&
      exec.input &&
      typeof exec.input === 'object'
    );

    fileOperations.forEach((exec) => {
      let filePath = '';
      if ('file_path' in exec.input!) {
        filePath = String(exec.input.file_path);
      } else if ('notebook_path' in exec.input!) {
        filePath = String(exec.input.notebook_path);
      }

      if (!filePath) return;

      // Remove leading slash and split path
      const normalizedPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      const parts = normalizedPath.split('/');

      // Build directory structure
      let currentPath = '';
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!pathMap.has(currentPath)) {
          const isFile = i === parts.length - 1;
          const node: FileTreeNode = {
            path: currentPath,
            name: part,
            type: isFile ? 'file' : 'directory',
            children: isFile ? undefined : [],
            operations: [],
          };

          pathMap.set(currentPath, node);

          // Add to parent's children
          const parent = pathMap.get(parentPath);
          if (parent && parent.children) {
            parent.children.push(node);
          }
        }

        // Add operation to the node
        const node = pathMap.get(currentPath);
        if (node) {
          node.operations.push({
            tool: exec.toolName,
            timestamp: exec.startTime,
            status: exec.status,
          });
        }
      }
    });

    // Sort children: directories first, then by name
    const sortNode = (node: FileTreeNode) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortNode);
      }
    };
    sortNode(root);

    return root;
  }, [executions]);

  const totalFiles = useMemo(() => {
    let count = 0;
    const countFiles = (node: FileTreeNode) => {
      if (node.type === 'file') {
        count++;
      }
      node.children?.forEach(countFiles);
    };
    countFiles(fileTree);
    return count;
  }, [fileTree]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-2">
        <p className="text-xs text-muted-foreground">
          {totalFiles} file{totalFiles !== 1 ? 's' : ''} accessed
        </p>
      </div>
      {fileTree.children && fileTree.children.length > 0 ? (
        <div className="space-y-0.5">
          {fileTree.children.map((child) => (
            <FileTreeItem key={child.path} node={child} />
          ))}
        </div>
      ) : (
        <div className="text-center text-muted-foreground py-8">
          <p>No files accessed yet</p>
          <p className="text-xs mt-1">Files accessed by the agent will appear here</p>
        </div>
      )}
    </div>
  );
}

// Helper to show file operation toasts
function showFileOperationToast(execution: ToolExecution) {
  const isFileOperation = ['Read', 'Write', 'Edit', 'Glob', 'Grep', 'NotebookEdit'].includes(execution.toolName);
  if (!isFileOperation || execution.status !== 'completed') return;

  let message = '';
  let description = '';
  let icon = <FileText className="h-4 w-4" />;

  switch (execution.toolName) {
    case 'Read':
      icon = <FileText className="h-4 w-4" />;
      message = 'File read successfully';
      if (execution.input && typeof execution.input === 'object' && 'file_path' in execution.input) {
        const filePath = String(execution.input.file_path);
        const fileName = filePath.split('/').pop() || filePath;
        description = fileName;
      }
      break;

    case 'Write':
      icon = <FileEdit className="h-4 w-4" />;
      message = 'File written successfully';
      if (execution.input && typeof execution.input === 'object' && 'file_path' in execution.input) {
        const filePath = String(execution.input.file_path);
        const fileName = filePath.split('/').pop() || filePath;
        description = fileName;
      }
      break;

    case 'Edit':
      icon = <FileEdit className="h-4 w-4" />;
      message = 'File edited successfully';
      if (execution.input && typeof execution.input === 'object' && 'file_path' in execution.input) {
        const filePath = String(execution.input.file_path);
        const fileName = filePath.split('/').pop() || filePath;
        description = fileName;
      }
      break;

    case 'Glob':
      icon = <FolderOpen className="h-4 w-4" />;
      message = 'Files found';
      if (execution.output) {
        const outputStr = typeof execution.output === 'string' ? execution.output : JSON.stringify(execution.output);
        const fileCount = (outputStr.match(/\n/g) || []).length;
        description = `${fileCount} file${fileCount !== 1 ? 's' : ''} matched`;
      }
      break;

    case 'Grep':
      icon = <Search className="h-4 w-4" />;
      message = 'Search completed';
      if (execution.output) {
        const outputStr = typeof execution.output === 'string' ? execution.output : JSON.stringify(execution.output);
        const matchCount = (outputStr.match(/\n/g) || []).length;
        description = `${matchCount} match${matchCount !== 1 ? 'es' : ''} found`;
      }
      break;

    case 'NotebookEdit':
      icon = <FileEdit className="h-4 w-4" />;
      message = 'Notebook updated';
      if (execution.input && typeof execution.input === 'object' && 'notebook_path' in execution.input) {
        const notebookPath = String(execution.input.notebook_path);
        const fileName = notebookPath.split('/').pop() || notebookPath;
        description = fileName;
      }
      break;
  }

  if (message) {
    toast.success(message, {
      description,
      icon,
      duration: 3000,
    });
  }
}

export function ToolsPanel() {
  const { toolExecutions, activeTools } = useAgentStore();
  const processedExecutionsRef = useRef<Set<string>>(new Set());

  // Monitor tool executions and show toasts for file operations
  useEffect(() => {
    toolExecutions.forEach((execution: ToolExecution) => {
      // Only process completed executions that we haven't seen before
      if (execution.status === 'completed' && !processedExecutionsRef.current.has(execution.id)) {
        processedExecutionsRef.current.add(execution.id);
        showFileOperationToast(execution);
      }
    });
  }, [toolExecutions]);

  // Separate active and completed executions
  const activeExecutions = toolExecutions.filter((exec: ToolExecution) => exec.status === 'running');
  const completedExecutions = toolExecutions.filter(
    (exec: ToolExecution) => exec.status === 'completed' || exec.status === 'failed'
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Tool Execution</h2>
        <p className="text-sm text-muted-foreground">
          Real-time visibility into agent tool usage
        </p>
      </div>

      <Tabs defaultValue="history" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 grid grid-cols-5 w-auto">
          <TabsTrigger value="history" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            History ({toolExecutions.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3" />
            Active ({activeExecutions.length})
          </TabsTrigger>
          <TabsTrigger value="agents" className="flex items-center gap-1">
            <Network className="h-3 w-3" />
            Agents
          </TabsTrigger>
          <TabsTrigger value="files" className="flex items-center gap-1">
            <FolderOpen className="h-3 w-3" />
            Files
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="flex-1 mt-0">
          <ScrollArea className="h-full p-4">
            {completedExecutions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No tool executions yet</p>
                <p className="text-xs mt-1">Tool usage will appear here as the agent works</p>
              </div>
            ) : (
              <div className="space-y-2">
                {completedExecutions
                  .slice()
                  .reverse()
                  .map((exec: ToolExecution) => (
                    <ToolExecutionCard key={exec.id} execution={exec} />
                  ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="active" className="flex-1 mt-0">
          <ScrollArea className="h-full p-4">
            {activeExecutions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No active tool executions</p>
                <p className="text-xs mt-1">Running tools will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {activeExecutions.map((exec: ToolExecution) => (
                  <ToolExecutionCard key={exec.id} execution={exec} />
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>

        <TabsContent value="agents" className="flex-1 mt-0">
          <ScrollArea className="h-full p-4">
            <SubagentHierarchy executions={toolExecutions} />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="files" className="flex-1 mt-0">
          <ScrollArea className="h-full p-4">
            <FileBrowser executions={toolExecutions} />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="stats" className="flex-1 mt-0">
          <ScrollArea className="h-full p-4">
            {toolExecutions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No statistics available</p>
                <p className="text-xs mt-1">Statistics will appear after tool executions</p>
              </div>
            ) : (
              <ToolStatistics executions={toolExecutions} />
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
