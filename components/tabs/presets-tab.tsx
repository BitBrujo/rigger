'use client';

import { useState } from 'react';
import { useAgentStore } from '@/lib/store';
import { toast } from 'sonner';
import { ApiClient } from '@/lib/api-client';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Bookmark, Plus, Trash2, Download, Check, RotateCcw, AlertCircle, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function ConfigurationTab() {
  const { config, setConfig, setActivePreset, clearActivePreset, activePresetId, activePresetName, loadedPresetConfig } = useAgentStore();
  const [presets, setPresets] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Check if current config differs from loaded preset
  const isConfigModified = loadedPresetConfig &&
    JSON.stringify(config) !== JSON.stringify(loadedPresetConfig);

  const handleRevertToPreset = () => {
    if (loadedPresetConfig) {
      setConfig(loadedPresetConfig);
      toast.success('Reverted to preset configuration', {
        description: activePresetName || 'Configuration restored',
      });
    }
  };

  // Import/Export handlers
  const handleExportConfig = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rigger-config-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Configuration exported', {
      description: 'Your configuration has been downloaded',
    });
  };

  const handleImportConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const importedConfig = JSON.parse(e.target.result);
            setConfig(importedConfig);
            toast.success('Configuration imported', {
              description: 'Your configuration has been updated',
            });
          } catch (error) {
            toast.error('Invalid configuration file', {
              description: 'Please ensure the file is a valid JSON configuration',
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const loadPresets = async () => {
    try {
      const data = await ApiClient.getPresets();
      setPresets(data);
    } catch (error: any) {
      toast.error('Failed to load presets', {
        description: error.message,
      });
    }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    try {
      setIsCreating(true);
      await ApiClient.createPreset(
        presetName,
        config,
        presetDescription
      );
      toast.success('Preset saved successfully');
      setPresetName('');
      setPresetDescription('');
      setIsDialogOpen(false);
      await loadPresets();
    } catch (error: any) {
      toast.error('Failed to save preset', {
        description: error.message,
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleLoadPreset = async (presetId: number) => {
    try {
      const preset = await ApiClient.getPreset(presetId);
      setConfig(preset.config);
      setActivePreset(String(presetId), preset.name, preset.config);
      toast.success(`Preset "${preset.name}" loaded`, {
        description: 'Configuration updated successfully',
      });
    } catch (error: any) {
      toast.error('Failed to load preset', {
        description: error.message,
      });
    }
  };

  const handleDeletePreset = async (presetId: number) => {
    if (!confirm('Are you sure you want to delete this preset?')) {
      return;
    }

    try {
      await ApiClient.deletePreset(presetId);
      toast.success('Preset deleted successfully');
      await loadPresets();
    } catch (error: any) {
      toast.error('Failed to delete preset', {
        description: error.message,
      });
    }
  };

  // Load presets on mount
  useState(() => {
    loadPresets();
  });

  return (
    <ScrollArea className="h-full">
      <div className="p-6 space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Configuration</h2>
          <p className="text-muted-foreground">
            Import/export configurations and manage presets
          </p>
        </div>

        {/* Import/Export Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Import / Export</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Export Configuration</h4>
                  <p className="text-sm text-muted-foreground">
                    Download current config as JSON
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4 flex-grow">
                Save your current agent configuration including model settings, tools, MCP servers,
                skills, subagents, and all other parameters to a JSON file.
              </p>
              <Button onClick={handleExportConfig} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                Export Configuration
              </Button>
            </Card>

            <Card className="p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Download className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium">Import Configuration</h4>
                  <p className="text-sm text-muted-foreground">
                    Load config from a JSON file
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4 flex-grow">
                Import a previously exported configuration file to restore all agent settings.
                This will replace your current configuration.
              </p>
              <Button onClick={handleImportConfig} variant="outline" className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Import Configuration
              </Button>
            </Card>
          </div>
        </div>

        <Separator />

        {/* Presets Section */}
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold">Presets</h3>
              <p className="text-sm text-muted-foreground">
                Save and load complete agent configurations
              </p>
              {activePresetName && (
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="font-medium text-primary">Currently using: {activePresetName}</span>
                    {isConfigModified && (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs rounded-full">
                        <AlertCircle className="h-3 w-3" />
                        Modified
                      </div>
                    )}
                  </div>
                  {isConfigModified && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRevertToPreset}
                      className="h-7 text-xs"
                    >
                      <RotateCcw className="h-3 w-3 mr-1" />
                      Remove Preset
                    </Button>
                  )}
                </div>
              )}
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Save Current Config
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Preset</DialogTitle>
                  <DialogDescription>
                    Save your current agent configuration as a reusable preset
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="preset-name">Preset Name</Label>
                    <Input
                      id="preset-name"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="e.g., Code Review Agent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preset-description">Description (optional)</Label>
                    <Textarea
                      id="preset-description"
                      value={presetDescription}
                      onChange={(e) => setPresetDescription(e.target.value)}
                      placeholder="Describe what this configuration is for..."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSavePreset}
                    disabled={isCreating}
                  >
                    {isCreating ? 'Saving...' : 'Save Preset'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {presets.length === 0 ? (
            <Card className="p-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4">
                <Bookmark className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h4 className="font-medium">No presets yet</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Save your first preset to quickly switch between configurations
                  </p>
                </div>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Preset
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {presets.map((preset) => {
                const isActive = activePresetId === String(preset.id);
                return (
                <Card key={preset.id} className={`p-4 hover:border-primary/50 transition-all ${isActive ? 'border-primary bg-primary/5' : ''}`}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{preset.name}</h4>
                          {isActive && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full">
                              <Check className="h-3 w-3" />
                              Active
                            </div>
                          )}
                        </div>
                        {preset.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {preset.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Model: {preset.config?.model || 'N/A'}</span>
                      <span>•</span>
                      <span>
                        {preset.config?.allowedTools?.length || 0} tools
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleLoadPreset(preset.id)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Load
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePreset(preset.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
              })}
            </div>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
