'use client';

import { useState, useEffect } from 'react';
import ChatInterface from './chat-interface';
import { SessionControlBar } from './session-control-bar';
import { SidebarNav } from './navigation/sidebar-nav';
import { BasicConfigTab } from './tabs/basic-config-tab';
import { ToolsTab } from './tabs/tools-tab';
import { McpServersTab } from './tabs/mcp-servers-tab';
import { SkillsTab } from './tabs/skills-tab';
import { AgentsTab } from './tabs/agents-tab';
import { HooksTab } from './tabs/hooks-tab';
import { PresetsTab } from './tabs/presets-tab';
import { SessionsTab } from './tabs/sessions-tab';
import { AdvancedTab } from './tabs/advanced-tab';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAgentStore } from '@/lib/store';
import { ApiClient } from '@/lib/api-client';
import { AlertCircle } from 'lucide-react';

export default function AgentTester() {
  const { resetConfig, activeTab, sidebarHovered } = useAgentStore();
  const [hasApiKey, setHasApiKey] = useState(true);

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    try {
      const status = await ApiClient.checkApiKey();
      setHasApiKey(status.hasApiKey);
    } catch (error) {
      console.error('Failed to check API key status:', error);
      setHasApiKey(false);
    }
  };

  // Render the active tab content
  const renderActiveTab = () => {
    switch (activeTab) {
      case 'basic-config':
        return <BasicConfigTab />;
      case 'tools':
        return <ToolsTab />;
      case 'mcp-servers':
        return <McpServersTab />;
      case 'skills':
        return <SkillsTab />;
      case 'agents':
        return <AgentsTab />;
      case 'hooks':
        return <HooksTab />;
      case 'presets':
        return <PresetsTab />;
      case 'sessions':
        return <SessionsTab />;
      case 'advanced':
        return <AdvancedTab />;
      default:
        return <BasicConfigTab />;
    }
  };

  return (
    <div className="h-full w-full bg-background flex overflow-hidden">
      {/* Sidebar Navigation */}
      <SidebarNav />

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{ marginLeft: sidebarHovered ? '240px' : '64px' }}
      >
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-primary">Rigger</h1>
            <p className="text-sm text-muted-foreground">
              Visual testing interface for the Claude Agent SDK
            </p>
          </div>

          {/* API Key Missing Alert */}
          {!hasApiKey && (
            <div className="flex-1 flex justify-center px-4">
              <Alert variant="destructive" className="w-fit">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ANTHROPIC_API_KEY is missing
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={resetConfig}>
              Reset Config
            </Button>
          </div>
        </div>

        {/* Session Control Bar */}
        <SessionControlBar />

        {/* Content + Chat Layout */}
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0">
          {/* Center Panel - Active Tab Content */}
          <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
            <div className="h-full overflow-hidden">
              {renderActiveTab()}
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right Panel - Chat with Debug Tab */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <ChatInterface />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
