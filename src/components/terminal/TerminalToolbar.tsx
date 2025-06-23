'use client';

import React from 'react';
import { 
  Terminal as TerminalIcon, 
  Settings, 
  Search, 
  Copy, 
  Trash2, 
  Plus,
  SplitSquareHorizontal,
  SplitSquareVertical,
  Maximize2,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ThemeSelector } from './ThemeSelector';
import { useTerminalStore } from '@/stores/terminalStore';

interface TerminalToolbarProps {
  session_id?: string;
  pane_id?: string;
  className?: string;
  show_splits?: boolean;
  show_theme_selector?: boolean;
  on_split_horizontal?: () => void;
  on_split_vertical?: () => void;
  on_close?: () => void;
  on_clear?: () => void;
  on_copy?: () => void;
  on_search?: () => void;
}

export const TerminalToolbar: React.FC<TerminalToolbarProps> = ({
  session_id,
  pane_id,
  className = '',
  show_splits = true,
  show_theme_selector = true,
  on_split_horizontal,
  on_split_vertical,
  on_close,
  on_clear,
  on_copy,
  on_search
}) => {
  const { 
    create_session, 
    split_pane, 
    close_pane,
    get_active_session 
  } = useTerminalStore();
  
  const active_session = get_active_session();
  const current_session_id = session_id || active_session?.id;
  const current_pane_id = pane_id || active_session?.active_pane_id;
  
  const handle_split_horizontal = () => {
    if (current_session_id && current_pane_id) {
      split_pane(current_session_id, current_pane_id, 'horizontal');
    }
    on_split_horizontal?.();
  };
  
  const handle_split_vertical = () => {
    if (current_session_id && current_pane_id) {
      split_pane(current_session_id, current_pane_id, 'vertical');
    }
    on_split_vertical?.();
  };
  
  const handle_close_pane = () => {
    if (current_session_id && current_pane_id) {
      close_pane(current_session_id, current_pane_id);
    }
    on_close?.();
  };
  
  const handle_new_session = () => {
    create_session();
  };

  return (
    <div className={`terminal-toolbar flex items-center gap-2 px-3 py-2 border-b border-border/50 bg-secondary/20 ${className}`}>
      {/* Left side - Terminal controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={handle_new_session}
          className="h-7 px-2"
          aria-label="New terminal session"
          title="New terminal session (Cmd/Ctrl+T)"
        >
          <Plus size={14} />
        </Button>
        
        {show_splits && current_session_id && current_pane_id && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={handle_split_horizontal}
              className="h-7 px-2"
              aria-label="Split horizontally"
              title="Split horizontally (Cmd/Ctrl+D)"
            >
              <SplitSquareHorizontal size={14} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handle_split_vertical}
              className="h-7 px-2"
              aria-label="Split vertically"
              title="Split vertically (Cmd/Ctrl+Shift+D)"
            >
              <SplitSquareVertical size={14} />
            </Button>
          </>
        )}
        
        <div className="w-px h-4 bg-border/50 mx-1" />
        
        {/* Terminal actions */}
        <Button
          variant="ghost"
          size="sm"
          onClick={on_copy}
          className="h-7 px-2"
          aria-label="Copy selection"
          title="Copy selection (Cmd/Ctrl+C)"
        >
          <Copy size={14} />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={on_clear}
          className="h-7 px-2"
          aria-label="Clear terminal"
          title="Clear terminal (Cmd/Ctrl+K)"
        >
          <Trash2 size={14} />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={on_search}
          className="h-7 px-2"
          aria-label="Search in terminal"
          title="Search in terminal (Cmd/Ctrl+F)"
        >
          <Search size={14} />
        </Button>
      </div>
      
      {/* Spacer */}
      <div className="flex-1" />
      
      {/* Right side - Settings and theme */}
      <div className="flex items-center gap-1">
        {show_theme_selector && (
          <ThemeSelector 
            pane_id={current_pane_id}
            size="sm"
            className="h-7"
          />
        )}
        
        <div className="w-px h-4 bg-border/50 mx-1" />
        
        {/* More options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2"
              aria-label="More terminal options"
            >
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Terminal Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem>
              <Settings size={14} className="mr-2" />
              Preferences
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              <Maximize2 size={14} className="mr-2" />
              Fullscreen
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {current_session_id && current_pane_id && (
              <DropdownMenuItem 
                onClick={handle_close_pane}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 size={14} className="mr-2" />
                Close Pane
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};