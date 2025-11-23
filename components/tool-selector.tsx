'use client';

import React, { useState } from 'react';
import { TOOL_CATEGORIES, ALL_SDK_TOOLS, TOOL_DESCRIPTIONS } from '@/lib/types';
import { Checkbox } from './ui/checkbox';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { FileText, Terminal, Globe, ListTodo, Plug, Lightbulb } from 'lucide-react';

interface ToolSelectorProps {
  selectedTools: string[];
  onChange: (tools: string[]) => void;
  disabled?: boolean;
}

const CATEGORY_ICONS: Record<string, any> = {
  'File Operations': FileText,
  'Execution': Terminal,
  'Web': Globe,
  'Task Management': ListTodo,
  'MCP Integration': Plug,
  'Planning & Interaction': Lightbulb,
};

export function ToolSelector({ selectedTools, onChange, disabled = false }: ToolSelectorProps) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    Object.keys(TOOL_CATEGORIES)
  );

  const handleToggleTool = (tool: string) => {
    if (selectedTools.includes(tool)) {
      onChange(selectedTools.filter((t) => t !== tool));
    } else {
      onChange([...selectedTools, tool]);
    }
  };

  const handleSelectAll = () => {
    onChange([...ALL_SDK_TOOLS]);
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  const handleToggleCategory = (category: string) => {
    const categoryTools = TOOL_CATEGORIES[category as keyof typeof TOOL_CATEGORIES] as readonly string[];
    const allSelected = categoryTools.every((tool) => selectedTools.includes(tool));

    if (allSelected) {
      // Deselect all tools in this category
      onChange(selectedTools.filter((t) => !categoryTools.includes(t)));
    } else {
      // Select all tools in this category
      const newTools = [...selectedTools];
      categoryTools.forEach((tool) => {
        if (!newTools.includes(tool)) {
          newTools.push(tool);
        }
      });
      onChange(newTools);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header with selection controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Tools</span>
          <Badge variant="secondary">
            {selectedTools.length} / {ALL_SDK_TOOLS.length}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSelectAll}
            disabled={disabled}
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDeselectAll}
            disabled={disabled}
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Grouped tool categories */}
      <Accordion type="multiple" value={expandedCategories} onValueChange={setExpandedCategories}>
        {Object.entries(TOOL_CATEGORIES).map(([category, tools]) => {
          const Icon = CATEGORY_ICONS[category] || FileText;
          const allSelected = tools.every((tool) => selectedTools.includes(tool));
          const someSelected = tools.some((tool) => selectedTools.includes(tool));

          return (
            <AccordionItem key={category} value={category}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{category}</span>
                  <Badge variant={allSelected ? 'default' : someSelected ? 'secondary' : 'outline'} className="ml-auto mr-2">
                    {tools.filter((t) => selectedTools.includes(t)).length} / {tools.length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {/* Category select all */}
                  <div className="flex items-center gap-2 pb-2 border-b">
                    <Checkbox
                      id={`category-${category}`}
                      checked={allSelected}
                      onCheckedChange={() => handleToggleCategory(category)}
                      disabled={disabled}
                    />
                    <label
                      htmlFor={`category-${category}`}
                      className="text-sm font-medium cursor-pointer"
                    >
                      {allSelected ? 'Deselect All' : 'Select All'}
                    </label>
                  </div>

                  {/* Individual tools */}
                  {tools.map((tool) => (
                    <div key={tool} className="flex items-center gap-2 pl-6">
                      <Checkbox
                        id={`tool-${tool}`}
                        checked={selectedTools.includes(tool)}
                        onCheckedChange={() => handleToggleTool(tool)}
                        disabled={disabled}
                      />
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <label
                              htmlFor={`tool-${tool}`}
                              className="text-sm font-mono cursor-pointer flex-1"
                            >
                              {tool}
                            </label>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{TOOL_DESCRIPTIONS[tool] || 'No description available'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
