'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  FileCode, 
  File, 
  Save, 
  MoreHorizontal,
  Pin,
  PinOff,
  Copy,
  SplitSquareHorizontal,
  SplitSquareVertical,
  Download
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLayoutStore } from '@/stores/layoutStore';
import { useEditorStore } from '@/stores/editorStore';

interface EditorTab {
  id: string;
  title: string;
  path?: string;
  type: string;
  isDirty?: boolean;
  isPinned?: boolean;
  isActive?: boolean;
}

interface EditorTabManagerProps {
  className?: string;
}

export function EditorTabManager({ className }: EditorTabManagerProps) {
  const [draggedTab, setDraggedTab] = useState<string | null>(null);
  const [dragOverTab, setDragOverTab] = useState<string | null>(null);
  
  const { 
    tabs, 
    activeTabId, 
    setActiveTab, 
    closeTab, 
    updateTab,
    addTab,
    reorderTabs
  } = useLayoutStore();
  
  const { 
    getDirtyState, 
    removeEditorState 
  } = useEditorStore();

  // Filter editor tabs only
  const editorTabs = tabs.filter(tab => tab.type === 'editor');

  const handleTabClick = useCallback((tabId: string) => {
    setActiveTab(tabId);
  }, [setActiveTab]);

  const handleTabClose = useCallback(async (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const isDirty = getDirtyState(tabId);
    if (isDirty) {
      // Show confirmation dialog for unsaved changes
      const shouldClose = confirm('You have unsaved changes. Are you sure you want to close this tab?');
      if (!shouldClose) return;
    }
    
    closeTab(tabId);
    removeEditorState(tabId);
  }, [closeTab, getDirtyState, removeEditorState]);

  const handleTabPin = useCallback((tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      updateTab(tabId, { isPinned: !tab.isPinned });
    }
  }, [tabs, updateTab]);

  const handleDragStart = useCallback((e: React.DragEvent, tabId: string) => {
    setDraggedTab(tabId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, tabId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTab(tabId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverTab(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    
    if (draggedTab && draggedTab !== targetTabId) {
      const draggedIndex = editorTabs.findIndex(tab => tab.id === draggedTab);
      const targetIndex = editorTabs.findIndex(tab => tab.id === targetTabId);
      
      if (draggedIndex !== -1 && targetIndex !== -1) {
        reorderTabs(draggedIndex, targetIndex);
      }
    }
    
    setDraggedTab(null);
    setDragOverTab(null);
  }, [draggedTab, editorTabs, reorderTabs]);

  const handleDragEnd = useCallback(() => {
    setDraggedTab(null);
    setDragOverTab(null);
  }, []);

  const getTabIcon = (tab: EditorTab) => {
    if (tab.path) {
      const ext = tab.path.split('.').pop()?.toLowerCase();
      // You could add more specific icons based on file type
      return <FileCode className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const handleCloseOthers = useCallback((tabId: string) => {
    editorTabs.forEach(tab => {
      if (tab.id !== tabId && !tab.isPinned) {
        const isDirty = getDirtyState(tab.id);
        if (!isDirty || confirm(`Close "${tab.title}" with unsaved changes?`)) {
          closeTab(tab.id);
          removeEditorState(tab.id);
        }
      }
    });
  }, [editorTabs, getDirtyState, closeTab, removeEditorState]);

  const handleCloseToRight = useCallback((tabId: string) => {
    const currentIndex = editorTabs.findIndex(tab => tab.id === tabId);
    const tabsToClose = editorTabs.slice(currentIndex + 1);
    
    tabsToClose.forEach(tab => {
      if (!tab.isPinned) {
        const isDirty = getDirtyState(tab.id);
        if (!isDirty || confirm(`Close "${tab.title}" with unsaved changes?`)) {
          closeTab(tab.id);
          removeEditorState(tab.id);
        }
      }
    });
  }, [editorTabs, getDirtyState, closeTab, removeEditorState]);

  const handleCloseAll = useCallback(() => {
    editorTabs.forEach(tab => {
      if (!tab.isPinned) {
        const isDirty = getDirtyState(tab.id);
        if (!isDirty || confirm(`Close "${tab.title}" with unsaved changes?`)) {
          closeTab(tab.id);
          removeEditorState(tab.id);
        }
      }
    });
  }, [editorTabs, getDirtyState, closeTab, removeEditorState]);

  const handleDuplicateTab = useCallback((tab: EditorTab) => {
    const newTab = {
      ...tab,
      title: `${tab.title} (Copy)`,
      isPinned: false,
      type: tab.type as 'editor',
    };
    addTab(newTab);
  }, [addTab]);

  if (editorTabs.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center bg-background border-b border-border/50 ${className || ''}`}>
      <div className="flex-1 flex items-center overflow-x-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {editorTabs.map((tab) => {
          const isDirty = getDirtyState(tab.id);
          const isActive = tab.id === activeTabId;
          const isDraggedOver = dragOverTab === tab.id;
          
          return (
            <div
              key={tab.id}
              className={`
                relative flex items-center min-w-0 max-w-xs group cursor-pointer select-none
                ${isActive 
                  ? 'bg-background border-b-2 border-primary text-foreground' 
                  : 'bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground'
                }
                ${isDraggedOver ? 'border-l-2 border-primary' : ''}
                ${draggedTab === tab.id ? 'opacity-50' : ''}
              `}
              onClick={() => handleTabClick(tab.id)}
              draggable
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={(e) => handleDragOver(e, tab.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, tab.id)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-center px-3 py-2 min-w-0 flex-1">
                {/* Pin indicator */}
                {tab.isPinned && (
                  <Pin className="w-3 h-3 mr-1 text-primary flex-shrink-0" />
                )}
                
                {/* File icon */}
                <div className="mr-2 flex-shrink-0 text-muted-foreground">
                  {getTabIcon(tab)}
                </div>
                
                {/* Title */}
                <span className="truncate text-sm">
                  {tab.title}
                  {isDirty && <span className="text-primary ml-1">•</span>}
                </span>
              </div>

              {/* Tab actions */}
              <div className="flex items-center pr-1">
                {/* Pin/Unpin button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleTabPin(tab.id, e)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  title={tab.isPinned ? 'Unpin tab' : 'Pin tab'}
                >
                  {tab.isPinned ? (
                    <PinOff className="w-3 h-3" />
                  ) : (
                    <Pin className="w-3 h-3" />
                  )}
                </Button>

                {/* More actions */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Tab Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {isDirty && (
                      <DropdownMenuItem>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuItem onClick={() => handleDuplicateTab(tab)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem>
                      <SplitSquareHorizontal className="w-4 h-4 mr-2" />
                      Split Horizontally
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem>
                      <SplitSquareVertical className="w-4 h-4 mr-2" />
                      Split Vertically
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => handleCloseOthers(tab.id)}>
                      Close Others
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => handleCloseToRight(tab.id)}>
                      Close to Right
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={handleCloseAll}>
                      Close All
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Close button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleTabClose(tab.id, e)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  title="Close tab"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Tab overflow indicator */}
      {editorTabs.length > 8 && (
        <div className="flex-shrink-0 px-2 border-l border-border/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="More tabs"
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 max-h-96 overflow-y-auto">
              <DropdownMenuLabel>Open Tabs</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {editorTabs.map((tab) => {
                const isDirty = getDirtyState(tab.id);
                const isActive = tab.id === activeTabId;
                
                return (
                  <DropdownMenuItem
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={isActive ? 'bg-accent' : ''}
                  >
                    <div className="flex items-center w-full">
                      {getTabIcon(tab)}
                      <span className="ml-2 truncate flex-1">
                        {tab.title}
                        {isDirty && <span className="text-primary ml-1">•</span>}
                      </span>
                      {tab.isPinned && <Pin className="w-3 h-3 ml-1 text-primary" />}
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}