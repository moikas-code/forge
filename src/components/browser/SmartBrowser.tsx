'use client';

import { useState, useEffect, useRef } from 'react';
import { getSystemService } from '@/services/electron/system';
import { 
  RefreshCw, 
  ExternalLink, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Loader2,
  Search,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SmartBrowserProps {
  url?: string;
  className?: string;
}

// Enhanced list of sites that typically work in iframes
const EMBEDDABLE_PATTERNS = [
  /^https?:\/\/localhost/,
  /^https?:\/\/127\.0\.0\.1/,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/[^/]*\.local/,
  /wikipedia\.org/,
  /wikimedia\.org/,
  /w3schools\.com/,
  /developer\.mozilla\.org/,
  /docs\.python\.org/,
  /nodejs\.org\/docs/,
  /reactjs\.org/,
  /react\.dev/,
  /vuejs\.org/,
  /angular\.io/,
  /tailwindcss\.com/,
  /github\.com.*\/blob\//,  // GitHub file viewer
  /raw\.githubusercontent\.com/,
  /gist\.github\.com/,
  /codepen\.io/,
  /jsfiddle\.net/,
  /codesandbox\.io/,
  /stackblitz\.com/,
  /repl\.it/,
  /glitch\.com/,
  /surge\.sh/,
  /netlify\.app/,
  /vercel\.app/,
  /herokuapp\.com/,
  /github\.io/,
  /gitlab\.io/,
];

export function SmartBrowser({ url: initialUrl, className }: SmartBrowserProps) {
  const [url, setUrl] = useState(initialUrl || 'https://moikas.com');
  const [inputUrl, setInputUrl] = useState(initialUrl || 'https://moikas.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canEmbed, setCanEmbed] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [history, setHistory] = useState<string[]>([initialUrl || 'https://moikas.com']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [hasTriedToLoad, setHasTriedToLoad] = useState(false);

  const isLikelyEmbeddable = (urlString: string): boolean => {
    try {
      return EMBEDDABLE_PATTERNS.some(pattern => pattern.test(urlString));
    } catch {
      return false;
    }
  };

  const normalizeUrl = (urlString: string): string => {
    // If it doesn't have a protocol
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
    setIframeError(false);
    setHasTriedToLoad(false);
    
    // Check if the URL is likely embeddable
    const embeddable = isLikelyEmbeddable(normalizedUrl);
    setCanEmbed(embeddable);
    
    if (!embeddable) {
      // Don't even try to load non-embeddable sites
      setError('This website cannot be displayed in the embedded browser due to security restrictions.');
      setLoading(false);
    } else {
      setLoading(true);
    }
    
    setUrl(normalizedUrl);
    setInputUrl(normalizedUrl);

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

  const handleGoBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const previousUrl = history[newIndex];
      setHistoryIndex(newIndex);
      navigateToUrl(previousUrl);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextUrl = history[newIndex];
      setHistoryIndex(newIndex);
      navigateToUrl(nextUrl);
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current && canEmbed && !iframeError) {
      setLoading(true);
      setError(null);
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
    navigateToUrl('https://moikas.com');
  };

  const handleOpenExternal = async () => {
    if (url) {
      try {
        const systemService = getSystemService();
        await systemService.openExternal(url);
      } catch (err) {
        console.error('Failed to open external URL:', err);
        setError('Failed to open URL in external browser');
      }
    }
  };

  const handleIframeLoad = () => {
    setLoading(false);
    setHasTriedToLoad(true);
    // If we successfully loaded, it's embeddable
    if (!iframeError) {
      setCanEmbed(true);
    }
  };

  const handleIframeError = () => {
    setLoading(false);
    setIframeError(true);
    setError('This website cannot be displayed in the embedded browser.');
  };

  // Monitor iframe load status without accessing cross-origin content
  useEffect(() => {
    if (hasTriedToLoad && !loading && !iframeError && canEmbed) {
      // If we expected the site to be embeddable but it hasn't loaded properly
      const checkTimeout = setTimeout(() => {
        if (iframeRef.current) {
          // Don't try to access cross-origin content, just assume it failed
          setIframeError(true);
          setError('This website cannot be displayed in the embedded browser.');
        }
      }, 3000);

      return () => clearTimeout(checkTimeout);
    }
  }, [hasTriedToLoad, loading, iframeError, canEmbed]);

  const showError = !!(error || iframeError || (!canEmbed && !loading));

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
            disabled={historyIndex <= 0 || loading}
            className="h-8 w-8"
          >
            <ChevronLeft size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleGoForward}
            disabled={historyIndex >= history.length - 1 || loading}
            className="h-8 w-8"
          >
            <ChevronRight size={16} />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={loading || showError}
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
      <div className="flex-1 relative bg-cyber-black">
        {showError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-cyber-black">
            <div className="text-center space-y-4 p-8 max-w-md">
              <div className="w-16 h-16 mx-auto bg-cyber-purple/10 rounded-lg flex items-center justify-center">
                <Globe className="w-8 h-8 text-cyber-purple" />
              </div>
              <h3 className="text-lg font-medium text-cyber-gray-200">Cannot Display Website</h3>
              <p className="text-sm text-cyber-gray-400">
                {error || 'This website cannot be displayed in the embedded browser due to security restrictions.'}
              </p>
              <div className="space-y-2">
                <Button 
                  onClick={handleOpenExternal} 
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <ExternalLink size={16} />
                  Open in Browser
                </Button>
                <p className="text-xs text-cyber-gray-500 mt-4">
                  The embedded browser works best with documentation sites, local development servers, and sites that allow iframe embedding.
                </p>
              </div>
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
            {canEmbed && (
              <iframe
                ref={iframeRef}
                src={url}
                className="w-full h-full border-0"
                onLoad={handleIframeLoad}
                onError={handleIframeError}
                title="Browser Preview"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}