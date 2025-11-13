'use client';

import React, { useState, useEffect } from 'react';
import { Textarea } from './textarea';
import { Alert, AlertDescription } from './alert';
import { AlertCircle, Check } from 'lucide-react';

interface JsonEditorProps {
  value: any;
  onChange: (value: any) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  rows?: number;
}

export function JsonEditor({
  value,
  onChange,
  placeholder = 'Enter JSON...',
  disabled = false,
  className = '',
  rows = 6,
}: JsonEditorProps) {
  const [textValue, setTextValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(true);

  // Initialize text value from prop
  useEffect(() => {
    try {
      setTextValue(JSON.stringify(value, null, 2));
      setError(null);
      setIsValid(true);
    } catch (err) {
      setError('Invalid JSON object');
      setIsValid(false);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTextValue(newText);

    // Try to parse JSON
    try {
      if (newText.trim() === '') {
        // Empty is valid (will be {} or [])
        onChange({});
        setError(null);
        setIsValid(true);
      } else {
        const parsed = JSON.parse(newText);
        onChange(parsed);
        setError(null);
        setIsValid(true);
      }
    } catch (err: any) {
      setError(err.message);
      setIsValid(false);
    }
  };

  return (
    <div className={className}>
      <div className="relative">
        <Textarea
          value={textValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          className={`font-mono text-xs ${!isValid ? 'border-destructive' : isValid && textValue.trim() ? 'border-green-500' : ''}`}
        />
        {isValid && textValue.trim() && (
          <div className="absolute top-2 right-2 text-green-500">
            <Check className="h-4 w-4" />
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs font-mono">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
