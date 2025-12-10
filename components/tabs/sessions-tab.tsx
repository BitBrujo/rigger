'use client';

import { useAgentStore } from '@/lib/store';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { ApiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Activity, StopCircle, XCircle, Trash2, Plus, Copy, Play, RotateCcw, GitBranch, ChevronDown, Eye } from 'lucide-react';
import { useState, useEffect } from 'react';
import { SessionViewerModal } from '@/components/session-viewer-modal';

export function SessionsTab() {
  const {
    activeSessionId,
    activeSessionStatus,
    activeSessionCost,
    activeSessionDuration,
    currentTool,
    isStopRequested,
    isForceKillRequested,
    setIsStopRequested,
    setIsForceKillRequested,
    setActiveSessionId,
    setActiveSessionStatus,
    setActiveSessionCost,
    setActiveSessionDuration,
    setCurrentTool,
    availableSessions,
    setAvailableSessions,
    setMessages,
    addMessage,
    debugInfo,
    accumulatedCost,
    config,
    setConfig,
  } = useAgentStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showForceKillDialog, setShowForceKillDialog] = useState(false);
  const [stopCountdown, setStopCountdown] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [viewingSession, setViewingSession] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);

  const loadSessions = async () => {
    try {
      setIsLoading(true);
      const sessions = await ApiClient.getSessions();
      setAvailableSessions(sessions);
    } catch (error: any) {
      toast.error('Failed to load sessions', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewSession = () => {
    // Clear active session state (no backend call)
    setActiveSessionId(null);
    setActiveSessionStatus(null);
    setActiveSessionCost(0);
    setActiveSessionDuration(0);
    setCurrentTool(null);
    setIsStopRequested(false);
    setIsForceKillRequested(false);

    // Clear messages and add system message
    setMessages([]);
    addMessage({
      role: 'assistant',
      content: 'New session ready. Send a message to start.',
    });

    toast.success('New session activated', {
      description: 'Send a message to start the session',
    });
  };

  const handleStopSession = async () => {
    if (!activeSessionId) return;

    try {
      setIsStopRequested(true);
      setStopCountdown(5); // Start 5-second countdown
      await ApiClient.stopSession(activeSessionId);
      toast.success('Stop requested', {
        description: 'Agent will stop after current operation',
      });
    } catch (error: any) {
      toast.error('Failed to stop session', {
        description: error.message,
      });
      setIsStopRequested(false);
      setStopCountdown(null);
    }
  };

  const handleForceKill = async () => {
    if (!activeSessionId) return;

    try {
      setIsForceKillRequested(true);
      await ApiClient.forceKillSession(activeSessionId);
      setShowForceKillDialog(false);
      setStopCountdown(null);
      toast.success('Session terminated', {
        description: 'Emergency stop executed',
      });
    } catch (error: any) {
      toast.error('Failed to force kill session', {
        description: error.message,
      });
      setIsForceKillRequested(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Delete this session from history?')) {
      return;
    }

    try {
      await ApiClient.deleteSession(sessionId);
      toast.success('Session deleted');
      await loadSessions();
    } catch (error: any) {
      toast.error('Failed to delete session', {
        description: error.message,
      });
    }
  };

  const handleViewSession = async (sessionId: string) => {
    try {
      setIsLoadingSession(true);
      const response = await ApiClient.getSession(sessionId);
      setViewingSession(response.session);
    } catch (error: any) {
      toast.error('Failed to load session details', {
        description: error.message,
      });
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Countdown timer for graceful stop
  useEffect(() => {
    if (stopCountdown === null || stopCountdown <= 0) {
      if (stopCountdown === 0) {
        setShowForceKillDialog(true);
      }
      return;
    }

    const timer = setTimeout(() => {
      setStopCountdown(stopCountdown - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [stopCountdown]);

  // Reset countdown when stop is no longer requested
  useEffect(() => {
    if (!isStopRequested) {
      setStopCountdown(null);
    }
  }, [isStopRequested]);

  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

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

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter history to exclude active session
  const sessionHistory = Array.isArray(availableSessions)
    ? availableSessions.filter(s => s.id !== activeSessionId)
    : [];

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Session Management</h2>
            <p className="text-muted-foreground">
              Monitor and control active agent sessions
            </p>
          </div>
          <Button onClick={handleNewSession} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Session
          </Button>
        </div>

        {/* Active Session */}
        {activeSessionId && (
          <Card className="p-4 border-2 border-primary">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  <Label className="text-base font-medium">Active Session</Label>
                </div>
                <Badge variant="outline" className={getStatusColor(activeSessionStatus || '')}>
                  {activeSessionStatus}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Session ID:</span>
                  <p className="font-mono text-xs mt-1">{activeSessionId}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Cost:</span>
                  <p className="font-medium mt-1">${activeSessionCost.toFixed(4)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <p className="font-medium mt-1">{formatDuration(activeSessionDuration)}</p>
                </div>
                {currentTool && (
                  <div>
                    <span className="text-muted-foreground">Current Tool:</span>
                    <p className="font-medium mt-1">{currentTool}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {stopCountdown !== null && stopCountdown > 0 ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-yellow-500 text-yellow-600"
                    disabled
                  >
                    <StopCircle className="h-4 w-4 mr-2 animate-spin" />
                    Stopping... {stopCountdown}s
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleStopSession}
                    disabled={isStopRequested || activeSessionStatus !== 'active'}
                    className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                  >
                    <StopCircle className="h-4 w-4 mr-2" />
                    Graceful Stop
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowForceKillDialog(true)}
                  disabled={isForceKillRequested || activeSessionStatus !== 'active'}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isForceKillRequested ? 'Killing...' : 'Force Kill'}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Session Details (Collapsible) */}
        {activeSessionId && debugInfo?.sessionId && (
          <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
            <Card className="p-4">
              <CollapsibleTrigger className="w-full flex items-center justify-between hover:opacity-80">
                <Label className="text-base font-medium cursor-pointer">Session Details</Label>
                <ChevronDown className={`h-5 w-5 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-4">
                <div className="space-y-4">
                  {/* Session Controls */}
                  <div>
                    <p className="text-sm font-medium mb-2">Session Controls</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs flex items-center gap-1"
                        onClick={() => {
                          navigator.clipboard.writeText(debugInfo.sessionId || '');
                          toast.success('Session ID copied', {
                            description: 'Copied to clipboard',
                          });
                        }}
                      >
                        <Copy className="h-3 w-3" />
                        Copy ID
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs flex items-center gap-1"
                        onClick={() => {
                          setConfig({ continueSession: true });
                          toast.info('Continue session enabled', {
                            description: 'Next message will continue this session',
                          });
                        }}
                      >
                        <Play className="h-3 w-3" />
                        Continue
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs flex items-center gap-1"
                        onClick={() => {
                          setConfig({ resumeSessionId: debugInfo.sessionId });
                          toast.info('Resume session set', {
                            description: `Will resume from ${debugInfo.sessionId?.slice(0, 8)}...`,
                          });
                        }}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Resume
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs flex items-center gap-1"
                        onClick={() => {
                          setConfig({ forkSession: true });
                          toast.info('Fork session enabled', {
                            description: 'Next message will fork this session',
                          });
                        }}
                      >
                        <GitBranch className="h-3 w-3" />
                        Fork
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Session Metadata */}
                  <div>
                    <p className="text-sm font-medium mb-2">Session Metadata</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Started</p>
                        <p className="font-medium">{debugInfo.timestamp ? new Date(debugInfo.timestamp).toLocaleTimeString() : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Turns</p>
                        <Badge variant="secondary">{debugInfo.numTurns || 1}</Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Cost</p>
                        <p className="font-medium">${accumulatedCost.toFixed(6)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Total Tokens</p>
                        <p className="font-medium">{debugInfo.tokens?.total.toLocaleString() || 0}</p>
                      </div>
                    </div>
                  </div>

                  {/* Tools Used */}
                  {debugInfo.toolsUsed && debugInfo.toolsUsed.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-2">Tools Used</p>
                        <div className="flex flex-wrap gap-1">
                          {debugInfo.toolsUsed.map((tool: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Session Timeline */}
                  <div>
                    <p className="text-sm font-medium mb-2">Session Timeline</p>
                    <div className="relative pl-4">
                      {/* Vertical line */}
                      <div className="absolute left-1 top-0 bottom-0 w-px bg-border" />

                      {/* Timeline items */}
                      <div className="space-y-3">
                        <div className="relative">
                          <div className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-green-600" />
                          <div className="text-xs">
                            <p className="font-medium">Session Started</p>
                            <p className="text-muted-foreground">{debugInfo.timestamp ? new Date(debugInfo.timestamp).toLocaleString() : 'N/A'}</p>
                          </div>
                        </div>

                        {debugInfo.numTurns && debugInfo.numTurns > 1 && (
                          <div className="relative">
                            <div className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-blue-600" />
                            <div className="text-xs">
                              <p className="font-medium">{debugInfo.numTurns} Turns Completed</p>
                              <p className="text-muted-foreground">Multi-turn conversation</p>
                            </div>
                          </div>
                        )}

                        <div className="relative">
                          <div className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-primary animate-pulse" />
                          <div className="text-xs">
                            <p className="font-medium">{activeSessionStatus === 'active' ? 'Active' : 'Idle'}</p>
                            <p className="text-muted-foreground">{activeSessionStatus === 'active' ? 'Processing' : 'Ready for next turn'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Session History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Session History</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={loadSessions}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          {sessionHistory.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <Activity className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No session history yet.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {sessionHistory.map((session: any) => (
                <Card
                  key={session.id}
                  className="p-4 hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => handleViewSession(session.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground font-mono">
                          {session.id.substring(0, 8)}...
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Cost:</span>
                          <p className="font-medium">${(session.total_cost || 0).toFixed(4)}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tokens:</span>
                          <p className="font-medium">{session.total_tokens || 0}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Turns:</span>
                          <p className="font-medium">{session.num_turns || 0}</p>
                        </div>
                      </div>
                      {session.created_at && (
                        <p className="text-xs text-muted-foreground">
                          Created: {new Date(session.created_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSession(session.id);
                        }}
                        title="View session details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        title="Delete session"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Force Kill Dialog */}
      <AlertDialog open={showForceKillDialog} onOpenChange={setShowForceKillDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force Kill Session?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                <p>
                  The graceful stop did not complete in time. Forcing termination will immediately kill all
                  processes, which may result in:
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1">
                  <li>Loss of unsaved work</li>
                  <li>Incomplete tool executions</li>
                  <li>Orphaned processes or resources</li>
                </ul>
                <p className="mt-2 font-semibold">Are you sure you want to force kill this session?</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleForceKill} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Force Kill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Session Viewer Modal */}
      <SessionViewerModal
        session={viewingSession}
        open={!!viewingSession}
        onOpenChange={(open) => !open && setViewingSession(null)}
      />
    </ScrollArea>
  );
}
