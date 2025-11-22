'use client';

import { useEffect, useState, useCallback } from 'react';
import { useStore } from '@/lib/store';
import { SessionClient, SessionMetadata } from '@/lib/session-client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Square, AlertTriangle, Clock, DollarSign } from 'lucide-react';
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

export function SessionControlBar() {
  const {
    activeSessionId,
    setActiveSessionId,
    activeSessionStatus,
    setActiveSessionStatus,
    activeSessionCost,
    setActiveSessionCost,
    activeSessionDuration,
    setActiveSessionDuration,
    currentTool,
    setCurrentTool,
    isStopRequested,
    setIsStopRequested,
    isForceKillRequested,
    setIsForceKillRequested,
    availableSessions,
    setAvailableSessions,
    config,
  } = useStore();

  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [stopCountdown, setStopCountdown] = useState<number | null>(null);
  const [showForceKillDialog, setShowForceKillDialog] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  // Load available sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Duration timer - updates every second when session is active
  useEffect(() => {
    if (!activeSessionId || !['active', 'idle'].includes(activeSessionStatus || '')) {
      return;
    }

    const interval = setInterval(() => {
      if (sessionStartTime) {
        const elapsed = Math.floor((Date.now() - sessionStartTime.getTime()) / 1000);
        setActiveSessionDuration(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSessionId, activeSessionStatus, sessionStartTime, setActiveSessionDuration]);

  // Stop countdown timer
  useEffect(() => {
    if (stopCountdown === null || stopCountdown <= 0) return;

    const interval = setInterval(() => {
      setStopCountdown((prev) => {
        if (prev === null || prev <= 1) {
          setShowForceKillDialog(true);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [stopCountdown]);

  // Poll session status when active
  useEffect(() => {
    if (!activeSessionId || !['active', 'stopping'].includes(activeSessionStatus || '')) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const status = await SessionClient.getSessionStatus(activeSessionId);
        setActiveSessionStatus(status.status);
        setActiveSessionCost(status.totalCost);
        setCurrentTool(status.currentTool);

        // If session stopped, cancel countdown
        if (['completed', 'terminated', 'error'].includes(status.status)) {
          setStopCountdown(null);
          setIsStopRequested(false);
          setIsForceKillRequested(false);
        }
      } catch (error) {
        console.error('Failed to poll session status:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [activeSessionId, activeSessionStatus, setActiveSessionStatus, setActiveSessionCost, setCurrentTool, setIsStopRequested, setIsForceKillRequested]);

  const loadSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const sessions = await SessionClient.listSessions({
        limit: 20,
      });
      setAvailableSessions(sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const handleNewSession = useCallback(async () => {
    try {
      const session = await SessionClient.createSession(config);
      setActiveSessionId(session.id);
      setActiveSessionStatus(session.status);
      setActiveSessionCost(0);
      setActiveSessionDuration(0);
      setSessionStartTime(new Date());
      setCurrentTool(null);
      await loadSessions();
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }, [config, setActiveSessionId, setActiveSessionStatus, setActiveSessionCost, setActiveSessionDuration, setCurrentTool]);

  const handleSessionSelect = useCallback(async (sessionId: string) => {
    try {
      const session = await SessionClient.getSession(sessionId);
      if (session) {
        setActiveSessionId(session.id);
        setActiveSessionStatus(session.status);
        setActiveSessionCost(session.totalCost);
        setCurrentTool(session.currentTool);

        // Calculate duration from session start time
        if (session.startedAt) {
          const startTime = new Date(session.startedAt);
          setSessionStartTime(startTime);
          const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
          setActiveSessionDuration(elapsed);
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }, [setActiveSessionId, setActiveSessionStatus, setActiveSessionCost, setActiveSessionDuration, setCurrentTool]);

  const handleStop = useCallback(async () => {
    if (!activeSessionId) return;

    try {
      setIsStopRequested(true);
      setStopCountdown(5); // 5 second countdown to force kill
      await SessionClient.stopSession(activeSessionId);
      setActiveSessionStatus('stopping');
    } catch (error) {
      console.error('Failed to stop session:', error);
      setIsStopRequested(false);
      setStopCountdown(null);
    }
  }, [activeSessionId, setIsStopRequested, setActiveSessionStatus]);

  const handleForceKill = useCallback(async () => {
    if (!activeSessionId) return;

    try {
      setIsForceKillRequested(true);
      await SessionClient.forceKillSession(activeSessionId);
      setActiveSessionStatus('terminated');
      setStopCountdown(null);
      setShowForceKillDialog(false);
    } catch (error) {
      console.error('Failed to force kill session:', error);
    } finally {
      setIsForceKillRequested(false);
      setIsStopRequested(false);
    }
  }, [activeSessionId, setIsForceKillRequested, setActiveSessionStatus, setIsStopRequested]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCost = (cost: number): string => {
    return `$${cost.toFixed(4)}`;
  };

  const getStatusColor = (status: string | null): string => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'idle':
        return 'bg-blue-500';
      case 'initializing':
        return 'bg-yellow-500';
      case 'stopping':
        return 'bg-orange-500';
      case 'completed':
        return 'bg-gray-500';
      case 'error':
        return 'bg-red-500';
      case 'terminated':
        return 'bg-red-700';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusLabel = (status: string | null): string => {
    if (!status) return 'No Session';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const canStop = activeSessionStatus && ['active', 'idle', 'initializing'].includes(activeSessionStatus);

  return (
    <>
      <div className="w-full border-b bg-background p-3">
        <div className="flex items-center gap-4">
          {/* Session Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Session:</span>
            <Select
              value={activeSessionId || 'none'}
              onValueChange={(value) => {
                if (value !== 'none') {
                  handleSessionSelect(value);
                }
              }}
              disabled={isLoadingSessions}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="No active session" />
              </SelectTrigger>
              <SelectContent>
                {activeSessionId && (
                  <SelectItem value={activeSessionId}>
                    Current: {activeSessionId.slice(0, 8)}...
                  </SelectItem>
                )}
                {availableSessions
                  .filter((s: SessionMetadata) => s.id !== activeSessionId)
                  .map((session: SessionMetadata) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.id.slice(0, 8)}... ({session.status})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${getStatusColor(activeSessionStatus)}`} />
            <Badge variant="outline">{getStatusLabel(activeSessionStatus)}</Badge>
            {currentTool && (
              <Badge variant="secondary" className="font-mono text-xs">
                {currentTool}
              </Badge>
            )}
          </div>

          {/* Duration */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formatDuration(activeSessionDuration)}</span>
          </div>

          {/* Cost */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" />
            <span className="font-mono">{formatCost(activeSessionCost)}</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleNewSession}
              variant="default"
              size="sm"
              disabled={activeSessionStatus === 'active'}
            >
              New Session
            </Button>

            {canStop && !isStopRequested && (
              <Button
                onClick={handleStop}
                variant="outline"
                size="sm"
                className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
              >
                <Square className="mr-1 h-4 w-4" />
                Stop
              </Button>
            )}

            {isStopRequested && stopCountdown !== null && (
              <Button
                variant="outline"
                size="sm"
                disabled
                className="border-orange-500 text-orange-600"
              >
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Stopping... {stopCountdown}s
              </Button>
            )}

            {isStopRequested && stopCountdown === null && (
              <Button
                onClick={() => setShowForceKillDialog(true)}
                variant="destructive"
                size="sm"
              >
                <AlertTriangle className="mr-1 h-4 w-4" />
                Force Kill
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Force Kill Confirmation Dialog */}
      <AlertDialog open={showForceKillDialog} onOpenChange={setShowForceKillDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Force Kill Session?</AlertDialogTitle>
            <AlertDialogDescription>
              The graceful stop did not complete in time. Forcing termination will immediately kill all
              processes, which may result in:
              <ul className="mt-2 list-inside list-disc space-y-1">
                <li>Loss of unsaved work</li>
                <li>Incomplete tool executions</li>
                <li>Orphaned processes or resources</li>
              </ul>
              <p className="mt-2 font-semibold">Are you sure you want to force kill this session?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Wait Longer</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleForceKill}
              className="bg-red-600 hover:bg-red-700"
            >
              {isForceKillRequested && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Force Kill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
