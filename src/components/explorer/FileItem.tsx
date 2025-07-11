import React from 'react';
import { cn } from '@/lib/utils';
import type { TreeNode } from '@/types/fileExplorer';
import { use_file_explorer_store } from '@/stores/fileExplorerStore';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  FileText,
  FileImage,
  FileVideo,
  FileCode,
  FileArchive,
  Settings,
  Loader2,
} from 'lucide-react';

interface FileItemProps {
  file: TreeNode;
  is_selected: boolean;
  is_expanded: boolean;
  is_loading: boolean;
  level: number;
  onClick: (event: React.MouseEvent) => void;
  onDoubleClick: () => void;
  onContextMenu: (event: React.MouseEvent) => void;
}

// File type mappings for icons
const get_file_icon = (file_name: string, is_directory: boolean) => {
  if (is_directory) {
    return Folder;
  }

  const extension = file_name.split('.').pop()?.toLowerCase() || '';
  
  // Code files
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'rs', 'go', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'swift', 'kt'].includes(extension)) {
    return FileCode;
  }
  
  // Text files
  if (['txt', 'md', 'mdx', 'json', 'yaml', 'yml', 'toml', 'xml', 'csv'].includes(extension)) {
    return FileText;
  }
  
  // Images
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'].includes(extension)) {
    return FileImage;
  }
  
  // Videos
  if (['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
    return FileVideo;
  }
  
  // Archives
  if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(extension)) {
    return FileArchive;
  }
  
  // Config files
  if (['config', 'conf', 'ini', 'cfg', 'env'].includes(extension) || file_name.startsWith('.')) {
    return Settings;
  }
  
  return File;
};

const format_file_size = (size?: number): string => {
  if (!size) return '';
  
  const units = ['B', 'KB', 'MB', 'GB'];
  let unit_index = 0;
  let file_size = size;
  
  while (file_size >= 1024 && unit_index < units.length - 1) {
    file_size /= 1024;
    unit_index++;
  }
  
  return `${file_size.toFixed(unit_index === 0 ? 0 : 1)} ${units[unit_index]}`;
};

const format_date = (timestamp?: number): string => {
  if (!timestamp) return '';
  
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than 24 hours
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // Less than a year
  if (diff < 365 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
  
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
};

export function FileItem({
  file,
  is_selected,
  is_expanded,
  is_loading,
  level,
  onClick,
  onDoubleClick,
  onContextMenu,
}: FileItemProps) {
  const FileIcon = get_file_icon(file.name, file.is_directory);
  const indent_width = level * 16; // 16px per level
  
  const { 
    dragging_files, 
    drop_target, 
    start_drag, 
    set_drop_target, 
    handle_drop,
    selected_files 
  } = use_file_explorer_store();
  
  const is_dragging = dragging_files.includes(file.path);
  const is_drop_target = drop_target === file.path && file.is_directory;
  
  const handle_drag_start = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.path);
    
    // If the dragged file is selected, drag all selected files
    const files_to_drag = is_selected ? selected_files : [file.path];
    start_drag(files_to_drag);
  };
  
  const handle_drag_end = () => {
    start_drag([]);
    set_drop_target(null);
  };
  
  const handle_drag_over = (e: React.DragEvent) => {
    if (!file.is_directory || dragging_files.includes(file.path)) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    set_drop_target(file.path);
  };
  
  const handle_drag_leave = (e: React.DragEvent) => {
    // Only clear if we're leaving this element entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      set_drop_target(null);
    }
  };
  
  const handle_drop_event = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!file.is_directory || dragging_files.includes(file.path)) return;
    
    await handle_drop(file.path);
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group hover:bg-accent/50 transition-colors",
        is_selected && "bg-accent text-accent-foreground",
        file.readonly && "opacity-60",
        is_dragging && "opacity-50",
        is_drop_target && "bg-blue-500/20 ring-2 ring-blue-500/50"
      )}
      style={{ paddingLeft: `${8 + indent_width}px` }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      onDragStart={handle_drag_start}
      onDragEnd={handle_drag_end}
      onDragOver={handle_drag_over}
      onDragLeave={handle_drag_leave}
      onDrop={handle_drop_event}
      draggable={!file.readonly}
      title={file.path}
    >
      {/* Expand/Collapse Icon */}
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
        {file.is_directory && (
          <>
            {is_loading ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : is_expanded ? (
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </>
        )}
      </div>

      {/* File Icon */}
      <div className="w-4 h-4 flex items-center justify-center flex-shrink-0">
        {file.is_directory && is_expanded ? (
          <FolderOpen className="h-4 w-4 text-blue-500" />
        ) : (
          <FileIcon className={cn(
            "h-4 w-4",
            file.is_directory ? "text-blue-500" : "text-muted-foreground"
          )} />
        )}
      </div>

      {/* File Name */}
      <span className={cn(
        "flex-1 text-sm truncate",
        file.name.startsWith('.') && "text-muted-foreground"
      )}>
        {file.name}
      </span>

      {/* File Info (Size & Date) */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
        {!file.is_directory && file.size && (
          <span className="min-w-[50px] text-right">
            {format_file_size(file.size)}
          </span>
        )}
        {file.modified_date && (
          <span className="min-w-[60px] text-right">
            {format_date(file.modified_date)}
          </span>
        )}
      </div>
    </div>
  );
}

FileItem.displayName = 'FileItem';