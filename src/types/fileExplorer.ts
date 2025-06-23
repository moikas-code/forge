export interface FileNode {
  name: string;
  path: string;
  is_directory: boolean;
  size?: number;
  modified_date?: number;
  created_date?: number;
  readonly: boolean;
  permissions: string;
  parent_path?: string;
}

export interface TreeNode extends FileNode {
  children?: TreeNode[];
  is_expanded: boolean;
  is_loading: boolean;
  level: number;
}

export type FileOperation = 'create_file' | 'create_folder' | 'delete' | 'rename' | 'copy' | 'move';

export interface FileOperationPayload {
  operation: FileOperation;
  source_path: string;
  destination_path?: string;
  content?: string;
}

export interface FileSearchOptions {
  query: string;
  case_sensitive: boolean;
  regex_mode: boolean;
  include_hidden: boolean;
}

export interface FavoriteDirectory {
  id: string;
  name: string;
  path: string;
  created_at: number;
}

export interface FileExplorerState {
  current_directory: string;
  expanded_directories: Set<string>;
  selected_files: string[];
  favorites: FavoriteDirectory[];
  search_query: string;
  search_options: FileSearchOptions;
  is_loading: boolean;
  error: string | null;
  clipboard: {
    operation: 'copy' | 'cut' | null;
    files: string[];
  };
  view_mode: 'tree' | 'list';
  show_hidden_files: boolean;
  sort_by: 'name' | 'size' | 'modified' | 'type';
  sort_direction: 'asc' | 'desc';
  dragging_files: string[];
  drop_target: string | null;
}

export interface FileExplorerActions {
  navigate_to_directory: (path: string) => Promise<void>;
  refresh_directory: (path?: string) => Promise<void>;
  toggle_directory_expansion: (path: string) => void;
  select_file: (path: string, multi_select?: boolean) => void;
  clear_selection: () => void;
  set_search_query: (query: string) => void;
  set_search_options: (options: Partial<FileSearchOptions>) => void;
  add_favorite: (path: string, name?: string) => void;
  remove_favorite: (id: string) => void;
  create_file: (path: string, name: string, content?: string) => Promise<void>;
  create_folder: (path: string, name: string) => Promise<void>;
  delete_files: (paths: string[]) => Promise<void>;
  rename_file: (old_path: string, new_name: string) => Promise<void>;
  copy_files: (paths: string[]) => void;
  cut_files: (paths: string[]) => void;
  paste_files: (destination_path: string) => Promise<void>;
  set_view_mode: (mode: 'tree' | 'list') => void;
  toggle_hidden_files: () => void;
  set_sort_options: (sort_by: FileExplorerState['sort_by'], direction: FileExplorerState['sort_direction']) => void;
  set_loading: (loading: boolean) => void;
  set_error: (error: string | null) => void;
  initialize: () => Promise<void>;
  start_drag: (files: string[]) => void;
  set_drop_target: (target: string | null) => void;
  handle_drop: (target_path: string) => Promise<void>;
}

export type FileExplorerStore = FileExplorerState & FileExplorerActions;