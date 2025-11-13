'use client';

import { useAgentStore } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, DollarSign, Zap, AlertCircle } from 'lucide-react';

export default function DebugPanel() {
  const { debugInfo } = useAgentStore();

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
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      In: {debugInfo.tokens.input.toLocaleString()}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Out: {debugInfo.tokens.output.toLocaleString()}
                    </Badge>
                    <Badge variant="default" className="text-xs">
                      Total: {debugInfo.tokens.total.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Stop Reason */}
        <div>
          <p className="text-sm font-medium mb-2">Stop Reason</p>
          <Badge variant={debugInfo.stopReason === 'end_turn' ? 'default' : 'secondary'}>
            {debugInfo.stopReason}
          </Badge>
        </div>

        {/* Timestamp */}
        <div>
          <p className="text-sm font-medium mb-2">Timestamp</p>
          <p className="text-xs text-muted-foreground font-mono">
            {new Date(debugInfo.timestamp).toLocaleString()}
          </p>
        </div>

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
            {debugInfo.rawResponse && (
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
            )}
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
