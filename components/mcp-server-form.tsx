'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyValueEditor } from '@/components/ui/key-value-editor';
import { X, Plus } from 'lucide-react';
import type { McpServerConfig } from '@/lib/types';

interface McpServerFormProps {
  serverName?: string; // If editing, this is the current server name
  initialConfig?: McpServerConfig; // If editing, this is the current config
  existingServerNames: string[]; // For validation (prevent duplicates)
  onSave: (name: string, config: McpServerConfig) => void;
  onCancel: () => void;
}

export function McpServerForm({
  serverName,
  initialConfig,
  existingServerNames,
  onSave,
  onCancel,
}: McpServerFormProps) {
  const isEditing = !!serverName;

  // Form state
  const [name, setName] = useState(serverName || '');
  const [command, setCommand] = useState(initialConfig?.command || '');
  const [args, setArgs] = useState<string[]>(initialConfig?.args || []);
  const [env, setEnv] = useState<Record<string, string>>(initialConfig?.env || {});
  const [argInput, setArgInput] = useState('');

  // Validation errors
  const [nameError, setNameError] = useState('');
  const [commandError, setCommandError] = useState('');

  // Reset form when initialConfig changes
  useEffect(() => {
    setName(serverName || '');
    setCommand(initialConfig?.command || '');
    setArgs(initialConfig?.args || []);
    setEnv(initialConfig?.env || {});
    setArgInput('');
    setNameError('');
    setCommandError('');
  }, [serverName, initialConfig]);

  const handleAddArg = () => {
    if (argInput.trim()) {
      setArgs([...args, argInput.trim()]);
      setArgInput('');
    }
  };

  const handleRemoveArg = (index: number) => {
    setArgs(args.filter((_, i) => i !== index));
  };

  const handleArgKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddArg();
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate name
    if (!name.trim()) {
      setNameError('Server name is required');
      isValid = false;
    } else if (!isEditing && existingServerNames.includes(name.trim())) {
      setNameError('Server name already exists');
      isValid = false;
    } else {
      setNameError('');
    }

    // Validate command
    if (!command.trim()) {
      setCommandError('Command is required');
      isValid = false;
    } else {
      setCommandError('');
    }

    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const config: McpServerConfig = {
      command: command.trim(),
      ...(args.length > 0 && { args }),
      ...(Object.keys(env).length > 0 && { env }),
    };

    onSave(name.trim(), config);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Server Name */}
      <div className="space-y-2">
        <Label htmlFor="server-name">
          Server Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="server-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., github, playwright, filesystem"
          disabled={isEditing}
          className={nameError ? 'border-destructive' : ''}
        />
        {nameError && (
          <p className="text-sm text-destructive">{nameError}</p>
        )}
        {isEditing && (
          <p className="text-xs text-muted-foreground">
            Server name cannot be changed when editing
          </p>
        )}
      </div>

      {/* Command */}
      <div className="space-y-2">
        <Label htmlFor="command">
          Command <span className="text-destructive">*</span>
        </Label>
        <Input
          id="command"
          type="text"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="e.g., npx, node, python"
          className={commandError ? 'border-destructive' : ''}
        />
        {commandError && (
          <p className="text-sm text-destructive">{commandError}</p>
        )}
        <p className="text-xs text-muted-foreground">
          The executable command to run the MCP server
        </p>
      </div>

      {/* Args */}
      <div className="space-y-2">
        <Label>Arguments</Label>

        {/* Display current args */}
        {args.length > 0 && (
          <div className="space-y-2 mb-3">
            {args.map((arg, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-secondary rounded-md group"
              >
                <div className="flex-1 font-mono text-sm">{arg}</div>
                <button
                  type="button"
                  onClick={() => handleRemoveArg(index)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
                  aria-label="Remove argument"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new arg */}
        <div className="flex gap-2">
          <Input
            type="text"
            value={argInput}
            onChange={(e) => setArgInput(e.target.value)}
            onKeyDown={handleArgKeyDown}
            placeholder="Add argument..."
          />
          <Button
            type="button"
            onClick={handleAddArg}
            disabled={!argInput.trim()}
            size="icon"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Command-line arguments passed to the server (e.g., -y, @modelcontextprotocol/server-github)
        </p>
      </div>

      {/* Environment Variables */}
      <div className="space-y-2">
        <Label>Environment Variables</Label>
        <KeyValueEditor
          values={env}
          onChange={setEnv}
          keyPlaceholder="Variable name..."
          valuePlaceholder="Variable value..."
        />
        <p className="text-xs text-muted-foreground">
          Environment variables for the MCP server (e.g., API keys, tokens)
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditing ? 'Save Changes' : 'Add Server'}
        </Button>
      </div>
    </form>
  );
}
