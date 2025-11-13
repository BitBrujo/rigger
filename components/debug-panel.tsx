'use client';

import { useAgentStore } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, DollarSign, Zap, AlertCircle, TrendingUp } from 'lucide-react';

export default function DebugPanel() {
  const { debugInfo, config, accumulatedCost, sdkMode } = useAgentStore();

  const budgetRemaining = config.maxBudgetUsd ? config.maxBudgetUsd - accumulatedCost : null;
  const budgetPercentage = config.maxBudgetUsd ? (accumulatedCost / config.maxBudgetUsd) * 100 : null;
  const isApproachingLimit = budgetPercentage !== null && budgetPercentage > 80;
  const isOverBudget = budgetPercentage !== null && budgetPercentage >= 100;

  if (!debugInfo) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center text-muted-foreground">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Send a message to see debug information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Debug Info</h2>
      </div>

      <Tabs defaultValue="metrics" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mx-4 mt-2">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="mcp" disabled={!sdkMode}>MCP</TabsTrigger>
          <TabsTrigger value="sessions" disabled={!sdkMode}>Sessions</TabsTrigger>
          <TabsTrigger value="raw">Raw</TabsTrigger>
        </TabsList>

        {/* METRICS TAB */}
        <TabsContent value="metrics" className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-2">
          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Latency</p>
                  <p className="text-lg font-semibold">{debugInfo.latency}ms</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Cost</p>
                  <p className="text-lg font-semibold">${debugInfo.cost.toFixed(6)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Tokens</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      In: {debugInfo.tokens.input.toLocaleString()}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Out: {debugInfo.tokens.output.toLocaleString()}
                    </Badge>
                    <Badge variant="default" className="text-xs">
                      Total: {debugInfo.tokens.total.toLocaleString()}
                    </Badge>
                    {debugInfo.tokens.cacheCreation !== undefined && debugInfo.tokens.cacheCreation > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Cache Created: {debugInfo.tokens.cacheCreation.toLocaleString()}
                      </Badge>
                    )}
                    {debugInfo.tokens.cacheRead !== undefined && debugInfo.tokens.cacheRead > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Cache Read: {debugInfo.tokens.cacheRead.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Tracking (SDK Mode only) */}
        {sdkMode && (
          <>
            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Budget Tracking</h3>
                {config.maxBudgetUsd && (
                  <Badge variant={isOverBudget ? 'destructive' : isApproachingLimit ? 'default' : 'secondary'}>
                    {budgetPercentage?.toFixed(1)}% used
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Card>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Total Spent</p>
                        <p className="text-lg font-semibold">${accumulatedCost.toFixed(6)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {config.maxBudgetUsd ? (
                  <Card className={isOverBudget ? 'border-destructive' : isApproachingLimit ? 'border-yellow-500' : ''}>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Remaining</p>
                          <p className={`text-lg font-semibold ${isOverBudget ? 'text-destructive' : isApproachingLimit ? 'text-yellow-600' : ''}`}>
                            ${Math.max(0, budgetRemaining || 0).toFixed(6)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="pt-4 pb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Budget Limit</p>
                          <p className="text-sm text-muted-foreground">No limit set</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {isOverBudget && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Budget exceeded! You've spent ${accumulatedCost.toFixed(6)} of ${config.maxBudgetUsd?.toFixed(6)}.
                  </AlertDescription>
                </Alert>
              )}

              {isApproachingLimit && !isOverBudget && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Warning: {budgetPercentage?.toFixed(1)}% of budget used. ${budgetRemaining?.toFixed(6)} remaining.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </>
        )}

        {/* SDK Mode Indicator */}
        {debugInfo.sdkMode !== undefined && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">API Mode</p>
              <Badge variant={debugInfo.sdkMode ? 'default' : 'secondary'}>
                {debugInfo.sdkMode ? 'Agent SDK' : 'Messages API'}
              </Badge>
            </div>
          </>
        )}

        <Separator />

        {/* Stop Reason & Agent SDK Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2">Stop Reason</p>
            <Badge variant={debugInfo.stopReason === 'end_turn' ? 'default' : 'secondary'}>
              {debugInfo.stopReason}
            </Badge>
          </div>
          {debugInfo.numTurns !== undefined && (
            <div>
              <p className="text-sm font-medium mb-2">Agent Turns</p>
              <Badge variant="outline">{debugInfo.numTurns}</Badge>
            </div>
          )}
        </div>

        {/* Tools Used (SDK only) */}
        {debugInfo.toolsUsed && debugInfo.toolsUsed.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Tools Used</p>
              <div className="flex flex-wrap gap-1">
                {debugInfo.toolsUsed.map((tool, i) => (
                  <Badge key={i} variant="default" className="text-xs">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Timestamp */}
        <div>
          <p className="text-sm font-medium mb-2">Timestamp</p>
          <p className="text-xs text-muted-foreground font-mono">
            {new Date(debugInfo.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Permission Denials (SDK only) */}
        {debugInfo.permissionDenials && debugInfo.permissionDenials.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Permission Denials</p>
              {debugInfo.permissionDenials.map((denial, i) => (
                <Alert key={i} variant="destructive" className="mb-2">
                  <AlertDescription className="text-xs">
                    Tool: {denial.tool_name} (ID: {denial.tool_use_id})
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </>
        )}

        {/* Errors */}
        {debugInfo.errors && debugInfo.errors.length > 0 && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium mb-2">Errors</p>
              {debugInfo.errors.map((error, i) => (
                <Alert key={i} variant="destructive" className="mb-2">
                  <AlertDescription className="text-xs">{error}</AlertDescription>
                </Alert>
              ))}
            </div>
          </>
        )}

            </div>
          </ScrollArea>
        </TabsContent>

        {/* MCP TAB */}
        <TabsContent value="mcp" className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">MCP Resources</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  View resources available from configured MCP servers
                </p>
              </div>

              {Object.keys(config.mcpServers || {}).length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    No MCP servers configured. Add MCP servers in the configuration panel to see available resources.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {Object.entries(config.mcpServers || {}).map(([name, serverConfig]: [string, any]) => (
                    <Card key={name}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>{name}</span>
                          <Badge variant="outline" className="text-xs">MCP Server</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="font-medium">Command:</span>
                            <code className="ml-2 text-muted-foreground">{serverConfig.command}</code>
                          </div>
                          {serverConfig.args && serverConfig.args.length > 0 && (
                            <div>
                              <span className="font-medium">Args:</span>
                              <code className="ml-2 text-muted-foreground">{serverConfig.args.join(' ')}</code>
                            </div>
                          )}
                          {serverConfig.env && Object.keys(serverConfig.env).length > 0 && (
                            <div>
                              <span className="font-medium">Environment:</span>
                              <div className="ml-2 mt-1 space-y-1">
                                {Object.entries(serverConfig.env).map(([key, value]: [string, any]) => (
                                  <div key={key} className="text-muted-foreground">
                                    {key}: {typeof value === 'string' && value.length > 20 ? '***' : String(value)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <Alert className="mt-3">
                          <AlertCircle className="h-3 w-3" />
                          <AlertDescription className="text-xs">
                            Use ListMcpResources and ReadMcpResource tools during agent execution to interact with this server
                          </AlertDescription>
                        </Alert>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* SESSIONS TAB */}
        <TabsContent value="sessions" className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Session Management</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Track and manage Agent SDK sessions
                </p>
              </div>

              {debugInfo.sessionId ? (
                <div className="space-y-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Current Session</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-xs font-medium">Session ID</p>
                        <code className="text-xs text-muted-foreground break-all">{debugInfo.sessionId}</code>
                      </div>
                      {debugInfo.numTurns && (
                        <div>
                          <p className="text-xs font-medium">Turns Completed</p>
                          <Badge variant="outline">{debugInfo.numTurns}</Badge>
                        </div>
                      )}

                      <Separator />

                      <div className="space-y-2">
                        <p className="text-xs font-medium">Session Controls</p>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              // Copy session ID to clipboard
                              navigator.clipboard.writeText(debugInfo.sessionId || '');
                            }}
                          >
                            Copy ID
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              // Set config to continue this session
                              const { setConfig } = useAgentStore.getState();
                              setConfig({ continueSession: true });
                            }}
                          >
                            Continue
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              const { setConfig } = useAgentStore.getState();
                              setConfig({ resumeSessionId: debugInfo.sessionId });
                            }}
                          >
                            Resume
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => {
                              const { setConfig } = useAgentStore.getState();
                              setConfig({ forkSession: true });
                            }}
                          >
                            Fork
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <strong>Session Operations:</strong><br />
                      • <strong>Continue:</strong> Resume from where this session left off<br />
                      • <strong>Resume:</strong> Start a new conversation from this session<br />
                      • <strong>Fork:</strong> Create a branch from this session
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    No active session. Sessions are created automatically in SDK mode when you send messages.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* RAW TAB */}
        <TabsContent value="raw" className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <Tabs defaultValue="formatted" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="formatted">Formatted</TabsTrigger>
                  <TabsTrigger value="json">Raw JSON</TabsTrigger>
                </TabsList>

                <TabsContent value="formatted" className="space-y-3 mt-4">
                  {debugInfo.sdkMode ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Agent SDK doesn't expose raw API responses. Check the Metrics tab for detailed usage information.
                      </AlertDescription>
                    </Alert>
                  ) : debugInfo.rawResponse ? (
                    <>
                      <div>
                        <p className="text-xs font-medium mb-1">ID</p>
                        <p className="text-xs font-mono text-muted-foreground">{debugInfo.rawResponse.id}</p>
                      </div>

                      <div>
                        <p className="text-xs font-medium mb-1">Model</p>
                        <Badge variant="outline" className="text-xs">
                          {debugInfo.rawResponse.model}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-xs font-medium mb-1">Role</p>
                        <Badge variant="outline" className="text-xs">
                          {debugInfo.rawResponse.role}
                        </Badge>
                      </div>

                      <div>
                        <p className="text-xs font-medium mb-1">Content Blocks</p>
                        <p className="text-xs text-muted-foreground">
                          {debugInfo.rawResponse.content?.length || 0} blocks
                        </p>
                      </div>

                      {debugInfo.rawResponse.content && debugInfo.rawResponse.content.length > 0 && (
                        <div>
                          <p className="text-xs font-medium mb-2">Content Types</p>
                          <div className="flex flex-wrap gap-1">
                            {debugInfo.rawResponse.content.map((block, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {block.type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        No raw response data available
                      </AlertDescription>
                    </Alert>
                  )}
                </TabsContent>

                <TabsContent value="json" className="mt-4">
                  <ScrollArea className="h-[500px] w-full rounded-md border">
                    <pre className="p-4 text-xs">
                      {JSON.stringify(debugInfo.rawResponse || debugInfo, null, 2)}
                    </pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
