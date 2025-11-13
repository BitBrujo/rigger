'use client';

import { useAgentStore } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    <ScrollArea className="h-full">
      <div className="p-6 space-y-4">
        <h2 className="text-lg font-semibold">Debug Info</h2>

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

        <Separator />

        {/* Raw Response */}
        <Tabs defaultValue="formatted" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="formatted">Formatted</TabsTrigger>
            <TabsTrigger value="raw">Raw JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="formatted" className="space-y-3">
            {debugInfo.sdkMode ? (
              <div>
                <p className="text-sm text-muted-foreground">
                  Agent SDK doesn't expose raw API responses. Check usage metrics above for detailed information.
                </p>
              </div>
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
            ) : null}
          </TabsContent>

          <TabsContent value="raw">
            <ScrollArea className="h-[400px] w-full rounded-md border">
              <pre className="p-4 text-xs">
                {JSON.stringify(debugInfo.rawResponse, null, 2)}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
