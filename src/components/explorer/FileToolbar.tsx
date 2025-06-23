import React, { useState } from 'react';
import { use_file_explorer_store } from '@/stores/fileExplorerStore';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  FilePlus,
  FolderPlus,
  RefreshCw,
  Search,
  Grid3X3,
  List,
  Settings,
  Eye,
  EyeOff,
  ArrowUpDown,
  X
} from 'lucide-react';
import { FileOperationDialog } from './FileOperationDialog';

export function FileToolbar() {
  const [show_operation_dialog, set_show_operation_dialog] = useState(false);
  const [operation_type, set_operation_type] = useState<'file' | 'folder'>('file');
  
  const {
    current_directory,
    search_query,
    view_mode,
    show_hidden_files,
    sort_by,
    sort_direction,
    refresh_directory,
    set_search_query,
    set_view_mode,
    toggle_hidden_files,
    set_sort_options,
  } = use_file_explorer_store();

  const handle_new_file = () => {
    set_operation_type('file');
    set_show_operation_dialog(true);
  };

  const handle_new_folder = () => {
    set_operation_type('folder');
    set_show_operation_dialog(true);
  };

  const handle_refresh = () => {
    refresh_directory();
  };

  const handle_view_mode_toggle = () => {
    set_view_mode(view_mode === 'tree' ? 'list' : 'tree');
  };

  const handle_sort_change = (new_sort_by: typeof sort_by) => {
    const new_direction = sort_by === new_sort_by && sort_direction === 'asc' ? 'desc' : 'asc';
    set_sort_options(new_sort_by, new_direction);
  };

  const clear_search = () => {
    set_search_query('');
  };

  return (
    <>
      <div className="flex items-center justify-between p-2 gap-2 border-b border-border">
        {/* Left Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handle_new_file}
            className="gap-2"
            title="New File"
          >
            <FilePlus className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handle_new_folder}
            className="gap-2"
            title="New Folder"
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handle_refresh}
            className="gap-2"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-xs">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files..."
              value={search_query}
              onChange={(e) => set_search_query(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            />
            {search_query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clear_search}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handle_view_mode_toggle}
            title={`Switch to ${view_mode === 'tree' ? 'List' : 'Tree'} View`}
          >
            {view_mode === 'tree' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggle_hidden_files}
            title={show_hidden_files ? 'Hide Hidden Files' : 'Show Hidden Files'}
          >
            {show_hidden_files ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" title="Sort Options">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handle_sort_change('name')}>
                Sort by Name {sort_by === 'name' && (sort_direction === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handle_sort_change('size')}>
                Sort by Size {sort_by === 'size' && (sort_direction === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handle_sort_change('modified')}>
                Sort by Modified {sort_by === 'modified' && (sort_direction === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handle_sort_change('type')}>
                Sort by Type {sort_by === 'type' && (sort_direction === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <FileOperationDialog
        open={show_operation_dialog}
        onOpenChange={set_show_operation_dialog}
        operation={operation_type}
        directory_path={current_directory}
      />
    </>
  );
}

FileToolbar.displayName = 'FileToolbar';