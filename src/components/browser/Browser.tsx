'use client';

import { ElectronBrowser } from './ElectronBrowser';
import { SmartBrowser } from './SmartBrowser';
import { isElectron } from '@/services/electron';

interface BrowserProps {
  url?: string;
  className?: string;
  tabId?: string;
}

export function Browser({ url, className, tabId }: BrowserProps) {
  // Always use ElectronBrowser since we've migrated to Electron
  // Keep SmartBrowser as fallback for development/testing
  
  if (isElectron()) {
    return (
      <ElectronBrowser 
        url={url} 
        className={className} 
        tabId={tabId} 
      />
    );
  }
  
  // Fallback to iframe-based browser for non-Electron environments
  return (
    <SmartBrowser 
      url={url} 
      className={className} 
      tabId={tabId} 
    />
  );
}