'use client';

import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Command } from 'cmdk';
import { 
  Search, 
  Code, 
  Terminal, 
  Globe, 
  FileText, 
  Image, 
  Music, 
  Video,
  Sparkles,
  Palette,
  Settings,
  X
} from 'lucide-react';
import { useLayoutStore } from '@/stores/layoutStore';
import { cn } from '@/lib/utils';

interface CommandItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'tools' | 'ai' | 'settings';
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTab } = useLayoutStore();

  // Toggle command palette with Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'browser',
      label: 'Open Browser',
      icon: <Globe className="w-4 h-4" />,
      shortcut: '⌘B',
      action: () => {
        addTab({ type: 'browser', title: 'Browser', path: 'https://www.google.com' });
        setOpen(false);
      },
      category: 'navigation'
    },
    {
      id: 'editor',
      label: 'New Code File',
      icon: <Code className="w-4 h-4" />,
      shortcut: '⌘N',
      action: () => {
        addTab({ type: 'editor', title: 'Untitled', path: '', content: '' });
        setOpen(false);
      },
      category: 'navigation'
    },
    {
      id: 'terminal',
      label: 'Open Terminal',
      icon: <Terminal className="w-4 h-4" />,
      shortcut: '⌘T',
      action: () => {
        const { toggleBottomPanel, isBottomPanelCollapsed } = useLayoutStore.getState();
        if (isBottomPanelCollapsed) {
          toggleBottomPanel();
        }
        setOpen(false);
      },
      category: 'navigation'
    },
    {
      id: 'explorer',
      label: 'File Explorer',
      icon: <FileText className="w-4 h-4" />,
      shortcut: '⌘E',
      action: () => {
        addTab({ type: 'explorer', title: 'Files', path: '~' });
        setOpen(false);
      },
      category: 'navigation'
    },
    // AI Tools
    {
      id: 'ai-image',
      label: 'Generate Image',
      icon: <Image className="w-4 h-4" />,
      action: () => {
        addTab({ type: 'ai-image', title: 'AI Image', path: '' });
        setOpen(false);
      },
      category: 'ai'
    },
    {
      id: 'ai-audio',
      label: 'Generate Audio',
      icon: <Music className="w-4 h-4" />,
      action: () => {
        addTab({ type: 'ai-audio', title: 'AI Audio', path: '' });
        setOpen(false);
      },
      category: 'ai'
    },
    {
      id: 'ai-video',
      label: 'Generate Video',
      icon: <Video className="w-4 h-4" />,
      action: () => {
        addTab({ type: 'ai-video', title: 'AI Video', path: '' });
        setOpen(false);
      },
      category: 'ai'
    },
    {
      id: 'ai-assistant',
      label: 'AI Assistant',
      icon: <Sparkles className="w-4 h-4" />,
      shortcut: '⌘/',
      action: () => {
        addTab({ type: 'ai-chat', title: 'AI Chat', path: '' });
        setOpen(false);
      },
      category: 'ai'
    },
    // Settings
    {
      id: 'theme',
      label: 'Change Theme',
      icon: <Palette className="w-4 h-4" />,
      action: () => {
        // TODO: Implement theme switcher
        setOpen(false);
      },
      category: 'settings'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4" />,
      shortcut: '⌘,',
      action: () => {
        addTab({ type: 'settings', title: 'Settings', path: '' });
        setOpen(false);
      },
      category: 'settings'
    }
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  const groupedCommands = {
    navigation: filteredCommands.filter(cmd => cmd.category === 'navigation'),
    ai: filteredCommands.filter(cmd => cmd.category === 'ai'),
    settings: filteredCommands.filter(cmd => cmd.category === 'settings')
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={() => setOpen(false)}
      />
      
      {/* Command Palette */}
      <div className="relative w-full max-w-2xl mx-4 bg-cyber-black border border-cyber-purple rounded-lg shadow-[0_0_40px_rgba(147,51,234,0.4)] overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-b from-cyber-purple/10 to-transparent pointer-events-none" />
        
        <Command className="relative">
          {/* Search Input */}
          <div className="flex items-center border-b border-cyber-purple/30 px-4">
            <Search className="w-5 h-5 text-cyber-purple mr-3" />
            <Command.Input
              ref={inputRef}
              value={search}
              onValueChange={setSearch}
              placeholder="Type a command or search..."
              className="flex-1 py-4 bg-transparent text-white placeholder:text-cyber-gray-400 focus:outline-none"
            />
            <button
              onClick={() => setOpen(false)}
              className="p-1 hover:bg-cyber-purple/20 rounded transition-colors"
            >
              <X className="w-4 h-4 text-cyber-gray-400" />
            </button>
          </div>
          
          {/* Command List */}
          <Command.List className="max-h-[60vh] overflow-y-auto p-2">
            {Object.entries(groupedCommands).map(([category, items]) => {
              if (items.length === 0) return null;
              
              return (
                <Command.Group 
                  key={category} 
                  heading={category.charAt(0).toUpperCase() + category.slice(1)}
                  className="text-xs text-cyber-gray-500 uppercase tracking-wider px-2 py-1 mt-2 first:mt-0"
                >
                  {items.map((cmd) => (
                    <Command.Item
                      key={cmd.id}
                      value={cmd.label}
                      onSelect={() => cmd.action()}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 my-1 rounded",
                        "text-cyber-gray-200 cursor-pointer transition-all duration-150",
                        "hover:bg-cyber-purple/20 hover:text-white",
                        "data-[selected=true]:bg-cyber-purple/30 data-[selected=true]:text-white",
                        "group relative overflow-hidden"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-cyber-purple group-hover:text-cyber-jade transition-colors">
                          {cmd.icon}
                        </div>
                        <span className="font-medium">{cmd.label}</span>
                      </div>
                      {cmd.shortcut && (
                        <span className="text-xs text-cyber-gray-500 font-mono">
                          {cmd.shortcut}
                        </span>
                      )}
                      
                      {/* Hover glow effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyber-purple/10 to-transparent opacity-0 group-hover:opacity-100 -translate-x-full group-hover:translate-x-full transition-all duration-700 pointer-events-none" />
                    </Command.Item>
                  ))}
                </Command.Group>
              );
            })}
            
            {filteredCommands.length === 0 && (
              <div className="text-center py-8 text-cyber-gray-500">
                No commands found
              </div>
            )}
          </Command.List>
          
          {/* Footer */}
          <div className="border-t border-cyber-purple/30 px-4 py-2 flex items-center justify-between text-xs text-cyber-gray-500">
            <div className="flex gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>esc Close</span>
            </div>
            <div className="text-cyber-purple">
              ⌘K to toggle
            </div>
          </div>
        </Command>
      </div>
    </div>,
    document.body
  );
}