'use client';

import { useState, useEffect, useRef } from 'react';
import { Webview } from '@tauri-apps/api/webview';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { open } from '@tauri-apps/plugin-shell';
import { 
  RefreshCw, 
  ExternalLink, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Search,
  Globe,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TauriBrowserProps {
  url?: string;
  className?: string;
  tabId: string;
}

export function TauriBrowser({ url: initialUrl, className, tabId }: TauriBrowserProps) {
  const [url, setUrl] = useState(initialUrl || 'https://developer.mozilla.org');
  const [inputUrl, setInputUrl] = useState(initialUrl || 'https://developer.mozilla.org');
  const [loading, setLoading] = useState(true);
  const [webview, setWebview] = useState<Webview | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<string[]>([initialUrl || 'https://developer.mozilla.org']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isWebviewReady, setIsWebviewReady] = useState(false);

  const normalizeUrl = (urlString: string): string => {
    if (!/^https?:\/\//i.test(urlString)) {
      // Check if it looks like a domain
      if (/^[\w.-]+\.\w+/.test(urlString)) {
        return `https://${urlString}`;
      }
      // Otherwise treat as search
      return `https://www.google.com/search?q=${encodeURIComponent(urlString)}`;
    }
    return urlString;
  };

  // Create and position webview
  useEffect(() => {
    if (!containerRef.current || webview) return;

    const createWebview = async () => {
      try {
        console.log('[TauriBrowser] Starting webview creation...');
        const window = getCurrentWindow();
        const container = containerRef.current;
        if (!container) {
          console.error('[TauriBrowser] Container ref not ready');
          return;
        }

        // Get container position and size
        const rect = container.getBoundingClientRect();
        console.log('[TauriBrowser] Container rect:', rect);
        
        const scaleFactor = await window.scaleFactor();
        console.log('[TauriBrowser] Scale factor:', scaleFactor);

        // Create a unique label for this webview
        const webviewLabel = `browser-${tabId}-${Date.now()}`;
        console.log('[TauriBrowser] Creating webview with label:', webviewLabel);
        
        // Create the webview
        const newWebview = new Webview(window, webviewLabel, {
          url: normalizeUrl(url),
          x: Math.round(rect.left / scaleFactor),
          y: Math.round(rect.top / scaleFactor),
          width: Math.round(rect.width / scaleFactor),
          height: Math.round(rect.height / scaleFactor),
          transparent: false,
          acceptFirstMouse: true,
        });

        console.log('[TauriBrowser] Webview instance created, waiting for events...');

        // Listen for navigation events
        await newWebview.once('tauri://created', () => {
          console.log('[TauriBrowser] Webview created successfully');
          setIsWebviewReady(true);
          setLoading(false);
        });

        await newWebview.once('tauri://error', (error) => {
          console.error('[TauriBrowser] Webview error event:', error);
          setLoading(false);
        });

        setWebview(newWebview);
      } catch (error) {
        console.error('[TauriBrowser] Failed to create webview:', error);
        console.error('[TauriBrowser] Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        setLoading(false);
      }
    };

    createWebview();

    // Cleanup function
    return () => {
      if (webview) {
        webview.close().catch(console.error);
      }
    };
  }, [tabId, url]); // Recreate when tabId or url changes

  // Update webview position when container resizes
  useEffect(() => {
    if (!webview || !containerRef.current || !isWebviewReady) return;

    const updatePosition = async () => {
      try {
        const window = getCurrentWindow();
        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const scaleFactor = await window.scaleFactor();

        await webview.setPosition({
          x: Math.round(rect.left / scaleFactor),
          y: Math.round(rect.top / scaleFactor),
        });

        await webview.setSize({
          width: Math.round(rect.width / scaleFactor),
          height: Math.round(rect.height / scaleFactor),
        });
      } catch (error) {
        console.error('Failed to update webview position:', error);
      }
    };

    // Update position on resize
    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(containerRef.current);

    // Update position on window resize
    window.addEventListener('resize', updatePosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePosition);
    };
  }, [webview, isWebviewReady]);

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

    if (!webview || !isWebviewReady) {
      // If webview isn't ready, the URL will be loaded when it's created
      setLoading(false);
      return;
    }
    
    try {
      // For now, we need to recreate the webview with the new URL
      // Tauri v2 doesn't have a direct navigation API yet
      await webview.close();
      setWebview(null);
      setIsWebviewReady(false);
      
      // The useEffect will recreate the webview with the new URL
    } catch (error) {
      console.error('Navigation failed:', error);
      setLoading(false);
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
      setUrl(previousUrl);
      setInputUrl(previousUrl);
      navigateToUrl(previousUrl);
    }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const nextUrl = history[newIndex];
      setUrl(nextUrl);
      setInputUrl(nextUrl);
      navigateToUrl(nextUrl);
    }
  };

  const handleRefresh = () => {
    // To refresh, we'll navigate to the same URL
    navigateToUrl(url);
  };

  const handleHome = () => {
    navigateToUrl('https://developer.mozilla.org');
  };

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
        {/* The webview will be positioned over this container */}
        {!isWebviewReady && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-cyber-black">
            <div className="text-center space-y-4 p-8 max-w-md">
              <div className="w-16 h-16 mx-auto bg-cyber-purple/10 rounded-lg flex items-center justify-center">
                <Globe className="w-8 h-8 text-cyber-purple" />
              </div>
              <h3 className="text-lg font-medium text-cyber-gray-200">Initializing Browser</h3>
              <p className="text-sm text-cyber-gray-400">
                Setting up native browser view...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}