import {
  Settings,
  Wrench,
  Blocks,
  Lightbulb,
  Users,
  Zap,
  Bookmark,
  Activity,
  SlidersHorizontal,
  FileText,
  type LucideIcon,
} from 'lucide-react';

export interface NavigationTab {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
  dividerAfter?: boolean;
}

export const navigationTabs: NavigationTab[] = [
  {
    id: 'sessions',
    label: 'Sessions',
    icon: Activity,
    description: 'Session management and controls',
  },
  {
    id: 'configuration',
    label: 'Configuration',
    icon: Bookmark,
    description: 'Import/export configurations and manage presets',
    dividerAfter: true,
  },
  {
    id: 'basic-config',
    label: 'Basic Config',
    icon: Settings,
    description: 'Model selection, permission mode, and agent SDK configuration',
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: Wrench,
    description: '19 built-in Agent SDK tools',
  },
  {
    id: 'mcp-servers',
    label: 'MCP Servers',
    icon: Blocks,
    description: 'Model Context Protocol server configuration',
  },
  {
    id: 'skills',
    label: 'Skills',
    icon: Lightbulb,
    description: 'Packaged agent workflows and skills management',
  },
  {
    id: 'agents',
    label: 'Subagents',
    icon: Users,
    description: 'Define specialized subagents with custom prompts and tools',
  },
  {
    id: 'hooks',
    label: 'Hooks',
    icon: Zap,
    description: 'Event-driven automation and webhooks',
    dividerAfter: true,
  },
  {
    id: 'files',
    label: 'Files',
    icon: FileText,
    description: 'Upload and manage files for agent context',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: SlidersHorizontal,
    description: 'Advanced SDK settings and model parameters',
  },
];
