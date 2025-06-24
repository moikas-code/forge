'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useLayoutStore } from '@/stores/layoutStore';
import { useTabAnnouncer } from '@/hooks/useAnnounce';
import { 
  Globe,
  Terminal,
  FileCode2, 
  FolderTree, 
  Image,
  AudioWaveform,
  Video,
  Box,
  Gamepad2,
  Brain,
  Settings,
  Command
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  type: string;
  description: string;
}

const sidebarItems: SidebarItem[] = [
  { 
    id: 'browser', 
    label: 'Browser', 
    icon: Globe, 
    type: 'browser',
    description: 'Browse the web with AI assistance'
  },
  { 
    id: 'terminal', 
    label: 'Terminal', 
    icon: Terminal, 
    type: 'terminal',
    description: 'AI-powered command line'
  },
  { 
    id: 'editor', 
    label: 'Code Editor', 
    icon: FileCode2, 
    type: 'editor',
    description: 'Write code with AI pair programming'
  },
  { 
    id: 'explorer', 
    label: 'Files', 
    icon: FolderTree, 
    type: 'explorer',
    description: 'Smart file management'
  },
  { 
    id: 'image', 
    label: 'Image Studio', 
    icon: Image, 
    type: 'image',
    description: 'AI image generation & editing'
  },
  { 
    id: 'audio', 
    label: 'Audio Studio', 
    icon: AudioWaveform, 
    type: 'audio',
    description: 'AI audio creation & editing'
  },
  { 
    id: 'video', 
    label: 'Video Studio', 
    icon: Video, 
    type: 'video',
    description: 'AI video generation & editing'
  },
  { 
    id: '3d', 
    label: '3D Studio', 
    icon: Box, 
    type: '3d',
    description: 'Text-to-3D modeling'
  },
  { 
    id: 'game', 
    label: 'Game Builder', 
    icon: Gamepad2, 
    type: 'game',
    description: 'Create games with AI'
  },
  { 
    id: 'ai', 
    label: 'AI Hub', 
    icon: Brain, 
    type: 'ai',
    description: 'Unified AI generation interface'
  },
];

export function MinimalSidebar() {
  const { addTab, activeTabId, tabs } = useLayoutStore();
  const { announce_new_tab } = useTabAnnouncer();
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null);
  
  const handle_item_click = (item: SidebarItem, event: React.MouseEvent) => {
    const activeTab = tabs.find(tab => tab.id === activeTabId);
    const isShiftClick = event.shiftKey;
    
    // If shift-clicked, always create a new tab
    if (isShiftClick) {
      addTab({
        title: item.type === 'browser' ? 'New Tab' : item.label,
        type: item.type as any,
        ...(item.type === 'browser' && { path: 'https://moikas.com' })
      });
      announce_new_tab(item.label);
      return;
    }
    
    // If the active tab is already this type, do nothing
    if (activeTab && activeTab.type === item.type) {
      return;
    }
    
    // Otherwise, check if tab already exists
    const existingTab = tabs.find(tab => tab.type === item.type);
    if (existingTab) {
      // Switch to existing tab
      useLayoutStore.getState().setActiveTab(existingTab.id);
    } else {
      // Create new tab
      addTab({
        title: item.type === 'browser' ? 'New Tab' : item.label,
        type: item.type as any,
        ...(item.type === 'browser' && { path: 'https://moikas.com' })
      });
      announce_new_tab(item.label);
    }
  };

  const handle_command_palette = () => {
    // Trigger command palette with Cmd+K event
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      ctrlKey: true,
      bubbles: true
    });
    document.dispatchEvent(event);
  };

  const handle_settings = () => {
    addTab({
      title: 'Settings',
      type: 'settings' as any,
    });
  };

  return (
    <TooltipProvider>
      <aside className="sidebar min-w-[50px] w-[50px] flex flex-col h-full relative bg-cyber-black border-r border-cyber-purple/50 z-10">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyber-purple/5 to-transparent pointer-events-none" />
        
        {/* Titlebar spacer */}
        <div className="h-[var(--titlebar-height)] w-full" />
        
        {/* Main tools */}
        <nav className="flex-1 py-2 space-y-1 px-1">
          {sidebarItems.map((item) => {
            const isActive = tabs.find(tab => tab.type === item.type && tab.id === activeTabId);
            return (
              <Tooltip key={item.id} delayDuration={300}>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => handle_item_click(item, e)}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      "w-full h-10 flex items-center justify-center rounded-md",
                      "transition-all duration-300 relative group glitch",
                      isActive 
                        ? "bg-cyber-purple text-white shadow-[0_0_20px_rgba(147,51,234,0.6)]" 
                        : "text-cyber-gray-400 hover:text-cyber-purple hover:bg-cyber-purple/10"
                    )}
                    aria-label={item.label}
                  >
                    {/* Active indicator with pulse */}
                    {isActive && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-cyber-jade rounded-r-full pulse-jade" />
                    )}
                    
                    {/* Icon with gradient on active */}
                    <div className={cn(
                      "transition-all duration-200",
                      isActive && "gradient-text"
                    )}>
                      <item.icon className={cn(
                        "w-5 h-5",
                        !isActive && "text-cyber-gray-400",
                        "group-hover:text-cyber-purple group-hover:scale-110"
                      )} />
                    </div>
                    
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-purple/10 to-transparent animate-[shimmer_2s_infinite]" />
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent 
                  side="right" 
                  className="bg-cyber-black border border-cyber-purple text-cyber-gray-200 shadow-[0_0_20px_rgba(147,51,234,0.4)] z-[100]"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-cyber-purple gradient-text-animate">{item.label}</p>
                    <p className="text-xs text-cyber-gray-400">{item.description}</p>
                    <p className="text-xs text-cyber-gray-500 mt-1">Shift+Click for new tab</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
        
        {/* Bottom actions */}
        <div className="p-1 space-y-1 border-t border-cyber-purple/20">
          {/* Command Palette */}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handle_command_palette}
                className="w-full h-10 text-cyber-jade hover:text-cyber-jade-light hover:bg-cyber-jade/10 hover:shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              >
                <Command size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-cyber-black border-cyber-purple/50 z-[100]">
              <p>Command Palette</p>
              <p className="text-xs text-cyber-gray-400">Cmd+K</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Settings */}
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handle_settings}
                className="w-full h-10 text-cyber-gray-400 hover:text-cyber-purple hover:bg-cyber-purple/10"
              >
                <Settings size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-cyber-black border-cyber-purple/50 z-[100]">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
          
          {/* Theme Toggle */}
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        </div>
        
        {/* Scan line effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <div className="scan-lines" />
        </div>
      </aside>
    </TooltipProvider>
  );
}