'use client';

import { NavigationTab } from '@/lib/navigation-config';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItemProps {
  tab: NavigationTab;
  isActive: boolean;
  isExpanded: boolean;
  onClick: () => void;
}

export function NavItem({ tab, isActive, isExpanded, onClick }: NavItemProps) {
  const Icon = tab.icon;

  const button = (
    <button
      role="tab"
      aria-selected={isActive}
      aria-controls={`${tab.id}-panel`}
      aria-label={tab.label}
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 transition-all duration-200',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        isActive && 'bg-accent text-accent-foreground font-medium border-r-2 border-primary'
      )}
    >
      <Icon
        className={cn(
          'flex-shrink-0 transition-transform duration-200',
          isActive ? 'scale-110' : 'scale-100',
          'hover:scale-110'
        )}
        size={20}
      />
      {isExpanded && (
        <span className="text-sm whitespace-nowrap">{tab.label}</span>
      )}
    </button>
  );

  // Show tooltip only when collapsed
  if (!isExpanded) {
    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent side="right" className="ml-2">
            <div className="flex flex-col gap-1">
              <p className="font-medium">{tab.label}</p>
              <p className="text-xs text-muted-foreground">{tab.description}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
}
