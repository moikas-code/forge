'use client';

import { useState, useEffect, useRef } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { LogicalPosition, LogicalSize } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/plugin-shell';
import { 
  RefreshCw, 
  ExternalLink, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Search,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TauriWebviewBrowserProps {
  url?: string;
  className?: string;
  tabId: string;
}

export function TauriWebviewBrowser({ url: initialUrl, className, tabId }: TauriWebviewBrowserProps) {
  const [url, setUrl] = useState(initialUrl || 'https://developer.mozilla.org');
  const [inputUrl, setInputUrl] = useState(initialUrl || 'https://developer.mozilla.org');
  const [loading, setLoading] = useState(true);
  const [webview, setWebview] = useState<WebviewWindow | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([initialUrl || 'https://developer.mozilla.org']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const normalizeUrl = (urlString: string): string => {
    if (!/^https?:\/\//i.test(urlString)) {
      if (/^[\w.-]+\.\w+/.test(urlString)) {
        return `https://${urlString}`;
      }
      return `https://www.google.com/search?q=${encodeURIComponent(urlString)}`;
    }
    return urlString;
  };

  // Create embedded webview window
  useEffect(() => {
    if (!containerRef.current) return;

    const createWebview = async () => {
      try {
        console.log('[TauriWebviewBrowser] Creating WebviewWindow...');
        
        const mainWindow = getCurrentWindow();
        const container = containerRef.current;
        if (!container) return;

        // Get container position relative to window
        const rect = container.getBoundingClientRect();
        const scaleFactor = await mainWindow.scaleFactor();
        
        console.log('[TauriWebviewBrowser] Container rect:', rect);
        console.log('[TauriWebviewBrowser] Scale factor:', scaleFactor);

        // Create a unique label for this webview
        const webviewLabel = `browser-webview-${tabId}`;
        
        // First check if a webview with this label already exists and close it
        try {
          const existingWebview = WebviewWindow.getByLabel(webviewLabel);
          if (existingWebview) {
            await existingWebview.close();
          }
        } catch (e) {
          // Webview doesn't exist, which is fine
        }

        // Create embedded webview window
        const newWebview = new WebviewWindow(webviewLabel, {
          url: normalizeUrl(url),
          decorations: false,
          transparent: false,
          skipTaskbar: true,
          focus: false,
          alwaysOnTop: false,
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          parent: mainWindow,
          fileDropEnabled: false,
          maximizable: false,
          minimizable: false,
          resizable: false,
          title: 'Browser',
          visible: false, // Start hidden
        });

        // Set up event listeners before showing the window
        const unlistenCreated = await newWebview.once('tauri://created', async () => {
          console.log('[TauriWebviewBrowser] WebviewWindow created successfully');
          setLoading(false);
        });

        const unlistenError = await newWebview.once('tauri://error', (error) => {
          console.error('[TauriWebviewBrowser] WebviewWindow error:', error);
          setError('Failed to create browser window');
          setLoading(false);
        });

        // Try to show the window after a small delay to ensure it's ready
        setTimeout(async () => {
          try {
            // First ensure the window exists
            const exists = await WebviewWindow.getByLabel(webviewLabel);
            if (exists) {
              console.log('[TauriWebviewBrowser] Window exists, showing it...');
              await newWebview.show();
              
              // Position it after showing
              await newWebview.setPosition(new LogicalPosition(
                rect.left / scaleFactor,
                rect.top / scaleFactor
              ));
              
              await newWebview.setSize(new LogicalSize(
                rect.width / scaleFactor,
                rect.height / scaleFactor
              ));
            } else {
              console.error('[TauriWebviewBrowser] Window does not exist after creation');
              setError('Browser window creation failed');
            }
          } catch (showError) {
            console.error('[TauriWebviewBrowser] Failed to show/position webview:', showError);
            setError('Failed to display browser window');
          }
          setLoading(false);
        }, 100);

        setWebview(newWebview);
      } catch (error) {
        console.error('[TauriWebviewBrowser] Failed to create webview:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        setLoading(false);
      }
    };

    createWebview();

    // Cleanup
    return () => {
      if (webview) {
        webview.close().catch(console.error);
      }
    };
  }, [tabId, url]);

  // Update position when container resizes
  useEffect(() => {
    if (!webview || !containerRef.current) return;

    const updatePosition = async () => {
      try {
        const mainWindow = getCurrentWindow();
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const scaleFactor = await mainWindow.scaleFactor();

        await webview.setPosition(new LogicalPosition(
          rect.left / scaleFactor,
          rect.top / scaleFactor
        ));

        await webview.setSize(new LogicalSize(
          rect.width / scaleFactor,
          rect.height / scaleFactor
        ));
      } catch (error) {
        console.error('[TauriWebviewBrowser] Failed to update position:', error);
      }
    };

    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(containerRef.current);
    window.addEventListener('resize', updatePosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePosition);
    };
  }, [webview]);

  const navigateToUrl = async (newUrl: string) => {
    const normalizedUrl = normalizeUrl(newUrl);
    setLoading(true);
    setUrl(normalizedUrl);
    setInputUrl(normalizedUrl);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(normalizedUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Close current webview and recreate with new URL
    if (webview) {
      try {
        await webview.close();
        setWebview(null);
      } catch (e) {
        console.error('[TauriWebviewBrowser] Error closing webview:', e);
      }
    }
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToUrl(inputUrl);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const previousUrl = history[newIndex];
      navigateToUrl(previousUrl);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextUrl = history[newIndex];
      navigateToUrl(nextUrl);
    }
  };

  const handleRefresh = () => navigateToUrl(url);
  const handleHome = () => navigateToUrl('https://developer.mozilla.org');

  const handleOpenExternal = async () => {
    try {
      await open(url);
    } catch (err) {
      console.error('Failed to open external URL:', err);
    }
  };

  return (
    <div className={cn("h-full flex flex-col bg-cyber-black", className)}>
      {/* Browser Toolbar */}
      <div className="flex items-center space-x-2 px-4 py-2 border-b border-cyber-purple/30 bg-cyber-black/95 backdrop-blur-sm">
        {/* Navigation Controls */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            disabled={historyIndex === 0}
            className="h-8 w-8 text-cyber-gray-400 hover:text-cyber-purple disabled:opacity-30"
            title="Go back"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleForward}
            disabled={historyIndex === history.length - 1}
            className="h-8 w-8 text-cyber-gray-400 hover:text-cyber-purple disabled:opacity-30"
            title="Go forward"
          >
            <ChevronRight size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className={cn(
              "h-8 w-8 text-cyber-gray-400 hover:text-cyber-purple",
              loading && "animate-spin"
            )}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleHome}
            className="h-8 w-8 text-cyber-gray-400 hover:text-cyber-purple"
            title="Home"
          >
            <Home size={16} />
          </Button>
        </div>

        {/* URL Bar */}
        <form onSubmit={handleNavigate} className="flex-1 flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className="w-full px-3 py-1.5 pr-10 text-sm bg-cyber-gray-800 border border-cyber-purple/30 rounded-md 
                       focus:outline-none focus:ring-1 focus:ring-cyber-purple focus:border-cyber-purple
                       font-mono text-xs text-cyber-gray-200 placeholder-cyber-gray-500"
              placeholder="Search or enter URL..."
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-cyber-gray-500" />
          </div>
        </form>

        {/* External Link */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenExternal}
          className="h-8 w-8 text-cyber-gray-400 hover:text-cyber-purple"
          title="Open in external browser"
        >
          <ExternalLink size={16} />
        </Button>
      </div>

      {/* Browser Content */}
      <div className="flex-1 relative" ref={containerRef}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-cyber-black/80 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-cyber-purple" />
              <p className="text-sm text-cyber-gray-400">Loading...</p>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-cyber-black">
            <div className="text-center space-y-4 p-8 max-w-md">
              <div className="w-16 h-16 mx-auto bg-cyber-purple/10 rounded-lg flex items-center justify-center">
                <Globe className="w-8 h-8 text-cyber-purple" />
              </div>
              <h3 className="text-lg font-medium text-cyber-gray-200">Browser Error</h3>
              <p className="text-sm text-cyber-gray-400">{error}</p>
              <Button onClick={handleRefresh} variant="default" size="sm">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}