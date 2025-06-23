import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getStorage } from '@/lib/zustand-electron-storage';
import { getElectronAPI } from '@/services/electron';

// Types for terminal session persistence
export interface TerminalSessionState {
  id: string;
  title: string;
  cwd: string;
  shell: string;
  environment_variables: Record<string, string>;
  command_history: string[];
  scroll_position: number;
  created_at: string;
  last_active: string;
  is_running: boolean;
  exit_code?: number;
}

export interface CommandSnippet {
  id: string;
  name: string;
  description: string;
  command: string;
  category: string;
  tags: string[];
  is_custom: boolean;
  created_at: string;
  usage_count: number;
}

export interface SSHConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  key_path?: string;
  password_stored?: boolean;
  last_connected?: string;
  is_favorite: boolean;
  connection_options: Record<string, string>;
}

interface TerminalPersistenceState {
  // Session persistence
  saved_sessions: TerminalSessionState[];
  auto_save_enabled: boolean;
  restore_on_startup: boolean;
  max_saved_sessions: number;
  
  // Command snippets
  snippets: CommandSnippet[];
  snippet_categories: string[];
  
  // SSH connections
  ssh_connections: SSHConnection[];
  default_ssh_key_path: string;
  
  // Command palette state
  is_command_palette_open: boolean;
  last_palette_query: string;
  
  // Actions for session persistence
  save_session_state: (session_id: string) => Promise<void>;
  restore_session: (session_id: string) => Promise<boolean>;
  delete_saved_session: (session_id: string) => void;
  clear_all_saved_sessions: () => void;
  update_session_state: (session_id: string, updates: Partial<TerminalSessionState>) => void;
  
  // Actions for snippets
  add_snippet: (snippet: Omit<CommandSnippet, 'id' | 'created_at' | 'usage_count'>) => void;
  update_snippet: (id: string, updates: Partial<CommandSnippet>) => void;
  delete_snippet: (id: string) => void;
  increment_snippet_usage: (id: string) => void;
  get_snippets_by_category: (category: string) => CommandSnippet[];
  search_snippets: (query: string) => CommandSnippet[];
  
  // Actions for SSH connections
  add_ssh_connection: (connection: Omit<SSHConnection, 'id'>) => void;
  update_ssh_connection: (id: string, updates: Partial<SSHConnection>) => void;
  delete_ssh_connection: (id: string) => void;
  get_favorite_connections: () => SSHConnection[];
  test_ssh_connection: (id: string) => Promise<boolean>;
  
  // Command palette actions
  toggle_command_palette: () => void;
  set_palette_query: (query: string) => void;
  close_command_palette: () => void;
  
  // Settings
  set_auto_save: (enabled: boolean) => void;
  set_restore_on_startup: (enabled: boolean) => void;
  set_max_saved_sessions: (max: number) => void;
  set_default_ssh_key_path: (path: string) => void;
}

