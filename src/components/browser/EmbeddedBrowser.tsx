'use client';

import { useState, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { 
  RefreshCw, 
  ExternalLink, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Loader2,
  Search,
  Monitor
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmbeddedBrowserProps {
  url?: string;
  className?: string;
}

// List of sites known to work in iframes
const IFRAME_FRIENDLY_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'wikipedia.org',
  'w3schools.com',
  'developer.mozilla.org',
  'docs.python.org',
  'nodejs.org',
  'reactjs.org',
  'vuejs.org',
  'angular.io',
  'tailwindcss.com',
  'github.com/readme', // GitHub readmes can be embedded
];

export function EmbeddedBrowser({ url: initialUrl, className }: EmbeddedBrowserProps) {
  const [url, setUrl] = useState(initialUrl || 'https://www.wikipedia.org');
  const [inputUrl, setInputUrl] = useState(initialUrl || 'https://www.wikipedia.org');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [canEmbed, setCanEmbed] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [history, setHistory] = useState<string[]>([initialUrl || 'https://www.wikipedia.org']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const isEmbeddable = (urlString: string): boolean => {
    try {
      const urlObj = new URL(urlString);
      const hostname = urlObj.hostname;
      
      // Check if it's a local URL
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.')) {
        return true;
      }
      
      // Check against known embeddable domains
      return IFRAME_FRIENDLY_DOMAINS.some(domain => hostname.includes(domain));
    } catch {
      return false;
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
    
    setError(null);
    setLoading(true);
    
    // Check if the URL can be embedded
    const embeddable = isEmbeddable(normalizedUrl);
    setCanEmbed(embeddable);
    
    if (!embeddable) {
      setError(`This website cannot be displayed in an embedded browser. Click "Open in Native Browser" to view it in a separate window.`);
      setLoading(false);
      setUrl(normalizedUrl);
      setInputUrl(normalizedUrl);
      return;
    }
    
    setUrl(normalizedUrl);
    setInputUrl(normalizedUrl);

    // Update history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(normalizedUrl);
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
      navigateToUrl(previousUrl);
      setCanGoBack(newIndex > 0);
      setCanGoForward(true);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextUrl = history[newIndex];
      setHistoryIndex(newIndex);
      navigateToUrl(nextUrl);
      setCanGoBack(true);
      setCanGoForward(newIndex < history.length - 1);
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current && canEmbed) {
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
    navigateToUrl('https://www.wikipedia.org');
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

  const handleOpenNativeBrowser = async () => {
    try {
      await invoke<string>('create_webview_window', { 
        url: url, 
        title: 'Browser' 
      });
    } catch (err) {
      console.error('Failed to create WebView:', err);
      setError('Failed to create browser window');
    }
  };

  const handleIframeLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load the page. The website may not allow embedding.');
    setCanEmbed(false);
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
            disabled={loading || !canEmbed}
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
      <div className="flex-1 relative bg-white">
        {error || !canEmbed ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background">
            <div className="text-center space-y-4 p-8 max-w-md">
              <div className="w-16 h-16 mx-auto bg-warning/10 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-warning" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Cannot Display Website</h3>
              <p className="text-sm text-muted-foreground">{error || 'This website cannot be displayed in an embedded browser.'}</p>
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleOpenNativeBrowser} 
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <Monitor size={16} />
                  Open in Native Browser
                </Button>
                <Button 
                  onClick={handleOpenExternal} 
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <ExternalLink size={16} />
                  Open in System Browser
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Try websites like Wikipedia, MDN Web Docs, or local development servers.
              </p>
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
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads allow-presentation allow-top-navigation-by-user-activation"
              title="Browser Preview"
            />
          </>
        )}
      </div>
    </div>
  );
}