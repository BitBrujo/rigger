'use client';

import { useAgentStore } from '@/lib/store';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ChevronRight, Clock, CheckCircle2, XCircle, Loader2, BarChart3 } from 'lucide-react';
import { useState } from 'react';
import { ToolExecution } from '@/lib/types';

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

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-2">
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                <CardTitle className="text-sm font-semibold">{execution.toolName}</CardTitle>
                <StatusBadge />
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
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Input</p>
              <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                {JSON.stringify(execution.input, null, 2)}
              </pre>
            </div>
            {execution.output && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">Output</p>
                <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                  {typeof execution.output === 'string'
                    ? execution.output
                    : JSON.stringify(execution.output, null, 2)}
                </pre>
              </div>
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

export function ToolsPanel() {
  const { toolExecutions, activeTools } = useAgentStore();

  // Separate active and completed executions
  const activeExecutions = toolExecutions.filter((exec) => exec.status === 'running');
  const completedExecutions = toolExecutions.filter(
    (exec) => exec.status === 'completed' || exec.status === 'failed'
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
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="history" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            History ({toolExecutions.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-1">
            <Loader2 className="h-3 w-3" />
            Active ({activeExecutions.length})
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1">
            <BarChart3 className="h-3 w-3" />
            Statistics
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
                  .map((exec) => (
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
                {activeExecutions.map((exec) => (
                  <ToolExecutionCard key={exec.id} execution={exec} />
                ))}
              </div>
            )}
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
