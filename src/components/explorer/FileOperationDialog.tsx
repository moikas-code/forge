import React, { useState, useEffect } from 'react';
import { use_file_explorer_store } from '@/stores/fileExplorerStore';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import {
  FilePlus,
  FolderPlus,
  Edit2,
  X,
} from 'lucide-react';

interface FileOperationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: 'file' | 'folder' | 'rename';
  directory_path: string;
  existing_file_path?: string;
}

export function FileOperationDialog({
  open,
  onOpenChange,
  operation,
  directory_path,
  existing_file_path,
}: FileOperationDialogProps) {
  const [name, set_name] = useState('');
  const [content, set_content] = useState('');
  const [is_submitting, set_is_submitting] = useState(false);

  const {
    create_file,
    create_folder,
    rename_file,
  } = use_file_explorer_store();

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      if (operation === 'rename' && existing_file_path) {
        const existing_name = existing_file_path.split('/').pop() || '';
        set_name(existing_name);
      } else {
        set_name('');
      }
      set_content('');
      set_is_submitting(false);
    }
  }, [open, operation, existing_file_path]);

  const get_dialog_config = () => {
    switch (operation) {
      case 'file':
        return {
          title: 'Create New File',
          icon: FilePlus,
          placeholder: 'file-name.txt',
          show_content: true,
        };
      case 'folder':
        return {
          title: 'Create New Folder',
          icon: FolderPlus,
          placeholder: 'folder-name',
          show_content: false,
        };
      case 'rename':
        return {
          title: 'Rename',
          icon: Edit2,
          placeholder: 'new-name',
          show_content: false,
        };
      default:
        return {
          title: 'File Operation',
          icon: FilePlus,
          placeholder: 'name',
          show_content: false,
        };
    }
  };

  const config = get_dialog_config();
  const IconComponent = config.icon;

  const validate_name = (input_name: string): string | null => {
    if (!input_name.trim()) {
      return 'Name cannot be empty';
    }

    // Check for invalid characters
    const invalid_chars = /[<>:"/\\|?*]/;
    if (invalid_chars.test(input_name)) {
      return 'Name contains invalid characters';
    }

    // Check for reserved names (Windows)
    const reserved_names = ['CON', 'PRN', 'AUX', 'NUL', 'COM1', 'COM2', 'COM3', 'COM4', 'COM5', 'COM6', 'COM7', 'COM8', 'COM9', 'LPT1', 'LPT2', 'LPT3', 'LPT4', 'LPT5', 'LPT6', 'LPT7', 'LPT8', 'LPT9'];
    if (reserved_names.includes(input_name.toUpperCase())) {
      return 'Name is reserved';
    }

    return null;
  };

  const handle_submit = async () => {
    const trimmed_name = name.trim();
    const validation_error = validate_name(trimmed_name);
    
    if (validation_error) {
      alert(validation_error);
      return;
    }

    set_is_submitting(true);

    try {
      switch (operation) {
        case 'file':
          await create_file(directory_path, trimmed_name, content);
          break;
        case 'folder':
          await create_folder(directory_path, trimmed_name);
          break;
        case 'rename':
          if (existing_file_path) {
            await rename_file(existing_file_path, trimmed_name);
          }
          break;
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error('Operation failed:', error);
    } finally {
      set_is_submitting(false);
    }
  };

  const handle_cancel = () => {
    onOpenChange(false);
  };

  const handle_key_down = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handle_submit();
    } else if (e.key === 'Escape') {
      handle_cancel();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <IconComponent className="h-5 w-5" />
            {config.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {operation === 'rename' 
              ? `Rename "${existing_file_path?.split('/').pop()}" to:` 
              : `Create a new ${operation} in "${directory_path}"`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4">
          {/* Name Input */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => set_name(e.target.value)}
              onKeyDown={handle_key_down}
              placeholder={config.placeholder}
              className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              autoFocus
            />
          </div>

          {/* Content Input (for files only) */}
          {config.show_content && (
            <div>
              <label htmlFor="content" className="block text-sm font-medium mb-2">
                Initial Content (optional)
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => set_content(e.target.value)}
                onKeyDown={handle_key_down}
                placeholder="File content..."
                rows={4}
                className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 resize-vertical"
              />
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={handle_cancel}
            disabled={is_submitting}
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handle_submit}
            disabled={is_submitting || !name.trim()}
          >
            <IconComponent className="h-4 w-4 mr-2" />
            {is_submitting ? 'Creating...' : config.title.split(' ')[0]}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

FileOperationDialog.displayName = 'FileOperationDialog';