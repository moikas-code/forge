'use client';

import React, { useEffect, useState } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { MinimalSidebar } from './MinimalSidebar';
import { TabManager } from './TabManager';
import { useLayoutStore } from '@/stores/layoutStore';
import { Button } from '@/components/ui/button';
import { ChevronUp, Menu, X, Terminal as TerminalIcon } from 'lucide-react';
import { useResponsive } from '@/hooks/useMediaQuery';
import { Terminal } from '@/components/terminal';
import { CodeEditor } from '@/components/editor';
import { Browser } from '@/components/browser';
import { FileExplorer } from '@/components/explorer';
import { TabErrorBoundary } from './TabErrorBoundary';
import { ComponentErrorBoundary } from './ComponentErrorBoundary';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useSkipLinks } from '@/hooks/useSkipLinks';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const { 
    tabs, 
    activeTabId, 
    isSidebarCollapsed, 
    isBottomPanelCollapsed,
    isMobileSidebarOpen,
    sidebarWidth,
    bottomPanelHeight,
    toggleBottomPanel,
    toggleMobileSidebar,
    setMobileSidebarOpen,
    setSidebarWidth,
    setBottomPanelHeight 
  } = useLayoutStore();
  
  // Initialize keyboard shortcuts and skip links
  useKeyboardShortcuts();
  // useSkipLinks();
  
  // Use responsive hook instead of manual state
  const { isMobile, isTouchDevice, isMediumUp } = useResponsive();
  const [isLoading, setIsLoading] = useState(true);
  
  const activeTab = tabs.find(t => t.id === activeTabId);
  
  // Set loading to false after hydration and ensure browser tab exists
  useEffect(() => {
    setIsLoading(false);
    
    // Create default browser tab if no tabs exist
    if (tabs.length === 0) {
      const { addTab } = useLayoutStore.getState();
      addTab({
        title: 'moikas.com',
        type: 'browser',
        path: 'https://moikas.com'
      });
    }
  }, []);
  
  // Close mobile sidebar when clicking outside (on medium+ screens)
  useEffect(() => {
    if (isMediumUp && isMobileSidebarOpen) {
      setMobileSidebarOpen(false);
    }
  }, [isMediumUp, isMobileSidebarOpen, setMobileSidebarOpen]);
  
  // Handle sidebar resize
  const handleSidebarResize = (sizes: number[]) => {
    if (!isMobile && sizes[0]) {
      setSidebarWidth(sizes[0]);
    }
  };
  
  // Handle bottom panel resize
  const handleBottomPanelResize = (sizes: number[]) => {
    if (!isMobile && sizes.length > 1 && sizes[1]) {
      setBottomPanelHeight(sizes[1]);
    }
  };
  
  // Use default sizes on mobile (with SSR safety)
  const effectiveSidebarSize = isMobile ? 17 : typeof window !== 'undefined' ? (sidebarWidth * 100) / window.innerWidth : 17;
  const effectiveBottomPanelSize = isMobile ? 25 : typeof window !== 'undefined' ? (bottomPanelHeight * 100) / window.innerHeight : 25;
  
  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden"
         role="application"
         aria-label="Forge MOI Development Studio">
      {/* Mobile Menu Button */}
      {isMobile && (
        <div className="absolute top-2 left-2 z-50">
          <Button
            variant="secondary"
            size="icon"
            onClick={toggleMobileSidebar}
            className={`h-8 w-8 shadow-lg transition-all duration-200 ${
              isTouchDevice ? 'h-10 w-10' : ''
            }`}
          >
            {isMobileSidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </Button>
        </div>
      )}
      
      {/* Mobile Backdrop */}
      {isMobile && isMobileSidebarOpen && (
        <div 
          className="absolute inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-200"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <PanelGroup 
        direction="horizontal" 
        className="flex-1"
        onLayout={handleSidebarResize}
      >
        {/* Sidebar Panel - Fixed width (50px) */}
        <Panel 
          defaultSize={3.6} 
          minSize={3.6} 
          maxSize={3.6}
          collapsible={false}
          id="sidebar-panel"
          className={cn(
            isMobile ? (
              isMobileSidebarOpen 
                ? 'absolute left-0 top-0 h-full w-64 z-50 shadow-2xl transform translate-x-0 transition-transform duration-200 ease-in-out'
                : 'absolute left-0 top-0 h-full w-64 z-50 transform -translate-x-full transition-transform duration-200 ease-in-out'
            ) : '',
            'min-w-[50px]'
          )}
        >
          <ComponentErrorBoundary componentName="Sidebar">
            <MinimalSidebar />
          </ComponentErrorBoundary>
        </Panel>
        
        {!isMobile && (
          <PanelResizeHandle className={`w-px bg-border/50 hover:bg-border transition-colors ${
            isTouchDevice ? 'w-2 hover:w-3' : ''
          }`} />
        )}
        
        {/* Main Content Area */}
        <Panel defaultSize={96.4}>
          <PanelGroup 
            direction="vertical"
            onLayout={handleBottomPanelResize}
          >
            {/* Main Panel with Tabs */}
            <Panel 
              defaultSize={isBottomPanelCollapsed ? 100 : (isLoading ? 75 : Math.max(50, 100 - effectiveBottomPanelSize))} 
              minSize={50}
            >
              <div className="h-full flex flex-col">
                <ComponentErrorBoundary componentName="Tab Manager">
                  <TabManager />
                </ComponentErrorBoundary>
                
                {/* Tab Content Area */}
                <div className="flex-1 relative">
                  {activeTab ? (
                    <>
                    {/* Render all browser tabs for persistent BrowserViews */}
                    {tabs.filter(tab => tab.type === 'browser').map(tab => (
                      <div 
                        key={tab.id}
                        className={cn(
                          "absolute inset-0 p-0",
                          tab.id !== activeTab?.id && "hidden"
                        )}
                        role="tabpanel"
                        id={`tabpanel-${tab.id}`}
                        aria-labelledby={`tabdesc-${tab.id}`}
                      >
                        <TabErrorBoundary tabName={tab.title}>
                          <ComponentErrorBoundary componentName="Browser">
                            <Browser 
                              url={tab.path} 
                              className="h-full"
                              tabId={tab.id}
                              isActive={tab.id === activeTab?.id}
                            />
                          </ComponentErrorBoundary>
                        </TabErrorBoundary>
                      </div>
                    ))}
                    
                    {/* Render active non-browser tab */}
                    {activeTab && activeTab.type !== 'browser' && (
                      <div className="absolute inset-0 p-0"
                           role="tabpanel"
                           id={`tabpanel-${activeTab.id}`}
                           aria-labelledby={`tabdesc-${activeTab.id}`}>
                        <TabErrorBoundary tabName={activeTab.title}>
                          {activeTab.type === 'editor' ? (
                            <ComponentErrorBoundary componentName="Code Editor">
                              <CodeEditor 
                                tabId={activeTab.id}
                                path={activeTab.path} 
                                content={activeTab.content} 
                                className="h-full" 
                              />
                            </ComponentErrorBoundary>
                          ) : activeTab.type === 'explorer' ? (
                            <ComponentErrorBoundary componentName="File Explorer">
                              <FileExplorer 
                                tab_id={activeTab.id}
                              />
                            </ComponentErrorBoundary>
                          ) : (
                            <div className="h-full bg-secondary/20 rounded-lg border border-border/50 flex items-center justify-center"
                               role="status"
                               aria-live="polite">
                            <p className="text-muted-foreground">
                              {activeTab.type} - {activeTab.title} (Coming Soon)
                            </p>
                          </div>
                        )}
                      </TabErrorBoundary>
                    </div>
                    )}
                    </>
                  ) : null}
                </div>
              </div>
            </Panel>
            
            {/* Bottom Panel */}
            {!isBottomPanelCollapsed && (
              <>
                <PanelResizeHandle className={`h-px bg-border/50 hover:bg-border transition-colors ${
                  isTouchDevice ? 'h-2 hover:h-3' : ''
                }`} />
                <Panel 
                  defaultSize={isLoading ? 25 : Math.min(effectiveBottomPanelSize, 50)} 
                  minSize={15} 
                  maxSize={50}
                >
                  <div className="h-full bg-background border-t border-border/50"
                       role="region"
                       aria-label="Terminal panel">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
                      <div className="flex items-center gap-2">
                        <TerminalIcon size={14} className="text-muted-foreground" />
                        <h2 className="text-sm font-medium">Terminal</h2>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleBottomPanel}
                        className="h-6 w-6 hover:bg-secondary/50"
                        aria-label="Collapse terminal panel"
                        title="Collapse terminal panel (Cmd/Ctrl+J)"
                      >
                        <ChevronUp size={14} aria-hidden="true" />
                      </Button>
                    </div>
                    <div className="h-[calc(100%-40px)]">
                      <ComponentErrorBoundary componentName="Terminal" fallbackHeight="100%">
                        <Terminal 
                          className="h-full" 
                          autoFocus={!isBottomPanelCollapsed}
                        />
                      </ComponentErrorBoundary>
                    </div>
                  </div>
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>
      </PanelGroup>
      
      {/* Collapsed Bottom Panel Toggle */}
      {isBottomPanelCollapsed && (
        <div className="absolute bottom-4 right-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleBottomPanel}
            className="shadow-panel"
            aria-label="Expand terminal panel"
            title="Expand terminal panel (Cmd/Ctrl+J)"
          >
            <ChevronUp size={14} className="rotate-180 mr-1" aria-hidden="true" />
            <TerminalIcon size={14} className="mr-1" aria-hidden="true" />
            Terminal
          </Button>
        </div>
      )}
    </div>
  );
}