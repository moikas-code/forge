import React, { useEffect, useRef, useState } from 'react';
import { use_file_explorer_store } from '@/stores/fileExplorerStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { Button } from '@/components/ui/button';
import {
  FilePlus,
  FolderPlus,
  Copy,
  Scissors,
  Clipboard,
  Trash2,
  Edit2,
  Eye,
  Info,
  Download,
  Share,
} from 'lucide-react';
import { FileOperationDialog } from './FileOperationDialog';

interface FileContextMenuProps {
  x: number;
  y: number;
  file_path: string;
  is_directory: boolean;
  onClose: () => void;
}

export function FileContextMenu({
  x,
  y,
  file_path,
  is_directory,
  onClose,
}: FileContextMenuProps) {
  const [show_operation_dialog, set_show_operation_dialog] = useState(false);
  const [operation_type, set_operation_type] = useState<'file' | 'folder' | 'rename'>('file');
  const menu_ref = useRef<HTMLDivElement>(null);

  const {
    clipboard,
    copy_files,
    cut_files,
    paste_files,
    delete_files,
    navigate_to_directory,
  } = use_file_explorer_store();

  const { addTab } = useLayoutStore();

  const file_name = file_path.split('/').pop() || '';
  const parent_directory = file_path.substring(0, file_path.lastIndexOf('/')) || '/';

  // Close menu when clicking outside
  useEffect(() => {
    const handle_click_outside = (event: MouseEvent) => {
      if (menu_ref.current && !menu_ref.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handle_click_outside);
    return () => document.removeEventListener('mousedown', handle_click_outside);
  }, [onClose]);

  // Position menu within viewport
  const menu_style: React.CSSProperties = {
    position: 'fixed',
    left: x,
    top: y,
    zIndex: 50,
  };

  const handle_open = () => {
    if (is_directory) {
      navigate_to_directory(file_path);
    } else {
      addTab({
        title: file_name,
        type: 'editor',
        path: file_path,
        content: file_path,
      });
    }
    onClose();
  };

  const handle_new_file = () => {
    set_operation_type('file');
    set_show_operation_dialog(true);
  };

  const handle_new_folder = () => {
    set_operation_type('folder');
    set_show_operation_dialog(true);
  };

  const handle_rename = () => {
    set_operation_type('rename');
    set_show_operation_dialog(true);
  };

  const handle_copy = () => {
    copy_files([file_path]);
    onClose();
  };

  const handle_cut = () => {
    cut_files([file_path]);
    onClose();
  };

  const handle_paste = async () => {
    const target_directory = is_directory ? file_path : parent_directory;
    await paste_files(target_directory);
    onClose();
  };

  const handle_delete = async () => {
    if (confirm(`Are you sure you want to delete "${file_name}"?`)) {
      await delete_files([file_path]);
      onClose();
    }
  };

  const handle_show_info = () => {
    // TODO: Implement file info dialog
    console.log('Show file info for:', file_path);
    onClose();
  };

  const can_paste = clipboard.operation && clipboard.files.length > 0;

  return (
    <>
      <div
        ref={menu_ref}
        style={menu_style}
        className="bg-popover border border-border rounded-md shadow-lg py-1 min-w-[200px]"
      >
        {/* Open/Navigate */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 px-3 py-2 h-auto font-normal"
          onClick={handle_open}
        >
          <Eye className="h-4 w-4" />
          {is_directory ? 'Open' : 'Open in Editor'}
        </Button>

        <div className="border-t border-border my-1" />

        {/* Create New (only for directories) */}
        {is_directory && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 px-3 py-2 h-auto font-normal"
              onClick={handle_new_file}
            >
              <FilePlus className="h-4 w-4" />
              New File
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 px-3 py-2 h-auto font-normal"
              onClick={handle_new_folder}
            >
              <FolderPlus className="h-4 w-4" />
              New Folder
            </Button>
            <div className="border-t border-border my-1" />
          </>
        )}

        {/* File Operations */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 px-3 py-2 h-auto font-normal"
          onClick={handle_copy}
        >
          <Copy className="h-4 w-4" />
          Copy
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 px-3 py-2 h-auto font-normal"
          onClick={handle_cut}
        >
          <Scissors className="h-4 w-4" />
          Cut
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 px-3 py-2 h-auto font-normal"
          onClick={handle_paste}
          disabled={!can_paste}
        >
          <Clipboard className="h-4 w-4" />
          Paste
        </Button>

        <div className="border-t border-border my-1" />

        {/* Rename & Delete */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 px-3 py-2 h-auto font-normal"
          onClick={handle_rename}
        >
          <Edit2 className="h-4 w-4" />
          Rename
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 px-3 py-2 h-auto font-normal text-destructive hover:text-destructive"
          onClick={handle_delete}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>

        <div className="border-t border-border my-1" />

        {/* Info */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 px-3 py-2 h-auto font-normal"
          onClick={handle_show_info}
        >
          <Info className="h-4 w-4" />
          Properties
        </Button>
      </div>

      <FileOperationDialog
        open={show_operation_dialog}
        onOpenChange={(open) => {
          set_show_operation_dialog(open);
          if (!open) onClose();
        }}
        operation={operation_type}
        directory_path={is_directory ? file_path : parent_directory}
        existing_file_path={operation_type === 'rename' ? file_path : undefined}
      />
    </>
  );
}

FileContextMenu.displayName = 'FileContextMenu';