'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Save, 
  Search, 
  Replace, 
  Settings, 
  RotateCcw, 
  RotateCw, 
  FileCode, 
  FolderOpen,
  Copy,
  Scissors,
  ClipboardPaste,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Indent,
  Outdent,
  Code,
  Palette,
  Download,
  Upload,
  Bookmark
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSub,
} from '@/components/ui/dropdown-menu';

interface EditorToolbarProps {
  isDirty?: boolean;
  fileName?: string;
  filePath?: string;
  canUndo?: boolean;
  canRedo?: boolean;
  fontSize?: number;
  showMinimap?: boolean;
  showLineNumbers?: boolean;
  wordWrap?: boolean;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onFindReplace?: () => void;
  onFormat?: () => void;
  onFontSizeChange?: (size: number) => void;
  onToggleMinimap?: () => void;
  onToggleLineNumbers?: () => void;
  onToggleWordWrap?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onIndent?: () => void;
  onOutdent?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  onBookmark?: () => void;
}

export function EditorToolbar({
  isDirty = false,
  fileName = 'Untitled',
  filePath,
  canUndo = false,
  canRedo = false,
  fontSize = 14,
  showMinimap = true,
  showLineNumbers = true,
  wordWrap = false,
  onSave,
  onUndo,
  onRedo,
  onFindReplace,
  onFormat,
  onFontSizeChange,
  onToggleMinimap,
  onToggleLineNumbers,
  onToggleWordWrap,
  onCopy,
  onCut,
  onPaste,
  onIndent,
  onOutdent,
  onExport,
  onImport,
  onBookmark,
}: EditorToolbarProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border/50 bg-background/95 backdrop-blur-sm">
      {/* Left section - File info and main actions */}
      <div className="flex items-center space-x-2">
        <FileCode className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">
          {fileName}
          {isDirty && <span className="text-primary ml-1">•</span>}
        </span>
        {filePath && (
          <span className="text-xs text-muted-foreground truncate max-w-md">
            {filePath}
          </span>
        )}
        
        <div className="flex items-center space-x-1 ml-4">
          {/* Save */}
          {isDirty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onSave}
              className="h-8 px-2"
              title="Save (⌘S)"
            >
              <Save className="w-4 h-4" />
            </Button>
          )}
          
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="h-8 px-2"
            title="Undo (⌘Z)"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="h-8 px-2"
            title="Redo (⌘⇧Z)"
          >
            <RotateCw className="w-4 h-4" />
          </Button>
          
          {/* Find/Replace */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              onFindReplace?.();
            }}
            className="h-8 px-2"
            title="Find & Replace (⌘F)"
          >
            <Search className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Center section - Edit actions */}
      <div className="flex items-center space-x-1">
        {/* Clipboard operations */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCopy}
          className="h-8 px-2"
          title="Copy (⌘C)"
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCut}
          className="h-8 px-2"
          title="Cut (⌘X)"
        >
          <Scissors className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onPaste}
          className="h-8 px-2"
          title="Paste (⌘V)"
        >
          <ClipboardPaste className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-4 bg-border mx-1" />
        
        {/* Indentation */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOutdent}
          className="h-8 px-2"
          title="Decrease Indent (⇧Tab)"
        >
          <Outdent className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onIndent}
          className="h-8 px-2"
          title="Increase Indent (Tab)"
        >
          <Indent className="w-4 h-4" />
        </Button>
        
        {/* Format */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onFormat}
          className="h-8 px-2"
          title="Format Document (⇧⌥F)"
        >
          <Code className="w-4 h-4" />
        </Button>
      </div>

      {/* Right section - View settings and tools */}
      <div className="flex items-center space-x-1">
        {/* Bookmarks */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onBookmark}
          className="h-8 px-2"
          title="Toggle Bookmark (⌘B)"
        >
          <Bookmark className="w-4 h-4" />
        </Button>

        {/* File operations */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              title="File Operations"
            >
              <FolderOpen className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>File Operations</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onImport}>
              <Upload className="w-4 h-4 mr-2" />
              Import File
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              title="View Settings"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>View Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuCheckboxItem
              checked={showLineNumbers}
              onCheckedChange={onToggleLineNumbers}
            >
              Show Line Numbers
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuCheckboxItem
              checked={showMinimap}
              onCheckedChange={onToggleMinimap}
            >
              Show Minimap
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuCheckboxItem
              checked={wordWrap}
              onCheckedChange={onToggleWordWrap}
            >
              Word Wrap
            </DropdownMenuCheckboxItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ZoomIn className="w-4 h-4 mr-2" />
                Font Size ({fontSize}px)
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {[10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24].map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => onFontSizeChange?.(size)}
                    className={fontSize === size ? 'bg-accent' : ''}
                  >
                    {size}px
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Editor settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              title="Editor Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Editor Settings</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Palette className="w-4 h-4 mr-2" />
                Theme
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Forge Dark</DropdownMenuItem>
                <DropdownMenuItem>Forge Light</DropdownMenuItem>
                <DropdownMenuItem>High Contrast</DropdownMenuItem>
                <DropdownMenuItem>System</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            
            <DropdownMenuItem>
              Tab Size: 2 spaces
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              Auto Save: Enabled
            </DropdownMenuItem>
            
            <DropdownMenuItem>
              Format on Save: Enabled
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}