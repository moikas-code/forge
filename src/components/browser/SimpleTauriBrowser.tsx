'use client';

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
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

interface SimpleTauriBrowserProps {
  url?: string;
  className?: string;
  tabId: string;
}

export function SimpleTauriBrowser({ url: initialUrl, className, tabId }: SimpleTauriBrowserProps) {
  const [url, setUrl] = useState(initialUrl || 'https://developer.mozilla.org');
  const [inputUrl, setInputUrl] = useState(initialUrl || 'https://developer.mozilla.org');
  const [currentWindow, setCurrentWindow] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([initialUrl || 'https://developer.mozilla.org']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const normalizeUrl = (urlString: string): string => {
    if (!/^https?:\/\//i.test(urlString)) {
      if (/^[\w.-]+\.\w+/.test(urlString)) {
        return `https://${urlString}`;
      }
      return `https://www.google.com/search?q=${encodeURIComponent(urlString)}`;
    }
    return urlString;
  };

  const createBrowserWindow = async (targetUrl: string) => {
    try {
      console.log('[SimpleTauriBrowser] Creating browser window for:', targetUrl);
      setLoading(true);
      
      // Use Tauri command to create a new window
      const windowLabel = `browser-${tabId}-${Date.now()}`;
      
      // Try to create window using the existing command
      const windowId = await invoke<string>('create_webview_window', {
        url: targetUrl,
        title: 'Browser'
      });
      
      console.log('[SimpleTauriBrowser] Browser window created:', windowId);
    } catch (error) {
      console.error('[SimpleTauriBrowser] Failed to create browser window:', error);
      // Fallback to opening in external browser
      try {
        await open(targetUrl);
      } catch (openError) {
        console.error('[SimpleTauriBrowser] Failed to open in external browser:', openError);
      }
    } finally {
      setLoading(false);
    }
  };

  const navigateToUrl = async (newUrl: string) => {
    const normalizedUrl = normalizeUrl(newUrl);
    setUrl(normalizedUrl);
    setInputUrl(normalizedUrl);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(normalizedUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // Create new browser window
    await createBrowserWindow(normalizedUrl);
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

  // Open initial URL on mount
  useEffect(() => {
    if (initialUrl) {
      createBrowserWindow(normalizeUrl(initialUrl));
    }
  }, []);

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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 p-8 max-w-md">
          <div className="w-20 h-20 mx-auto bg-cyber-purple/10 rounded-lg flex items-center justify-center">
            <Globe className="w-10 h-10 text-cyber-purple" />
          </div>
          <h3 className="text-xl font-medium text-cyber-gray-200">Browser Window Mode</h3>
          <p className="text-sm text-cyber-gray-400">
            This browser opens links in separate Tauri windows.
            {currentWindow && (
              <span className="block mt-2 text-xs text-cyber-gray-500">
                Current window: {currentWindow}
              </span>
            )}
          </p>
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-cyber-purple" />
              <span className="text-sm text-cyber-gray-400">Opening browser window...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-cyber-gray-500">
                Current URL: {url}
              </p>
              <Button
                onClick={() => navigateToUrl(url)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <ExternalLink size={16} />
                Open in New Window
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}