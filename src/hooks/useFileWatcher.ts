import { useEffect, useCallback, useRef, useMemo } from 'react';
import { getFileSystemService } from '@/services/electron/filesystem';
import type { FileChangeEvent as ElectronFileChangeEvent } from '@/services/electron/index';
import { useLayoutStore } from '@/stores/layoutStore';
import { useEditorStore } from '@/stores/editorStore';

interface FileChangeEvent {
  path: string;
  change_type: 'modified' | 'created' | 'deleted' | 'renamed';
  timestamp: number;
}

interface FileWatcherOptions {
  onFileChanged?: (event: FileChangeEvent) => void;
  onFileDeleted?: (path: string) => void;
  onFileRenamed?: (oldPath: string, newPath: string) => void;
  showNotification?: boolean;
}

export function useFileWatcher(options: FileWatcherOptions = {}) {
  const { 
    onFileChanged,
    onFileDeleted,
    onFileRenamed,
    showNotification = true
  } = options;

  const { tabs, updateTab } = useLayoutStore();
  const { getEditorState, setEditorState } = useEditorStore();
  const watchedFiles = useRef<Set<string>>(new Set());
  const unlistenRef = useRef<(() => void) | null>(null);

  const show_file_change_notification = useCallback((message: string, type: 'info' | 'warning' | 'error' = 'info') => {
    if (!showNotification || typeof document === 'undefined') return;
    
    try {
      // Create a simple notification (you could replace this with a proper toast component)
      const notification = document.createElement('div');
      notification.className = `fixed top-4 right-4 z-50 p-3 rounded-lg border max-w-sm 
        ${type === 'error' ? 'bg-destructive text-destructive-foreground border-destructive' : 
          type === 'warning' ? 'bg-yellow-100 text-yellow-900 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-100' :
          'bg-background text-foreground border-border'} 
        shadow-lg transition-all duration-300 translate-x-full`;
      
      notification.innerHTML = `
        <div class="flex items-start space-x-2">
          <div class="flex-1 text-sm">${message}</div>
          <button class="text-xs opacity-70 hover:opacity-100" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
      `;
      
      document.body.appendChild(notification);
      
      // Animate in
      setTimeout(() => {
        notification.classList.remove('translate-x-full');
      }, 100);
      
      // Auto remove after 5 seconds
      setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 300);
      }, 5000);
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }, [showNotification]);

  const handleFileChange = useCallback(async (event: FileChangeEvent) => {
    const { path, change_type, timestamp } = event;
    
    // Find tabs with this file
    const affectedTabs = tabs.filter(tab => tab.path === path);
    
    if (affectedTabs.length === 0) return;

    switch (change_type) {
      case 'modified': {
        // Check if any of the affected tabs have unsaved changes
        const hasUnsavedChanges = affectedTabs.some(tab => {
          const editorState = getEditorState(tab.id);
          return editorState && tab.isDirty;
        });

        if (hasUnsavedChanges) {
          show_file_change_notification(
            `File "${path.split('/').pop()}" was modified externally but has unsaved changes. Reload to see changes?`,
            'warning'
          );
        } else {
          // Auto-reload the file
          try {
            const fs = getFileSystemService();
            const newContent = await fs.readFile(path);
            
            affectedTabs.forEach(tab => {
              setEditorState(tab.id, { content: newContent });
            });
            
            show_file_change_notification(
              `File "${path.split('/').pop()}" was reloaded due to external changes`,
              'info'
            );
          } catch (error) {
            console.error('Failed to reload file:', error);
            show_file_change_notification(
              `Failed to reload file "${path.split('/').pop()}"`,
              'error'
            );
          }
        }
        break;
      }
      
      case 'deleted': {
        show_file_change_notification(
          `File "${path.split('/').pop()}" was deleted externally`,
          'warning'
        );
        
        affectedTabs.forEach(tab => {
          updateTab(tab.id, { title: `${tab.title} (deleted)` });
        });
        
        onFileDeleted?.(path);
        break;
      }
      
      case 'renamed': {
        show_file_change_notification(
          `File "${path.split('/').pop()}" was renamed externally`,
          'info'
        );
        
        onFileRenamed?.(path, path); // In a real implementation, you'd get the new path
        break;
      }
    }

    // Call custom handler
    onFileChanged?.(event);
  }, [tabs, getEditorState, setEditorState, updateTab, show_file_change_notification, onFileChanged, onFileDeleted, onFileRenamed]);

  const watch_file = useCallback(async (filePath: string) => {
    try {
      if (watchedFiles.current.has(filePath)) return;
      
      const fs = getFileSystemService();
      await fs.watchFile(filePath, (event: ElectronFileChangeEvent) => {
        // Convert Electron event to our FileChangeEvent format
        const fileChangeEvent: FileChangeEvent = {
          path: event.path,
          change_type: event.type === 'change' ? 'modified' : 
                       event.type === 'rename' ? 'renamed' : 
                       event.type === 'delete' ? 'deleted' : 'modified',
          timestamp: Date.now()
        };
        handleFileChange(fileChangeEvent);
      });
      watchedFiles.current.add(filePath);
    } catch (error) {
      console.error('Failed to watch file:', error);
      show_file_change_notification(`Failed to watch file: ${filePath}`, 'error');
    }
  }, [show_file_change_notification, handleFileChange]);

  const unwatch_file = useCallback(async (filePath: string) => {
    try {
      const fs = getFileSystemService();
      await fs.unwatchFile(filePath);
      watchedFiles.current.delete(filePath);
    } catch (error) {
      console.error('Failed to unwatch file:', error);
    }
  }, []);

  // Note: With Electron filesystem service, file watching is handled per-file
  // So we don't need a global event listener like with Tauri

  // Watch files for open editor tabs
  useEffect(() => {
    const editorTabs = tabs.filter(tab => tab.type === 'editor' && tab.path);
    
    // Watch new files
    editorTabs.forEach(tab => {
      if (tab.path && !watchedFiles.current.has(tab.path)) {
        watch_file(tab.path);
      }
    });

    // Unwatch files that are no longer open
    const currentPaths = new Set(editorTabs.map(tab => tab.path).filter(Boolean) as string[]);
    const pathsToUnwatch = Array.from(watchedFiles.current).filter(path => !currentPaths.has(path));
    
    pathsToUnwatch.forEach(path => {
      unwatch_file(path);
    });
  }, [tabs, watch_file, unwatch_file]);

  // Cleanup on unmount
  useEffect(() => {
    const watched_files_copy = Array.from(watchedFiles.current);
    return () => {
      // Unwatch all files
      watched_files_copy.forEach(path => {
        unwatch_file(path).catch(console.error);
      });
    };
  }, [unwatch_file]);

  return {
    watchFile: watch_file,
    unwatchFile: unwatch_file,
    watchedFiles: Array.from(watchedFiles.current),
  };
}