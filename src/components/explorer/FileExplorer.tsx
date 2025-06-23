import React, { useEffect, useState } from 'react';
import { use_file_explorer_store } from '@/stores/fileExplorerStore';
import { useLayoutStore } from '@/stores/layoutStore';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FileTree } from './FileTree';
import { FileToolbar } from './FileToolbar';
import { PathBreadcrumb } from './PathBreadcrumb';
import { 
  RefreshCw, 
  AlertCircle, 
  X 
} from 'lucide-react';

interface FileExplorerProps {
  tab_id: string;
}

export function FileExplorer({ tab_id }: FileExplorerProps) {
  const [is_error_dialog_open, set_error_dialog_open] = useState(false);
  
  const {
    current_directory,
    is_loading,
    error,
    initialize,
    refresh_directory,
    set_error,
  } = use_file_explorer_store();

  const { updateTab } = useLayoutStore();

  // Initialize file explorer when component mounts
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Update tab title with current directory
  useEffect(() => {
    if (current_directory) {
      const directory_name = current_directory.split('/').pop() || current_directory;
      updateTab(tab_id, { 
        title: `Explorer: ${directory_name}`,
        path: current_directory 
      });
    }
  }, [current_directory, tab_id, updateTab]);

  // Show error dialog when error occurs
  useEffect(() => {
    if (error) {
      set_error_dialog_open(true);
    }
  }, [error]);

  const handle_refresh = () => {
    refresh_directory();
  };

  const handle_error_close = () => {
    set_error_dialog_open(false);
    set_error(null);
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border">
        <PathBreadcrumb />
        <FileToolbar />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {is_loading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading directory...</span>
            </div>
          </div>
        )}

        <div className="h-full overflow-auto">
          <FileTree />
        </div>
      </div>

      {/* Error Dialog */}
      <AlertDialog open={is_error_dialog_open} onOpenChange={set_error_dialog_open}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              File Explorer Error
            </AlertDialogTitle>
            <AlertDialogDescription className="text-left">
              {error}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button 
              variant="outline" 
              onClick={handle_refresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
            <Button onClick={handle_error_close} className="gap-2">
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

FileExplorer.displayName = 'FileExplorer';