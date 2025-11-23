'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit2, Trash2, Terminal, Hash, Key } from 'lucide-react';
import type { McpServerConfig } from '@/lib/types';

interface McpServerCardProps {
  name: string;
  config: McpServerConfig;
  onEdit: () => void;
  onDelete: () => void;
}

export function McpServerCard({
  name,
  config,
  onEdit,
  onDelete,
}: McpServerCardProps) {
  const argsCount = config.args?.length || 0;
  const envCount = Object.keys(config.env || {}).length;

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg font-semibold">{name}</CardTitle>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8"
              aria-label="Edit server"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="Delete server"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Command */}
        <div className="flex items-start gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-1">Command</div>
            <code className="text-sm font-mono bg-secondary px-2 py-1 rounded">
              {config.command}
            </code>
          </div>
        </div>

        {/* Args */}
        {argsCount > 0 && (
          <div className="flex items-start gap-2">
            <Hash className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground mb-1">Arguments</div>
              <div className="flex flex-wrap gap-1">
                {config.args!.slice(0, 3).map((arg, index) => (
                  <Badge key={index} variant="secondary" className="font-mono text-xs">
                    {arg}
                  </Badge>
                ))}
                {argsCount > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{argsCount - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Environment Variables */}
        {envCount > 0 && (
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <div className="text-xs text-muted-foreground">
              {envCount} environment variable{envCount !== 1 ? 's' : ''}
            </div>
          </div>
        )}

        {/* Empty state */}
        {argsCount === 0 && envCount === 0 && (
          <div className="text-xs text-muted-foreground italic">
            No arguments or environment variables configured
          </div>
        )}
      </CardContent>
    </Card>
  );
}
