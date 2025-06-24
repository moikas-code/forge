'use client';

import { ElectronBrowser } from './ElectronBrowser';
import { SmartBrowser } from './SmartBrowser';
import { isElectron } from '@/services/electron';
import { useEffect, useState } from 'react';

interface BrowserProps {
  url?: string;
  className?: string;
  tabId: string;
  isActive?: boolean;
}

export function Browser({ url, className, tabId, isActive = true }: BrowserProps) {
  const [isElectronEnv, setIsElectronEnv] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for Electron environment after component mounts
    setIsElectronEnv(isElectron());
    setIsLoading(false);
  }, []);

  // Show loading state while checking environment
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className || ''}`}>
        <div className="text-muted-foreground">Loading browser...</div>
      </div>
    );
  }
  
  // Try to use ElectronBrowser in Electron environment
  if (isElectronEnv) {
    try {
      return (
        <ElectronBrowser 
          url={url} 
          className={className} 
          tabId={tabId}
          isActive={isActive}
        />
      );
    } catch (error) {
      console.error('Failed to render ElectronBrowser:', error);
      // Fall through to SmartBrowser
    }
  }
  
  // Fallback to iframe-based browser for non-Electron environments or if ElectronBrowser fails
  return (
    <SmartBrowser 
      url={url} 
      className={className} 
      tabId={tabId} 
    />
  );
}