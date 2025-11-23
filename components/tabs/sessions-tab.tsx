'use client';

import { useAgentStore } from '@/lib/store';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ApiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Activity, StopCircle, XCircle, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

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
    availableSessions,
    setAvailableSessions,
  } = useAgentStore();

  const [isLoading, setIsLoading] = useState(false);

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

  const handleStopSession = async () => {
    if (!activeSessionId) return;

    try {
      setIsStopRequested(true);
      await ApiClient.stopSession(activeSessionId);
      toast.success('Stop requested', {
        description: 'Agent will stop after current operation',
      });
    } catch (error: any) {
      toast.error('Failed to stop session', {
        description: error.message,
      });
      setIsStopRequested(false);
    }
  };

  const handleForceKill = async () => {
    if (!activeSessionId) return;

    if (!confirm('Force kill will immediately terminate the session. Continue?')) {
      return;
    }

    try {
      setIsForceKillRequested(true);
      await ApiClient.forceKillSession(activeSessionId);
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

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Session Management</h2>
          <p className="text-muted-foreground">
            Monitor and control active agent sessions
          </p>
        </div>

        {/* Current Session */}
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
                  <p className="font-medium mt-1">{activeSessionDuration}s</p>
                </div>
                {currentTool && (
                  <div>
                    <span className="text-muted-foreground">Current Tool:</span>
                    <p className="font-medium mt-1">{currentTool}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleStopSession}
                  disabled={isStopRequested || activeSessionStatus !== 'active'}
                >
                  <StopCircle className="h-4 w-4 mr-2" />
                  {isStopRequested ? 'Stopping...' : 'Graceful Stop'}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleForceKill}
                  disabled={isForceKillRequested || activeSessionStatus !== 'active'}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {isForceKillRequested ? 'Killing...' : 'Force Kill'}
                </Button>
              </div>
            </div>
          </Card>
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

          {availableSessions.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <Activity className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No sessions yet. Start a conversation to create a session.
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-2">
              {availableSessions.map((session: any) => (
                <Card key={session.id} className="p-4 hover:border-primary/50 transition-all">
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
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteSession(session.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
