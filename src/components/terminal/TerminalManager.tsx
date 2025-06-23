import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { useTerminalStore } from '@/stores/terminalStore';
import { Terminal } from './Terminal';
import { TerminalToolbar } from './TerminalToolbar';
import { TabStatusIndicator } from './TerminalStatusIndicator';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import './TerminalManager.css';

interface TerminalManagerProps {
  className?: string;
}

export function TerminalManager({ className }: TerminalManagerProps) {
  const { 
    sessions, 
    active_session_id, 
    create_session, 
    remove_session, 
    set_active_session 
  } = useTerminalStore();
  
  const terminal_container_ref = useRef<HTMLDivElement>(null);
  const active_terminal_actions_ref = useRef<{
    onClear: () => void;
    onCopy: () => void;
    onPaste: () => void;
    onNewTab?: () => void;
  } | null>(null);
  
  const handle_new_terminal = useCallback(() => {
    create_session();
  }, [create_session]);

  // Keyboard navigation support
  useEffect(() => {
    const handle_keyboard_navigation = (e: KeyboardEvent) => {
      // Only handle keyboard events when terminal manager is focused
      if (!document.activeElement?.closest('.terminal-manager')) return;
      
      const is_cmd_or_ctrl = e.metaKey || e.ctrlKey;
      
      if (is_cmd_or_ctrl) {
        switch (e.key) {
          case 't':
            e.preventDefault();
            handle_new_terminal();
            break;
          case 'w':
            if (sessions.length > 1 && active_session_id) {
              e.preventDefault();
              remove_session(active_session_id);
            }
            break;
          case ']':
            e.preventDefault();
            // Navigate to next tab
            const current_index = sessions.findIndex(s => s.id === active_session_id);
            const next_index = (current_index + 1) % sessions.length;
            if (sessions[next_index]) {
              set_active_session(sessions[next_index].id);
            }
            break;
          case '[':
            e.preventDefault();
            // Navigate to previous tab
            const current_prev_index = sessions.findIndex(s => s.id === active_session_id);
            const prev_index = current_prev_index === 0 ? sessions.length - 1 : current_prev_index - 1;
            if (sessions[prev_index]) {
              set_active_session(sessions[prev_index].id);
            }
            break;
        }
      }
      
      // Number keys for direct tab navigation (1-9)
      if (e.altKey && !isNaN(parseInt(e.key)) && parseInt(e.key) >= 1 && parseInt(e.key) <= 9) {
        e.preventDefault();
        const tab_index = parseInt(e.key) - 1;
        if (sessions[tab_index]) {
          set_active_session(sessions[tab_index].id);
        }
      }
    };
    
    document.addEventListener('keydown', handle_keyboard_navigation);
    return () => document.removeEventListener('keydown', handle_keyboard_navigation);
  }, [sessions, active_session_id, remove_session, set_active_session, handle_new_terminal]);
  
  // Create initial terminal if none exist
  useEffect(() => {
    if (sessions.length === 0) {
      create_session();
    }
  }, [sessions.length, create_session]);
  
  // Stable terminal toolbar actions with proper callback memoization
  const handle_clear = useCallback(() => {
    if (active_terminal_actions_ref.current?.onClear) {
      active_terminal_actions_ref.current.onClear();
    }
  }, []);
  
  const handle_copy = useCallback(() => {
    if (active_terminal_actions_ref.current?.onCopy) {
      active_terminal_actions_ref.current.onCopy();
    }
  }, []);
  
  const handle_paste = useCallback(() => {
    if (active_terminal_actions_ref.current?.onPaste) {
      active_terminal_actions_ref.current.onPaste();
    }
  }, []);
  
  const handle_new_tab = useCallback(() => {
    handle_new_terminal();
  }, [handle_new_terminal]);
  
  const handle_close_terminal = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    remove_session(id);
  };
  
  // Create stable actions objects to prevent terminal re-initialization
  const stable_actions = useMemo(() => {
    const actions_map = new Map();
    
    sessions.forEach(session => {
      const is_active = session.id === active_session_id;
      
      if (is_active) {
        // Create stable actions object for active terminal only
        const terminal_actions = {
          onClear: () => {}, // Will be assigned by Terminal component
          onCopy: () => {},  // Will be assigned by Terminal component
          onPaste: () => {}, // Will be assigned by Terminal component
          onNewTab: handle_new_terminal
        };
        
        actions_map.set(session.id, terminal_actions);
        // Store reference for toolbar actions
        active_terminal_actions_ref.current = terminal_actions;
      }
    });
    
    return actions_map;
  }, [active_session_id, handle_new_terminal]); // Remove sessions dependency
  
  // Memoize terminal instances with stable actions
  const terminal_instances = useMemo(() => {
    return sessions.map(session => {
      const is_active = session.id === active_session_id;
      const terminal_actions = stable_actions.get(session.id);
      
      return {
        id: session.id,
        element: (
          <div
            key={session.id}
            className={`terminal-instance ${is_active ? 'active' : 'hidden'}`}
          >
            <Terminal 
              terminalId={session.id}
              className="h-full"
              actions={terminal_actions}
              pane_id={session.id}
              theme_id={undefined}
            />
          </div>
        )
      };
    });
  }, [sessions, active_session_id, stable_actions]);
  
  return (
    <TooltipProvider>
      <div 
        className={`terminal-manager ${className || ''}`}
        role="region"
        aria-label="Terminal Manager"
        tabIndex={0}
      >
      {/* Tab bar with macOS terminal style */}
      <div className="terminal-tabs-container" role="tablist" aria-label="Terminal tabs">
        <div className="terminal-tabs">
          {sessions.map((session) => {
            // Use session status directly since there are no splits/panes
            const active_pane = {
              status: 'idle' as const,
              process_info: null
            };
            
            // Create tooltip content with process information
            const get_tooltip_content = () => {
              const parts = [
                `Session: ${session.title}`,
                `Created: ${session.created_at.toLocaleString()}`,
              ];
              
              if (active_pane) {
                parts.push(`Status: ${active_pane.status}`);
                
                // Simplified - process_info functionality disabled for now
              }
              
              return parts.join('\n');
            };
            
            return (
              <Tooltip key={session.id}>
                <TooltipTrigger asChild>
                  <div
                    id={`terminal-tab-${session.id}`}
                    className={`terminal-tab ${session.id === active_session_id ? 'active' : ''}`}
                    onClick={() => set_active_session(session.id)}
                    role="tab"
                    aria-selected={session.id === active_session_id}
                    aria-controls={`terminal-panel-${session.id}`}
                    tabIndex={session.id === active_session_id ? 0 : -1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        set_active_session(session.id);
                      }
                    }}
                  >
                    <span className="terminal-tab-title">{session.title}</span>
                    {active_pane && (
                      <TabStatusIndicator 
                        status={active_pane.status}
                        process_info={active_pane.process_info}
                      />
                    )}
                    {sessions.length > 1 && (
                      <button
                        className="terminal-tab-close"
                        onClick={(e) => handle_close_terminal(session.id, e)}
                        aria-label="Close terminal"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="whitespace-pre-line text-xs">
                  {get_tooltip_content()}
                </TooltipContent>
              </Tooltip>
            );
          })}
          
          <Button
            variant="ghost"
            size="icon"
            className="terminal-new-tab"
            onClick={handle_new_terminal}
            aria-label="New terminal"
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>
      
      {/* Terminal toolbar */}
      <TerminalToolbar
        session_id={active_session_id || ''}
        pane_id={active_session_id || ''}
        on_clear={handle_clear}
        on_copy={handle_copy}
        on_search={() => {}} // TODO: Implement search
      />
      
        {/* Terminal content area */}
        <div 
          ref={terminal_container_ref} 
          className="terminal-content"
          role="tabpanel"
          id={`terminal-panel-${active_session_id}`}
          aria-labelledby={`terminal-tab-${active_session_id}`}
        >
          {terminal_instances.map(({ element }) => element)}
        </div>
      </div>
    </TooltipProvider>
  );
}