// Default command snippets
const default_snippets: CommandSnippet[] = [
  {
    id: 'git-status',
    name: 'Git Status',
    description: 'Check git repository status',
    command: 'git status',
    category: 'Git',
    tags: ['git', 'status', 'vcs'],
    is_custom: false,
    created_at: new Date().toISOString(),
    usage_count: 0,
  },
  {
    id: 'git-commit',
    name: 'Git Commit',
    description: 'Commit changes with message',
    command: 'git commit -m "${message}"',
    category: 'Git',
    tags: ['git', 'commit', 'vcs'],
    is_custom: false,
    created_at: new Date().toISOString(),
    usage_count: 0,
  },
  {
    id: 'npm-install',
    name: 'NPM Install',
    description: 'Install npm dependencies',
    command: 'npm install',
    category: 'Node.js',
    tags: ['npm', 'install', 'dependencies'],
    is_custom: false,
    created_at: new Date().toISOString(),
    usage_count: 0,
  },
  {
    id: 'bun-install',
    name: 'Bun Install',
    description: 'Install dependencies with Bun',
    command: 'bun install',
    category: 'Node.js',
    tags: ['bun', 'install', 'dependencies'],
    is_custom: false,
    created_at: new Date().toISOString(),
    usage_count: 0,
  },
  {
    id: 'docker-ps',
    name: 'Docker List Containers',
    description: 'List running Docker containers',
    command: 'docker ps',
    category: 'Docker',
    tags: ['docker', 'containers', 'list'],
    is_custom: false,
    created_at: new Date().toISOString(),
    usage_count: 0,
  },
  {
    id: 'docker-logs',
    name: 'Docker Logs',
    description: 'View container logs',
    command: 'docker logs ${container_name}',
    category: 'Docker',
    tags: ['docker', 'logs', 'debug'],
    is_custom: false,
    created_at: new Date().toISOString(),
    usage_count: 0,
  },
  {
    id: 'find-files',
    name: 'Find Files',
    description: 'Find files by name pattern',
    command: 'find . -name "${pattern}" -type f',
    category: 'System',
    tags: ['find', 'search', 'files'],
    is_custom: false,
    created_at: new Date().toISOString(),
    usage_count: 0,
  },
  {
    id: 'disk-usage',
    name: 'Disk Usage',
    description: 'Show disk usage in human readable format',
    command: 'du -sh *',
    category: 'System',
    tags: ['disk', 'usage', 'space'],
    is_custom: false,
    created_at: new Date().toISOString(),
    usage_count: 0,
  },
  {
    id: 'process-tree',
    name: 'Process Tree',
    description: 'Show process tree',
    command: 'ps aux | grep ${process_name}',
    category: 'System',
    tags: ['process', 'monitoring', 'system'],
    is_custom: false,
    created_at: new Date().toISOString(),
    usage_count: 0,
  },
  {
    id: 'network-ports',
    name: 'Network Ports',
    description: 'Show listening network ports',
    command: 'netstat -tlnp',
    category: 'Network',
    tags: ['network', 'ports', 'monitoring'],
    is_custom: false,
    created_at: new Date().toISOString(),
    usage_count: 0,
  },
];

