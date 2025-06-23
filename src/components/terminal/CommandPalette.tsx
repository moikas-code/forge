'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Terminal, Plus, Copy, Trash2, Settings, Wifi, History, Code2, Zap } from 'lucide-react';
import { useTerminalPersistenceStore } from '@/stores/terminalPersistenceStore';
import { useTerminalStore } from '@/stores/terminalStore';
import { Button } from '@/components/ui/button';
import { invoke } from '@tauri-apps/api/core';

interface CommandPaletteProps {
  is_open: boolean;
  on_close: () => void;
}

interface PaletteAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  keywords: string[];
  action: () => void | Promise<void>;
  shortcut?: string;
}

export function CommandPalette({ is_open, on_close }: CommandPaletteProps) {
  const [query, set_query] = useState('');
  const [selected_index, set_selected_index] = useState(0);
  const input_ref = useRef<HTMLInputElement>(null);
  const container_ref = useRef<HTMLDivElement>(null);
  
  const {
    snippets,
    ssh_connections,
    saved_sessions,
    set_palette_query,
    add_snippet,
    increment_snippet_usage,
    search_snippets,
  } = useTerminalPersistenceStore();
  
  const {
    sessions,
    active_session_id,
    create_session,
    remove_session,
    clear_all_sessions,
  } = useTerminalStore();

  // Focus input when palette opens
  useEffect(() => {
    if (is_open && input_ref.current) {
      input_ref.current.focus();
      input_ref.current.select();
    }
  }, [is_open]);

  // Build available actions
  const all_actions = useMemo((): PaletteAction[] => {
    const actions: PaletteAction[] = [];

    // Terminal management actions
    actions.push({
      id: 'new-terminal',
      title: 'New Terminal',
      description: 'Create a new terminal session',
      icon: <Terminal className="w-4 h-4" />,
      category: 'Terminal',
      keywords: ['new', 'terminal', 'create', 'session'],
      action: () => {
        create_session();
        on_close();
      },
      shortcut: 'Cmd+T',
    });

    if (sessions.length > 0) {
      actions.push({
        id: 'close-terminal',
        title: 'Close Current Terminal',
        description: 'Close the active terminal session',
        icon: <Trash2 className="w-4 h-4" />,
        category: 'Terminal',
        keywords: ['close', 'terminal', 'remove', 'session'],
        action: () => {
          if (active_session_id) {
            remove_session(active_session_id);
          }
          on_close();
        },
        shortcut: 'Cmd+W',
      });

      actions.push({
        id: 'close-all-terminals',
        title: 'Close All Terminals',
        description: 'Close all terminal sessions',
        icon: <Trash2 className="w-4 h-4" />,
        category: 'Terminal',
        keywords: ['close', 'all', 'terminals', 'clear', 'sessions'],
        action: () => {
          clear_all_sessions();
          on_close();
        },
        shortcut: 'Cmd+Shift+W',
      });
    }

    // Add snippet actions
    const filtered_snippets = query ? search_snippets(query) : snippets.slice(0, 10);
    filtered_snippets.forEach(snippet => {
      actions.push({
        id: `snippet-${snippet.id}`,
        title: snippet.name,
        description: `Run: ${snippet.command}`,
        icon: <Code2 className="w-4 h-4" />,
        category: 'Snippets',
        keywords: [snippet.name, snippet.command, ...snippet.tags],
        action: async () => {
          if (active_session_id) {
            try {
              // Process template variables in command
              let processed_command = snippet.command;
              const template_vars = processed_command.match(/\$\{([^}]+)\}/g);
              
              if (template_vars) {
                // For now, just remove template syntax - in future could prompt for values
                processed_command = processed_command.replace(/\$\{([^}]+)\}/g, '$1');
              }
              
              // Send command to active terminal
              const bytes = new TextEncoder().encode(processed_command + '\r');
              await invoke('write_to_terminal', {
                terminalId: active_session_id,
                data: Array.from(bytes)
              });
              
              increment_snippet_usage(snippet.id);
            } catch (error) {
              console.error('Failed to execute snippet:', error);
            }
          }
          on_close();
        },
      });
    });

    // SSH connection actions
    ssh_connections.forEach(connection => {
      actions.push({
        id: `ssh-${connection.id}`,
        title: `Connect to ${connection.name}`,
        description: `SSH to ${connection.username}@${connection.host}:${connection.port}`,
        icon: <Wifi className="w-4 h-4" />,
        category: 'SSH',
        keywords: ['ssh', 'connect', connection.name, connection.host, connection.username],
        action: async () => {
          // Create new terminal session with SSH connection
          const session_id = create_session({
            title: `SSH: ${connection.name}`,
          });
          
          try {
            // Wait a moment for terminal to initialize
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Build SSH command
            let ssh_command = `ssh ${connection.username}@${connection.host}`;
            if (connection.port !== 22) {
              ssh_command += ` -p ${connection.port}`;
            }
            if (connection.key_path) {
              ssh_command += ` -i ${connection.key_path}`;
            }
            
            // Add connection options
            Object.entries(connection.connection_options).forEach(([key, value]) => {
              ssh_command += ` -o ${key}=${value}`;
            });
            
            // Send SSH command to terminal
            const bytes = new TextEncoder().encode(ssh_command + '\r');
            await invoke('write_to_terminal', {
              terminalId: session_id,
              data: Array.from(bytes)
            });
            
            // Update connection last used
            useTerminalPersistenceStore.getState().update_ssh_connection(connection.id, {
              last_connected: new Date().toISOString(),
            });
          } catch (error) {
            console.error('Failed to start SSH connection:', error);
          }
          
          on_close();
        },
      });
    });

    // Saved session restoration actions
    saved_sessions.slice(0, 5).forEach(session => {
      actions.push({
        id: `restore-${session.id}`,
        title: `Restore: ${session.title}`,
        description: `Restore terminal session from ${new Date(session.last_active).toLocaleDateString()}`,
        icon: <History className="w-4 h-4" />,
        category: 'Sessions',
        keywords: ['restore', 'session', session.title, 'history'],
        action: async () => {
          try {
            const success = await useTerminalPersistenceStore.getState().restore_session(session.id);
            if (success) {
              console.log('Session restored successfully');
            } else {
              console.error('Failed to restore session');
            }
          } catch (error) {
            console.error('Error restoring session:', error);
          }
          on_close();
        },
      });
    });

    // Quick actions
    actions.push({
      id: 'copy-current-path',
      title: 'Copy Current Path',
      description: 'Copy the current working directory to clipboard',
      icon: <Copy className="w-4 h-4" />,
      category: 'Actions',
      keywords: ['copy', 'path', 'cwd', 'directory', 'clipboard'],
      action: async () => {
        if (active_session_id) {
          try {
            const cwd = await invoke<string>('get_terminal_cwd', {
              terminalId: active_session_id
            });
            
            await navigator.clipboard.writeText(cwd);
            console.log('Path copied to clipboard:', cwd);
          } catch (error) {
            console.error('Failed to copy path:', error);
          }
        }
        on_close();
      },
      shortcut: 'Cmd+Shift+C',
    });

    actions.push({
      id: 'create-snippet',
      title: 'Create New Snippet',
      description: 'Create a custom command snippet',
      icon: <Plus className="w-4 h-4" />,
      category: 'Snippets',
      keywords: ['create', 'snippet', 'command', 'custom'],
      action: () => {
        // This would open a modal to create a snippet
        // For now, create a basic example
        add_snippet({
          name: 'Custom Command',
          description: 'Enter your description',
          command: 'echo "Hello World"',
          category: 'Custom',
          tags: ['custom'],
          is_custom: true,
        });
        on_close();
      },
    });

    return actions;
  }, [query, snippets, ssh_connections, saved_sessions, sessions, active_session_id, create_session, remove_session, clear_all_sessions, search_snippets, increment_snippet_usage, add_snippet, on_close]);

  // Filter actions based on query
  const filtered_actions = useMemo(() => {
    if (!query.trim()) return all_actions;
    
    const lower_query = query.toLowerCase();
    return all_actions.filter(action => 
      action.title.toLowerCase().includes(lower_query) ||
      action.description.toLowerCase().includes(lower_query) ||
      action.keywords.some(keyword => keyword.toLowerCase().includes(lower_query))
    );
  }, [all_actions, query]);

  // Group actions by category
  const grouped_actions = useMemo(() => {
    const groups: Record<string, PaletteAction[]> = {};
    
    filtered_actions.forEach(action => {
      if (!groups[action.category]) {
        groups[action.category] = [];
      }
      groups[action.category].push(action);
    });
    
    return groups;
  }, [filtered_actions]);

  // Handle keyboard navigation
  useEffect(() => {
    const handle_keydown = (e: KeyboardEvent) => {
      if (!is_open) return;
      
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          on_close();
          break;
        case 'ArrowDown':
          e.preventDefault();
          set_selected_index(prev => Math.min(prev + 1, filtered_actions.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          set_selected_index(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filtered_actions[selected_index]) {
            filtered_actions[selected_index].action();
          }
          break;
      }
    };

    document.addEventListener('keydown', handle_keydown);
    return () => document.removeEventListener('keydown', handle_keydown);
  }, [is_open, filtered_actions, selected_index, on_close]);

  // Update selected index when filtered actions change
  useEffect(() => {
    set_selected_index(0);
  }, [filtered_actions]);

  // Handle query changes
  const handle_query_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const new_query = e.target.value;
    set_query(new_query);
    set_palette_query(new_query);
  };

  if (!is_open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[10vh]">
      <div 
        ref={container_ref}
        className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 mr-3" />
          <input
            ref={input_ref}
            type="text"
            placeholder="Type a command or search..."
            value={query}
            onChange={handle_query_change}
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 outline-none text-lg"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={on_close}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <span className="text-xs">ESC</span>
          </Button>
        </div>

        {/* Actions List */}
        <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
          {Object.keys(grouped_actions).length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
              <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No matching commands found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            Object.entries(grouped_actions).map(([category, actions], category_index) => (
              <div key={category} className={category_index > 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}>
                <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide bg-gray-50 dark:bg-gray-800">
                  {category}
                </div>
                {actions.map((action, action_index) => {
                  const global_index = filtered_actions.findIndex(a => a.id === action.id);
                  const is_selected = global_index === selected_index;
                  
                  return (
                    <button
                      key={action.id}
                      className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        is_selected ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                      }`}
                      onClick={() => action.action()}
                      onMouseEnter={() => set_selected_index(global_index)}
                    >
                      <div className="flex items-center">
                        <div className={`mr-3 ${is_selected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`}>
                          {action.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium ${is_selected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                            {action.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {action.description}
                          </div>
                        </div>
                        {action.shortcut && (
                          <div className="ml-3 text-xs text-gray-400 font-mono">
                            {action.shortcut}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}