import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getStorage } from '@/lib/zustand-electron-storage';

export type AppMode = 'developer' | 'studio';
export type Theme = 'light' | 'dark';

export interface Tab {
  id: string;
  title: string;
  type: 'editor' | 'browser' | 'explorer' | 'image' | 'video' | '3d';
  content?: string;
  path?: string;
  isActive: boolean;
  isDirty?: boolean;
  isPinned?: boolean;
}

export interface LayoutState {
  mode: AppMode;
  theme: Theme;
  activeTabId: string | null;
  tabs: Tab[];
  sidebarWidth: number;
  bottomPanelHeight: number;
  isSidebarCollapsed: boolean;
  isBottomPanelCollapsed: boolean;
  isMobileSidebarOpen: boolean;
  
  setMode: (mode: AppMode) => void;
  setTheme: (theme: Theme) => void;
  addTab: (tab: Omit<Tab, 'id' | 'isActive'>) => void;
  removeTab: (id: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<Tab>) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  pinTab: (id: string) => void;
  unpinTab: (id: string) => void;
  setSidebarWidth: (width: number) => void;
  setBottomPanelHeight: (height: number) => void;
  toggleSidebar: () => void;
  toggleBottomPanel: () => void;
  toggleMobileSidebar: () => void;
  setMobileSidebarOpen: (isOpen: boolean) => void;
  resetLayout: () => void;
}

const DEFAULT_SIDEBAR_WIDTH = 240;
const DEFAULT_BOTTOM_PANEL_HEIGHT = 200;

// Get system theme preference
const getSystemTheme = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set, get) => ({
      mode: 'developer',
      theme: getSystemTheme(),
      activeTabId: null,
      tabs: [],
      sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
      bottomPanelHeight: DEFAULT_BOTTOM_PANEL_HEIGHT,
      isSidebarCollapsed: false,
      isBottomPanelCollapsed: false,
      isMobileSidebarOpen: false,
      
      setMode: (mode) => set({ mode }),
      
      setTheme: (theme) => {
        set({ theme });
        // Update document class for Tailwind dark mode
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', theme === 'dark');
        }
      },
      
      addTab: (tab) => set((state) => {
        const newTab: Tab = {
          ...tab,
          id: crypto.randomUUID(),
          isActive: true,
        };
        
        const updatedTabs = state.tabs.map(t => ({ ...t, isActive: false }));
        
        return {
          tabs: [...updatedTabs, newTab],
          activeTabId: newTab.id,
        };
      }),
      
      removeTab: (id) => set((state) => {
        const filteredTabs = state.tabs.filter(t => t.id !== id);
        const removedTabIndex = state.tabs.findIndex(t => t.id === id);
        
        let newActiveTabId = state.activeTabId;
        if (state.activeTabId === id && filteredTabs.length > 0) {
          const newActiveIndex = Math.min(removedTabIndex, filteredTabs.length - 1);
          newActiveTabId = filteredTabs[newActiveIndex].id;
          filteredTabs[newActiveIndex].isActive = true;
        }
        
        return {
          tabs: filteredTabs,
          activeTabId: filteredTabs.length > 0 ? newActiveTabId : null,
        };
      }),

      closeTab: (id) => set((state) => {
        const tab = state.tabs.find(t => t.id === id);
        if (tab?.isPinned) return state; // Don't close pinned tabs via closeTab
        
        const filteredTabs = state.tabs.filter(t => t.id !== id);
        const removedTabIndex = state.tabs.findIndex(t => t.id === id);
        
        let newActiveTabId = state.activeTabId;
        if (state.activeTabId === id && filteredTabs.length > 0) {
          const newActiveIndex = Math.min(removedTabIndex, filteredTabs.length - 1);
          newActiveTabId = filteredTabs[newActiveIndex].id;
          filteredTabs[newActiveIndex].isActive = true;
        }
        
        return {
          tabs: filteredTabs,
          activeTabId: filteredTabs.length > 0 ? newActiveTabId : null,
        };
      }),
      
      setActiveTab: (id) => set((state) => ({
        activeTabId: id,
        tabs: state.tabs.map(t => ({ ...t, isActive: t.id === id })),
      })),
      
      updateTab: (id, updates) => set((state) => ({
        tabs: state.tabs.map(t => t.id === id ? { ...t, ...updates } : t),
      })),

      reorderTabs: (fromIndex, toIndex) => set((state) => {
        const tabs = [...state.tabs];
        const [removed] = tabs.splice(fromIndex, 1);
        tabs.splice(toIndex, 0, removed);
        return { tabs };
      }),

      pinTab: (id) => set((state) => ({
        tabs: state.tabs.map(t => t.id === id ? { ...t, isPinned: true } : t),
      })),

      unpinTab: (id) => set((state) => ({
        tabs: state.tabs.map(t => t.id === id ? { ...t, isPinned: false } : t),
      })),
      
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      
      setBottomPanelHeight: (height) => set({ bottomPanelHeight: height }),
      
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
      
      toggleBottomPanel: () => set((state) => ({ isBottomPanelCollapsed: !state.isBottomPanelCollapsed })),
      
      toggleMobileSidebar: () => set((state) => ({ isMobileSidebarOpen: !state.isMobileSidebarOpen })),
      
      setMobileSidebarOpen: (isOpen) => set({ isMobileSidebarOpen: isOpen }),
      
      resetLayout: () => set((state) => ({
        ...state,
        sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
        bottomPanelHeight: DEFAULT_BOTTOM_PANEL_HEIGHT,
        isSidebarCollapsed: false,
        isBottomPanelCollapsed: false,
        isMobileSidebarOpen: false,
      })),
    }),
    {
      name: 'forge-moi-layout',
      storage: getStorage(),
      partialize: (state) => ({
        mode: state.mode,
        theme: state.theme,
        sidebarWidth: state.sidebarWidth,
        bottomPanelHeight: state.bottomPanelHeight,
        isSidebarCollapsed: state.isSidebarCollapsed,
        isBottomPanelCollapsed: state.isBottomPanelCollapsed,
      }),
      onRehydrateStorage: () => (state) => {
        // Apply theme on store rehydration
        if (state?.theme && typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', state.theme === 'dark');
        }
      },
    }
  )
);