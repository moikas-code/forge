'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getBrowserService } from '@/services/electron';
import { useLayoutStore } from '@/stores/layoutStore';
import { 
  RefreshCw, 
  Home, 
  ChevronLeft, 
  ChevronRight,
  Loader2,
  Search,
  Globe,
  Code,
  Camera,
  Video,
  Square,
  Download,
  ChevronDown,
  Maximize2,
  Crop
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface ElectronBrowserProps {
  url?: string;
  className?: string;
  tabId: string;
  isActive?: boolean;
}

export function ElectronBrowser({ url: initialUrl, className, tabId, isActive = true }: ElectronBrowserProps) {
  const [url, setUrl] = useState(initialUrl || 'https://moikas.com');
  const [inputUrl, setInputUrl] = useState(initialUrl || 'https://moikas.com');
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('New Tab');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [browserId, setBrowserId] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingData, setRecordingData] = useState<MediaRecorder | null>(null);
  const [isSelectingRegion, setIsSelectingRegion] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const browserService = useRef<any>(null);
  const recordedChunks = useRef<Blob[]>([]);

  // Initialize browser service safely
  useEffect(() => {
    try {
      browserService.current = getBrowserService();
      if (!browserService.current) {
        setServiceError('Browser service not available');
      } else {
        // Set up global new tab request handler
        browserService.current.onNewTabRequest((data: { url: string; disposition: string }) => {
          // Get the layout store to add a new tab
          const { addTab, setActiveTab } = useLayoutStore.getState();
          
          // Extract domain name for initial title
          let initialTitle = 'New Tab';
          try {
            const url = new URL(data.url);
            initialTitle = url.hostname || 'New Tab';
          } catch (e) {
            // If URL parsing fails, use the URL itself (might be a search query)
            initialTitle = data.url.length > 30 ? data.url.substring(0, 30) + '...' : data.url;
          }
          
          // Create new browser tab
          const newTab = {
            title: initialTitle,
            type: 'browser' as const,
            path: data.url
          };
          
          // Add the tab
          addTab(newTab);
          
          // If disposition is foreground, make it active
          if (data.disposition === 'foreground-tab' || data.disposition === 'new-window') {
            // The addTab function already makes the new tab active
          }
        });
      }
    } catch (error) {
      console.error('Failed to get browser service:', error);
      setServiceError('Failed to initialize browser service');
    }
  }, []);

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
    if (!containerRef.current || !browserService.current) return;

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
          browserService.current.onNavigate(browserInfo.id, (newUrl: string) => {
            if (isMounted) {
              setUrl(newUrl);
              setInputUrl(newUrl);
              updateNavigationState(browserInfo.id);
            }
          });

          browserService.current.onTitleUpdate(browserInfo.id, (newTitle: string) => {
            if (isMounted) {
              setTitle(newTitle);
              // Update the tab title in the layout store
              const { updateTab } = useLayoutStore.getState();
              updateTab(tabId, { title: newTitle || 'New Tab' });
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
      } catch (error: any) {
        console.error('[ElectronBrowser] Failed to create browser:', error);
      }
    };

    initBrowser();

    // Cleanup function with proper async handling
    return () => {
      isMounted = false;
      
      // Clean up browser view immediately if we have the ID
      if (currentBrowserId && browserService.current) {
        browserService.current.close(currentBrowserId).catch((error: any) => {
          console.error('[ElectronBrowser] Cleanup error:', error);
        });
      }
      
      // Also clean up via state if available (fallback)
      if (browserId && browserId !== currentBrowserId && browserService.current) {
        browserService.current.close(browserId).catch((error: any) => {
          console.error('[ElectronBrowser] State cleanup error:', error);
        });
      }
    };
  }, [tabId]);

  // Update BrowserView position when container moves/resizes
  useEffect(() => {
    if (!browserId || !containerRef.current) return;

    const updateBounds = async () => {
      if (!browserService.current) return;
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
        if (browserService.current) {
          if (isActive) {
            await browserService.current.show(browserId);
          } else {
            await browserService.current.hide(browserId);
          }
        }
      } catch (error) {
        console.error('[ElectronBrowser] Visibility error:', error);
      }
    };

    handleVisibility();
  }, [browserId, isActive]);

  const updateNavigationState = async (id: string) => {
    if (!browserService.current) return;
    const [back, forward] = await Promise.all([
      browserService.current.canGoBack(id),
      browserService.current.canGoForward(id)
    ]);
    setCanGoBack(back);
    setCanGoForward(forward);
  };

  const navigateToUrl = async (newUrl: string) => {
    if (!browserId || !browserService.current) return;
    
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
    if (!browserId || !canGoBack || !browserService.current) return;
    await browserService.current.goBack(browserId);
  };

  const handleForward = async () => {
    if (!browserId || !canGoForward || !browserService.current) return;
    await browserService.current.goForward(browserId);
  };

  const handleRefresh = async () => {
    if (!browserId || !browserService.current) return;
    await browserService.current.refresh(browserId);
  };

  const handleHome = () => {
    navigateToUrl('https://moikas.com');
  };

  const handleToggleDevTools = async () => {
    if (!browserId || !browserService.current) return;
    
    // Simple toggle - in real app, track state
    try {
      await browserService.current.openDevTools(browserId);
    } catch {
      await browserService.current.closeDevTools(browserId);
    }
  };

  const handleScreenshot = async () => {
    if (!browserId || !browserService.current) return;
    
    try {
      const dataUrl = await browserService.current.captureScreenshot(browserId);
      
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screenshot-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    }
  };

  const handleStartRegionCapture = () => {
    setIsSelectingRegion(true);
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelectingRegion || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setSelectionStart({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setSelectionEnd({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, [isSelectingRegion]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelectingRegion || !selectionStart || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    setSelectionEnd({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, [isSelectingRegion, selectionStart]);

  const handleMouseUp = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSelectingRegion || !selectionStart || !selectionEnd || !browserId || !browserService.current) return;
    
    // Calculate selection rectangle
    const x = Math.min(selectionStart.x, selectionEnd.x);
    const y = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);
    
    // Reset selection state
    setIsSelectingRegion(false);
    setSelectionStart(null);
    setSelectionEnd(null);
    
    // Don't capture if selection is too small
    if (width < 5 || height < 5) return;
    
    try {
      const dataUrl = await browserService.current.captureRegion(browserId, { x, y, width, height });
      
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `screenshot-region-${new Date().toISOString().replace(/[:.]/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to capture region:', error);
    }
  }, [isSelectingRegion, selectionStart, selectionEnd, browserId]);

  const handleCancelSelection = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isSelectingRegion) {
      setIsSelectingRegion(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }, [isSelectingRegion]);

  const handleStartRecording = async () => {
    if (!browserId || !browserService.current || isRecording) return;
    
    try {
      // Get recording source from browser service
      const { sourceId, bounds } = await browserService.current.startRecording(browserId);
      
      // Set up screen capture
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          // @ts-ignore - Electron-specific constraint
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: sourceId,
            minWidth: bounds.width,
            maxWidth: bounds.width,
            minHeight: bounds.height,
            maxHeight: bounds.height
          }
        }
      });

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9'
      });

      recordedChunks.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks.current, {
          type: 'video/webm'
        });

        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecordingData(mediaRecorder);
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const handleStopRecording = async () => {
    if (!browserId || !browserService.current || !isRecording || !recordingData) return;
    
    try {
      await browserService.current.stopRecording(browserId);
      recordingData.stop();
      setRecordingData(null);
      setIsRecording(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  // Show error state if browser service is not available
  if (serviceError) {
    return (
      <div className={cn("h-full flex flex-col items-center justify-center bg-cyber-black", className)}>
        <div className="text-center p-8">
          <Globe className="h-12 w-12 text-cyber-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-cyber-gray-300 mb-2">Browser Service Unavailable</h3>
          <p className="text-sm text-cyber-gray-500 mb-4">{serviceError}</p>
          <p className="text-xs text-cyber-gray-600">
            The browser feature requires Electron environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("h-full flex flex-col bg-cyber-black", className)}>
      {/* Browser Toolbar */}
      <div className="flex items-center space-x-2 px-4 py-2 border-b border-cyber-purple/30 bg-cyber-black/95 backdrop-blur-sm relative z-50">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-cyber-gray-400 hover:text-cyber-jade relative z-10"
              title="Screenshot options"
            >
              <Camera size={16} />
              <ChevronDown size={12} className="ml-0.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-cyber-black border-cyber-purple/30 z-[100]">
            <DropdownMenuItem
              onClick={handleScreenshot}
              className="text-cyber-gray-200 hover:text-cyber-jade hover:bg-cyber-purple/20 cursor-pointer"
            >
              <Maximize2 size={14} className="mr-2" />
              Capture Full View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleStartRegionCapture}
              className="text-cyber-gray-200 hover:text-cyber-jade hover:bg-cyber-purple/20 cursor-pointer"
            >
              <Crop size={14} className="mr-2" />
              Capture Region
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {!isRecording ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStartRecording}
            className="h-8 w-8 text-cyber-gray-400 hover:text-cyber-jade relative z-10"
            title="Start Recording"
          >
            <Video size={16} />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleStopRecording}
            className="h-8 w-8 text-red-500 hover:text-red-400 animate-pulse relative z-10"
            title="Stop Recording"
          >
            <Square size={16} />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleDevTools}
          className="h-8 w-8 text-cyber-gray-400 hover:text-cyber-jade relative z-10"
          title="Toggle DevTools"
        >
          <Code size={16} />
        </Button>
        
      </div>

      {/* Browser Title Bar */}
      <div className="px-4 py-1 bg-cyber-black/50 border-b border-cyber-purple/20">
        <div className="flex items-center gap-2 text-xs text-cyber-gray-400">
          <Globe size={12} />
          <span className="truncate">{title}</span>
          {isRecording && (
            <div className="ml-auto flex items-center gap-1 text-red-500">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-xs">Recording</span>
            </div>
          )}
        </div>
      </div>

      {/* Browser Content Container */}
      <div 
        className="flex-1 relative bg-white" 
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onKeyDown={handleCancelSelection}
        tabIndex={-1}
        style={{ cursor: isSelectingRegion ? 'crosshair' : 'default' }}
      >
        {/* The BrowserView will be positioned here by Electron */}
        {!browserId && (
          <div className="absolute inset-0 flex items-center justify-center bg-cyber-black">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-cyber-purple" />
              <p className="text-sm text-cyber-gray-400">Initializing browser...</p>
            </div>
          </div>
        )}
        
        {/* Selection overlay */}
        {isSelectingRegion && selectionStart && selectionEnd && (
          <>
            {/* Darkened overlay */}
            <div className="absolute inset-0 bg-black/30 pointer-events-none z-10" />
            
            {/* Selection rectangle */}
            <div
              className="absolute border-2 border-cyber-jade bg-cyber-jade/10 pointer-events-none z-20"
              style={{
                left: Math.min(selectionStart.x, selectionEnd.x),
                top: Math.min(selectionStart.y, selectionEnd.y),
                width: Math.abs(selectionEnd.x - selectionStart.x),
                height: Math.abs(selectionEnd.y - selectionStart.y),
              }}
            >
              {/* Dimensions display */}
              {Math.abs(selectionEnd.x - selectionStart.x) > 50 && Math.abs(selectionEnd.y - selectionStart.y) > 30 && (
                <div className="absolute -top-6 left-0 bg-cyber-black/90 text-cyber-jade text-xs px-2 py-1 rounded">
                  {Math.abs(selectionEnd.x - selectionStart.x)} × {Math.abs(selectionEnd.y - selectionStart.y)}
                </div>
              )}
            </div>
            
            {/* Instructions */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-cyber-black/90 text-cyber-jade text-sm px-4 py-2 rounded-md z-30 pointer-events-none">
              Drag to select region • Press ESC to cancel
            </div>
          </>
        )}
      </div>
    </div>
  );
}