'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Editor, { Monaco } from '@monaco-editor/react';
import { getFileSystemService } from '@/services/electron/filesystem';
import { useLayoutStore } from '@/stores/layoutStore';
import { useEditorStore } from '@/stores/editorStore';
import { configureMonaco, getEditorOptions, getLanguageFromExtension } from '@/lib/monaco-config';
import { Save, X, FileCode, Loader2 } from 'lucide-react';
import type { editor } from 'monaco-editor';
import { EditorToolbar } from './EditorToolbar';
import { FindReplacePanel } from './FindReplacePanel';
import { useFileWatcher } from '@/hooks/useFileWatcher';

interface CodeEditorProps {
  tabId: string;
  path?: string;
  content?: string;
  className?: string;
}

export function CodeEditor({ tabId, path, content: initialContent, className }: CodeEditorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);
  const [findMatches, setFindMatches] = useState({ count: 0, current: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const monacoConfigured = useRef(false);
  
  const updateTab = useLayoutStore((state) => state.updateTab);
  const { 
    getEditorState, 
    setEditorState, 
    setDirtyState,
    getDirtyState 
  } = useEditorStore();
  
  const editorState = getEditorState(tabId);
  const isDirty = getDirtyState(tabId);

  // SSR safety - only mount on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Set up file watching
  const { watchFile, unwatchFile } = useFileWatcher({
    onFileChanged: (event) => {
      console.log('File changed:', event);
    },
    onFileDeleted: (filePath) => {
      console.log('File deleted:', filePath);
    },
    showNotification: true,
  });

  const get_language_from_path = useCallback((filepath: string): string => {
    const ext = filepath.split('.').pop()?.toLowerCase();
    return getLanguageFromExtension(ext || '');
  }, []);

  const loadFile = useCallback(async (filepath: string) => {
    setLoading(true);
    setError(null);
    try {
      const fs = getFileSystemService();
      const content = await fs.readFile(filepath);
      setEditorState(tabId, { 
        content, 
        path: filepath,
        language: get_language_from_path(filepath)
      });
      setDirtyState(tabId, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load file');
      console.error('Error loading file:', err);
    } finally {
      setLoading(false);
    }
  }, [tabId, setEditorState, setDirtyState, get_language_from_path]);

  // Load file content
  useEffect(() => {
    if (path && !editorState?.content) {
      loadFile(path);
    }
  }, [path, editorState?.content, loadFile]);

  // Update tab title with dirty indicator
  useEffect(() => {
    if (path) {
      const fileName = path.split('/').pop() || 'Untitled';
      updateTab(tabId, { 
        title: isDirty ? `${fileName} •` : fileName 
      });
    }
  }, [isDirty, path, tabId, updateTab]);

  const saveFile = useCallback(async () => {
    if (!path || !editorState?.content || saving) return;
    
    setSaving(true);
    try {
      const fs = getFileSystemService();
      await fs.writeFile(path, editorState.content);
      setDirtyState(tabId, false);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save file');
      console.error('Error saving file:', err);
    } finally {
      setSaving(false);
    }
  }, [path, editorState?.content, saving, tabId, setDirtyState]);

  const handle_editor_did_mount = useCallback((editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
    try {
      editorRef.current = editor;
      monacoRef.current = monaco;
      
      // Configure Monaco only once
      if (!monacoConfigured.current) {
        try {
          configureMonaco(monaco);
          monacoConfigured.current = true;
        } catch (configError) {
          console.error('Failed to configure Monaco:', configError);
          setError('Failed to configure editor. Please try refreshing the page.');
          return;
        }
      }
      
      // Apply editor options
      try {
        editor.updateOptions(getEditorOptions(theme));
      } catch (optionsError) {
        console.error('Failed to apply editor options:', optionsError);
      }

      // Save on Cmd/Ctrl+S
      try {
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
          saveFile().catch(console.error);
        });
      } catch (commandError) {
        console.error('Failed to add save command:', commandError);
      }

      // Focus editor
      try {
        editor.focus();
      } catch (focusError) {
        console.error('Failed to focus editor:', focusError);
      }
      
      // Clear any previous errors
      setError(null);
    } catch (mountError) {
      console.error('Failed to mount editor:', mountError);
      setError('Failed to initialize editor. Please try refreshing the page.');
    }
  }, [theme, saveFile]);

  const handleEditorChange = useCallback((value: string | undefined) => {
    if (value !== undefined) {
      setEditorState(tabId, { content: value });
      setDirtyState(tabId, true);
    }
  }, [tabId, setEditorState, setDirtyState]);

  // Editor action handlers
  const handleUndo = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'undo', null);
  }, []);

  const handleRedo = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'redo', null);
  }, []);

  const handleFormat = useCallback(() => {
    editorRef.current?.getAction('editor.action.formatDocument')?.run();
  }, []);

  const handleCopy = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'editor.action.clipboardCopyAction', null);
  }, []);

  const handleCut = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'editor.action.clipboardCutAction', null);
  }, []);

  const handlePaste = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'editor.action.clipboardPasteAction', null);
  }, []);

  const handleIndent = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'editor.action.indentLines', null);
  }, []);

  const handleOutdent = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'editor.action.outdentLines', null);
  }, []);

  const handleFind = useCallback((term: string, options: any) => {
    if (!editorRef.current || !term) return;
    
    const matches = editorRef.current.getModel()?.findMatches(
      term,
      false,
      options.useRegex,
      options.caseSensitive,
      options.wholeWord ? term : null,
      true
    );
    
    setFindMatches({ count: matches?.length || 0, current: 0 });
  }, []);

  const handleReplace = useCallback((findTerm: string, replaceTerm: string, options: any) => {
    editorRef.current?.trigger('keyboard', 'editor.action.startFindReplaceAction', null);
  }, []);

  const handleReplaceAll = useCallback((findTerm: string, replaceTerm: string, options: any) => {
    if (!editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    const matches = model.findMatches(
      findTerm,
      false,
      options.useRegex,
      options.caseSensitive,
      options.wholeWord ? findTerm : null,
      true
    );

    if (matches) {
      editorRef.current.executeEdits('replace-all', matches.map(match => ({
        range: match.range,
        text: replaceTerm
      })));
    }
  }, []);

  const handleFindNext = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'editor.action.nextMatchFindAction', null);
  }, []);

  const handleFindPrevious = useCallback(() => {
    editorRef.current?.trigger('keyboard', 'editor.action.previousMatchFindAction', null);
  }, []);

  const handleFontSizeChange = useCallback((newSize: number) => {
    setFontSize(newSize);
    editorRef.current?.updateOptions({ fontSize: newSize });
  }, []);

  const handleToggleMinimap = useCallback(() => {
    const newValue = !showMinimap;
    setShowMinimap(newValue);
    editorRef.current?.updateOptions({ minimap: { enabled: newValue } });
  }, [showMinimap]);

  const handleToggleLineNumbers = useCallback(() => {
    const newValue = !showLineNumbers;
    setShowLineNumbers(newValue);
    editorRef.current?.updateOptions({ lineNumbers: newValue ? 'on' : 'off' });
  }, [showLineNumbers]);

  const handleToggleWordWrap = useCallback(() => {
    const newValue = !wordWrap;
    setWordWrap(newValue);
    editorRef.current?.updateOptions({ wordWrap: newValue ? 'on' : 'off' });
  }, [wordWrap]);

  // Handle theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };

    // Initial theme detection
    handleThemeChange();

    // Listen for theme changes
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  // Update Monaco theme when theme changes
  useEffect(() => {
    if (monacoRef.current && editorRef.current) {
      try {
        monacoRef.current.editor.setTheme(theme === 'dark' ? 'forge-dark' : 'forge-light');
      } catch (themeError) {
        console.error('Failed to update Monaco theme:', themeError);
      }
    }
  }, [theme]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try {
        if (editorRef.current) {
          editorRef.current.dispose();
          editorRef.current = null;
        }
        if (monacoRef.current) {
          monacoRef.current = null;
        }
      } catch (cleanupError) {
        console.error('Error during editor cleanup:', cleanupError);
      }
    };
  }, []);

  return (
    <div className={`h-full flex flex-col bg-editor-background ${className || ''}`}>
      {/* Enhanced Editor Toolbar */}
      <EditorToolbar
        isDirty={isDirty}
        fileName={path?.split('/').pop() || 'Untitled'}
        filePath={path}
        canUndo={true} // TODO: Track actual undo/redo state
        canRedo={true}
        fontSize={fontSize}
        showMinimap={showMinimap}
        showLineNumbers={showLineNumbers}
        wordWrap={wordWrap}
        onSave={saveFile}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onFindReplace={() => setShowFindReplace(true)}
        onFormat={handleFormat}
        onFontSizeChange={handleFontSizeChange}
        onToggleMinimap={handleToggleMinimap}
        onToggleLineNumbers={handleToggleLineNumbers}
        onToggleWordWrap={handleToggleWordWrap}
        onCopy={handleCopy}
        onCut={handleCut}
        onPaste={handlePaste}
        onIndent={handleIndent}
        onOutdent={handleOutdent}
        onExport={() => {/* TODO: Implement export */}}
        onImport={() => {/* TODO: Implement import */}}
        onBookmark={() => {/* TODO: Implement bookmarks */}}
      />

      {/* Find and Replace Panel */}
      <FindReplacePanel
        isOpen={showFindReplace}
        onClose={() => setShowFindReplace(false)}
        onFind={handleFind}
        onReplace={handleReplace}
        onReplaceAll={handleReplaceAll}
        onFindNext={handleFindNext}
        onFindPrevious={handleFindPrevious}
        matchCount={findMatches.count}
        currentMatch={findMatches.current}
      />

      {/* Editor Content */}
      <div className="flex-1 relative">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-muted-foreground">Loading file...</p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
            <X className="w-12 h-12 text-destructive mb-4" />
            <p className="text-destructive text-center">{error}</p>
            {path && (
              <button
                onClick={() => loadFile(path)}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Retry
              </button>
            )}
          </div>
        ) : isMounted ? (
          <Editor
            height="100%"
            defaultLanguage={editorState?.language || 'plaintext'}
            language={editorState?.language || 'plaintext'}
            value={editorState?.content || initialContent || ''}
            onChange={handleEditorChange}
            onMount={handle_editor_did_mount}
            theme={theme === 'dark' ? 'forge-dark' : 'forge-light'}
            options={getEditorOptions(theme)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-muted-foreground">Initializing editor...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}