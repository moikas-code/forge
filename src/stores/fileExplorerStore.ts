import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/core';
import type { 
  FileExplorerStore, 
  FileNode, 
  FavoriteDirectory, 
  FileSearchOptions 
} from '@/types/fileExplorer';

const DEFAULT_SEARCH_OPTIONS: FileSearchOptions = {
  query: '',
  case_sensitive: false,
  regex_mode: false,
  include_hidden: false,
};

const get_home_directory = async (): Promise<string> => {
  try {
    // Try to get home directory from environment
    return await invoke('get_terminal_cwd') || '/home';
  } catch {
    return '/home';
  }
};

export const use_file_explorer_store = create<FileExplorerStore>()(
  persist(
    (set, get) => ({
      // State
      current_directory: '/home',
      expanded_directories: new Set<string>(),
      selected_files: [],
      favorites: [],
      search_query: '',
      search_options: DEFAULT_SEARCH_OPTIONS,
      is_loading: false,
      error: null,
      clipboard: {
        operation: null,
        files: [],
      },
      view_mode: 'tree',
      show_hidden_files: false,
      sort_by: 'name',
      sort_direction: 'asc',
      dragging_files: [],
      drop_target: null,

      // Actions
      navigate_to_directory: async (path: string) => {
        set({ is_loading: true, error: null });
        
        try {
          // Verify directory exists and is accessible
          const file_info = await invoke<FileNode>('get_file_metadata', { filePath: path });
          
          if (!file_info.is_directory) {
            throw new Error('Path is not a directory');
          }

          set({ 
            current_directory: path,
            selected_files: [],
            search_query: '',
          });
        } catch (error) {
          set({ error: `Failed to navigate to directory: ${error}` });
        } finally {
          set({ is_loading: false });
        }
      },

      refresh_directory: async (path?: string) => {
        const target_path = path || get().current_directory;
        set({ is_loading: true });
        
        try {
          // Force refresh by clearing expanded state and re-expanding
          const { expanded_directories } = get();
          if (expanded_directories.has(target_path)) {
            expanded_directories.delete(target_path);
            set({ expanded_directories: new Set(expanded_directories) });
            // Re-expand after a brief delay
            setTimeout(() => {
              get().toggle_directory_expansion(target_path);
            }, 100);
          }
        } catch (error) {
          set({ error: `Failed to refresh directory: ${error}` });
        } finally {
          set({ is_loading: false });
        }
      },

      toggle_directory_expansion: (path: string) => {
        const { expanded_directories } = get();
        const new_expanded = new Set(expanded_directories);
        
        if (new_expanded.has(path)) {
          new_expanded.delete(path);
        } else {
          new_expanded.add(path);
        }
        
        set({ expanded_directories: new_expanded });
      },

      select_file: (path: string, multi_select = false) => {
        const { selected_files } = get();
        
        if (multi_select) {
          const new_selection = selected_files.includes(path)
            ? selected_files.filter(p => p !== path)
            : [...selected_files, path];
          set({ selected_files: new_selection });
        } else {
          set({ selected_files: [path] });
        }
      },

      clear_selection: () => set({ selected_files: [] }),

      set_search_query: (query: string) => {
        set({ search_query: query });
      },

      set_search_options: (options: Partial<FileSearchOptions>) => {
        const { search_options } = get();
        set({ 
          search_options: { ...search_options, ...options }
        });
      },

      add_favorite: (path: string, name?: string) => {
        const { favorites } = get();
        const favorite_name = name || path.split('/').pop() || path;
        
        const new_favorite: FavoriteDirectory = {
          id: crypto.randomUUID(),
          name: favorite_name,
          path,
          created_at: Date.now(),
        };
        
        set({ favorites: [...favorites, new_favorite] });
      },

      remove_favorite: (id: string) => {
        const { favorites } = get();
        set({ favorites: favorites.filter(f => f.id !== id) });
      },

      create_file: async (path: string, name: string, content = '') => {
        set({ is_loading: true, error: null });
        
        try {
          const file_path = `${path}/${name}`;
          await invoke('create_file', { filePath: file_path, content });
          get().refresh_directory(path);
        } catch (error) {
          set({ error: `Failed to create file: ${error}` });
        } finally {
          set({ is_loading: false });
        }
      },

      create_folder: async (path: string, name: string) => {
        set({ is_loading: true, error: null });
        
        try {
          const folder_path = `${path}/${name}`;
          // Create folder by creating a temporary file and then removing it
          // This ensures the directory structure exists
          await invoke('create_file', { filePath: `${folder_path}/.gitkeep`, content: '' });
          get().refresh_directory(path);
        } catch (error) {
          set({ error: `Failed to create folder: ${error}` });
        } finally {
          set({ is_loading: false });
        }
      },

      delete_files: async (paths: string[]) => {
        set({ is_loading: true, error: null });
        
        try {
          for (const path of paths) {
            await invoke('delete_file', { filePath: path });
          }
          
          const { current_directory } = get();
          get().refresh_directory(current_directory);
          set({ selected_files: [] });
        } catch (error) {
          set({ error: `Failed to delete files: ${error}` });
        } finally {
          set({ is_loading: false });
        }
      },

      rename_file: async (old_path: string, new_name: string) => {
        set({ is_loading: true, error: null });
        
        try {
          const directory = old_path.substring(0, old_path.lastIndexOf('/'));
          const new_path = `${directory}/${new_name}`;
          
          await invoke('rename_file', { oldPath: old_path, newPath: new_path });
          
          const { current_directory } = get();
          get().refresh_directory(current_directory);
          set({ selected_files: [] });
        } catch (error) {
          set({ error: `Failed to rename file: ${error}` });
        } finally {
          set({ is_loading: false });
        }
      },

      copy_files: (paths: string[]) => {
        set({
          clipboard: {
            operation: 'copy',
            files: paths,
          },
        });
      },

      cut_files: (paths: string[]) => {
        set({
          clipboard: {
            operation: 'cut',
            files: paths,
          },
        });
      },

      paste_files: async (destination_path: string) => {
        const { clipboard } = get();
        if (!clipboard.operation || clipboard.files.length === 0) return;

        set({ is_loading: true, error: null });
        
        try {
          for (const source_path of clipboard.files) {
            const file_name = source_path.split('/').pop() || '';
            const dest_path = `${destination_path}/${file_name}`;
            
            if (clipboard.operation === 'copy') {
              await invoke('copy_file', { sourcePath: source_path, destPath: dest_path });
            } else if (clipboard.operation === 'cut') {
              await invoke('rename_file', { oldPath: source_path, newPath: dest_path });
            }
          }
          
          // Clear clipboard after successful paste
          set({
            clipboard: { operation: null, files: [] },
            selected_files: [],
          });
          
          get().refresh_directory(destination_path);
        } catch (error) {
          set({ error: `Failed to paste files: ${error}` });
        } finally {
          set({ is_loading: false });
        }
      },

      set_view_mode: (mode: 'tree' | 'list') => set({ view_mode: mode }),

      toggle_hidden_files: () => {
        const { show_hidden_files } = get();
        set({ show_hidden_files: !show_hidden_files });
      },

      set_sort_options: (sort_by, direction) => {
        set({ sort_by, sort_direction: direction });
      },

      set_loading: (loading: boolean) => set({ is_loading: loading }),

      set_error: (error: string | null) => set({ error }),

      initialize: async () => {
        set({ is_loading: true });
        
        try {
          const home_dir = await get_home_directory();
          set({ current_directory: home_dir });
          get().toggle_directory_expansion(home_dir);
        } catch (error) {
          set({ error: `Failed to initialize file explorer: ${error}` });
        } finally {
          set({ is_loading: false });
        }
      },
      
      start_drag: (files: string[]) => {
        set({ dragging_files: files });
      },
      
      set_drop_target: (target: string | null) => {
        set({ drop_target: target });
      },
      
      handle_drop: async (target_path: string) => {
        const { dragging_files, clipboard } = get();
        
        if (dragging_files.length === 0) return;
        
        set({ is_loading: true, error: null });
        
        try {
          // Move files to the target directory
          for (const source_path of dragging_files) {
            const file_name = source_path.split('/').pop() || '';
            const dest_path = `${target_path}/${file_name}`;
            
            // Check if dropping on same directory
            const source_dir = source_path.substring(0, source_path.lastIndexOf('/'));
            if (source_dir === target_path) {
              continue;
            }
            
            await invoke('rename_file', { oldPath: source_path, newPath: dest_path });
          }
          
          // Clear drag state
          set({ 
            dragging_files: [], 
            drop_target: null,
            selected_files: []
          });
          
          // Refresh both source and target directories
          const source_dirs = new Set(dragging_files.map(f => 
            f.substring(0, f.lastIndexOf('/'))
          ));
          
          for (const dir of source_dirs) {
            get().refresh_directory(dir);
          }
          get().refresh_directory(target_path);
          
        } catch (error) {
          set({ error: `Failed to move files: ${error}` });
        } finally {
          set({ is_loading: false, dragging_files: [], drop_target: null });
        }
      },
    }),
    {
      name: 'forge-moi-file-explorer',
      partialize: (state) => ({
        favorites: state.favorites,
        view_mode: state.view_mode,
        show_hidden_files: state.show_hidden_files,
        sort_by: state.sort_by,
        sort_direction: state.sort_direction,
        search_options: state.search_options,
      }),
    }
  )
);