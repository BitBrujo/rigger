'use client';

import { useAgentStore } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, DollarSign, Zap, AlertCircle, TrendingUp, Info, Terminal, Server, CheckCircle, XCircle, RefreshCw, GitBranch, Play, Pause, RotateCcw, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function DebugPanel() {
  const { debugInfo, config, accumulatedCost, sdkMode, systemInfo, hookLogs, sessionHistory } = useAgentStore();

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
        <TabsList className="grid w-full grid-cols-6 mx-4 mt-2">
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="system">
            <Info className="h-3 w-3 mr-1" />
            System
          </TabsTrigger>
          <TabsTrigger value="mcp">
            <Server className="h-3 w-3 mr-1" />
            MCP
          </TabsTrigger>
          <TabsTrigger value="hooks">
            <Terminal className="h-3 w-3 mr-1" />
            Hooks
          </TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
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

              {/* Visual Budget Progress Bar */}
              {config.maxBudgetUsd && (
                <Card>
                  <CardContent className="pt-4 pb-3 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Budget Usage</span>
                      <span className="font-medium">{budgetPercentage?.toFixed(1)}%</span>
                    </div>
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 transition-all duration-300 ${
                          isOverBudget
                            ? 'bg-destructive'
                            : isApproachingLimit
                            ? 'bg-yellow-500'
                            : 'bg-green-600'
                        }`}
                        style={{ width: `${Math.min(100, budgetPercentage || 0)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>$0</span>
                      <span>${config.maxBudgetUsd.toFixed(6)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Cost Breakdown */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Cost Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">This Request</span>
                    <span className="font-medium">${debugInfo.cost.toFixed(6)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Session Total</span>
                    <span className="font-medium">${accumulatedCost.toFixed(6)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Input Tokens</span>
                    <span className="font-medium">{debugInfo.tokens.input.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Output Tokens</span>
                    <span className="font-medium">{debugInfo.tokens.output.toLocaleString()}</span>
                  </div>
                  {debugInfo.tokens.cacheRead !== undefined && debugInfo.tokens.cacheRead > 0 && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Cache Read</span>
                        <div className="flex items-center gap-1">
                          <Badge variant="outline" className="text-xs h-4 px-1">
                            {debugInfo.tokens.cacheRead.toLocaleString()}
                          </Badge>
                          <span className="text-green-600">↓90% cost</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

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

        {/* Performance Metrics */}
        <Separator />
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Response Time</span>
                <span className="font-medium">{debugInfo.latency}ms</span>
              </div>
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-300 ${
                    debugInfo.latency < 1000
                      ? 'bg-green-600'
                      : debugInfo.latency < 3000
                      ? 'bg-yellow-500'
                      : 'bg-orange-500'
                  }`}
                  style={{ width: `${Math.min(100, (debugInfo.latency / 5000) * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Fast</span>
                <span>Slow</span>
              </div>
            </div>

            {debugInfo.numTurns && debugInfo.numTurns > 1 && (
              <>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Avg Time per Turn</span>
                    <span className="font-medium">{(debugInfo.latency / debugInfo.numTurns).toFixed(0)}ms</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Tokens per Second</span>
                    <span className="font-medium">
                      {((debugInfo.tokens.total / debugInfo.latency) * 1000).toFixed(1)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {debugInfo.tokens.cacheRead !== undefined && debugInfo.tokens.cacheRead > 0 && (
              <>
                <Separator />
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Cache Hit Rate</span>
                    <Badge variant="outline" className="text-xs h-4 px-1 bg-green-50 text-green-700 border-green-200">
                      {((debugInfo.tokens.cacheRead / debugInfo.tokens.input) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-green-600 transition-all duration-300"
                      style={{
                        width: `${((debugInfo.tokens.cacheRead / debugInfo.tokens.input) * 100).toFixed(1)}%`,
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

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

        {/* SYSTEM INFO TAB */}
        <TabsContent value="system" className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">System Initialization</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Information from the Agent SDK session initialization
                </p>
              </div>

              {systemInfo ? (
                <div className="space-y-4">
                  {/* Model Information */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Model Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Model:</span>
                        <Badge variant="default">{systemInfo.model}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Permission Mode:</span>
                        <Badge variant="outline">{systemInfo.permissionMode}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">API Key Source:</span>
                        <Badge variant="secondary">{systemInfo.apiKeySource}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Working Directory */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Working Directory</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <code className="text-xs text-muted-foreground break-all">{systemInfo.cwd}</code>
                    </CardContent>
                  </Card>

                  {/* Available Tools */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <span>Available Tools</span>
                        <Badge variant="secondary">{systemInfo.tools.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {systemInfo.tools.map((tool, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* MCP Servers Status */}
                  {systemInfo.mcpServers && systemInfo.mcpServers.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>MCP Servers</span>
                          <Badge variant="secondary">{systemInfo.mcpServers.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {systemInfo.mcpServers.map((server, i) => (
                          <div key={i} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex items-center gap-2">
                              {server.status === 'connected' ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              ) : server.status === 'failed' ? (
                                <XCircle className="h-4 w-4 text-destructive" />
                              ) : (
                                <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                              )}
                              <span className="text-xs font-medium">{server.name}</span>
                            </div>
                            <Badge
                              variant={
                                server.status === 'connected' ? 'default' :
                                server.status === 'failed' ? 'destructive' :
                                'secondary'
                              }
                              className="text-xs"
                            >
                              {server.status}
                            </Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Agents */}
                  {systemInfo.agents && systemInfo.agents.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>Configured Agents</span>
                          <Badge variant="secondary">{systemInfo.agents.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {systemInfo.agents.map((agent, i) => (
                            <Badge key={i} variant="default" className="text-xs">
                              {agent}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Plugins */}
                  {systemInfo.plugins && systemInfo.plugins.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>Loaded Plugins</span>
                          <Badge variant="secondary">{systemInfo.plugins.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {systemInfo.plugins.map((plugin, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <span className="font-medium">{plugin.name}</span>
                            <Badge variant="outline" className="text-xs">{plugin.version}</Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Slash Commands */}
                  {systemInfo.slashCommands && systemInfo.slashCommands.length > 0 && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>Slash Commands</span>
                          <Badge variant="secondary">{systemInfo.slashCommands.length}</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-1">
                          {systemInfo.slashCommands.map((cmd, i) => (
                            <Badge key={i} variant="outline" className="text-xs font-mono">
                              /{cmd}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    No system information available. System info is sent when a new Agent SDK session is initialized.
                  </AlertDescription>
                </Alert>
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

        {/* HOOKS TAB */}
        <TabsContent value="hooks" className="flex-1">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-2">Hook Execution Logs</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  View results from hooks executed during agent lifecycle events
                </p>
              </div>

              {hookLogs && hookLogs.length > 0 ? (
                <div className="space-y-3">
                  {hookLogs.slice().reverse().map((log, i) => (
                    <Card key={i}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Terminal className="h-4 w-4" />
                            <span>{log.hookName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {log.hookEvent}
                            </Badge>
                            {log.exitCode !== undefined && (
                              <Badge
                                variant={log.exitCode === 0 ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                Exit: {log.exitCode}
                              </Badge>
                            )}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {/* Stdout */}
                        {log.stdout && (
                          <div>
                            <p className="text-xs font-medium mb-1 flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              stdout
                            </p>
                            <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto max-h-32">
                              {log.stdout}
                            </pre>
                          </div>
                        )}

                        {/* Stderr */}
                        {log.stderr && (
                          <div>
                            <p className="text-xs font-medium mb-1 flex items-center gap-1 text-destructive">
                              <XCircle className="h-3 w-3" />
                              stderr
                            </p>
                            <pre className="text-xs bg-destructive/10 text-destructive p-2 rounded-md overflow-x-auto max-h-32">
                              {log.stderr}
                            </pre>
                          </div>
                        )}

                        {!log.stdout && !log.stderr && (
                          <p className="text-xs text-muted-foreground italic">No output</p>
                        )}

                        {/* Timestamp */}
                        <Separator />
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    No hooks executed yet. Hooks are custom scripts that run at specific agent lifecycle events. Configure hooks in the Config Panel to see execution logs here.
                  </AlertDescription>
                </Alert>
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
                              const { setConfig } = useAgentStore.getState();
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
                              const { setConfig } = useAgentStore.getState();
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
                              const { setConfig } = useAgentStore.getState();
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
                    </CardContent>
                  </Card>

                  {/* Session Metadata Card */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Session Metadata</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Started</p>
                          <p className="text-xs font-medium">{new Date(debugInfo.timestamp).toLocaleTimeString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Turns</p>
                          <Badge variant="secondary">{debugInfo.numTurns || 1}</Badge>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Cost</p>
                          <p className="text-xs font-medium">${accumulatedCost.toFixed(6)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Total Tokens</p>
                          <p className="text-xs font-medium">{debugInfo.tokens.total.toLocaleString()}</p>
                        </div>
                      </div>

                      {debugInfo.toolsUsed && debugInfo.toolsUsed.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">Tools Used</p>
                            <div className="flex flex-wrap gap-1">
                              {debugInfo.toolsUsed.map((tool, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {tool}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {/* Session Timeline */}
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Session Timeline</p>
                        <div className="relative pl-4">
                          {/* Vertical line */}
                          <div className="absolute left-1 top-0 bottom-0 w-px bg-border" />

                          {/* Timeline items */}
                          <div className="space-y-3">
                            <div className="relative">
                              <div className="absolute -left-[13px] top-1 w-2 h-2 rounded-full bg-green-600" />
                              <div className="text-xs">
                                <p className="font-medium">Session Started</p>
                                <p className="text-muted-foreground">{new Date(debugInfo.timestamp).toLocaleString()}</p>
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
                                <p className="font-medium">Active</p>
                                <p className="text-muted-foreground">Ready for next turn</p>
                              </div>
                            </div>
                          </div>
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
