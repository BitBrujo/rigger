'use client';

import { useState } from 'react';
import ConfigPanel from './config-panel';
import ChatInterface from './chat-interface';
import DebugPanel from './debug-panel';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export default function AgentTester() {
  return (
    <div className="h-full w-full bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Claude Agent SDK Tester</h1>
        <p className="text-sm text-muted-foreground">
          Test and debug agent configurations with real-time streaming
        </p>
      </div>

      {/* Three-panel layout */}
      <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-80px)]">
        {/* Left Panel - Configuration */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
          <ConfigPanel />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center Panel - Chat */}
        <ResizablePanel defaultSize={50} minSize={35}>
          <ChatInterface />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Debug */}
        <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
          <DebugPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