export const useTerminalPersistenceStore = create<TerminalPersistenceState>()(
  persist(
    (set, get) => ({
      // Initial state
      saved_sessions: [],
      auto_save_enabled: true,
      restore_on_startup: false,
      max_saved_sessions: 10,
      
      snippets: default_snippets,
      snippet_categories: ['Git', 'Node.js', 'Docker', 'System', 'Network', 'Custom'],
      
      ssh_connections: [],
      default_ssh_key_path: '~/.ssh/id_rsa',
      
      is_command_palette_open: false,
      last_palette_query: '',
      
      // Session persistence actions
      save_session_state: async (session_id: string) => {
        try {
          const api = getElectronAPI();
          if (!api) {
            console.error('Electron API not available');
            return;
          }
          
          // Get session info from backend
          const session_info = await api.terminal.getSessionInfo(session_id);
          
          // Get command history from backend  
          const history = await api.terminal.getHistory(session_id);
          
          const session_state: TerminalSessionState = {
            id: session_id,
            title: `Terminal ${session_id.slice(0, 8)}`,
            cwd: session_info.cwd,
            shell: session_info.shell,
            environment_variables: session_info.environment,
            command_history: history,
            scroll_position: 0,
            created_at: new Date().toISOString(),
            last_active: new Date().toISOString(),
            is_running: session_info.isRunning,
            exit_code: undefined, // Electron API doesn't provide exit_code in session info
          };
          
          set((state) => {
            const existing_index = state.saved_sessions.findIndex(s => s.id === session_id);
            let updated_sessions = [...state.saved_sessions];
            
            if (existing_index >= 0) {
              updated_sessions[existing_index] = session_state;
            } else {
              updated_sessions.push(session_state);
              
              // Respect max_saved_sessions limit
              if (updated_sessions.length > state.max_saved_sessions) {
                updated_sessions = updated_sessions
                  .sort((a, b) => new Date(b.last_active).getTime() - new Date(a.last_active).getTime())
                  .slice(0, state.max_saved_sessions);
              }
            }
            
            return { saved_sessions: updated_sessions };
          });
        } catch (error) {
          console.error('Failed to save session state:', error);
        }
      },
      
      restore_session: async (session_id: string) => {
        const session = get().saved_sessions.find(s => s.id === session_id);
        if (!session) return false;
        
        try {
          const api = getElectronAPI();
          if (!api) {
            console.error('Electron API not available');
            return false;
          }
          
          // Create new terminal with saved state
          await api.terminal.create({
            shell: session.shell,
            cwd: session.cwd,
            env: session.environment_variables,
            // Note: Electron API doesn't support restoring command history directly
          });
          
          return true;
        } catch (error) {
          console.error('Failed to restore session:', error);
          return false;
        }
      },
      
      delete_saved_session: (session_id: string) => set((state) => ({
        saved_sessions: state.saved_sessions.filter(s => s.id !== session_id),
      })),
      
      clear_all_saved_sessions: () => set({ saved_sessions: [] }),
      
      update_session_state: (session_id: string, updates: Partial<TerminalSessionState>) => set((state) => ({
        saved_sessions: state.saved_sessions.map(s => 
          s.id === session_id ? { ...s, ...updates, last_active: new Date().toISOString() } : s
        ),
      })),
      
      // Snippet actions
      add_snippet: (snippet) => set((state) => ({
        snippets: [...state.snippets, {
          ...snippet,
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          usage_count: 0,
        }],
      })),
      
      update_snippet: (id, updates) => set((state) => ({
        snippets: state.snippets.map(s => s.id === id ? { ...s, ...updates } : s),
      })),
      
      delete_snippet: (id) => set((state) => ({
        snippets: state.snippets.filter(s => s.id !== id),
      })),
      
      increment_snippet_usage: (id) => set((state) => ({
        snippets: state.snippets.map(s => 
          s.id === id ? { ...s, usage_count: s.usage_count + 1 } : s
        ),
      })),
      
      get_snippets_by_category: (category) => {
        return get().snippets.filter(s => s.category === category);
      },
      
      search_snippets: (query) => {
        const lower_query = query.toLowerCase();
        return get().snippets.filter(s => 
          s.name.toLowerCase().includes(lower_query) ||
          s.description.toLowerCase().includes(lower_query) ||
          s.command.toLowerCase().includes(lower_query) ||
          s.tags.some(tag => tag.toLowerCase().includes(lower_query))
        );
      },
      
      // SSH connection actions
      add_ssh_connection: (connection) => set((state) => ({
        ssh_connections: [...state.ssh_connections, {
          ...connection,
          id: crypto.randomUUID(),
        }],
      })),
      
      update_ssh_connection: (id, updates) => set((state) => ({
        ssh_connections: state.ssh_connections.map(c => c.id === id ? { ...c, ...updates } : c),
      })),
      
      delete_ssh_connection: (id) => set((state) => ({
        ssh_connections: state.ssh_connections.filter(c => c.id !== id),
      })),
      
      get_favorite_connections: () => {
        return get().ssh_connections.filter(c => c.is_favorite);
      },
      
      test_ssh_connection: async (id) => {
        const connection = get().ssh_connections.find(c => c.id === id);
        if (!connection) return false;
        
        try {
          const api = getElectronAPI();
          if (!api) {
            console.error('Electron API not available');
            return false;
          }
          
          const result = await api.terminal.testSSH({
            host: connection.host,
            port: connection.port,
            username: connection.username,
            keyPath: connection.key_path,
          });
          
          return result;
        } catch (error) {
          console.error('SSH connection test failed:', error);
          return false;
        }
      },
      
      // Command palette actions
      toggle_command_palette: () => set((state) => ({
        is_command_palette_open: !state.is_command_palette_open,
      })),
      
      set_palette_query: (query) => set({ last_palette_query: query }),
      
      close_command_palette: () => set({ 
        is_command_palette_open: false,
        last_palette_query: '',
      }),
      
      // Settings actions
      set_auto_save: (enabled) => set({ auto_save_enabled: enabled }),
      set_restore_on_startup: (enabled) => set({ restore_on_startup: enabled }),
      set_max_saved_sessions: (max) => set({ max_saved_sessions: max }),
      set_default_ssh_key_path: (path) => set({ default_ssh_key_path: path }),
    }),
    {
      name: 'forge-moi-terminal-persistence',
      storage: getStorage(),
      partialize: (state) => ({
        saved_sessions: state.saved_sessions,
        auto_save_enabled: state.auto_save_enabled,
        restore_on_startup: state.restore_on_startup,
        max_saved_sessions: state.max_saved_sessions,
        snippets: state.snippets,
        snippet_categories: state.snippet_categories,
        ssh_connections: state.ssh_connections,
        default_ssh_key_path: state.default_ssh_key_path,
      }),
    }
  )
);