import { StateStorage } from 'zustand/middleware';
import { getStoreService } from '@/services/electron/store';

/**
 * Custom storage adapter for Zustand that uses Electron's store service
 */
export const createElectronStorage = (): StateStorage => {
  const store = getStoreService();
  
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const value = await store.get(name);
        return value ? JSON.stringify(value) : null;
      } catch (error) {
        console.error(`Error getting item ${name} from electron store:`, error);
        return null;
      }
    },
    
    setItem: async (name: string, value: string): Promise<void> => {
      try {
        // Check if value is already a string
        if (typeof value !== 'string') {
          console.warn(`Expected string value for ${name}, got ${typeof value}. Converting to string.`);
          value = JSON.stringify(value);
        }
        
        // Try to parse the JSON string
        let parsed;
        try {
          parsed = JSON.parse(value);
        } catch (parseError) {
          // If parsing fails, store as-is
          console.warn(`Could not parse value for ${name} as JSON, storing as string`);
          parsed = value;
        }
        
        await store.set(name, parsed);
      } catch (error) {
        console.error(`Error setting item ${name} in electron store:`, error);
      }
    },
    
    removeItem: async (name: string): Promise<void> => {
      try {
        await store.delete(name);
      } catch (error) {
        console.error(`Error removing item ${name} from electron store:`, error);
      }
    }
  };
};

/**
 * Helper function to check if we're in an Electron environment
 * Handles server-side rendering (SSR) by checking if window exists first
 */
export const isElectronEnvironment = (): boolean => {
  if (typeof window === 'undefined') {
    return false; // Server-side rendering
  }
  return !!(window as any).electronAPI;
};

/**
 * Get the appropriate storage based on the environment
 * Falls back to localStorage if not in Electron
 */
export const getStorage = (): StateStorage => {
  if (isElectronEnvironment()) {
    return createElectronStorage();
  }
  
  // Fallback to localStorage for non-Electron environments (e.g., web preview)
  return {
    getItem: (name: string) => {
      if (typeof window === 'undefined') {
        return Promise.resolve(null); // Server-side rendering
      }
      const value = localStorage.getItem(name);
      return Promise.resolve(value);
    },
    setItem: (name: string, value: string) => {
      if (typeof window === 'undefined') {
        return Promise.resolve(); // Server-side rendering
      }
      localStorage.setItem(name, value);
      return Promise.resolve();
    },
    removeItem: (name: string) => {
      if (typeof window === 'undefined') {
        return Promise.resolve(); // Server-side rendering
      }
      localStorage.removeItem(name);
      return Promise.resolve();
    }
  };
};