'use client';

import { useState, useEffect, useRef } from 'react';
import { getBrowserService } from '@/services/electron';
import { 
  RefreshCw, 
  ExternalLink, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Search,
  Globe,
  Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ElectronBrowserProps {
  url?: string;
  className?: string;
  tabId: string;
  isActive?: boolean;
}

export function ElectronBrowser({ url: initialUrl, className, tabId, isActive = true }: ElectronBrowserProps) {
  const [url, setUrl] = useState(initialUrl || 'https://www.example.com');
  const [inputUrl, setInputUrl] = useState(initialUrl || 'https://www.example.com');
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('New Tab');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [browserId, setBrowserId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const browserService = useRef(getBrowserService());

  const normalizeUrl = (urlString: string): string => {
    if (!/^https?:\/\//i.test(urlString)) {
      if (/^[\w.-]+\.\w+/.test(urlString)) {
        return `https://${urlString}`;
      }
      return `https://www.google.com/search?q=${encodeURIComponent(urlString)}`;
    }
    return urlString;
  };

  // Create and position BrowserView
  useEffect(() => {
    if (!containerRef.current) return;

    let currentBrowserId: string | null = null;
    let isMounted = true;

    const initBrowser = async () => {
      try {
        // Get container bounds
        const rect = containerRef.current!.getBoundingClientRect();
        
        // Create BrowserView with bounds
        const browserInfo = await browserService.current.create({
          url: normalizeUrl(url),
          bounds: {
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          },
          hidden: !isActive // Start hidden if not active
        });

        // Store browser ID for cleanup
        currentBrowserId = browserInfo.id;
        
        // Only update state if component is still mounted
        if (isMounted) {
          setBrowserId(browserInfo.id);

          // Set up event listeners
          browserService.current.onNavigate(browserInfo.id, (newUrl) => {
            if (isMounted) {
              setUrl(newUrl);
              setInputUrl(newUrl);
              updateNavigationState(browserInfo.id);
            }
          });

          browserService.current.onTitleUpdate(browserInfo.id, (newTitle) => {
            if (isMounted) {
              setTitle(newTitle);
            }
          });

          browserService.current.onLoadStart(browserInfo.id, () => {
            if (isMounted) {
              setLoading(true);
            }
          });

          browserService.current.onLoadStop(browserInfo.id, () => {
            if (isMounted) {
              setLoading(false);
              updateNavigationState(browserInfo.id);
            }
          });

          // Update navigation state
          await updateNavigationState(browserInfo.id);
        }
      } catch (error) {
        console.error('[ElectronBrowser] Failed to create browser:', error);
      }
    };

    initBrowser();

    // Cleanup function with proper async handling
    return () => {
      isMounted = false;
      
      // Clean up browser view immediately if we have the ID
      if (currentBrowserId) {
        browserService.current.close(currentBrowserId).catch((error) => {
          console.error('[ElectronBrowser] Cleanup error:', error);
        });
      }
      
      // Also clean up via state if available (fallback)
      if (browserId && browserId !== currentBrowserId) {
        browserService.current.close(browserId).catch((error) => {
          console.error('[ElectronBrowser] State cleanup error:', error);
        });
      }
    };
  }, [tabId]);

  // Update BrowserView position when container moves/resizes
  useEffect(() => {
    if (!browserId || !containerRef.current) return;

    const updateBounds = async () => {
      const rect = containerRef.current!.getBoundingClientRect();
      await browserService.current.setBounds(browserId, {
        x: Math.round(rect.left),
        y: Math.round(rect.top),
        width: Math.round(rect.width),
        height: Math.round(rect.height)
      });
    };

    const resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(containerRef.current);

    window.addEventListener('resize', updateBounds);
    window.addEventListener('scroll', updateBounds);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateBounds);
      window.removeEventListener('scroll', updateBounds);
    };
  }, [browserId]);

  // Handle show/hide based on active state
  useEffect(() => {
    if (!browserId) return;

    const handleVisibility = async () => {
      try {
        if (isActive) {
          await browserService.current.show(browserId);
        } else {
          await browserService.current.hide(browserId);
        }
      } catch (error) {
        console.error('[ElectronBrowser] Visibility error:', error);
      }
    };

    handleVisibility();
  }, [browserId, isActive]);

  const updateNavigationState = async (id: string) => {
    const [back, forward] = await Promise.all([
      browserService.current.canGoBack(id),
      browserService.current.canGoForward(id)
    ]);
    setCanGoBack(back);
    setCanGoForward(forward);
  };

  const navigateToUrl = async (newUrl: string) => {
    if (!browserId) return;
    
    const normalizedUrl = normalizeUrl(newUrl);
    setUrl(normalizedUrl);
    setInputUrl(normalizedUrl);
    await browserService.current.navigate(browserId, normalizedUrl);
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToUrl(inputUrl);
  };

  const handleBack = async () => {
    if (!browserId || !canGoBack) return;
    await browserService.current.goBack(browserId);
  };

  const handleForward = async () => {
    if (!browserId || !canGoForward) return;
    await browserService.current.goForward(browserId);
  };

  const handleRefresh = async () => {
    if (!browserId) return;
    await browserService.current.refresh(browserId);
  };

  const handleHome = () => {
    navigateToUrl('https://www.example.com');
  };

  const handleOpenExternal = async () => {
    const system = (await import('@/services/electron')).getSystemService();
    await system.openExternal(url);
  };

  const handleToggleDevTools = async () => {
    if (!browserId) return;
    
    // Simple toggle - in real app, track state
    try {
      await browserService.current.openDevTools(browserId);
    } catch {
      await browserService.current.closeDevTools(browserId);
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
            {loading && (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 animate-spin text-cyber-purple" />
            )}
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              className={cn(
                "w-full px-3 py-1.5 pr-10 text-sm bg-cyber-gray-800 border border-cyber-purple/30 rounded-md",
                "focus:outline-none focus:ring-1 focus:ring-cyber-purple focus:border-cyber-purple",
                "font-mono text-xs text-cyber-gray-200 placeholder-cyber-gray-500",
                loading && "pl-8"
              )}
              placeholder="Search or enter URL..."
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-cyber-gray-500" />
          </div>
        </form>

        {/* Action Buttons */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleDevTools}
          className="h-8 w-8 text-cyber-gray-400 hover:text-cyber-jade"
          title="Toggle DevTools"
        >
          <Code size={16} />
        </Button>
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

      {/* Browser Title Bar */}
      <div className="px-4 py-1 bg-cyber-black/50 border-b border-cyber-purple/20">
        <div className="flex items-center gap-2 text-xs text-cyber-gray-400">
          <Globe size={12} />
          <span className="truncate">{title}</span>
        </div>
      </div>

      {/* Browser Content Container */}
      <div className="flex-1 relative bg-white" ref={containerRef}>
        {/* The BrowserView will be positioned here by Electron */}
        {!browserId && (
          <div className="absolute inset-0 flex items-center justify-center bg-cyber-black">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-cyber-purple" />
              <p className="text-sm text-cyber-gray-400">Initializing browser...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}