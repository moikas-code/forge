import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ShellType = 'bash' | 'zsh' | 'fish' | 'powershell' | 'cmd';
export type TerminalStatus = 'idle' | 'running' | 'error' | 'exited';

export interface TerminalProfile {
  id: string;
  name: string;
  shell: ShellType;
  font_size: number;
  font_family: string;
  theme: string;
  is_default: boolean;
  env_variables: Record<string, string>;
}

export interface TerminalPane {
  id: string;
  status: TerminalStatus;
  process_info?: {
    pid?: number;
    command?: string;
    cpu_usage?: number;
    memory_usage?: number;
    start_time?: Date;
  } | null;
}

export interface TerminalSession {
  id: string;
  title: string;
  created_at: Date;
  is_active: boolean;
  current_directory: string;
  command_history: string[];
  output_buffer: string[];
  performance_metrics?: {
    startup_time: number;
    command_count: number;
    output_bytes: number;
  };
}

interface TerminalState {
  sessions: TerminalSession[];
  active_session_id: string | null;
  max_sessions: number;
  
  // Actions
  create_session: (title?: string) => string;
  remove_session: (id: string) => void;
  set_active_session: (id: string) => void;
  update_session: (id: string, updates: Partial<TerminalSession>) => void;
  add_to_history: (session_id: string, command: string) => void;
  add_output: (session_id: string, output: string) => void;
  clear_session: (session_id: string) => void;
  get_session: (id: string) => TerminalSession | undefined;
  get_active_session: () => TerminalSession | undefined;
  cleanup_sessions: () => void;
  save_current_session: () => Promise<void>;
  clear_all_sessions: () => void;
  navigate_history: (direction: 'up' | 'down') => string | null;
  reset_history_index: () => void;
  get_profile: (id: string) => TerminalProfile | undefined;
}

const DEFAULT_MAX_SESSIONS = 10;
const DEFAULT_HISTORY_SIZE = 1000;
const DEFAULT_OUTPUT_BUFFER_SIZE = 5000;

