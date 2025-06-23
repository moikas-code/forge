'use client';

import { useState, useEffect, useRef } from 'react';
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

interface InAppBrowserProps {
  url?: string;
  className?: string;
  tabId: string;
}

export function InAppBrowser({ url: initialUrl, className, tabId }: InAppBrowserProps) {
  const [url, setUrl] = useState(initialUrl || 'https://developer.mozilla.org');
  const [inputUrl, setInputUrl] = useState(initialUrl || 'https://developer.mozilla.org');
  const [loading, setLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const webviewId = useRef<string>(`browser-${tabId}`);

  const normalizeUrl = (urlString: string): string => {
    if (!/^https?:\/\//i.test(urlString)) {
      if (/^[\w.-]+\.\w+/.test(urlString)) {
        return `https://${urlString}`;
      }
      return `https://www.google.com/search?q=${encodeURIComponent(urlString)}`;
    }
    return urlString;
  };

  // Initialize the webview
  useEffect(() => {
    const initWebview = async () => {
      if (!containerRef.current) return;
      
      try {
        console.log('[InAppBrowser] Initializing embedded webview...');
        setLoading(true);
        
        // Get container dimensions
        const rect = containerRef.current.getBoundingClientRect();
        
        // Create an embedded webview using Rust
        await invoke('create_embedded_browser', {
          browserId: webviewId.current,
          url: normalizeUrl(url),
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
        
        console.log('[InAppBrowser] Embedded webview created successfully');
        setLoading(false);
      } catch (error) {
        console.error('[InAppBrowser] Failed to create embedded webview:', error);
        setLoading(false);
      }
    };

    initWebview();

    // Cleanup
    return () => {
      invoke('close_embedded_browser', { browserId: webviewId.current }).catch(console.error);
    };
  }, []);

  // Update webview position on resize
  useEffect(() => {
    if (!containerRef.current) return;

    const updatePosition = async () => {
      const rect = containerRef.current!.getBoundingClientRect();
      
      try {
        await invoke('resize_embedded_browser', {
          browserId: webviewId.current,
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        });
      } catch (error) {
        console.error('[InAppBrowser] Failed to resize webview:', error);
      }
    };

    const resizeObserver = new ResizeObserver(updatePosition);
    resizeObserver.observe(containerRef.current);
    
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, []);

  const navigateToUrl = async (newUrl: string) => {
    const normalizedUrl = normalizeUrl(newUrl);
    setUrl(normalizedUrl);
    setInputUrl(normalizedUrl);
    setLoading(true);

    try {
      await invoke('navigate_embedded_browser', {
        browserId: webviewId.current,
        url: normalizedUrl,
      });
      
      // Update navigation state
      const state = await invoke<{ canGoBack: boolean; canGoForward: boolean }>('get_browser_navigation_state', {
        browserId: webviewId.current,
      });
      
      setCanGoBack(state.canGoBack);
      setCanGoForward(state.canGoForward);
    } catch (error) {
      console.error('[InAppBrowser] Navigation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToUrl(inputUrl);
  };

  const handleBack = async () => {
    try {
      setLoading(true);
      await invoke('browser_go_back', { browserId: webviewId.current });
      
      // Update URL and navigation state
      const currentUrl = await invoke<string>('get_browser_url', { browserId: webviewId.current });
      setUrl(currentUrl);
      setInputUrl(currentUrl);
      
      const state = await invoke<{ canGoBack: boolean; canGoForward: boolean }>('get_browser_navigation_state', {
        browserId: webviewId.current,
      });
      setCanGoBack(state.canGoBack);
      setCanGoForward(state.canGoForward);
    } catch (error) {
      console.error('[InAppBrowser] Back navigation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleForward = async () => {
    try {
      setLoading(true);
      await invoke('browser_go_forward', { browserId: webviewId.current });
      
      // Update URL and navigation state
      const currentUrl = await invoke<string>('get_browser_url', { browserId: webviewId.current });
      setUrl(currentUrl);
      setInputUrl(currentUrl);
      
      const state = await invoke<{ canGoBack: boolean; canGoForward: boolean }>('get_browser_navigation_state', {
        browserId: webviewId.current,
      });
      setCanGoBack(state.canGoBack);
      setCanGoForward(state.canGoForward);
    } catch (error) {
      console.error('[InAppBrowser] Forward navigation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await invoke('browser_refresh', { browserId: webviewId.current });
    } catch (error) {
      console.error('[InAppBrowser] Refresh failed:', error);
    } finally {
      setLoading(false);
    }
  };

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
            disabled={!canGoBack}
            className="h-8 w-8 text-cyber-gray-400 hover:text-cyber-purple disabled:opacity-30"
            title="Go back"
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleForward}
            disabled={!canGoForward}
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
        {/* The actual webview will be rendered here by Rust */}
      </div>
    </div>
  );
}