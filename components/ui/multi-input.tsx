'use client';

import React, { useState } from 'react';
import { Input } from './input';
import { Button } from './button';
import { X, Plus } from 'lucide-react';

interface MultiInputProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function MultiInput({
  values,
  onChange,
  placeholder = 'Enter value...',
  disabled = false,
  className = '',
}: MultiInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim() && !values.includes(inputValue.trim())) {
      onChange([...values, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className={className}>
      {/* List of current values */}
      {values.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {values.map((value, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-secondary rounded-md"
            >
              <span className="font-mono text-xs">{value}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                disabled={disabled}
                className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                aria-label="Remove"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input field for adding new values */}
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !inputValue.trim()}
          size="icon"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
