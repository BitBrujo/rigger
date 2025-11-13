'use client';

import { useState } from 'react';
import ConfigPanel from './config-panel';
import ChatInterface from './chat-interface';
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

      {/* Two-panel layout */}
      <ResizablePanelGroup direction="horizontal" className="h-[calc(100vh-80px)]">
        {/* Left Panel - Configuration (doubled size) */}
        <ResizablePanel defaultSize={50} minSize={40} maxSize={70}>
          <ConfigPanel />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right Panel - Chat with Debug Tab */}
        <ResizablePanel defaultSize={50} minSize={30}>
          <ChatInterface />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
