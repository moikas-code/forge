'use client';

import React, { useRef, useEffect } from 'react';
import { useLayoutStore } from '@/stores/layoutStore';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTabAnnouncer } from '@/hooks/useAnnounce';
import { cn } from '@/lib/utils';

export function TabManager() {
  const { tabs, activeTabId, setActiveTab, removeTab } = useLayoutStore();
  const tab_list_ref = useRef<HTMLDivElement>(null);
  const { announce_tab_change, announce_tab_closed } = useTabAnnouncer();
  
  if (tabs.length === 0) {
    return (
      <div className="h-[40px] flex items-center px-4 bg-cyber-black border-b border-cyber-purple/30"
           role="tablist"
           aria-label="No tabs open">
        <p className="text-sm text-cyber-gray-500">No tabs open</p>
      </div>
    );
  }
  // Handle keyboard navigation within tabs
  const handle_tab_keyboard = (e: React.KeyboardEvent, tab_id: string) => {
    const current_index = tabs.findIndex(t => t.id === tab_id);
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        const prev_index = current_index > 0 ? current_index - 1 : tabs.length - 1;
        setActiveTab(tabs[prev_index].id);
        announce_tab_change(tabs[prev_index].title, prev_index + 1, tabs.length);
        break;
      case 'ArrowRight':
        e.preventDefault();
        const next_index = current_index < tabs.length - 1 ? current_index + 1 : 0;
        setActiveTab(tabs[next_index].id);
        announce_tab_change(tabs[next_index].title, next_index + 1, tabs.length);
        break;
      case 'Home':
        e.preventDefault();
        setActiveTab(tabs[0].id);
        announce_tab_change(tabs[0].title, 1, tabs.length);
        break;
      case 'End':
        e.preventDefault();
        const last_tab = tabs[tabs.length - 1];
        setActiveTab(last_tab.id);
        announce_tab_change(last_tab.title, tabs.length, tabs.length);
        break;
      case 'Delete':
      case 'Backspace':
        e.preventDefault();
        handle_tab_close(e, tab_id);
        break;
    }
  };

  const handle_tab_close = (e: React.MouseEvent | React.KeyboardEvent, tab_id: string) => {
    e.stopPropagation();
    const tab = tabs.find(t => t.id === tab_id);
    if (tab) {
      announce_tab_closed(tab.title);
      removeTab(tab_id);
    }
  };

  const handle_tab_click = (tab_id: string) => {
    const tab = tabs.find(t => t.id === tab_id);
    const tab_index = tabs.findIndex(t => t.id === tab_id);
    if (tab) {
      setActiveTab(tab_id);
      announce_tab_change(tab.title, tab_index + 1, tabs.length);
    }
  };
  
  return (
    <div className="h-[40px] flex items-center bg-cyber-black border-b border-cyber-purple/30 overflow-x-auto scrollbar-auto"
         role="tablist"
         aria-label="Open tabs"
         ref={tab_list_ref}>
      <div className="flex items-center">
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            role="tab"
            tabIndex={tab.id === activeTabId ? 0 : -1}
            aria-selected={tab.id === activeTabId}
            aria-controls={`tabpanel-${tab.id}`}
            aria-describedby={`tabdesc-${tab.id}`}
            className={cn(
              "group flex items-center gap-2 px-4 py-2 border-r border-cyber-purple/20",
              "cursor-pointer transition-all duration-200 relative",
              "focus:outline-none focus:ring-2 focus:ring-cyber-purple focus:ring-offset-2",
              tab.id === activeTabId
                ? "bg-cyber-purple/20 text-cyber-purple border-b-2 border-b-cyber-purple shadow-[inset_0_-2px_0_0_rgba(147,51,234,0.6)]"
                : "text-cyber-gray-400 hover:text-cyber-purple hover:bg-cyber-purple/10"
            )}
            onClick={() => handle_tab_click(tab.id)}
            onKeyDown={(e) => handle_tab_keyboard(e, tab.id)}
          >
            {/* Active tab glow */}
            {tab.id === activeTabId && (
              <div className="absolute inset-0 bg-gradient-to-b from-cyber-purple/10 to-transparent pointer-events-none" />
            )}
            
            <span className={cn(
              "text-sm whitespace-nowrap font-medium relative z-10",
              tab.id === activeTabId && "text-white"
            )} id={`tabdesc-${tab.id}`}>
              {tab.title}
            </span>
            
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-4 w-4 transition-all duration-200 relative z-10",
                "hover:bg-cyber-purple/30 hover:text-cyber-purple",
                tab.id === activeTabId
                  ? "opacity-60 hover:opacity-100"
                  : "opacity-0 group-hover:opacity-60 hover:!opacity-100"
              )}
              onClick={(e) => handle_tab_close(e, tab.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handle_tab_close(e, tab.id);
                }
              }}
              aria-label={`Close ${tab.title} tab`}
              title={`Close ${tab.title} tab`}
            >
              <X size={12} />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}