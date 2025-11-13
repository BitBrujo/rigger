'use client';

import React, { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { X, Plus } from 'lucide-react';

interface KeyValueEditorProps {
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  disabled?: boolean;
  className?: string;
}

export function KeyValueEditor({
  values,
  onChange,
  keyPlaceholder = 'Key...',
  valuePlaceholder = 'Value...',
  disabled = false,
  className = '',
}: KeyValueEditorProps) {
  const [keyInput, setKeyInput] = useState('');
  const [valueInput, setValueInput] = useState('');

  const handleAdd = () => {
    if (keyInput.trim() && !values[keyInput.trim()]) {
      onChange({
        ...values,
        [keyInput.trim()]: valueInput.trim(),
      });
      setKeyInput('');
      setValueInput('');
    }
  };

  const handleRemove = (key: string) => {
    const newValues = { ...values };
    delete newValues[key];
    onChange(newValues);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const entries = Object.entries(values);

  return (
    <div className={className}>
      {/* List of current key-value pairs */}
      {entries.length > 0 && (
        <div className="space-y-2 mb-3">
          {entries.map(([key, value]) => (
            <div
              key={key}
              className="flex items-center gap-2 p-2 bg-secondary rounded-md group"
            >
              <div className="flex-1 grid grid-cols-2 gap-2 font-mono text-xs">
                <div className="font-semibold text-primary">{key}</div>
                <div className="text-muted-foreground truncate">{value}</div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(key)}
                disabled={disabled}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all disabled:opacity-50"
                aria-label="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input fields for adding new key-value pairs */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={keyPlaceholder}
          disabled={disabled}
          className="flex-1"
        />
        <Input
          type="text"
          value={valueInput}
          onChange={(e) => setValueInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={valuePlaceholder}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !keyInput.trim()}
          size="icon"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
