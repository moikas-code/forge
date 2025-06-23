import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Bookmark {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  created_at: number;
  folder?: string;
}

export interface BrowserHistory {
  id: string;
  title: string;
  url: string;
  visited_at: number;
  visit_count: number;
}

export interface BrowserSettings {
  default_search_engine: string;
  homepage: string;
  enable_javascript: boolean;
  enable_cookies: boolean;
  enable_popups: boolean;
  default_download_path: string;
}

interface BrowserState {
  // Bookmarks
  bookmarks: Bookmark[];
  bookmark_folders: string[];
  
  // History
  history: BrowserHistory[];
  max_history_items: number;
  
  // Settings
  settings: BrowserSettings;
  
  // Actions
  add_bookmark: (bookmark: Omit<Bookmark, 'id' | 'created_at'>) => void;
  remove_bookmark: (id: string) => void;
  update_bookmark: (id: string, updates: Partial<Bookmark>) => void;
  get_bookmarks_by_folder: (folder?: string) => Bookmark[];
  
  add_history_item: (item: Omit<BrowserHistory, 'id' | 'visit_count'>) => void;
  clear_history: () => void;
  clear_history_range: (start_time: number, end_time: number) => void;
  
  update_settings: (settings: Partial<BrowserSettings>) => void;
  
  search_bookmarks: (query: string) => Bookmark[];
  search_history: (query: string) => BrowserHistory[];
}

export const use_browser_store = create<BrowserState>()(
  persist(
    (set, get) => ({
      // Initial state
      bookmarks: [],
      bookmark_folders: ['Favorites', 'Work', 'Personal'],
      history: [],
      max_history_items: 5000,
      
      settings: {
        default_search_engine: 'https://www.google.com/search?q=',
        homepage: 'https://www.google.com',
        enable_javascript: true,
        enable_cookies: true,
        enable_popups: false,
        default_download_path: '~/Downloads',
      },
      
      // Bookmark actions
      add_bookmark: (bookmark) => {
        const new_bookmark: Bookmark = {
          ...bookmark,
          id: `bookmark_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          created_at: Date.now(),
        };
        
        set((state) => ({
          bookmarks: [...state.bookmarks, new_bookmark],
        }));
      },
      
      remove_bookmark: (id) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((b) => b.id !== id),
        }));
      },
      
      update_bookmark: (id, updates) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        }));
      },
      
      get_bookmarks_by_folder: (folder) => {
        const { bookmarks } = get();
        if (!folder) {
          return bookmarks.filter((b) => !b.folder);
        }
        return bookmarks.filter((b) => b.folder === folder);
      },
      
      // History actions
      add_history_item: (item) => {
        const { history, max_history_items } = get();
        
        // Check if URL already exists in history
        const existing_index = history.findIndex((h) => h.url === item.url);
        
        if (existing_index !== -1) {
          // Update existing entry
          const updated_history = [...history];
          updated_history[existing_index] = {
            ...updated_history[existing_index],
            title: item.title,
            visited_at: item.visited_at,
            visit_count: updated_history[existing_index].visit_count + 1,
          };
          
          set({ history: updated_history });
        } else {
          // Add new entry
          const new_item: BrowserHistory = {
            ...item,
            id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            visit_count: 1,
          };
          
          const updated_history = [new_item, ...history];
          
          // Trim history if it exceeds max items
          if (updated_history.length > max_history_items) {
            updated_history.splice(max_history_items);
          }
          
          set({ history: updated_history });
        }
      },
      
      clear_history: () => {
        set({ history: [] });
      },
      
      clear_history_range: (start_time, end_time) => {
        set((state) => ({
          history: state.history.filter(
            (h) => h.visited_at < start_time || h.visited_at > end_time
          ),
        }));
      },
      
      // Settings actions
      update_settings: (settings) => {
        set((state) => ({
          settings: { ...state.settings, ...settings },
        }));
      },
      
      // Search actions
      search_bookmarks: (query) => {
        const { bookmarks } = get();
        const query_lower = query.toLowerCase();
        
        return bookmarks.filter(
          (b) =>
            b.title.toLowerCase().includes(query_lower) ||
            b.url.toLowerCase().includes(query_lower)
        );
      },
      
      search_history: (query) => {
        const { history } = get();
        const query_lower = query.toLowerCase();
        
        return history
          .filter(
            (h) =>
              h.title.toLowerCase().includes(query_lower) ||
              h.url.toLowerCase().includes(query_lower)
          )
          .slice(0, 100); // Limit search results
      },
    }),
    {
      name: 'browser-storage',
      partialize: (state) => ({
        bookmarks: state.bookmarks,
        bookmark_folders: state.bookmark_folders,
        settings: state.settings,
        // Don't persist history by default (privacy)
      }),
    }
  )
);