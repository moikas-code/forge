'use client';

import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  RefreshCw, 
  ExternalLink, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BrowserPreviewProps {
  path?: string;
  url?: string;
  className?: string;
}

export function BrowserPreview({ path, url: initialUrl, className }: BrowserPreviewProps) {
  const [url, setUrl] = useState(initialUrl || 'http://localhost:3000');
  const [inputUrl, setInputUrl] = useState(initialUrl || 'http://localhost:3000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [history, setHistory] = useState<string[]>([initialUrl || 'http://localhost:3000']);
  const [historyIndex, setHistoryIndex] = useState(0);

  useEffect(() => {
    if (path) {
      // Convert file path to localhost URL
      const newUrl = `http://localhost:3000/${path.split('/').pop()}`;
      navigateToUrl(newUrl);
    }
  }, [path]);

  const isValidLocalUrl = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString);
      // Only allow localhost URLs for security
      return urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
    } catch {
      return false;
    }
  };

  const navigateToUrl = (newUrl: string) => {
    if (!isValidLocalUrl(newUrl)) {
      setError('Only localhost URLs are allowed for security reasons');
      return;
    }

    setError(null);
    setLoading(true);
    setUrl(newUrl);
    setInputUrl(newUrl);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    // Update navigation state
    setCanGoBack(historyIndex > 0);
    setCanGoForward(false);
  };

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToUrl(inputUrl);
  };

  const handleGoBack = () => {
    if (historyIndex > 0) {
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

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
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

  const handleRefresh = () => {
    if (iframeRef.current) {
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
    navigateToUrl('http://localhost:3000');
  };

  const handleOpenExternal = async () => {
    if (url) {
      try {
        await invoke('open_external', { url });
      } catch (err) {
        console.error('Failed to open external URL:', err);
        setError('Failed to open URL in external browser');
      }
    }
  };

  const handleIframeLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load the page. Make sure your development server is running.');
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
            disabled={!canGoBack || loading}
            className="h-8 w-8"
          >
            <ChevronLeft size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoForward}
            disabled={!canGoForward || loading}
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
        <form onSubmit={handleNavigate} className="flex-1 flex items-center">
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm bg-secondary/50 border border-border/50 rounded-md 
                     focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50
                     font-mono text-xs"
            placeholder="Enter localhost URL..."
          />
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
      <div className="flex-1 relative bg-white">
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
            <iframe
              ref={iframeRef}
              src={url}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
              title="Browser Preview"
            />
          </>
        )}
      </div>
    </div>
  );
}