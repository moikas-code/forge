'use client';

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  RefreshCw, 
  ExternalLink, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimpleBrowserProps {
  url?: string;
  className?: string;
}

export function SimpleBrowser({ url: initialUrl, className }: SimpleBrowserProps) {
  const [url, setUrl] = useState(initialUrl || 'https://www.google.com');
  const [inputUrl, setInputUrl] = useState(initialUrl || 'https://www.google.com');
  const [loading, setLoading] = useState(false);
  const [webViewId, setWebViewId] = useState<string | null>(null);

  useEffect(() => {
    // Create webview on mount
    createWebView(url);
    
    return () => {
      // Cleanup webview on unmount if needed
    };
  }, []);

  const createWebView = async (targetUrl: string) => {
    try {
      setLoading(true);
      const id = await invoke<string>('create_webview_window', { 
        url: targetUrl, 
        title: 'Browser' 
      });
      setWebViewId(id);
      setUrl(targetUrl);
      setInputUrl(targetUrl);
    } catch (err) {
      console.error('Failed to create WebView:', err);
    } finally {
      setLoading(false);
    }
  };

  const normalizeUrl = (urlString: string): string => {
    // If it doesn't have a protocol, check if it looks like a URL
    if (!urlString.includes('://')) {
      // Check if it looks like a domain
      if (urlString.includes('.') && !urlString.includes(' ')) {
        return `https://${urlString}`;
      } else {
        // Treat as search query
        return `https://www.google.com/search?q=${encodeURIComponent(urlString)}`;
      }
    }
    return urlString;
  };

  const navigateToUrl = async (newUrl: string) => {
    const normalizedUrl = normalizeUrl(newUrl);
    
    if (webViewId) {
      try {
        setLoading(true);
        await invoke('navigate_browser', { windowId: webViewId, url: normalizedUrl });
        setUrl(normalizedUrl);
        setInputUrl(normalizedUrl);
      } catch (err) {
        console.error('Navigation failed:', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Create new webview with the URL
      createWebView(normalizedUrl);
    }
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToUrl(inputUrl);
  };

  const handleGoBack = async () => {
    if (webViewId) {
      try {
        await invoke('browser_go_back', { windowId: webViewId });
      } catch (err) {
        console.error('Failed to go back:', err);
      }
    }
  };

  const handleGoForward = async () => {
    if (webViewId) {
      try {
        await invoke('browser_go_forward', { windowId: webViewId });
      } catch (err) {
        console.error('Failed to go forward:', err);
      }
    }
  };

  const handleRefresh = async () => {
    if (webViewId) {
      try {
        setLoading(true);
        await invoke('browser_refresh', { windowId: webViewId });
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
      <div className="flex-1 flex items-center justify-center bg-background">
        {webViewId ? (
          <div className="text-center space-y-4 p-8">
            <h3 className="text-lg font-medium text-foreground">Browser Window Active</h3>
            <p className="text-sm text-muted-foreground">
              The webpage is displayed in a separate native window.
            </p>
            <p className="text-xs text-muted-foreground">
              Window ID: {webViewId}
            </p>
          </div>
        ) : (
          <div className="text-center space-y-4 p-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Creating browser window...</p>
          </div>
        )}
      </div>
    </div>
  );
}