'use client';

import { useAgentStore } from '@/lib/store';
import { navigationTabs } from '@/lib/navigation-config';
import { NavItem } from './nav-item';
import { cn } from '@/lib/utils';

export function SidebarNav() {
  const activeTab = useAgentStore((state) => state.activeTab);
  const setActiveTab = useAgentStore((state) => state.setActiveTab);
  const sidebarHovered = useAgentStore((state) => state.sidebarHovered);
  const setSidebarHovered = useAgentStore((state) => state.setSidebarHovered);

  return (
    <nav
      role="navigation"
      aria-label="Main configuration navigation"
      className={cn(
        'fixed left-0 top-0 h-full bg-background border-r border-border z-50',
        'transition-all duration-300 ease-in-out',
        sidebarHovered ? 'w-60' : 'w-16',
        'shadow-lg'
      )}
      onMouseEnter={() => setSidebarHovered(true)}
      onMouseLeave={() => setSidebarHovered(false)}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Header */}
        <div className="h-16 flex items-center justify-center border-b border-border px-4">
          {sidebarHovered ? (
            <h1 className="text-xl font-bold text-foreground">Rigger</h1>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">R</span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <ul role="list" className="flex-1 overflow-y-auto py-4">
          {navigationTabs.map((tab) => (
            <li key={tab.id} role="listitem">
              <NavItem
                tab={tab}
                isActive={activeTab === tab.id}
                isExpanded={sidebarHovered}
                onClick={() => setActiveTab(tab.id)}
              />
            </li>
          ))}
        </ul>

        {/* Footer (optional version info) */}
        <div className="h-12 flex items-center justify-center border-t border-border px-4">
          {sidebarHovered && (
            <span className="text-xs text-muted-foreground">v1.0.0</span>
          )}
        </div>
      </div>
    </nav>
  );
}
