'use client';

import { useState, useEffect, useRef } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
import { LogicalPosition, LogicalSize, getCurrentWindow } from '@tauri-apps/api/window';
import { 
  RefreshCw, 
  ExternalLink, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Search,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { invoke } from '@tauri-apps/api/core';

interface IntegratedBrowserProps {
  url?: string;
  className?: string;
}

export function IntegratedBrowser({ url: initialUrl, className }: IntegratedBrowserProps) {
  const [url, setUrl] = useState(initialUrl || 'https://www.google.com');
  const [inputUrl, setInputUrl] = useState(initialUrl || 'https://www.google.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webview, setWebview] = useState<WebviewWindow | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    // Create webview overlay when component mounts
    createWebviewOverlay();

    return () => {
      // Cleanup webview when component unmounts
      if (webview) {
        webview.close();
      }
    };
  }, []);

  useEffect(() => {
    // Update webview position when container resizes
    const updatePosition = () => {
      if (webview && containerRef.current) {
        positionWebview();
      }
    };

    const resizeObserver = new ResizeObserver(updatePosition);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener('resize', updatePosition);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePosition);
    };
  }, [webview]);

  const createWebviewOverlay = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create a unique label for this webview
      const label = `browser-${Date.now()}`;
      
      // Create the webview window
      const webviewWindow = new WebviewWindow(label, {
        url: url,
        title: 'Browser',
        width: 800,
        height: 600,
        decorations: false,
        transparent: true,
        alwaysOnTop: false,
        skipTaskbar: true,
        parent: await getCurrent(),
      });

      // Wait for the webview to be created
      await webviewWindow.once('tauri://created', () => {
        console.log('Webview created');
        setWebview(webviewWindow);
        positionWebview();
      });

      // Handle navigation events
      await webviewWindow.listen('tauri://navigate', (event) => {
        console.log('Navigation event:', event);
        // Update URL and navigation state
      });

      setLoading(false);
    } catch (err) {
      console.error('Failed to create webview:', err);
      setError('Failed to create browser window. Using fallback mode.');
      setLoading(false);
    }
  };

  const positionWebview = async () => {
    if (!webview || !containerRef.current) return;

    try {
      const rect = containerRef.current.getBoundingClientRect();
      const mainWindow = await getCurrentWindow();
      const factor = await mainWindow.scaleFactor();
      
      // Position the webview to overlay the container
      await webview.setPosition(new LogicalPosition(
        rect.left / factor,
        rect.top / factor
      ));
      
      await webview.setSize(new LogicalSize(
        rect.width / factor,
        rect.height / factor
      ));
    } catch (err) {
      console.error('Failed to position webview:', err);
    }
  };

  const normalizeUrl = (urlString: string): string => {
    if (!urlString.includes('://')) {
      if (urlString.includes('.') && !urlString.includes(' ')) {
        return `https://${urlString}`;
      } else {
        return `https://www.google.com/search?q=${encodeURIComponent(urlString)}`;
      }
    }
    return urlString;
  };

  const navigateToUrl = async (newUrl: string) => {
    const normalizedUrl = normalizeUrl(newUrl);
    
    if (webview) {
      try {
        setLoading(true);
        setError(null);
        
        // Navigate using eval (webview API doesn't have direct navigation method)
        await webview.eval(`window.location.href = "${normalizedUrl}"`);
        
        setUrl(normalizedUrl);
        setInputUrl(normalizedUrl);
      } catch (err) {
        console.error('Navigation failed:', err);
        setError('Navigation failed');
      } finally {
        setLoading(false);
      }
    } else {
      // If webview doesn't exist, show error
      setError('Browser window not initialized');
    }
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToUrl(inputUrl);
  };

  const handleGoBack = async () => {
    if (webview) {
      try {
        await webview.eval('window.history.back()');
      } catch (err) {
        console.error('Failed to go back:', err);
      }
    }
  };

  const handleGoForward = async () => {
    if (webview) {
      try {
        await webview.eval('window.history.forward()');
      } catch (err) {
        console.error('Failed to go forward:', err);
      }
    }
  };

  const handleRefresh = async () => {
    if (webview) {
      try {
        setLoading(true);
        await webview.eval('window.location.reload()');
      } catch (err) {
        console.error('Failed to refresh:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleHome = () => {
    navigateToUrl('https://www.google.com');
  };

  const handleOpenExternal = async () => {
    if (url) {
      try {
        await invoke('open_external', { url });
      } catch (err) {
        console.error('Failed to open external URL:', err);
      }
    }
  };

  // Fallback iframe mode for when webview fails
  const showIframeFallback = !webview && error;

  return (
    <div className={`h-full flex flex-col bg-background ${className || ''}`}>
      {/* Browser Toolbar */}
      <div className="flex items-center space-x-2 px-4 py-2 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        {/* Navigation Controls */}
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoBack}
            disabled={loading}
            className="h-8 w-8"
          >
            <ChevronLeft size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoForward}
            disabled={loading}
            className="h-8 w-8"
          >
            <ChevronRight size={16} />
          </Button>
          
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
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleHome}
            className="h-8 w-8"
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
              className="w-full px-3 py-1.5 pr-10 text-sm bg-secondary/50 border border-border/50 rounded-md 
                       focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50
                       font-mono text-xs"
              placeholder="Search or enter URL..."
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          </div>
        </form>

        {/* External Link */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenExternal}
          className="h-8 w-8"
          title="Open in external browser"
        >
          <ExternalLink size={16} />
        </Button>
      </div>

      {/* Browser Content */}
      <div className="flex-1 relative" ref={containerRef}>
        {showIframeFallback ? (
          // Fallback to iframe if webview fails
          <iframe
            src={url}
            className="w-full h-full border-0 bg-white"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-presentation allow-top-navigation-by-user-activation"
            title="Browser Preview"
          />
        ) : (
          // Placeholder content (webview renders on top)
          <div className="w-full h-full bg-white">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading...</p>
                </div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <AlertCircle className="w-8 h-8 text-warning mx-auto" />
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}