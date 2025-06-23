'use client';

import { useState, useRef } from 'react';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow';
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
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HybridBrowserProps {
  url?: string;
  className?: string;
  tabId: string;
}

export function HybridBrowser({ url: initialUrl, className, tabId }: HybridBrowserProps) {
  // Use a default URL that allows iframe embedding
  const defaultUrl = 'https://www.example.com';
  const [url, setUrl] = useState(initialUrl || defaultUrl);
  const [inputUrl, setInputUrl] = useState(initialUrl || defaultUrl);
  const [loading, setLoading] = useState(true);
  const [showError, setShowError] = useState(false);
  const [isPoppedOut, setIsPoppedOut] = useState(false);
  const [webviewWindow, setWebviewWindow] = useState<WebviewWindow | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [history, setHistory] = useState<string[]>([initialUrl || defaultUrl]);
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

  const handleIframeLoad = () => {
    setLoading(false);
    setShowError(false);
  };

  const handleIframeError = () => {
    setLoading(false);
    setShowError(true);
  };

  const navigateToUrl = async (newUrl: string) => {
    const normalizedUrl = normalizeUrl(newUrl);
    setUrl(normalizedUrl);
    setInputUrl(normalizedUrl);
    setLoading(true);
    setShowError(false);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(normalizedUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    if (isPoppedOut && webviewWindow) {
      // Navigate in the popped out window
      try {
        await webviewWindow.emit('navigate', { url: normalizedUrl });
      } catch (error) {
        console.error('[HybridBrowser] Failed to navigate popped out window:', error);
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
  const handleHome = () => navigateToUrl('https://www.example.com');

  const handleOpenExternal = async () => {
    try {
      await open(url);
    } catch (err) {
      console.error('Failed to open external URL:', err);
    }
  };

  const handlePopOut = async () => {
    if (isPoppedOut) {
      // Pop back in
      if (webviewWindow) {
        try {
          await webviewWindow.close();
        } catch (error) {
          console.error('[HybridBrowser] Failed to close popped out window:', error);
        }
      }
      setWebviewWindow(null);
      setIsPoppedOut(false);
      setLoading(true); // Reload iframe
    } else {
      // Pop out to separate window
      try {
        const webviewLabel = `browser-popout-${tabId}`;
        
        // Check if window already exists
        try {
          const existing = WebviewWindow.getByLabel(webviewLabel);
          if (existing) {
            await existing.close();
          }
        } catch (e) {
          // Window doesn't exist, which is fine
        }

        // Create new window
        const newWindow = new WebviewWindow(webviewLabel, {
          url: normalizeUrl(url),
          title: 'Browser',
          width: 1024,
          height: 768,
          center: true,
          resizable: true,
          maximizable: true,
          minimizable: true,
          closable: true,
        });

        // Listen for window close
        await newWindow.once('tauri://close-requested', () => {
          setWebviewWindow(null);
          setIsPoppedOut(false);
          setLoading(true); // Reload iframe when window closes
        });

        setWebviewWindow(newWindow);
        setIsPoppedOut(true);
      } catch (error) {
        console.error('[HybridBrowser] Failed to create popped out window:', error);
      }
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

        {/* Action Buttons */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePopOut}
          className={cn(
            "h-8 w-8 text-cyber-gray-400 hover:text-cyber-purple",
            isPoppedOut && "text-cyber-jade"
          )}
          title={isPoppedOut ? "Pop back in" : "Pop out to window"}
        >
          {isPoppedOut ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
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

      {/* Browser Content */}
      <div className="flex-1 relative bg-cyber-black">
        {!isPoppedOut && (
          <>
            {showError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-cyber-black">
                <div className="text-center space-y-4 p-8 max-w-md">
                  <div className="w-16 h-16 mx-auto bg-cyber-purple/10 rounded-lg flex items-center justify-center">
                    <Globe className="w-8 h-8 text-cyber-purple" />
                  </div>
                  <h3 className="text-lg font-medium text-cyber-gray-200">Cannot Display Website</h3>
                  <p className="text-sm text-cyber-gray-400">
                    This website cannot be displayed in the embedded browser due to security restrictions.
                  </p>
                  <p className="text-xs text-cyber-gray-500 mt-2">
                    Try sites like: example.com, wikipedia.org, or localhost:3000
                  </p>
                  <div className="flex gap-2 justify-center mt-4">
                    <Button
                      onClick={handlePopOut}
                      className="bg-cyber-purple hover:bg-cyber-purple/80 text-white"
                      size="sm"
                    >
                      <Maximize2 className="w-4 h-4 mr-2" />
                      Pop Out to Window
                    </Button>
                    <Button
                      onClick={handleOpenExternal}
                      variant="outline"
                      className="border-cyber-purple/30 text-cyber-gray-200 hover:bg-cyber-purple/10"
                      size="sm"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open External
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <iframe
                  ref={iframeRef}
                  src={url}
                  className="w-full h-full border-0"
                  onLoad={(e) => {
                    // Check if iframe loaded but is empty (blocked by X-Frame-Options)
                    try {
                      const iframe = e.currentTarget;
                      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                      if (!iframeDoc || !iframeDoc.body || iframeDoc.body.children.length === 0) {
                        handleIframeError();
                      } else {
                        handleIframeLoad();
                      }
                    } catch (error) {
                      // Cross-origin error - likely blocked
                      handleIframeError();
                    }
                  }}
                  onError={handleIframeError}
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
                  title="Browser"
                />
              </>
            )}
            {loading && !showError && (
              <div className="absolute inset-0 flex items-center justify-center bg-cyber-black/80 backdrop-blur-sm">
                <div className="flex flex-col items-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-cyber-purple" />
                  <p className="text-sm text-cyber-gray-400">Loading...</p>
                </div>
              </div>
            )}
          </>
        )}
        {isPoppedOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-cyber-black">
            <div className="text-center space-y-4 p-8">
              <div className="w-16 h-16 mx-auto bg-cyber-jade/10 rounded-lg flex items-center justify-center">
                <Maximize2 className="w-8 h-8 text-cyber-jade" />
              </div>
              <h3 className="text-lg font-medium text-cyber-gray-200">Browser Popped Out</h3>
              <p className="text-sm text-cyber-gray-400">
                The browser is now running in a separate window.
              </p>
              <Button
                onClick={handlePopOut}
                className="bg-cyber-jade hover:bg-cyber-jade/80 text-black"
                size="sm"
              >
                <Minimize2 className="w-4 h-4 mr-2" />
                Pop Back In
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}