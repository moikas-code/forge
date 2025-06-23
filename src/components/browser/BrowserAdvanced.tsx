'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import { injectConsoleCapture, type ConsoleMessage } from '@/services/browser/consoleCapture';
import { screenCaptureService } from '@/services/browser/screenCapture';
import { use_browser_store } from '@/stores/browserStore';
import { 
  RefreshCw, 
  ExternalLink, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Loader2,
  Code2,
  Smartphone,
  Tablet,
  Monitor,
  Camera,
  Video,
  Terminal,
  X,
  CheckCircle,
  Settings,
  Star,
  Bookmark,
  History,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface BrowserAdvancedProps {
  path?: string;
  url?: string;
  className?: string;
}

interface ViewportPreset {
  name: string;
  width: number;
  height: number;
  device_scale_factor: number;
}

export function BrowserAdvanced({ path, url: initialUrl, className }: BrowserAdvancedProps) {
  const { 
    bookmarks, 
    settings, 
    add_bookmark, 
    remove_bookmark, 
    add_history_item,
    search_bookmarks,
    search_history 
  } = use_browser_store();
  const [url, setUrl] = useState(initialUrl || settings.homepage);
  const [inputUrl, setInputUrl] = useState(initialUrl || settings.homepage);
  const [pageTitle, setPageTitle] = useState('New Tab');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [useWebView, setUseWebView] = useState(false); // Default to iframe mode
  const [webViewId, setWebViewId] = useState<string | null>(null);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [viewportPresets, setViewportPresets] = useState<ViewportPreset[]>([]);
  const [currentViewport, setCurrentViewport] = useState<ViewportPreset | null>(null);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const [showConsole, setShowConsole] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hotReloadEnabled, setHotReloadEnabled] = useState(true);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [history, setHistory] = useState<string[]>([initialUrl || settings.homepage]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const hotReloadIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load viewport presets on mount
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const presets = await invoke<ViewportPreset[]>('get_browser_viewport_presets');
        setViewportPresets(presets);
      } catch (err) {
        console.error('Failed to load viewport presets:', err);
      }
    };
    loadPresets();
  }, []);
  
  const createWebView = async () => {
    try {
      const id = await invoke<string>('create_webview_window', { 
        url: url, 
        title: 'Browser Preview' 
      });
      setWebViewId(id);
      setError(null);
    } catch (err) {
      console.error('Failed to create WebView:', err);
      setError('Failed to create WebView window. Falling back to iframe mode.');
      setUseWebView(false);
    }
  };

  // Hot reload functionality
  useEffect(() => {
    if (hotReloadEnabled && !useWebView && url.includes('localhost')) {
      hotReloadIntervalRef.current = setInterval(() => {
        if (iframeRef.current && document.hasFocus()) {
          // Check if iframe is still responsive
          try {
            // This will fail if the iframe is not same-origin
            const iframeDoc = iframeRef.current.contentDocument;
            if (iframeDoc) {
              // Reload silently if the page has changed
              iframeRef.current.src = iframeRef.current.src;
            }
          } catch (e) {
            // Cross-origin, can't check for changes
          }
        }
      }, 1000);

      return () => {
        if (hotReloadIntervalRef.current) {
          clearInterval(hotReloadIntervalRef.current);
        }
      };
    }
  }, [hotReloadEnabled, useWebView, url]);

  // Console message polling (when using WebView)
  useEffect(() => {
    if (useWebView && showConsole) {
      const interval = setInterval(async () => {
        try {
          const messages = await invoke<ConsoleMessage[]>('get_browser_console_logs');
          setConsoleMessages(messages);
        } catch (err) {
          console.error('Failed to get console logs:', err);
        }
      }, 500);

      return () => clearInterval(interval);
    }
  }, [useWebView, showConsole]);

  useEffect(() => {
    if (path) {
      // If path is provided, use it as URL or convert file path to localhost URL
      if (path.startsWith('http://') || path.startsWith('https://')) {
        navigateToUrl(path);
      } else {
        // Convert file path to localhost URL for local development
        const newUrl = `http://localhost:3000/${path.split('/').pop()}`;
        navigateToUrl(newUrl);
      }
    }
  }, [path]);

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const navigateToUrl = async (newUrl: string) => {
    if (!isValidUrl(newUrl)) {
      setError('Invalid URL');
      return;
    }

    setError(null);
    setLoading(true);
    
    if (useWebView && webViewId) {
      try {
        await invoke('navigate_browser', { windowId: webViewId, url: newUrl });
      } catch (err) {
        setError(`Navigation failed: ${err}`);
      }
    } else {
      setUrl(newUrl);
    }
    
    setInputUrl(newUrl);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    // Update navigation state
    setCanGoBack(historyIndex > 0);
    setCanGoForward(false);
    
    // Add to browser history
    add_history_item({
      title: pageTitle || newUrl,
      url: newUrl,
      visited_at: Date.now()
    });
  };
  
  const is_bookmarked = useCallback(() => {
    return bookmarks.some(b => b.url === url);
  }, [bookmarks, url]);
  
  const toggle_bookmark = () => {
    if (is_bookmarked()) {
      const bookmark = bookmarks.find(b => b.url === url);
      if (bookmark) {
        remove_bookmark(bookmark.id);
      }
    } else {
      add_bookmark({
        title: pageTitle || url,
        url: url
      });
    }
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToUrl(inputUrl);
  };

  const handleGoBack = async () => {
    if (useWebView && webViewId) {
      try {
        await invoke('browser_go_back', { windowId: webViewId });
      } catch (err) {
        console.error('Failed to go back:', err);
      }
    } else if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousUrl = history[newIndex];
      setHistoryIndex(newIndex);
      setUrl(previousUrl);
      setInputUrl(previousUrl);
      setCanGoBack(newIndex > 0);
      setCanGoForward(true);
      setLoading(true);
    }
  };

  const handleGoForward = async () => {
    if (useWebView && webViewId) {
      try {
        await invoke('browser_go_forward', { windowId: webViewId });
      } catch (err) {
        console.error('Failed to go forward:', err);
      }
    } else if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextUrl = history[newIndex];
      setHistoryIndex(newIndex);
      setUrl(nextUrl);
      setInputUrl(nextUrl);
      setCanGoBack(true);
      setCanGoForward(newIndex < history.length - 1);
      setLoading(true);
    }
  };

  const handleRefresh = async () => {
    if (useWebView && webViewId) {
      try {
        await invoke('browser_refresh', { windowId: webViewId });
      } catch (err) {
        console.error('Failed to refresh:', err);
      }
    } else if (iframeRef.current) {
      setLoading(true);
      setError(null);
      // Force refresh by setting src again
      const currentSrc = iframeRef.current.src;
      iframeRef.current.src = 'about:blank';
      setTimeout(() => {
        if (iframeRef.current) {
          iframeRef.current.src = currentSrc;
        }
      }, 0);
    }
  };

  const handleHome = () => {
    navigateToUrl(settings.homepage);
  };

  const handleOpenExternal = async () => {
    if (url) {
      try {
        await open(url);
      } catch (err) {
        console.error('Failed to open external URL:', err);
        setError('Failed to open URL in external browser');
      }
    }
  };

  const toggleDevTools = async () => {
    if (useWebView && webViewId) {
      try {
        await invoke('toggle_browser_devtools', { windowId: webViewId });
        setDevToolsOpen(!devToolsOpen);
      } catch (err) {
        console.error('Failed to toggle DevTools:', err);
      }
    }
  };

  const handleViewportChange = async (preset: ViewportPreset) => {
    if (useWebView && webViewId) {
      try {
        await invoke('set_browser_viewport', { 
          windowId: webViewId, 
          width: preset.width, 
          height: preset.height 
        });
        setCurrentViewport(preset);
      } catch (err) {
        console.error('Failed to set viewport:', err);
      }
    } else if (iframeRef.current) {
      // For iframe, we can only change the container size
      iframeRef.current.style.width = `${preset.width}px`;
      iframeRef.current.style.height = `${preset.height}px`;
      setCurrentViewport(preset);
    }
  };

  const handleScreenshot = async () => {
    try {
      if (useWebView && webViewId) {
        await invoke('capture_browser_screenshot', { windowId: webViewId });
      } else if (iframeRef.current) {
        // For iframe, use client-side screenshot
        const blob = await screenCaptureService.captureIframeScreenshot(iframeRef.current);
        if (blob) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const filename = `screenshot-${timestamp}.png`;
          const saved = await screenCaptureService.saveFile(blob, filename);
          if (saved) {
            // Show success message (could add a toast notification here)
            console.log('Screenshot saved:', filename);
          } else {
            setError('Failed to save screenshot');
          }
        } else {
          setError('Failed to capture screenshot');
        }
      }
    } catch (err) {
      console.error('Failed to capture screenshot:', err);
      setError('Failed to capture screenshot');
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      const blob = await screenCaptureService.stopRecording();
      if (blob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `recording-${timestamp}.webm`;
        const saved = await screenCaptureService.saveFile(blob, filename);
        if (saved) {
          console.log('Recording saved:', filename);
        }
      }
      setIsRecording(false);
    } else {
      // Start recording
      const element = iframeRef.current || document.body;
      const started = await screenCaptureService.startRecording(element, {
        fps: 30,
        audio: false
      });
      setIsRecording(started);
    }
  };

  const clearConsole = async () => {
    if (useWebView) {
      try {
        await invoke('clear_browser_console_logs');
        setConsoleMessages([]);
      } catch (err) {
        console.error('Failed to clear console:', err);
      }
    } else {
      setConsoleMessages([]);
    }
  };

  const toggleWebView = async () => {
    if (!useWebView) {
      // Switch to WebView
      setUseWebView(true);
      await createWebView();
    } else {
      // Switch back to iframe
      setUseWebView(false);
      setWebViewId(null);
    }
  };

  const handleIframeLoad = () => {
    setLoading(false);
    setError(null);
    
    // Try to get page title
    if (iframeRef.current) {
      try {
        const iframeDoc = iframeRef.current.contentDocument;
        if (iframeDoc && iframeDoc.title) {
          setPageTitle(iframeDoc.title);
        }
      } catch (e) {
        // Cross-origin, can't access title
        setPageTitle(url);
      }
    }
    
    // Set up console capture for iframe
    if (iframeRef.current && !useWebView) {
      injectConsoleCapture(iframeRef.current, (msg) => {
        setConsoleMessages(prev => [...prev, msg].slice(-1000)); // Keep last 1000 messages
      });
    }
  };

  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load the page. Make sure your development server is running.');
  };

  const getConsoleLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'info': return 'text-blue-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <TooltipProvider>
      <div className={`h-full flex flex-col bg-background ${className || ''}`}>
        {/* Browser Toolbar */}
        <div className="flex items-center space-x-2 px-4 py-2 border-b border-border/50 bg-background/95 backdrop-blur-sm">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleGoBack}
                  disabled={!canGoBack || loading}
                  className="h-8 w-8"
                >
                  <ChevronLeft size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Go Back</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleGoForward}
                  disabled={!canGoForward || loading}
                  className="h-8 w-8"
                >
                  <ChevronRight size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Go Forward</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={loading}
                  className="h-8 w-8"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleHome}
                  className="h-8 w-8"
                >
                  <Home size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Home</TooltipContent>
            </Tooltip>
          </div>

          {/* URL Bar */}
          <form onSubmit={handleNavigate} className="flex-1 flex items-center gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !inputUrl.includes('://')) {
                    // If no protocol, treat as search
                    e.preventDefault();
                    navigateToUrl(`${settings.default_search_engine}${encodeURIComponent(inputUrl)}`);
                  }
                }}
                className="w-full px-3 py-1.5 pr-10 text-sm bg-secondary/50 border border-border/50 rounded-md 
                         focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50
                         font-mono text-xs"
                placeholder="Search or enter URL..."
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            </div>
            
            {/* Bookmark Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggle_bookmark}
                  className="h-8 w-8"
                >
                  {is_bookmarked() ? (
                    <Star size={16} className="fill-yellow-500 text-yellow-500" />
                  ) : (
                    <Star size={16} />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {is_bookmarked() ? 'Remove bookmark' : 'Add bookmark'}
              </TooltipContent>
            </Tooltip>
          </form>

          {/* Tool buttons */}
          <div className="flex items-center space-x-1">
            {/* Bookmarks Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Bookmark size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="p-2 text-sm font-medium">Bookmarks</div>
                <DropdownMenuSeparator />
                {bookmarks.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No bookmarks yet</div>
                ) : (
                  bookmarks.slice(0, 10).map((bookmark) => (
                    <DropdownMenuItem
                      key={bookmark.id}
                      onClick={() => navigateToUrl(bookmark.url)}
                      className="flex items-center gap-2"
                    >
                      <Star size={12} className="text-yellow-500" />
                      <div className="flex-1 truncate">
                        <div className="text-sm truncate">{bookmark.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{bookmark.url}</div>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* History Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <History size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="p-2 text-sm font-medium">History</div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => use_browser_store.getState().clear_history()}>
                  Clear browsing history
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Viewport Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  title="Viewport Size"
                >
                  {currentViewport ? <Smartphone size={16} /> : <Monitor size={16} />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setCurrentViewport(null)}>
                  <Monitor className="mr-2 h-4 w-4" />
                  Default
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {viewportPresets.map((preset) => (
                  <DropdownMenuItem 
                    key={preset.name} 
                    onClick={() => handleViewportChange(preset)}
                  >
                    {preset.name} ({preset.width}×{preset.height})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* DevTools Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleDevTools}
                  className={`h-8 w-8 ${devToolsOpen ? 'bg-accent' : ''}`}
                  disabled={!useWebView}
                >
                  <Code2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle DevTools</TooltipContent>
            </Tooltip>

            {/* Console Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowConsole(!showConsole)}
                  className={`h-8 w-8 ${showConsole ? 'bg-accent' : ''}`}
                >
                  <Terminal size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Toggle Console</TooltipContent>
            </Tooltip>

            {/* Screenshot */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleScreenshot}
                  className="h-8 w-8"
                >
                  <Camera size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Take Screenshot</TooltipContent>
            </Tooltip>

            {/* Recording Toggle */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleRecording}
                  className={`h-8 w-8 ${isRecording ? 'text-red-500' : ''}`}
                >
                  <Video size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isRecording ? 'Stop Recording' : 'Start Recording'}</TooltipContent>
            </Tooltip>

            {/* Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Settings size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={toggleWebView}>
                  <CheckCircle className={`mr-2 h-4 w-4 ${useWebView ? '' : 'opacity-0'}`} />
                  Use Native WebView
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setHotReloadEnabled(!hotReloadEnabled)}>
                  <CheckCircle className={`mr-2 h-4 w-4 ${hotReloadEnabled ? '' : 'opacity-0'}`} />
                  Hot Reload
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleOpenExternal}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in External Browser
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Browser Content */}
        <div className="flex-1 flex flex-col relative">
          {/* Main View */}
          <div className={`flex-1 relative bg-white ${showConsole ? 'h-2/3' : ''}`}>
            {error ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background">
                <div className="text-center space-y-4 p-8">
                  <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">Error Loading Page</h3>
                  <p className="text-sm text-muted-foreground max-w-md">{error}</p>
                  <Button 
                    onClick={handleRefresh} 
                    variant="outline"
                    size="sm"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                    <div className="flex flex-col items-center space-y-4">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                  </div>
                )}
                {useWebView ? (
                  <div className="flex items-center justify-center h-full bg-background">
                    <div className="text-center space-y-4 p-8">
                      <Monitor className="w-16 h-16 text-primary mx-auto" />
                      <h3 className="text-lg font-medium text-foreground">Browser Window Active</h3>
                      <p className="text-sm text-muted-foreground max-w-md">
                        The webpage is displayed in a separate native window for better compatibility.
                      </p>
                      {webViewId && (
                        <p className="text-xs text-muted-foreground">
                          Window ID: {webViewId}
                        </p>
                      )}
                      <Button 
                        onClick={toggleWebView} 
                        variant="outline"
                        size="sm"
                      >
                        Switch to Embedded Mode
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={currentViewport ? 'flex items-center justify-center h-full bg-gray-100' : 'w-full h-full'}>
                    <iframe
                      ref={iframeRef}
                      src={url}
                      className={currentViewport ? 'border shadow-lg' : 'w-full h-full border-0'}
                      style={currentViewport ? {
                        width: `${currentViewport.width}px`,
                        height: `${currentViewport.height}px`,
                      } : undefined}
                      onLoad={handleIframeLoad}
                      onError={handleIframeError}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-presentation allow-top-navigation-by-user-activation"
                      title="Browser Preview"
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Console Panel */}
          {showConsole && (
            <div className="h-1/3 border-t border-border bg-background">
              <div className="flex items-center justify-between px-4 py-2 border-b border-border">
                <h3 className="text-sm font-medium">Console</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearConsole}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowConsole(false)}
                    className="h-6 w-6"
                  >
                    <X size={14} />
                  </Button>
                </div>
              </div>
              <div className="h-full overflow-auto p-2 font-mono text-xs">
                {consoleMessages.length === 0 ? (
                  <p className="text-muted-foreground">No console messages</p>
                ) : (
                  consoleMessages.map((msg, index) => (
                    <div key={index} className={`py-1 ${getConsoleLevelColor(msg.level)}`}>
                      <span className="opacity-60">[{msg.level}]</span> {msg.message}
                      {msg.source && (
                        <span className="opacity-40 ml-2">
                          {msg.source}:{msg.line}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}