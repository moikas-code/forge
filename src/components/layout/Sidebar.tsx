'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useLayoutStore, AppMode } from '@/stores/layoutStore';
import { useTabAnnouncer } from '@/hooks/useAnnounce';
import { 
  FileCode2, 
  FolderTree, 
  Globe,
  Image,
  Video,
  Box,
  Code2,
  Sparkles,
  ChevronLeft,
  RotateCcw
} from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  type: 'editor' | 'browser' | 'explorer' | 'image' | 'video' | '3d';
  mode: AppMode | 'both';
}

const sidebarItems: SidebarItem[] = [
  { id: 'browser', label: 'Web Browser', icon: <Globe size={18} />, type: 'browser', mode: 'both' },
  { id: 'editor', label: 'Code Editor', icon: <FileCode2 size={18} />, type: 'editor', mode: 'developer' },
  { id: 'explorer', label: 'File Explorer', icon: <FolderTree size={18} />, type: 'explorer', mode: 'developer' },
  { id: 'image', label: 'Image Generator', icon: <Image size={18} />, type: 'image', mode: 'studio' },
  { id: 'video', label: 'Video Generator', icon: <Video size={18} />, type: 'video', mode: 'studio' },
  { id: '3d', label: '3D Modeling', icon: <Box size={18} />, type: '3d', mode: 'studio' },
];

export function Sidebar() {
  const { mode, setMode, addTab, isSidebarCollapsed, toggleSidebar, resetLayout } = useLayoutStore();
  const { announce_new_tab } = useTabAnnouncer();
  
  const filteredItems = sidebarItems.filter(
    item => item.mode === mode || item.mode === 'both'
  );
  
  const handle_item_click = (item: SidebarItem) => {
    addTab({
      title: item.label,
      type: item.type,
    });
    announce_new_tab(item.label);
  };

  const handle_item_keyboard = (e: React.KeyboardEvent, item: SidebarItem) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handle_item_click(item);
    }
  };
  
  if (isSidebarCollapsed) {
    return (
      <aside className="sidebar w-[50px] flex flex-col h-full relative"
             role="navigation"
             aria-label="Collapsed sidebar">
        <div className="p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="w-full h-8 hover:bg-secondary/50"
            aria-label="Expand sidebar"
            title="Expand sidebar (Cmd/Ctrl+B)"
          >
            <ChevronLeft size={16} className="rotate-180" aria-hidden="true" />
          </Button>
        </div>
      </aside>
    );
  }
  
  return (
    <aside className="sidebar w-[240px] flex flex-col h-full relative"
           role="navigation"
           aria-label="Main navigation">
      {/* Titlebar spacer for macOS traffic lights */}
      <div className="h-[var(--titlebar-height)] w-full" />
      
      {/* Mode Toggle */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-muted-foreground">Mode</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-6 w-6 hover:bg-secondary/50"
            aria-label="Collapse sidebar"
            title="Collapse sidebar (Cmd/Ctrl+B)"
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </Button>
        </div>
        
        <div className="flex gap-2 p-1 bg-secondary/50 rounded-md">
          <button
            onClick={() => setMode('developer')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
              mode === 'developer' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code2 size={14} />
            Dev
          </button>
          <button
            onClick={() => setMode('studio')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-all ${
              mode === 'studio' 
                ? 'bg-background text-foreground shadow-sm' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sparkles size={14} />
            Studio
          </button>
        </div>
      </div>
      
      <div className="h-px bg-border/50 mx-4" />
      
      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1">
        <h3 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          Tools
        </h3>
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handle_item_click(item)}
            onKeyDown={(e) => handle_item_keyboard(e, item)}
            tabIndex={0}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-secondary/50 transition-colors text-left"
            aria-label={`Open ${item.label}`}
            title={`Open ${item.label} in a new tab`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      
      {/* Footer */}
      <div className="p-4 border-t border-border/50 space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={resetLayout}
          className="w-full justify-start text-xs text-muted-foreground hover:text-foreground"
        >
          <RotateCcw size={12} className="mr-2" />
          Reset Layout
        </Button>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Forge MOI v0.1.0
          </p>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}