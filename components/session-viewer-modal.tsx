'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  Clock,
  DollarSign,
  Hash,
  Cpu,
  MessageSquare,
  Settings2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { Message } from '@/lib/types';

interface SessionViewerModalProps {
  session: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionViewerModal({ session, open, onOpenChange }: SessionViewerModalProps) {
  if (!session) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'idle':
        return 'bg-blue-500';
      case 'stopping':
        return 'bg-yellow-500';
      case 'error':
      case 'terminated':
        return 'bg-red-500';
      case 'completed':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const formatDuration = (startDate: string, endDate: string | null): string => {
    if (!endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const mins = Math.floor(diffSecs / 60);
    const secs = diffSecs % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (date: string | null): string => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  };

  const messages = session.messages || [];
  const config = session.config || {};
  const toolsUsed = session.tools_used || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Session Details
            <Badge variant="outline" className={getStatusColor(session.status)}>
              {session.status}
            </Badge>
          </DialogTitle>
          <DialogDescription className="font-mono text-xs">
            {session.id}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview" className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="messages">Messages ({messages.length})</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="flex-1 overflow-auto mt-4">
            <ScrollArea className="h-full">
              <div className="space-y-6 pr-4">
                {/* Timestamps */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Timestamps
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Created</p>
                      <p className="font-medium">{formatDate(session.created_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Started</p>
                      <p className="font-medium">{formatDate(session.started_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Completed</p>
                      <p className="font-medium">{formatDate(session.completed_at)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium">
                        {formatDuration(session.created_at, session.completed_at || session.last_activity_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Metrics */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Metrics
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Total Cost</p>
                          <p className="font-medium">${(session.total_cost || 0).toFixed(6)}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Total Tokens</p>
                          <p className="font-medium">{(session.total_tokens || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </Card>
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-xs text-muted-foreground">Turns</p>
                          <p className="font-medium">{session.num_turns || 0}</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Token breakdown */}
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 bg-muted rounded">
                      <p className="text-muted-foreground">Input Tokens</p>
                      <p className="font-medium">{(session.total_input_tokens || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-muted-foreground">Output Tokens</p>
                      <p className="font-medium">{(session.total_output_tokens || 0).toLocaleString()}</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-muted-foreground">Cached Tokens</p>
                      <p className="font-medium">{(session.total_cached_tokens || 0).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Tools Used */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Cpu className="h-4 w-4" />
                    Tools Used ({toolsUsed.length})
                  </h3>
                  {toolsUsed.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {toolsUsed.map((tool: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No tools used</p>
                  )}
                </div>

                {/* Termination Reason */}
                {session.termination_reason && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Termination Reason
                      </h3>
                      <Badge variant="secondary">{session.termination_reason}</Badge>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="flex-1 overflow-auto mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4 pr-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No messages in this session</p>
                  </div>
                ) : (
                  messages.map((message: Message, i: number) => (
                    <div
                      key={i}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <Card
                        className={`p-3 max-w-[85%] ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Badge variant="outline" className="mt-0.5 text-xs shrink-0">
                            {message.role}
                          </Badge>
                          <div className="flex-1 whitespace-pre-wrap break-words text-sm">
                            {typeof message.content === 'string'
                              ? message.content
                              : JSON.stringify(message.content, null, 2)}
                          </div>
                        </div>
                      </Card>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Configuration Tab */}
          <TabsContent value="config" className="flex-1 overflow-auto mt-4">
            <ScrollArea className="h-[400px]">
              <div className="space-y-4 pr-4">
                {/* Key Config Summary */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Key Settings
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Model</p>
                      <p className="font-mono text-xs">{config.model || 'N/A'}</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Max Tokens</p>
                      <p className="font-mono text-xs">{config.maxTokens || 'N/A'}</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Max Turns</p>
                      <p className="font-mono text-xs">{config.maxTurns || 'N/A'}</p>
                    </div>
                    <div className="p-2 bg-muted rounded">
                      <p className="text-xs text-muted-foreground">Permission Mode</p>
                      <p className="font-mono text-xs">{config.permissionMode || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* System Prompt */}
                {config.systemPrompt && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium mb-2">System Prompt</h3>
                      <Card className="p-3 bg-muted">
                        <p className="text-xs whitespace-pre-wrap font-mono">
                          {config.systemPrompt.length > 500
                            ? config.systemPrompt.substring(0, 500) + '...'
                            : config.systemPrompt}
                        </p>
                      </Card>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Allowed Tools */}
                {config.allowedTools && config.allowedTools.length > 0 && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium mb-2">Allowed Tools</h3>
                      <div className="flex flex-wrap gap-1">
                        {config.allowedTools.map((tool: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Full Config JSON */}
                <div>
                  <h3 className="text-sm font-medium mb-2">Full Configuration</h3>
                  <Card className="p-3 bg-muted">
                    <pre className="text-xs overflow-auto whitespace-pre-wrap font-mono">
                      {JSON.stringify(config, null, 2)}
                    </pre>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="flex-1 overflow-auto mt-4">
            <ScrollArea className="h-[400px]">
              <div className="relative pl-6 pr-4">
                {/* Vertical line */}
                <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />

                <div className="space-y-4">
                  {/* Session Created */}
                  <div className="relative">
                    <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-green-500 border-2 border-background" />
                    <div>
                      <p className="text-sm font-medium">Session Created</p>
                      <p className="text-xs text-muted-foreground">{formatDate(session.created_at)}</p>
                    </div>
                  </div>

                  {/* Session Started */}
                  {session.started_at && session.started_at !== session.created_at && (
                    <div className="relative">
                      <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-background" />
                      <div>
                        <p className="text-sm font-medium">Session Started</p>
                        <p className="text-xs text-muted-foreground">{formatDate(session.started_at)}</p>
                      </div>
                    </div>
                  )}

                  {/* Turns */}
                  {session.num_turns > 0 && (
                    <div className="relative">
                      <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-background" />
                      <div>
                        <p className="text-sm font-medium">{session.num_turns} Turn{session.num_turns > 1 ? 's' : ''} Completed</p>
                        <p className="text-xs text-muted-foreground">
                          {messages.length} message{messages.length > 1 ? 's' : ''} exchanged
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tools Used */}
                  {toolsUsed.length > 0 && (
                    <div className="relative">
                      <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-orange-500 border-2 border-background" />
                      <div>
                        <p className="text-sm font-medium">{toolsUsed.length} Tool{toolsUsed.length > 1 ? 's' : ''} Used</p>
                        <p className="text-xs text-muted-foreground">
                          {toolsUsed.slice(0, 3).join(', ')}{toolsUsed.length > 3 ? ` +${toolsUsed.length - 3} more` : ''}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Last Activity */}
                  {session.last_activity_at && (
                    <div className="relative">
                      <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-gray-400 border-2 border-background" />
                      <div>
                        <p className="text-sm font-medium">Last Activity</p>
                        <p className="text-xs text-muted-foreground">{formatDate(session.last_activity_at)}</p>
                      </div>
                    </div>
                  )}

                  {/* Session Completed/Terminated */}
                  {(session.completed_at || session.terminated_at) && (
                    <div className="relative">
                      <div className={`absolute -left-[18px] top-1 w-3 h-3 rounded-full border-2 border-background ${
                        session.status === 'completed' ? 'bg-green-600' : 'bg-red-500'
                      }`} />
                      <div>
                        <p className="text-sm font-medium flex items-center gap-2">
                          {session.status === 'completed' ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Session Completed
                            </>
                          ) : (
                            <>
                              <XCircle className="h-4 w-4 text-red-500" />
                              Session Terminated
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(session.completed_at || session.terminated_at)}
                        </p>
                        {session.termination_reason && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {session.termination_reason}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
