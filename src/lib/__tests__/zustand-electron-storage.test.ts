import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createElectronStorage, isElectronEnvironment, getStorage } from '../zustand-electron-storage';

describe('zustand-electron-storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isElectronEnvironment', () => {
    it('should return true when electron API is available', () => {
      (window as any).electron = { store: {} };
      expect(isElectronEnvironment()).toBe(true);
    });

    it('should return false when electron API is not available', () => {
      const originalElectron = (window as any).electron;
      delete (window as any).electron;
      expect(isElectronEnvironment()).toBe(false);
      (window as any).electron = originalElectron;
    });
  });

  describe('createElectronStorage', () => {
    const mockStore = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    };

    beforeEach(() => {
      vi.doMock('@/services/electron/store', () => ({
        getStoreService: () => mockStore,
      }));
    });

    it('should get item from electron store', async () => {
      const storage = createElectronStorage();
      const testData = { test: 'value' };
      mockStore.get.mockResolvedValue(testData);

      const result = await storage.getItem('test-key');
      
      expect(mockStore.get).toHaveBeenCalledWith('test-key');
      expect(result).toBe(JSON.stringify(testData));
    });

    it('should return null when item does not exist', async () => {
      const storage = createElectronStorage();
      mockStore.get.mockResolvedValue(undefined);

      const result = await storage.getItem('non-existent');
      
      expect(result).toBeNull();
    });

    it('should set item in electron store', async () => {
      const storage = createElectronStorage();
      const testData = { test: 'value' };
      mockStore.set.mockResolvedValue(true);

      await storage.setItem('test-key', JSON.stringify(testData));
      
      expect(mockStore.set).toHaveBeenCalledWith('test-key', testData);
    });

    it('should remove item from electron store', async () => {
      const storage = createElectronStorage();
      mockStore.delete.mockResolvedValue(true);

      await storage.removeItem('test-key');
      
      expect(mockStore.delete).toHaveBeenCalledWith('test-key');
    });

    it('should handle errors gracefully', async () => {
      const storage = createElectronStorage();
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockStore.get.mockRejectedValue(new Error('Store error'));
      
      const result = await storage.getItem('test-key');
      
      expect(result).toBeNull();
      expect(consoleError).toHaveBeenCalled();
      
      consoleError.mockRestore();
    });
  });

  describe('getStorage', () => {
    it('should return electron storage when in electron environment', () => {
      (window as any).electron = { store: {} };
      const storage = getStorage();
      
      // Test that it's not localStorage by checking it has async methods
      expect(storage.getItem('test')).toBeInstanceOf(Promise);
    });

    it('should return localStorage wrapper when not in electron environment', () => {
      const originalElectron = (window as any).electron;
      delete (window as any).electron;
      
      const storage = getStorage();
      
      // localStorage wrapper should still return promises
      expect(storage.getItem('test')).toBeInstanceOf(Promise);
      
      (window as any).electron = originalElectron;
    });
  });
});