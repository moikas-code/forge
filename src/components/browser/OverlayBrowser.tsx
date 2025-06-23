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

interface OverlayBrowserProps {
  url?: string;
  className?: string;
  tabId: string;
}

export function OverlayBrowser({ url: initialUrl, className, tabId }: OverlayBrowserProps) {
  const [url, setUrl] = useState(initialUrl || 'https://developer.mozilla.org');
  const [inputUrl, setInputUrl] = useState(initialUrl || 'https://developer.mozilla.org');
  const [loading, setLoading] = useState(true);
  const [webview, setWebview] = useState<WebviewWindow | null>(null);
  const webviewRef = useRef<WebviewWindow | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([initialUrl || 'https://developer.mozilla.org']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  const normalizeUrl = (urlString: string): string => {
    if (!/^https?:\/\//i.test(urlString)) {
      if (/^[\w.-]+\.\w+/.test(urlString)) {
        return `https://${urlString}`;
      }
      return `https://www.google.com/search?q=${encodeURIComponent(urlString)}`;
    }
    return urlString;
  };

  // Create and position overlay webview
  useEffect(() => {
    if (!containerRef.current) return;

    const createOverlayWebview = async () => {
      try {
        console.log('[OverlayBrowser] Creating overlay webview...');
        
        const mainWindow = getCurrentWindow();
        const container = containerRef.current;
        if (!container) return;

        // Get main window position
        const mainPosition = await mainWindow.outerPosition();
        const scaleFactor = await mainWindow.scaleFactor();
        
        // Get container position relative to viewport
        const rect = container.getBoundingClientRect();
        
        // Calculate absolute position
        const x = mainPosition.x + (rect.left / scaleFactor);
        const y = mainPosition.y + (rect.top / scaleFactor) + 60; // Add offset for window title bar
        
        const webviewLabel = `overlay-browser-${tabId}`;
        
        // Check if webview already exists
        try {
          const existing = WebviewWindow.getByLabel(webviewLabel);
          if (existing) {
            await existing.close();
          }
        } catch (e) {
          // Webview doesn't exist, which is fine
        }

        // Create overlay webview
        const newWebview = new WebviewWindow(webviewLabel, {
          url: normalizeUrl(url),
          decorations: false,
          transparent: false,
          skipTaskbar: true,
          focus: true,
          alwaysOnTop: false,
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(rect.width / scaleFactor),
          height: Math.round(rect.height / scaleFactor),
          resizable: false,
          maximizable: false,
          minimizable: false,
          closable: true,
          title: '',
          visible: true,
        });

        // Listen for creation
        await newWebview.once('tauri://created', () => {
          console.log('[OverlayBrowser] Overlay webview created successfully');
          setLoading(false);
        });

        await newWebview.once('tauri://error', (error) => {
          console.error('[OverlayBrowser] Webview error:', error);
          setLoading(false);
        });

        setWebview(newWebview);
        webviewRef.current = newWebview;
      } catch (error) {
        console.error('[OverlayBrowser] Failed to create overlay webview:', error);
        setLoading(false);
      }
    };

    createOverlayWebview();

    // Cleanup
    return () => {
      if (webviewRef.current) {
        const webviewToClose = webviewRef.current;
        webviewToClose.close().catch(console.error);
        webviewRef.current = null;
      }
    };
  }, [tabId, url]); // Re-create webview when URL changes

  // Update overlay position when container moves/resizes
  useEffect(() => {
    if (!webview || !containerRef.current) return;

    const updatePosition = async () => {
      try {
        const mainWindow = getCurrentWindow();
        const container = containerRef.current;
        if (!container) return;

        const mainPosition = await mainWindow.outerPosition();
        const scaleFactor = await mainWindow.scaleFactor();
        const rect = container.getBoundingClientRect();
        
        const x = mainPosition.x + (rect.left / scaleFactor);
        const y = mainPosition.y + (rect.top / scaleFactor) + 60;

        await webview.setPosition(new LogicalPosition(x, y));
        await webview.setSize(new LogicalSize(
          rect.width / scaleFactor,
          rect.height / scaleFactor
        ));
      } catch (error) {
        console.error('[OverlayBrowser] Failed to update position:', error);
      }
    };

    // Debounce updates
    const debouncedUpdate = () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      updateTimeoutRef.current = setTimeout(updatePosition, 50);
    };

    const resizeObserver = new ResizeObserver(debouncedUpdate);
    resizeObserver.observe(containerRef.current);
    
    window.addEventListener('resize', debouncedUpdate);
    window.addEventListener('scroll', debouncedUpdate);

    // Listen for main window move
    const unlisten = getCurrentWindow().onMoved(debouncedUpdate);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', debouncedUpdate);
      window.removeEventListener('scroll', debouncedUpdate);
      unlisten.then(fn => fn()).catch(console.error);
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [webview]);

  const navigateToUrl = async (newUrl: string) => {
    const normalizedUrl = normalizeUrl(newUrl);
    setUrl(normalizedUrl);
    setInputUrl(normalizedUrl);
    setLoading(true);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(normalizedUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToUrl(inputUrl);
  };

  const handleBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      navigateToUrl(history[newIndex]);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      navigateToUrl(history[newIndex]);
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

  // Hide overlay when tab is not active
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (webview && containerRef.current) {
        const isVisible = containerRef.current.offsetParent !== null;
        if (isVisible) {
          webview.show().catch(console.error);
        } else {
          webview.hide().catch(console.error);
        }
      }
    };

    // Check visibility on mount and when DOM changes
    handleVisibilityChange();
    const observer = new MutationObserver(handleVisibilityChange);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [webview]);

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

      {/* Browser Content Container */}
      <div className="flex-1 relative bg-white" ref={containerRef}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-cyber-black/80 backdrop-blur-sm z-10">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-cyber-purple" />
              <p className="text-sm text-cyber-gray-400">Loading...</p>
            </div>
          </div>
        )}
        {/* The overlay webview appears here */}
      </div>
    </div>
  );
}