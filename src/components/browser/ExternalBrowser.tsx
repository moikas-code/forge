'use client';

import { useState, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { 
  ExternalLink, 
  Globe,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExternalBrowserProps {
  url?: string;
  className?: string;
}

export function ExternalBrowser({ url: initialUrl, className }: ExternalBrowserProps) {
  const [url, setUrl] = useState(initialUrl || 'https://developer.mozilla.org');
  const [inputUrl, setInputUrl] = useState(initialUrl || 'https://developer.mozilla.org');

  const normalizeUrl = (urlString: string): string => {
    if (!/^https?:\/\//i.test(urlString)) {
      if (/^[\w.-]+\.\w+/.test(urlString)) {
        return `https://${urlString}`;
      }
      return `https://www.google.com/search?q=${encodeURIComponent(urlString)}`;
    }
    return urlString;
  };

  const handleNavigate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const normalizedUrl = normalizeUrl(inputUrl);
    setUrl(normalizedUrl);
    setInputUrl(normalizedUrl);
    
    try {
      await open(normalizedUrl);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  // Open initial URL on mount
  useEffect(() => {
    if (initialUrl) {
      handleNavigate();
    }
  }, []);

  return (
    <div className={cn("h-full flex flex-col bg-cyber-black", className)}>
      {/* Browser Toolbar */}
      <div className="flex items-center space-x-2 px-4 py-2 border-b border-cyber-purple/30 bg-cyber-black/95 backdrop-blur-sm">
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
          <Button
            type="submit"
            variant="default"
            size="sm"
            className="gap-2"
          >
            <ExternalLink size={16} />
            Open
          </Button>
        </form>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4 p-8 max-w-md">
          <div className="w-20 h-20 mx-auto bg-cyber-purple/10 rounded-lg flex items-center justify-center">
            <Globe className="w-10 h-10 text-cyber-purple" />
          </div>
          <h3 className="text-xl font-medium text-cyber-gray-200">External Browser Mode</h3>
          <p className="text-sm text-cyber-gray-400">
            This browser opens links in your default web browser. 
            Enter a URL above and click "Open" to navigate.
          </p>
          <p className="text-xs text-cyber-gray-500">
            Current URL: {url}
          </p>
          <Button
            onClick={() => handleNavigate()}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <ExternalLink size={16} />
            Open Current URL
          </Button>
        </div>
      </div>
    </div>
  );
}