export const useTerminalStore = create<TerminalState>()(
  persist(
    (set, get) => ({
      sessions: [],
      active_session_id: null,
      max_sessions: DEFAULT_MAX_SESSIONS,
      
      create_session: (title?: string) => {
        const id = crypto.randomUUID();
        const session: TerminalSession = {
          id,
          title: title || `Terminal ${get().sessions.length + 1}`,
          created_at: new Date(),
          is_active: true,
          current_directory: '~',
          command_history: [],
          output_buffer: [],
          performance_metrics: {
            startup_time: performance.now(),
            command_count: 0,
            output_bytes: 0,
          },
        };
        
        set((state) => {
          // Deactivate other sessions
          const updated_sessions = state.sessions.map(s => ({ ...s, is_active: false }));
          
          // Add new session
          const new_sessions = [...updated_sessions, session];
          
          // Enforce max sessions limit
          if (new_sessions.length > state.max_sessions) {
            // Remove oldest inactive session
            const sessions_to_keep = new_sessions
              .sort((a, b) => {
                if (a.is_active && !b.is_active) return -1;
                if (!a.is_active && b.is_active) return 1;
                return b.created_at.getTime() - a.created_at.getTime();
              })
              .slice(0, state.max_sessions);
            
            return {
              sessions: sessions_to_keep,
              active_session_id: id,
            };
          }
          
          return {
            sessions: new_sessions,
            active_session_id: id,
          };
        });
        
        return id;
      },
      
      remove_session: (id: string) => {
        set((state) => {
          const filtered_sessions = state.sessions.filter(s => s.id !== id);
          
          // If we removed the active session, activate another one
          let new_active_id = state.active_session_id;
          if (state.active_session_id === id) {
            if (filtered_sessions.length > 0) {
              new_active_id = filtered_sessions[filtered_sessions.length - 1].id;
              filtered_sessions[filtered_sessions.length - 1].is_active = true;
            } else {
              new_active_id = null;
            }
          }
          
          return {
            sessions: filtered_sessions,
            active_session_id: new_active_id,
          };
        });
      },
      
      set_active_session: (id: string) => {
        set((state) => ({
          sessions: state.sessions.map(s => ({
            ...s,
            is_active: s.id === id,
          })),
          active_session_id: id,
        }));
      },
      
      update_session: (id: string, updates: Partial<TerminalSession>) => {
        set((state) => ({
          sessions: state.sessions.map(s =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },
      
      add_to_history: (session_id: string, command: string) => {
        set((state) => ({
          sessions: state.sessions.map(s => {
            if (s.id === session_id) {
              const new_history = [...s.command_history, command];
              
              // Limit history size
              if (new_history.length > DEFAULT_HISTORY_SIZE) {
                new_history.splice(0, new_history.length - DEFAULT_HISTORY_SIZE);
              }
              
              return {
                ...s,
                command_history: new_history,
                performance_metrics: s.performance_metrics ? {
                  ...s.performance_metrics,
                  command_count: s.performance_metrics.command_count + 1,
                } : undefined,
              };
            }
            return s;
          }),
        }));
      },
      
      add_output: (session_id: string, output: string) => {
        set((state) => ({
          sessions: state.sessions.map(s => {
            if (s.id === session_id) {
              const new_buffer = [...s.output_buffer, output];
              
              // Limit output buffer size
              if (new_buffer.length > DEFAULT_OUTPUT_BUFFER_SIZE) {
                new_buffer.splice(0, new_buffer.length - DEFAULT_OUTPUT_BUFFER_SIZE);
              }
              
              return {
                ...s,
                output_buffer: new_buffer,
                performance_metrics: s.performance_metrics ? {
                  ...s.performance_metrics,
                  output_bytes: s.performance_metrics.output_bytes + output.length,
                } : undefined,
              };
            }
            return s;
          }),
        }));
      },
      
      clear_session: (session_id: string) => {
        set((state) => ({
          sessions: state.sessions.map(s =>
            s.id === session_id ? { ...s, output_buffer: [] } : s
          ),
        }));
      },
      
      get_session: (id: string) => {
        return get().sessions.find(s => s.id === id);
      },
      
      get_active_session: () => {
        const state = get();
        return state.sessions.find(s => s.id === state.active_session_id);
      },
      
      cleanup_sessions: () => {
        set((state) => {
          const now = Date.now();
          const hour_ago = now - (60 * 60 * 1000); // 1 hour
          
          // Keep active session and recent sessions
          const sessions_to_keep = state.sessions.filter(s => {
            return s.is_active || s.created_at.getTime() > hour_ago;
          });
          
          return {
            sessions: sessions_to_keep,
            active_session_id: sessions_to_keep.find(s => s.is_active)?.id || null,
          };
        });
      },
      
      save_current_session: async () => {
        const state = get();
        const active_session = state.get_active_session();
        
        if (active_session) {
          // Import the persistence store here to avoid circular dependencies
          const { useTerminalPersistenceStore } = await import('./terminalPersistenceStore');
          const persistence_store = useTerminalPersistenceStore.getState();
          
          if (persistence_store.auto_save_enabled) {
            await persistence_store.save_session_state(active_session.id);
          }
        }
      },
      
      clear_all_sessions: () => {
        set({
          sessions: [],
          active_session_id: null,
        });
      },
      
      navigate_history: (direction: 'up' | 'down') => {
        const state = get();
        const active_session = state.get_active_session();
        if (!active_session || active_session.command_history.length === 0) {
          return null;
        }
        
        // This is a simplified implementation - in a real app you'd track history index
        const history = active_session.command_history;
        return direction === 'up' ? history[history.length - 1] : history[0];
      },
      
      reset_history_index: () => {
        // Reset history navigation index - simplified implementation
      },
      
      get_profile: (id: string) => {
        // Return a default profile - in a real app this would come from a profiles store
        return {
          id: id || 'default',
          name: 'Default',
          shell: 'bash' as ShellType,
          font_size: 14,
          font_family: 'monospace',
          theme: 'default',
          is_default: true,
          env_variables: {},
        };
      },
    }),
    {
      name: 'forge-moi-terminal-store',
      partialize: (state) => ({
        // Only persist essential data, not the entire output buffer
        sessions: state.sessions.map(s => ({
          ...s,
          output_buffer: [], // Don't persist output buffer
          command_history: s.command_history.slice(-100), // Keep only last 100 commands
        })),
        active_session_id: state.active_session_id,
        max_sessions: state.max_sessions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Restore runtime properties
          state.sessions = state.sessions.map(s => ({
            ...s,
            output_buffer: [],
            created_at: new Date(s.created_at), // Convert back to Date object
          }));
        }
      },
    }
  )
);