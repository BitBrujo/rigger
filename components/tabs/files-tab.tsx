'use client';

import { useEffect, useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAgentStore } from '@/lib/store';
import { ApiClient } from '@/lib/api-client';
import { UploadedFile } from '@/lib/types';
import { Upload, FileText, File, Image, FileCode, X, Globe, User, AlertCircle, Info } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function FilesTab() {
  const { uploadedFiles, setUploadedFiles, conversationId } = useAgentStore();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'global' | 'conversation'>('all');
  const [uploadScope, setUploadScope] = useState<'global' | 'conversation'>(
    conversationId ? 'conversation' : 'global'
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update upload scope when conversationId changes
  useEffect(() => {
    // If conversation just started, switch to conversation scope
    if (conversationId && uploadScope === 'global') {
      setUploadScope('conversation');
    }
  }, [conversationId]);

  // Load files on mount
  useEffect(() => {
    loadFiles();
  }, [conversationId]);

  const loadFiles = async () => {
    try {
      const files = await ApiClient.getFiles({
        conversationId: conversationId ?? undefined,
      });
      setUploadedFiles(files);
    } catch (err: any) {
      console.error('Failed to load files:', err);
      setError(err.message);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate conversation scope
    if (uploadScope === 'conversation' && !conversationId) {
      setError('Cannot upload conversation-scoped file without an active conversation');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const uploadedFile = await ApiClient.uploadFile({
        file,
        conversationId: conversationId ?? undefined,
        isGlobal: uploadScope === 'global',
        integrationMethod: 'working-directory', // Default integration method
      });

      setUploadedFiles([...uploadedFiles, uploadedFile]);
    } catch (err: any) {
      console.error('Failed to upload file:', err);
      setError(err.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleToggleEnabled = async (id: number, currentEnabled: boolean) => {
    try {
      const updated = await ApiClient.updateFile(id, { enabled: !currentEnabled });
      setUploadedFiles(
        uploadedFiles.map((f) => (f.id === id ? updated : f))
      );
    } catch (err: any) {
      console.error('Failed to toggle file:', err);
      setError(err.message);
    }
  };

  const handleUpdateIntegrationMethod = async (
    id: number,
    method: 'system-prompt' | 'working-directory' | 'both'
  ) => {
    try {
      const updated = await ApiClient.updateFile(id, { integrationMethod: method });
      setUploadedFiles(
        uploadedFiles.map((f) => (f.id === id ? updated : f))
      );
    } catch (err: any) {
      console.error('Failed to update integration method:', err);
      setError(err.message);
    }
  };

  const handleUpdateDescription = async (id: number, description: string) => {
    try {
      const updated = await ApiClient.updateFile(id, { description });
      setUploadedFiles(
        uploadedFiles.map((f) => (f.id === id ? updated : f))
      );
    } catch (err: any) {
      console.error('Failed to update description:', err);
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await ApiClient.deleteFile(id);
      setUploadedFiles(uploadedFiles.filter((f) => f.id !== id));
    } catch (err: any) {
      console.error('Failed to delete file:', err);
      setError(err.message);
    }
  };

  const getFileIcon = (mimeType?: string) => {
    if (!mimeType) return FileText;
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.includes('javascript') || mimeType.includes('typescript') || mimeType.includes('python')) {
      return FileCode;
    }
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatUploadDate = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return 'Unknown date';

    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (err) {
      return 'Invalid date';
    }
  };

  const filteredFiles = uploadedFiles.filter((file) => {
    if (filter === 'global') return file.isGlobal;
    if (filter === 'conversation') return !file.isGlobal;
    return true;
  });

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold">Files</h2>
          <p className="text-muted-foreground">Upload and manage files for agent context</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload File</CardTitle>
            <CardDescription>
              Upload files for the agent to interact with (max 10MB, common file types only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scope Selection */}
            <div className="space-y-2">
              <Label>File Scope</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={uploadScope === 'global' ? 'default' : 'outline'}
                  onClick={() => setUploadScope('global')}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Global
                </Button>
                <Button
                  type="button"
                  variant={uploadScope === 'conversation' ? 'default' : 'outline'}
                  onClick={() => setUploadScope('conversation')}
                  disabled={!conversationId}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <User className="h-4 w-4" />
                  Current Conversation
                </Button>
              </div>
            </div>

            {/* Scope Info Alert */}
            {uploadScope === 'global' && (
              <Alert>
                <Globe className="h-4 w-4" />
                <AlertDescription>
                  File will be available across all conversations
                </AlertDescription>
              </Alert>
            )}
            {uploadScope === 'conversation' && conversationId && (
              <Alert>
                <User className="h-4 w-4" />
                <AlertDescription>
                  File will be available only in this conversation
                </AlertDescription>
              </Alert>
            )}
            {uploadScope === 'conversation' && !conversationId && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No active conversation. Start a conversation first or upload as global file.
                </AlertDescription>
              </Alert>
            )}

            {/* File Upload Button */}
            <div className="flex items-center gap-4">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || (uploadScope === 'conversation' && !conversationId)}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {isUploading ? 'Uploading...' : 'Choose File'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".txt,.md,.json,.csv,.log,.yml,.yaml,.xml,.pdf,.docx,.py,.js,.ts,.tsx,.jsx,.html,.css,.sh,.sql,.png,.jpg,.jpeg,.svg,.gif,.webp"
              />
              <div className="text-sm text-muted-foreground">
                Supported: Text, JSON, CSV, PDF, Images, Code files
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filter Controls */}
        <div className="flex items-center gap-4">
          <Label>Show:</Label>
          <Select value={filter} onValueChange={(v: any) => setFilter(v)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Files ({uploadedFiles.length})</SelectItem>
              <SelectItem value="global">
                Global Only ({uploadedFiles.filter((f) => f.isGlobal).length})
              </SelectItem>
              <SelectItem value="conversation">
                Conversation Only ({uploadedFiles.filter((f) => !f.isGlobal).length})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Files Grid */}
        {filteredFiles.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No files uploaded</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload files to make them available to the agent
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredFiles.map((file) => {
              const Icon = getFileIcon(file.mimeType);
              return (
                <Card key={file.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base truncate">
                            {file.originalFilename}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            {formatFileSize(file.fileSizeBytes)} •{' '}
                            {formatUploadDate(file.uploadedAt)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={file.isGlobal ? 'default' : 'secondary'}>
                          {file.isGlobal ? (
                            <>
                              <Globe className="h-3 w-3 mr-1" />
                              Global
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3 mr-1" />
                              Conversation
                            </>
                          )}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(file.id)}
                          className="h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`enabled-${file.id}`} className="text-sm">
                        Enabled
                      </Label>
                      <Switch
                        id={`enabled-${file.id}`}
                        checked={file.enabled}
                        onCheckedChange={() => handleToggleEnabled(file.id, file.enabled)}
                      />
                    </div>

                    {/* Integration Method */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Integration Method</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p className="font-medium mb-1">How should the agent access this file?</p>
                            <ul className="text-xs space-y-1">
                              <li><strong>System Prompt:</strong> File content added to agent's instructions (read-only reference)</li>
                              <li><strong>Working Directory:</strong> File copied to workspace (agent can edit with tools)</li>
                              <li><strong>Both:</strong> Maximum availability (both system prompt and workspace)</li>
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                        {file.integrationMethod === 'working-directory' && (
                          <Badge variant="outline" className="text-xs border-amber-500/50 text-amber-600 dark:text-amber-400">
                            Default - Click to customize
                          </Badge>
                        )}
                      </div>
                      <Select
                        value={file.integrationMethod}
                        onValueChange={(v: any) => handleUpdateIntegrationMethod(file.id, v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system-prompt">System Prompt</SelectItem>
                          <SelectItem value="working-directory">Working Directory</SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {file.integrationMethod === 'system-prompt' &&
                          'File content injected into system prompt'}
                        {file.integrationMethod === 'working-directory' &&
                          'File copied to agent working directory'}
                        {file.integrationMethod === 'both' &&
                          'Both system prompt and working directory'}
                      </p>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor={`desc-${file.id}`} className="text-sm">
                        Description (optional)
                      </Label>
                      <Input
                        id={`desc-${file.id}`}
                        placeholder="Add notes about this file..."
                        defaultValue={file.description || ''}
                        onBlur={(e) => {
                          if (e.target.value !== file.description) {
                            handleUpdateDescription(file.id, e.target.value);
                          }
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
