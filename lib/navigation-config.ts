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
  type LucideIcon,
} from 'lucide-react';

export interface NavigationTab {
  id: string;
  label: string;
  icon: LucideIcon;
  description: string;
}

export const navigationTabs: NavigationTab[] = [
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
    label: 'Agents',
    icon: Users,
    description: 'Custom agent definitions and subagents',
  },
  {
    id: 'hooks',
    label: 'Hooks',
    icon: Zap,
    description: 'Event-driven automation and webhooks',
  },
  {
    id: 'presets',
    label: 'Presets',
    icon: Bookmark,
    description: 'Save and load agent configurations',
  },
  {
    id: 'sessions',
    label: 'Sessions',
    icon: Activity,
    description: 'Session management and controls',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: SlidersHorizontal,
    description: 'Advanced SDK settings and model parameters',
  },
];
