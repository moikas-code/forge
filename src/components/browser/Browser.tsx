'use client';

import { useEffect, useState } from 'react';
import { SmartBrowser } from './SmartBrowser';
import { TauriBrowser } from './TauriBrowser';
import { TauriWebviewBrowser } from './TauriWebviewBrowser';
import { ExternalBrowser } from './ExternalBrowser';
import { SimpleTauriBrowser } from './SimpleTauriBrowser';
import { InAppBrowser } from './InAppBrowser';
import { OverlayBrowser } from './OverlayBrowser';
import { HybridBrowser } from './HybridBrowser';

interface BrowserProps {
  url?: string;
  className?: string;
  tabId?: string;
}

export function Browser({ url, className, tabId }: BrowserProps) {
  const [isTauri, setIsTauri] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [detectionError, setDetectionError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we're running in Tauri
    const checkTauri = async () => {
      console.log('[Browser] Checking Tauri environment...');
      
      try {
        // Method 1: Check for __TAURI__ global
        // @ts-ignore
        if (typeof window !== 'undefined' && window.__TAURI__) {
          console.log('[Browser] Detected Tauri via __TAURI__ global');
          setIsTauri(true);
          setIsLoading(false);
          return;
        }

        // Method 2: Try to import and use Tauri API
        try {
          const { invoke } = await import('@tauri-apps/api/core');
          // Try to invoke any command to verify Tauri is available
          await invoke('tauri', { __tauriModule: 'App', message: { cmd: 'getVersion' } });
          console.log('[Browser] Detected Tauri via API invoke');
          setIsTauri(true);
        } catch (invokeError) {
          console.log('[Browser] Tauri invoke test failed:', invokeError);
        }

        // Method 3: Check for Tauri-specific APIs
        try {
          await import('@tauri-apps/api/window');
          console.log('[Browser] Detected Tauri via window API import');
          setIsTauri(true);
        } catch (importError) {
          console.log('[Browser] Tauri window API import failed:', importError);
        }

      } catch (error) {
        console.log('[Browser] Not running in Tauri environment:', error);
        setDetectionError(String(error));
      } finally {
        setIsLoading(false);
      }
    };

    checkTauri();
  }, []);

  console.log('[Browser] State:', { isTauri, isLoading, tabId, url });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-cyber-black">
        <div className="text-cyber-gray-400">Initializing browser...</div>
      </div>
    );
  }

  // Show debug info in development
  if (process.env.NODE_ENV === 'development' && detectionError) {
    console.warn('[Browser] Tauri detection error:', detectionError);
  }

  // Check for manual override via URL parameter (for testing)
  const urlParams = new URLSearchParams(window.location.search);
  const forceBrowser = urlParams.get('browser');
  
  if (forceBrowser === 'smart') {
    console.log('[Browser] Forced to use SmartBrowser via URL param');
    return <SmartBrowser url={url} className={className} />;
  }
  
  if (forceBrowser === 'external') {
    console.log('[Browser] Forced to use ExternalBrowser via URL param');
    return <ExternalBrowser url={url} className={className} />;
  }
  
  if (forceBrowser === 'simple' && isTauri && tabId) {
    console.log('[Browser] Forced to use SimpleTauriBrowser via URL param');
    return <SimpleTauriBrowser url={url} className={className} tabId={tabId} />;
  }

  // Use TauriBrowser when in Tauri environment and tabId is provided
  if (isTauri && tabId) {
    // Use HybridBrowser by default - starts embedded, can pop out
    if (!forceBrowser || forceBrowser === 'hybrid') {
      console.log('[Browser] Using HybridBrowser (embedded with pop-out capability)');
      return <HybridBrowser url={url} className={className} tabId={tabId} />;
    } else if (forceBrowser === 'overlay') {
      console.log('[Browser] Using OverlayBrowser (overlay window browser)');
      return <OverlayBrowser url={url} className={className} tabId={tabId} />;
    } else if (forceBrowser === 'inapp') {
      console.log('[Browser] Using InAppBrowser (embedded in-app browser)');
      return <InAppBrowser url={url} className={className} tabId={tabId} />;
    } else if (forceBrowser === 'simple') {
      console.log('[Browser] Using SimpleTauriBrowser (separate windows)');
      return <SimpleTauriBrowser url={url} className={className} tabId={tabId} />;
    } else if (forceBrowser === 'webview') {
      console.log('[Browser] Using TauriWebviewBrowser (WebviewWindow)');
      return <TauriWebviewBrowser url={url} className={className} tabId={tabId} />;
    } else if (forceBrowser === 'embedded') {
      console.log('[Browser] Using TauriBrowser (embedded Webview)');
      return <TauriBrowser url={url} className={className} tabId={tabId} />;
    }
  }

  // If we're in Tauri but webview isn't working, use external browser
  if (isTauri) {
    console.log('[Browser] Using ExternalBrowser as Tauri fallback');
    return <ExternalBrowser url={url} className={className} />;
  }

  // Fallback to SmartBrowser for web
  console.log('[Browser] Using SmartBrowser (web fallback)');
  return <SmartBrowser url={url} className={className} />;
}