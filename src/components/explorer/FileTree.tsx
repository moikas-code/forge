import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { use_file_explorer_store } from '@/stores/fileExplorerStore';
import { useLayoutStore } from '@/stores/layoutStore';
import type { FileNode, TreeNode } from '@/types/fileExplorer';
import { FileItem } from './FileItem';
import { FileContextMenu } from './FileContextMenu';

export function FileTree() {
  const [directory_contents, set_directory_contents] = useState<Map<string, FileNode[]>>(new Map());
  const [loading_directories, set_loading_directories] = useState<Set<string>>(new Set());
  const [context_menu, set_context_menu] = useState<{
    x: number;
    y: number;
    file_path: string;
    is_directory: boolean;
  } | null>(null);

  const {
    current_directory,
    expanded_directories,
    selected_files,
    search_query,
    show_hidden_files,
    sort_by,
    sort_direction,
    view_mode,
    select_file,
    toggle_directory_expansion,
    navigate_to_directory,
  } = use_file_explorer_store();

  const { addTab } = useLayoutStore();

  // Load directory contents
  const load_directory = useCallback(async (path: string) => {
    if (loading_directories.has(path)) return;

    set_loading_directories(prev => new Set(prev).add(path));

    try {
      const files = await invoke<FileNode[]>('list_directory', { dirPath: path });
      set_directory_contents(prev => new Map(prev).set(path, files));
    } catch (error) {
      console.error(`Failed to load directory ${path}:`, error);
    } finally {
      set_loading_directories(prev => {
        const new_set = new Set(prev);
        new_set.delete(path);
        return new_set;
      });
    }
  }, [loading_directories]);

  // Load current directory when it changes
  useEffect(() => {
    load_directory(current_directory);
  }, [current_directory, load_directory]);

  // Load expanded directories
  useEffect(() => {
    expanded_directories.forEach(path => {
      if (!directory_contents.has(path)) {
        load_directory(path);
      }
    });
  }, [expanded_directories, directory_contents, load_directory]);

  // Filter and sort files
  const filtered_and_sorted_files = useMemo(() => {
    const files = directory_contents.get(current_directory) || [];
    
    // Filter files
    let filtered = files.filter(file => {
      // Hide hidden files if option is disabled
      if (!show_hidden_files && file.name.startsWith('.')) {
        return false;
      }
      
      // Apply search filter
      if (search_query) {
        const query = search_query.toLowerCase();
        return file.name.toLowerCase().includes(query);
      }
      
      return true;
    });

    // Sort files
    filtered.sort((a, b) => {
      // Directories first
      if (a.is_directory && !b.is_directory) return -1;
      if (!a.is_directory && b.is_directory) return 1;

      let comparison = 0;
      
      switch (sort_by) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        case 'modified':
          comparison = (a.modified_date || 0) - (b.modified_date || 0);
          break;
        case 'type':
          const a_ext = a.name.split('.').pop() || '';
          const b_ext = b.name.split('.').pop() || '';
          comparison = a_ext.localeCompare(b_ext);
          break;
      }

      return sort_direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [directory_contents, current_directory, show_hidden_files, search_query, sort_by, sort_direction]);

  // Convert to tree nodes for recursive rendering
  const build_tree_nodes = (files: FileNode[], parent_path: string, level = 0): TreeNode[] => {
    return files.map(file => ({
      ...file,
      children: file.is_directory && expanded_directories.has(file.path) 
        ? build_tree_nodes(directory_contents.get(file.path) || [], file.path, level + 1)
        : undefined,
      is_expanded: expanded_directories.has(file.path),
      is_loading: loading_directories.has(file.path),
      level,
    }));
  };

  const tree_nodes = view_mode === 'tree' 
    ? build_tree_nodes(filtered_and_sorted_files, current_directory)
    : filtered_and_sorted_files.map(file => ({
        ...file,
        children: undefined,
        is_expanded: false,
        is_loading: false,
        level: 0,
      }));

  const handle_file_click = (file: TreeNode, event: React.MouseEvent) => {
    const is_multi_select = event.ctrlKey || event.metaKey;
    
    if (file.is_directory) {
      if (view_mode === 'tree') {
        toggle_directory_expansion(file.path);
      } else {
        navigate_to_directory(file.path);
      }
    } else {
      // Open file in editor
      addTab({
        title: file.name,
        type: 'editor',
        path: file.path,
        content: file.path,
      });
    }
    
    select_file(file.path, is_multi_select);
  };

  const handle_file_double_click = (file: TreeNode) => {
    if (file.is_directory) {
      navigate_to_directory(file.path);
    }
  };

  const handle_context_menu = (file: TreeNode, event: React.MouseEvent) => {
    event.preventDefault();
    set_context_menu({
      x: event.clientX,
      y: event.clientY,
      file_path: file.path,
      is_directory: file.is_directory,
    });
  };

  const handle_context_menu_close = () => {
    set_context_menu(null);
  };

  const render_tree_nodes = (nodes: TreeNode[]): React.ReactNode => {
    return nodes.map(node => (
      <div key={node.path}>
        <FileItem
          file={node}
          is_selected={selected_files.includes(node.path)}
          is_expanded={node.is_expanded}
          is_loading={node.is_loading}
          level={node.level}
          onClick={(event) => handle_file_click(node, event)}
          onDoubleClick={() => handle_file_double_click(node)}
          onContextMenu={(event) => handle_context_menu(node, event)}
        />
        {view_mode === 'tree' && node.children && (
          <div>
            {render_tree_nodes(node.children)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="p-2">
      {filtered_and_sorted_files.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          {search_query ? 'No files match your search.' : 'This directory is empty.'}
        </div>
      ) : (
        <div className="space-y-1">
          {render_tree_nodes(tree_nodes)}
        </div>
      )}

      {context_menu && (
        <FileContextMenu
          x={context_menu.x}
          y={context_menu.y}
          file_path={context_menu.file_path}
          is_directory={context_menu.is_directory}
          onClose={handle_context_menu_close}
        />
      )}
    </div>
  );
}

FileTree.displayName = 'FileTree';