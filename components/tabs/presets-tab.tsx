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
import { Bookmark, Plus, Trash2, Download, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function PresetsTab() {
  const { config, setConfig } = useAgentStore();
  const [presets, setPresets] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      await ApiClient.createPreset({
        name: presetName,
        description: presetDescription,
        config: config,
      });
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
      toast.success('Preset loaded successfully', {
        description: preset.name,
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
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Presets Management</h2>
            <p className="text-muted-foreground">
              Save and load complete agent configurations
            </p>
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
                <h3 className="font-medium">No presets yet</h3>
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
            {presets.map((preset) => (
              <Card key={preset.id} className="p-4 hover:border-primary/50 transition-all">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-medium">{preset.name}</h3>
                    {preset.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {preset.description}
                      </p>
                    )}
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
            ))}
          </div>
        )}

        <Card className="p-4 bg-muted/50">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Export/Import</Label>
            <p className="text-xs text-muted-foreground">
              Export your current configuration as JSON or import a saved configuration file
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'rigger-config.json';
                  a.click();
                  toast.success('Configuration exported');
                }}
              >
                <Upload className="h-3 w-3 mr-2" />
                Export Config
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'application/json';
                  input.onchange = (e: any) => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e: any) => {
                        try {
                          const config = JSON.parse(e.target.result);
                          setConfig(config);
                          toast.success('Configuration imported');
                        } catch (error) {
                          toast.error('Invalid configuration file');
                        }
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}
              >
                <Download className="h-3 w-3 mr-2" />
                Import Config
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </ScrollArea>
  );
}
