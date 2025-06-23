'use client';

import React, { useRef, useCallback, useState } from 'react';
import { 
  Split, 
  MoreHorizontal, 
  X, 
  Maximize2, 
  RotateCcw 
} from 'lucide-react';
import { 
  useTerminalStore, 
  type TerminalPane, 
  type TerminalSplit 
} from '@/stores/terminalStore';
import { Terminal } from './Terminal';
import { Button } from '@/components/ui/button';

interface SplitTerminalPaneProps {
  session_id: string;
  split: TerminalSplit;
  className?: string;
}

interface ResizeHandleProps {
  direction: 'horizontal' | 'vertical';
  onResize: (delta: number) => void;
}

function ResizeHandle({ direction, onResize }: ResizeHandleProps) {
  const [is_dragging, set_is_dragging] = useState(false);
  const drag_start_ref = useRef<{ x: number; y: number } | null>(null);

  const handle_mouse_down = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    set_is_dragging(true);
    drag_start_ref.current = { x: e.clientX, y: e.clientY };

    const handle_mouse_move = (e: MouseEvent) => {
      if (!drag_start_ref.current) return;

      const delta = direction === 'horizontal' 
        ? e.clientX - drag_start_ref.current.x
        : e.clientY - drag_start_ref.current.y;

      onResize(delta);
      drag_start_ref.current = { x: e.clientX, y: e.clientY };
    };

    const handle_mouse_up = () => {
      set_is_dragging(false);
      drag_start_ref.current = null;
      document.removeEventListener('mousemove', handle_mouse_move);
      document.removeEventListener('mouseup', handle_mouse_up);
    };

    document.addEventListener('mousemove', handle_mouse_move);
    document.addEventListener('mouseup', handle_mouse_up);
  }, [direction, onResize]);

  const cursor_class = direction === 'horizontal' ? 'cursor-col-resize' : 'cursor-row-resize';
  const size_class = direction === 'horizontal' ? 'w-1 h-full' : 'w-full h-1';

  return (
    <div
      className={`resize-handle ${cursor_class} ${size_class} ${
        is_dragging ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
      } transition-colors select-none`}
      onMouseDown={handle_mouse_down}
    />
  );
}

interface PaneHeaderProps {
  pane: TerminalPane;
  session_id: string;
  split_id: string;
  is_single_pane: boolean;
}

function PaneHeader({ pane, session_id, split_id, is_single_pane }: PaneHeaderProps) {
  const { 
    split_pane, 
    close_pane, 
    set_active_pane,
    get_profile 
  } = useTerminalStore();

  const profile = get_profile(pane.profile_id || '');

  const handle_split_horizontal = () => {
    split_pane(session_id, pane.id, 'horizontal');
  };

  const handle_split_vertical = () => {
    split_pane(session_id, pane.id, 'vertical');
  };

  const handle_close_pane = () => {
    if (!is_single_pane) {
      close_pane(session_id, pane.id);
    }
  };

  const handle_set_active = () => {
    set_active_pane(session_id, pane.id);
  };

  return (
    <div 
      className={`pane-header flex items-center justify-between px-2 py-1 text-xs border-b transition-colors ${
        pane.is_active 
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}
      onClick={handle_set_active}
    >
      <div className="pane-info flex items-center space-x-2">
        <div className="pane-indicator w-2 h-2 rounded-full bg-green-500" />
        <span className="pane-title text-gray-700 dark:text-gray-300">
          {profile?.name || 'Terminal'}
        </span>
      </div>
      
      <div className="pane-actions flex items-center space-x-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handle_split_horizontal}
          className="w-5 h-5 p-0"
          title="Split horizontally"
        >
          <Split size={10} className="rotate-90" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handle_split_vertical}
          className="w-5 h-5 p-0"
          title="Split vertically"
        >
          <Split size={10} />
        </Button>
        
        {!is_single_pane && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handle_close_pane}
            className="w-5 h-5 p-0 text-red-500 hover:text-red-600"
            title="Close pane"
          >
            <X size={10} />
          </Button>
        )}
      </div>
    </div>
  );
}

export function SplitTerminalPane({ session_id, split, className }: SplitTerminalPaneProps) {
  const { resize_pane } = useTerminalStore();
  const container_ref = useRef<HTMLDivElement>(null);

  const handle_resize = useCallback((pane_index: number, delta: number) => {
    if (!container_ref.current) return;

    const container_rect = container_ref.current.getBoundingClientRect();
    const container_size = split.direction === 'horizontal' 
      ? container_rect.width 
      : container_rect.height;

    if (container_size <= 0) return;

    const delta_ratio = delta / container_size;
    const current_pane = split.panes[pane_index];
    const next_pane = split.panes[pane_index + 1];

    if (!current_pane || !next_pane) return;

    // Calculate new ratios
    const new_current_ratio = Math.max(0.1, Math.min(0.9, current_pane.size_ratio + delta_ratio));
    const new_next_ratio = Math.max(0.1, Math.min(0.9, next_pane.size_ratio - delta_ratio));

    // Update pane sizes
    resize_pane(session_id, current_pane.id, new_current_ratio);
    resize_pane(session_id, next_pane.id, new_next_ratio);
  }, [session_id, split, resize_pane]);

  const flex_direction = split.direction === 'horizontal' ? 'flex-row' : 'flex-col';
  const is_single_pane = split.panes.length === 1;

  return (
    <div 
      ref={container_ref}
      className={`split-terminal-pane flex ${flex_direction} h-full ${className || ''}`}
    >
      {split.panes.map((pane, index) => {
        const pane_style = split.direction === 'horizontal' 
          ? { width: `${pane.size_ratio * 100}%` }
          : { height: `${pane.size_ratio * 100}%` };

        return (
          <React.Fragment key={pane.id}>
            {/* Pane */}
            <div 
              className={`terminal-pane flex flex-col ${
                pane.is_active ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
              }`}
              style={pane_style}
            >
              {/* Pane header */}
              <PaneHeader
                pane={pane}
                session_id={session_id}
                split_id={split.id}
                is_single_pane={is_single_pane}
              />
              
              {/* Terminal content */}
              <div className="terminal-content flex-1 relative">
                <Terminal
                  terminalId={pane.terminal_id}
                  className="absolute inset-0"
                />
              </div>
            </div>
            
            {/* Resize handle */}
            {index < split.panes.length - 1 && (
              <ResizeHandle
                direction={split.direction}
                onResize={(delta) => handle_resize(index, delta)}
              />
            )}
          </React.Fragment>
        );
      })}
      
      <style jsx>{`
        .split-terminal-pane {
          min-height: 0;
          min-width: 0;
        }
        
        .terminal-pane {
          min-height: 0;
          min-width: 0;
          overflow: hidden;
        }
        
        .pane-header {
          cursor: pointer;
          user-select: none;
        }
        
        .pane-header:hover {
          background-color: rgba(0, 0, 0, 0.05);
        }
        
        .dark .pane-header:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
        
        .pane-indicator {
          flex-shrink: 0;
        }
        
        .pane-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        
        .pane-actions {
          flex-shrink: 0;
        }
        
        .resize-handle {
          flex-shrink: 0;
          position: relative;
          z-index: 10;
        }
        
        .resize-handle:hover {
          background-color: rgba(59, 130, 246, 0.5) !important;
        }
        
        .terminal-content {
          background: #1e1e1e;
        }
      `}</style>
    </div>
  );
}