'use client';

import React, { useState, useEffect } from 'react';
import { useAgentStore } from '@/lib/store';
import { ApiClient } from '@/lib/api-client';
import { SkillMetadata } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

export function SkillsManager() {
  const { availableSkills, setAvailableSkills, addSkill, removeSkill, updateSkill, toggleSkillEnabled } = useAgentStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<SkillMetadata | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [viewingSkill, setViewingSkill] = useState<SkillMetadata | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    allowedTools: [] as string[],
  });

  // Load skills on mount
  useEffect(() => {
    loadSkills();
  }, []);

  const loadSkills = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const skills = await ApiClient.listSkills();
      setAvailableSkills(skills);
    } catch (err: any) {
      setError(err.message || 'Failed to load skills');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSkill = async () => {
    if (!formData.name || !formData.description) {
      setError('Name and description are required');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const newSkill = await ApiClient.createSkill(formData);
      addSkill(newSkill);
      setIsCreating(false);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to create skill');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSkill = async () => {
    if (!selectedSkill) return;

    setIsLoading(true);
    setError(null);
    try {
      const updated = await ApiClient.updateSkill(selectedSkill.name, {
        description: formData.description,
        content: formData.content,
        allowedTools: formData.allowedTools.length > 0 ? formData.allowedTools : undefined,
      });
      updateSkill(selectedSkill.name, updated);
      setIsEditing(false);
      setSelectedSkill(null);
      resetForm();
    } catch (err: any) {
      setError(err.message || 'Failed to update skill');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSkill = async (skillName: string) => {
    if (!confirm(`Are you sure you want to delete "${skillName}"?`)) return;

    setIsLoading(true);
    setError(null);
    try {
      await ApiClient.deleteSkill(skillName);
      removeSkill(skillName);
    } catch (err: any) {
      setError(err.message || 'Failed to delete skill');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = async (skill: SkillMetadata) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch full skill content
      const fullSkill = await ApiClient.getSkill(skill.name);
      setSelectedSkill(fullSkill);
      setFormData({
        name: fullSkill.name,
        description: fullSkill.description,
        content: fullSkill.content || '',
        allowedTools: fullSkill.allowedTools || [],
      });
      setIsEditing(true);
    } catch (err: any) {
      setError(err.message || 'Failed to load skill');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewClick = async (skill: SkillMetadata) => {
    setIsLoading(true);
    setError(null);
    try {
      const fullSkill = await ApiClient.getSkill(skill.name);
      setViewingSkill(fullSkill);
    } catch (err: any) {
      setError(err.message || 'Failed to load skill');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = (skillName: string) => {
    // Toggle in local state only (enabled is frontend-only state, not persisted)
    toggleSkillEnabled(skillName);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      content: '',
      allowedTools: [],
    });
  };

  const handleCreateNew = () => {
    resetForm();
    setIsCreating(true);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={loadSkills}
          disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-1" />
                New Skill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Skill</DialogTitle>
                <DialogDescription>
                  Create a new skill in .claude/skills/. Name must be kebab-case.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Name (kebab-case)</label>
                  <Input
                    placeholder="my-custom-skill"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Use lowercase letters, numbers, and hyphens only
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="When to invoke this skill (used by Claude for matching)"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Be specific - this determines when Claude invokes the skill
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Content (Markdown)</label>
                  <Textarea
                    placeholder="# My Skill&#10;&#10;## When to Use&#10;- ...&#10;&#10;## Workflow&#10;1. ..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={12}
                    disabled={isLoading}
                    className="font-mono text-sm"
                  />
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateSkill} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Skill
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
      </div>

      {/* Error Display */}
      {error && !isCreating && !isEditing && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Skills List */}
      {isLoading && availableSkills.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : availableSkills.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Skills Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first skill or add SKILL.md files to .claude/skills/
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Skill
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-rounded">
          {availableSkills.map((skill: SkillMetadata) => (
            <Card
              key={skill.name}
              className={`hover:border-primary/50 transition-all ${
                skill.enabled === false ? 'opacity-60' : ''
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {skill.name}
                      {skill.name.startsWith('example-') && (
                        <Badge variant="secondary">Example</Badge>
                      )}
                      {skill.enabled === false && (
                        <Badge variant="outline" className="text-xs">Disabled</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">{skill.description}</CardDescription>
                  </div>
                  <div className="flex flex-col items-end gap-2 min-w-fit">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={skill.enabled ?? true}
                        onCheckedChange={() => handleToggleEnabled(skill.name)}
                        aria-label={`Toggle ${skill.name}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {skill.enabled ?? true ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewClick(skill)}
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditClick(skill)}
                        title="Edit Skill"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSkill(skill.name)}
                        title="Delete Skill"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              {skill.allowedTools && skill.allowedTools.length > 0 && (
                <CardContent>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Allowed Tools:</span>
                    <div className="flex flex-wrap gap-1">
                      {skill.allowedTools.map((tool) => (
                        <Badge key={tool} variant="outline" className="text-xs">
                          {tool}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Skill: {selectedSkill?.name}</DialogTitle>
            <DialogDescription>
              Update the skill description and content. Changes are saved to SKILL.md.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Description</label>
              <Input
                placeholder="When to invoke this skill"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Content (Markdown)</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={16}
                disabled={isLoading}
                className="font-mono text-sm"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleUpdateSkill} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!viewingSkill} onOpenChange={(open) => !open && setViewingSkill(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewingSkill?.name}
              {viewingSkill?.name.startsWith('example-') && (
                <Badge variant="secondary">Example</Badge>
              )}
            </DialogTitle>
            <DialogDescription>{viewingSkill?.description}</DialogDescription>
          </DialogHeader>
          <Separator />
          <ScrollArea className="max-h-[500px]">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md overflow-x-auto">
                {viewingSkill?.content}
              </pre>
            </div>
          </ScrollArea>
          {viewingSkill?.allowedTools && viewingSkill.allowedTools.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="text-sm font-medium mb-2">Allowed Tools</h4>
                <div className="flex flex-wrap gap-2">
                  {viewingSkill.allowedTools.map((tool) => (
                    <Badge key={tool} variant="outline">
                      {tool}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Skills Count Badge */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {availableSkills.length > 0 && (
          <>
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>{availableSkills.length} skill{availableSkills.length !== 1 ? 's' : ''} available</span>
          </>
        )}
      </div>
    </div>
  );
}
